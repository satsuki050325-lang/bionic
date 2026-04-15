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

  const rollbackClaim = async (cause: string) => {
    // Flip missed_event_emitted back to false so the next runner tick can
    // re-claim and re-emit. Only rollback if the flag is still true — a
    // concurrent runner may have already processed or cleared it.
    const { error: rollbackError } = await supabase
      .from('heartbeat_targets')
      .update({
        missed_event_emitted: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', target.id)
      .eq('missed_event_emitted', true)
    if (rollbackError) {
      console.error(
        `[heartbeat] CRITICAL: rollback after ${cause} failed:`,
        rollbackError
      )
    }
  }

  if (insertError) {
    console.error('[heartbeat] failed to insert missing event:', insertError)
    // Without rollback, `missed_event_emitted=true` would persist with no
    // corresponding event / alert — a silent hole in the audit trail.
    await rollbackClaim('event-insert failure')
    return
  }

  // Await the alert-creation path so a thrown failure rolls the claim back
  // and the next runner tick can retry. Mirrors routes/heartbeats.ts (Group
  // 1) for symmetry. NOTE: evaluateAlertForEvent's internal DB errors are
  // logged-and-swallowed rather than thrown, so this only recovers from
  // programming errors / unhandled exceptions. See self-review in WORK_LOG.
  try {
    await evaluateAlertForEvent({
      id: eventId,
      projectId: target.projectId,
      serviceId: target.serviceId,
      type: 'heartbeat.missing.detected',
      occurredAt: now,
      source: 'engine',
      payload,
    })
  } catch (err) {
    console.error('[heartbeat] alert creation threw:', err)
    await rollbackClaim('alert-creation throw')
  }
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
