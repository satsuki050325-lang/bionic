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

  void evaluateAlertForEvent({
    id: eventId,
    projectId: params.projectId,
    serviceId: params.serviceId,
    type: params.type,
    occurredAt,
    source: 'engine',
    payload: params.payload,
  })
}

async function processTarget(target: UptimeTarget): Promise<void> {
  const outcome = await runUptimeCheck({
    url: target.url,
    method: target.method,
    timeoutMs: target.timeoutMs,
    expectedStatusMin: target.expectedStatusMin,
    expectedStatusMax: target.expectedStatusMax,
  })

  const now = new Date().toISOString()

  if (outcome.ok) {
    // Atomically claim a recovery transition: only one concurrent runner gets
    // to flip a degraded/down target back to 'up'. The .select('id') return
    // set tells us whether we were the claimer.
    const { data: recoveryClaim, error: recoveryErr } = await supabase
      .from('uptime_targets')
      .update({
        last_checked_at: now,
        last_status: 'up',
        last_latency_ms: outcome.latencyMs,
        last_status_code: outcome.statusCode,
        last_failure_reason: null,
        consecutive_failures: 0,
        degraded_event_emitted: false,
        updated_at: now,
      })
      .eq('id', target.id)
      .or('degraded_event_emitted.eq.true,last_status.eq.down')
      .select('id')

    if (recoveryErr) {
      console.error('[uptime] recovery claim failed:', recoveryErr)
    }

    if (recoveryClaim && recoveryClaim.length > 0) {
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
      return
    }

    // No state transition (already 'up' or never been down) — just refresh the
    // probe fields. Idempotent even under concurrent runs.
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
    return
  }

  // Failure path: first write the new counters/status (non-atomic increment is
  // acceptable — worst case a concurrent run writes the same value), then
  // atomically claim the "emit degraded" transition.
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

  // Atomically claim the degraded emit. If another runner already claimed,
  // this update matches zero rows and we skip the event.
  const { data: degradedClaim, error: claimErr } = await supabase
    .from('uptime_targets')
    .update({
      degraded_event_emitted: true,
      updated_at: now,
    })
    .eq('id', target.id)
    .eq('degraded_event_emitted', false)
    .gte('consecutive_failures', DEGRADED_THRESHOLD)
    .select('id')

  if (claimErr) {
    console.error('[uptime] degraded claim failed:', claimErr)
    return
  }

  if (!degradedClaim || degradedClaim.length === 0) return

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
