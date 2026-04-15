/**
 * Public heartbeat ping receiver.
 *
 * Mounted BEFORE the engine-wide auth middleware: authentication here is
 * per-target (Authorization: Bearer <secret>), not the shared engine token.
 * The runner / alert pipeline run as normal service_role DB writes.
 */
import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { supabase } from '../lib/supabase.js'
import { verifyHeartbeatSecret } from '../heartbeat/secret.js'
import { evaluateAlertForEvent } from '../decisions/alerts.js'
import type { EngineEvent } from '@bionic/shared'

export const heartbeatsRouter = Router()

function parseBearer(header: string | undefined): string | null {
  if (!header) return null
  const m = /^Bearer\s+(.+)$/i.exec(header)
  return m?.[1]?.trim() || null
}

heartbeatsRouter.post('/:slug', async (req, res) => {
  const slug = req.params['slug']
  if (!slug || !/^[a-z0-9-]{3,64}$/.test(slug)) {
    res.status(404).json({ error: 'heartbeat target not found' })
    return
  }

  const presented = parseBearer(req.headers['authorization'])
  if (!presented) {
    res.status(401).json({ error: 'missing Authorization Bearer token' })
    return
  }

  const { data, error } = await supabase
    .from('heartbeat_targets')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('[heartbeats] select failed:', error)
    res.status(500).json({ error: 'internal error' })
    return
  }

  if (!data) {
    res.status(404).json({ error: 'heartbeat target not found' })
    return
  }

  // Always run the timing-safe compare even on shape mismatches so failure
  // paths have similar latency regardless of whether the row existed.
  const storedHash = (data['secret_hash'] as string | null) ?? ''
  const ok = verifyHeartbeatSecret(presented, storedHash)
  if (!ok) {
    res.status(401).json({ error: 'invalid secret' })
    return
  }

  if (!(data['enabled'] as boolean)) {
    res.status(403).json({ error: 'heartbeat target is disabled' })
    return
  }

  const now = new Date().toISOString()
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    null

  // Record ping. If this target was in missed state, atomically claim the
  // recovery flag flip and emit a recovered event so the alert auto-resolves.
  const wasMissed = (data['missed_event_emitted'] as boolean) === true

  await supabase
    .from('heartbeat_targets')
    .update({
      last_ping_at: now,
      last_ping_from_ip: ip,
      updated_at: now,
    })
    .eq('id', data['id'] as string)

  // Always record the ping event (useful for audit / activity feed)
  await supabase.from('engine_events').insert({
    client_event_id: `heartbeat_ping_${data['id']}_${now}`,
    project_id: data['project_id'] as string,
    service_id: data['service_id'] as string,
    type: 'heartbeat.ping.received',
    occurred_at: now,
    source: 'engine',
    payload: {
      targetId: data['id'] as string,
      slug,
      check: 'heartbeat',
      fromIp: ip,
    },
  })

  if (wasMissed) {
    const { data: recovered, error: recoveryErr } = await supabase.rpc(
      'claim_heartbeat_recovery',
      { p_target_id: data['id'] as string }
    )
    if (recoveryErr) {
      console.error('[heartbeats] claim_heartbeat_recovery failed:', recoveryErr)
    } else if (recovered === true) {
      // The flag is now false. We still need to (a) insert the recovered
      // event and (b) auto-resolve the open cron_missing alert. If either
      // fails, roll the flag back to true so a subsequent ping retries the
      // whole transition — otherwise the alert would stay open forever
      // (runner won't re-claim because last_ping_at was just refreshed).
      const eventId = randomUUID()
      const payload = {
        targetId: data['id'] as string,
        slug,
        check: 'heartbeat',
        status: 'ok' as const,
      }

      const { error: eventInsertErr } = await supabase.from('engine_events').insert({
        client_event_id: `heartbeat_recovered_${eventId}`,
        project_id: data['project_id'] as string,
        service_id: data['service_id'] as string,
        type: 'heartbeat.recovered',
        occurred_at: now,
        source: 'engine',
        payload,
      })

      let resolveErr: unknown = null
      if (!eventInsertErr) {
        // Await the evaluate path so a failed alert-resolve triggers rollback.
        // evaluateAlertForEvent for heartbeat.recovered only does the resolve
        // UPDATE — no additional side effects we care about here.
        try {
          const event: EngineEvent = {
            id: eventId,
            projectId: data['project_id'] as string,
            serviceId: data['service_id'] as string,
            type: 'heartbeat.recovered',
            occurredAt: now,
            source: 'engine',
            payload,
          }
          await evaluateAlertForEvent(event)
        } catch (err) {
          resolveErr = err
          console.error('[heartbeats] alert auto-resolve failed:', err)
        }
      }

      if (eventInsertErr || resolveErr) {
        console.error(
          '[heartbeats] recovery chain failed; rolling back claim so the next ping retries'
        )
        const { error: rollbackErr } = await supabase
          .from('heartbeat_targets')
          .update({
            missed_event_emitted: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data['id'] as string)
          .eq('missed_event_emitted', false)
        if (rollbackErr) {
          console.error(
            '[heartbeats] CRITICAL: rollback of recovery claim failed:',
            rollbackErr
          )
        }
      }
    }
  }

  res.status(204).end()
})
