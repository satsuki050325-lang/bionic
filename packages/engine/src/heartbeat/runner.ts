import { randomUUID } from 'node:crypto'
import type { HeartbeatTarget } from '@bionic/shared'
import { supabase } from '../lib/supabase.js'
import { evaluateAlertForEvent } from '../decisions/alerts.js'
import { mapHeartbeatRow } from './repository.js'

function isDue(target: HeartbeatTarget, now: number): boolean {
  const reference = target.lastPingAt
    ? new Date(target.lastPingAt).getTime()
    : new Date(target.createdAt).getTime()
  const deadlineMs =
    reference + (target.expectedIntervalSeconds + target.graceSeconds) * 1000
  return now > deadlineMs
}

export async function processHeartbeat(target: HeartbeatTarget): Promise<void> {
  if (!target.enabled) return
  if (target.missedEventEmitted) return
  if (!isDue(target, Date.now())) return

  const { data: claimed, error } = await supabase.rpc(
    'claim_heartbeat_missing',
    { p_target_id: target.id }
  )

  if (error) {
    console.error('[heartbeat] claim RPC failed:', error)
    return
  }

  if (claimed !== true) return

  const eventId = randomUUID()
  const now = new Date().toISOString()
  const payload = {
    targetId: target.id,
    slug: target.slug,
    check: 'heartbeat',
    status: 'missing' as const,
    expectedIntervalSeconds: target.expectedIntervalSeconds,
    graceSeconds: target.graceSeconds,
    severity: target.severity,
    lastPingAt: target.lastPingAt,
  }

  const { error: insertError } = await supabase.from('engine_events').insert({
    client_event_id: `heartbeat_missing_${eventId}`,
    project_id: target.projectId,
    service_id: target.serviceId,
    type: 'heartbeat.missing.detected',
    occurred_at: now,
    source: 'engine',
    payload,
  })

  if (insertError) {
    console.error('[heartbeat] failed to insert missing event:', insertError)
    return
  }

  void evaluateAlertForEvent({
    id: eventId,
    projectId: target.projectId,
    serviceId: target.serviceId,
    type: 'heartbeat.missing.detected',
    occurredAt: now,
    source: 'engine',
    payload,
  })
}

export async function runDueHeartbeatChecks(): Promise<{
  checked: number
  skipped: number
}> {
  const { data, error } = await supabase
    .from('heartbeat_targets')
    .select('*')
    .eq('enabled', true)

  if (error) {
    console.error('[heartbeat] failed to fetch targets:', error)
    return { checked: 0, skipped: 0 }
  }

  const now = Date.now()
  let checked = 0
  let skipped = 0

  const tasks: Promise<void>[] = []
  for (const row of data ?? []) {
    const target = mapHeartbeatRow(row as Record<string, unknown>)
    if (target.missedEventEmitted || !isDue(target, now)) {
      skipped++
      continue
    }
    checked++
    tasks.push(
      processHeartbeat(target).catch((err) => {
        console.error(`[heartbeat] target ${target.id} failed:`, err)
      })
    )
  }

  await Promise.all(tasks)
  return { checked, skipped }
}
