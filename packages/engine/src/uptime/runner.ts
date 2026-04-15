import { randomUUID } from 'node:crypto'
import type { UptimeTarget } from '@bionic/shared'
import { supabase } from '../lib/supabase.js'
import { runUptimeCheck } from './check.js'
import { evaluateAlertForEvent } from '../decisions/alerts.js'

const DEGRADED_THRESHOLD = 3

export function mapUptimeRow(row: Record<string, unknown>): UptimeTarget {
  return {
    id: row['id'] as string,
    projectId: row['project_id'] as string,
    serviceId: row['service_id'] as string,
    url: row['url'] as string,
    method: (row['method'] as 'GET' | 'HEAD') ?? 'GET',
    intervalSeconds: row['interval_seconds'] as 30 | 60 | 300,
    timeoutMs: (row['timeout_ms'] as number) ?? 10000,
    expectedStatusMin: (row['expected_status_min'] as number) ?? 200,
    expectedStatusMax: (row['expected_status_max'] as number) ?? 299,
    enabled: (row['enabled'] as boolean) ?? true,
    lastCheckedAt: (row['last_checked_at'] as string | null) ?? null,
    lastStatus: (row['last_status'] as 'up' | 'down' | null) ?? null,
    lastLatencyMs: (row['last_latency_ms'] as number | null) ?? null,
    lastStatusCode: (row['last_status_code'] as number | null) ?? null,
    lastFailureReason: (row['last_failure_reason'] as string | null) ?? null,
    consecutiveFailures: (row['consecutive_failures'] as number) ?? 0,
    degradedEventEmitted: (row['degraded_event_emitted'] as boolean) ?? false,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  }
}

async function emitEvent(params: {
  projectId: string
  serviceId: string
  type: 'service.health.reported' | 'service.health.degraded'
  payload: Record<string, unknown>
}): Promise<void> {
  const eventId = randomUUID()
  const occurredAt = new Date().toISOString()

  const { error } = await supabase.from('engine_events').insert({
    client_event_id: `uptime_${params.type}_${eventId}`,
    project_id: params.projectId,
    service_id: params.serviceId,
    type: params.type,
    occurred_at: occurredAt,
    source: 'engine',
    payload: params.payload,
  })

  if (error) {
    console.error('[uptime] failed to insert event:', error)
    return
  }

  // evaluateAlertForEvent now returns Promise<boolean>. We still dispatch
  // fire-and-forget from the uptime emit helper — the uptime runner does
  // not currently rollback on alert failure (distinct from the heartbeat
  // runner) because the uptime runner naturally retries on the next tick
  // once the degraded state persists. We surface failures via the return
  // value so future callers can opt in to rollback if desired.
  void evaluateAlertForEvent({
    id: eventId,
    projectId: params.projectId,
    serviceId: params.serviceId,
    type: params.type,
    occurredAt,
    source: 'engine',
    payload: params.payload,
  }).then((ok) => {
    if (!ok) {
      console.error(
        `[uptime] evaluateAlertForEvent returned false for ${params.type} on ${params.serviceId}`
      )
    }
  })
}

export async function processTarget(target: UptimeTarget): Promise<void> {
  const outcome = await runUptimeCheck({
    url: target.url,
    method: target.method,
    timeoutMs: target.timeoutMs,
    expectedStatusMin: target.expectedStatusMin,
    expectedStatusMax: target.expectedStatusMax,
  })

  const now = new Date().toISOString()

  if (outcome.ok) {
    // Claim the recovery transition atomically at the DB level via RPC.
    // The function body is a single UPDATE ... WHERE (degraded OR down);
    // Postgres MVCC guarantees at most one concurrent caller observes
    // row_count > 0 and therefore at most one runner emits the event.
    const { data: recoveryClaimed, error: recoveryErr } = await supabase.rpc(
      'claim_uptime_recovery',
      { p_target_id: target.id }
    )
    if (recoveryErr) {
      console.error('[uptime] recovery claim RPC failed:', recoveryErr)
    }

    // Always refresh the probe-result columns (latency / status code /
    // last_checked_at). These are outside the claim window and are
    // idempotent under concurrent writes.
    await supabase
      .from('uptime_targets')
      .update({
        last_checked_at: now,
        last_status: 'up',
        last_latency_ms: outcome.latencyMs,
        last_status_code: outcome.statusCode,
        last_failure_reason: null,
        consecutive_failures: 0,
        updated_at: now,
      })
      .eq('id', target.id)

    if (recoveryClaimed === true) {
      await emitEvent({
        projectId: target.projectId,
        serviceId: target.serviceId,
        type: 'service.health.reported',
        payload: {
          status: 'ok',
          check: 'uptime',
          targetId: target.id,
          url: target.url,
          latencyMs: outcome.latencyMs,
          statusCode: outcome.statusCode,
          source: 'uptime_runner',
        },
      })
    }
    return
  }

  // Failure path: write probe-result + failure counters first, then claim the
  // degraded emit atomically via RPC.
  const newFailures = target.consecutiveFailures + 1
  const { error: failErr } = await supabase
    .from('uptime_targets')
    .update({
      last_checked_at: now,
      last_status: 'down',
      last_latency_ms: outcome.latencyMs,
      last_status_code: outcome.statusCode,
      last_failure_reason: outcome.reason,
      consecutive_failures: newFailures,
      updated_at: now,
    })
    .eq('id', target.id)

  if (failErr) {
    console.error('[uptime] failure update failed:', failErr)
    return
  }

  if (newFailures < DEGRADED_THRESHOLD) return

  const { data: degradedClaimed, error: claimErr } = await supabase.rpc(
    'claim_uptime_degraded',
    { p_target_id: target.id, p_threshold: DEGRADED_THRESHOLD }
  )

  if (claimErr) {
    console.error('[uptime] degraded claim RPC failed:', claimErr)
    return
  }

  if (degradedClaimed !== true) return

  await emitEvent({
    projectId: target.projectId,
    serviceId: target.serviceId,
    type: 'service.health.degraded',
    payload: {
      status: 'down',
      check: 'uptime',
      targetId: target.id,
      url: target.url,
      reason: outcome.reason,
      statusCode: outcome.statusCode,
      consecutiveFailures: newFailures,
      source: 'uptime_runner',
    },
  })
}

export async function runDueUptimeChecks(): Promise<{
  checked: number
  skipped: number
}> {
  const { data, error } = await supabase
    .from('uptime_targets')
    .select('*')
    .eq('enabled', true)

  if (error) {
    console.error('[uptime] failed to fetch targets:', error)
    return { checked: 0, skipped: 0 }
  }

  const now = Date.now()
  let checked = 0
  let skipped = 0

  const tasks: Promise<void>[] = []
  for (const row of data ?? []) {
    const target = mapUptimeRow(row as Record<string, unknown>)
    const lastMs = target.lastCheckedAt
      ? new Date(target.lastCheckedAt).getTime()
      : 0
    const dueAt = lastMs + target.intervalSeconds * 1000
    if (lastMs !== 0 && dueAt > now) {
      skipped++
      continue
    }
    checked++
    tasks.push(
      processTarget(target).catch((err) => {
        console.error(`[uptime] target ${target.id} failed:`, err)
      })
    )
  }

  await Promise.all(tasks)
  return { checked, skipped }
}
