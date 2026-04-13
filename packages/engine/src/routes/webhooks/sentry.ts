import { Router, type Request, type Response } from 'express'
import { getConfig } from '../../config.js'
import {
  verifySentrySignature,
  type SentryWebhookEvent,
} from '../../sources/sentry.js'
import { evaluateSentryEvent } from '../../decisions/sentry.js'
import { supabase } from '../../lib/supabase.js'

export const sentryWebhookRouter = Router()

sentryWebhookRouter.post('/', (req: Request, res: Response): void => {
  void (async () => {
    const config = getConfig()

    if (!config.sentry.webhookSecret) {
      res.status(401).json({ error: 'Sentry webhook not configured' })
      return
    }

    const rawBody = req.body as Buffer
    if (!Buffer.isBuffer(rawBody)) {
      res.status(400).json({ error: 'Raw body not available' })
      return
    }

    const signature = req.headers['sentry-hook-signature'] as string | undefined
    if (!verifySentrySignature(rawBody, signature, config.sentry.webhookSecret)) {
      res.status(401).json({ error: 'Invalid signature' })
      return
    }

    const resource = req.headers['sentry-hook-resource'] as string | undefined

    let body: SentryWebhookEvent
    try {
      body = JSON.parse(rawBody.toString()) as SentryWebhookEvent
    } catch {
      res.status(400).json({ error: 'Invalid JSON body' })
      return
    }

    const issueId = body.data.issue?.id ?? 'unknown'
    const clientEventId = `sentry:${issueId}:${body.action}:${resource ?? 'issue'}`
    const webhookId = `sentry:${resource ?? 'unknown'}:${Date.now()}`

    const { data: existing } = await supabase
      .from('engine_events')
      .select('id')
      .eq('client_event_id', clientEventId)
      .maybeSingle()

    if (existing) {
      res.status(202).json({ processed: false, duplicate: true })
      return
    }

    const projectId = config.projectId
    const serviceId = config.sentry.serviceId
    const eventType = resource === 'issue' ? 'sentry.issue' : 'sentry.metric_alert'

    const { error: insertError } = await supabase.from('engine_events').insert({
      project_id: projectId,
      service_id: serviceId,
      type: eventType,
      source: 'engine',
      client_event_id: clientEventId,
      payload: {
        action: body.action,
        resource,
        issueId: body.data.issue?.id,
        issueShortId: body.data.issue?.shortId,
        projectSlug: body.data.issue?.project.slug,
        level: body.data.issue?.level,
        title: body.data.issue?.title?.slice(0, 200),
        permalink: body.data.issue?.permalink,
      },
      occurred_at: new Date().toISOString(),
    })

    if (insertError) {
      if ((insertError as { code?: string }).code === '23505') {
        res.status(202).json({ processed: false, duplicate: true })
        return
      }
      console.error('[webhooks/sentry] failed to save event:', insertError)
      res.status(500).json({ error: 'failed to save event' })
      return
    }

    void evaluateSentryEvent(body, projectId, webhookId)

    res.status(202).json({ processed: true, action: body.action })
  })()
})
