import { Router, type Request, type Response } from 'express'
import { getConfig } from '../../config.js'
import {
  verifyGitHubSignature,
  type GitHubWorkflowRunPayload,
} from '../../sources/github.js'
import { evaluateGitHubWorkflowRun } from '../../decisions/github.js'
import { supabase } from '../../lib/supabase.js'

export const githubWebhookRouter = Router()

githubWebhookRouter.post('/', (req: Request, res: Response): void => {
  void (async () => {
    const config = getConfig()

    if (!config.github.webhookSecret) {
      res.status(401).json({ error: 'GitHub webhook not configured' })
      return
    }

    const rawBody = req.body as Buffer
    if (!Buffer.isBuffer(rawBody)) {
      res.status(400).json({ error: 'Raw body not available' })
      return
    }

    const signature = req.headers['x-hub-signature-256'] as string | undefined
    if (!verifyGitHubSignature(rawBody, signature, config.github.webhookSecret)) {
      res.status(401).json({ error: 'Invalid signature' })
      return
    }

    const githubEvent = req.headers['x-github-event'] as string | undefined
    const deliveryId = req.headers['x-github-delivery'] as string | undefined

    if (!deliveryId) {
      res.status(400).json({ error: 'Missing X-GitHub-Delivery' })
      return
    }

    let body: Record<string, unknown>
    try {
      body = JSON.parse(rawBody.toString()) as Record<string, unknown>
    } catch {
      res.status(400).json({ error: 'invalid json' })
      return
    }

    const clientEventId = `github:${deliveryId}`
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
    const repo = body['repository'] as Record<string, unknown> | undefined
    const serviceId =
      (repo?.['full_name'] as string | undefined) ?? 'github'

    await supabase.from('engine_events').insert({
      project_id: projectId,
      service_id: serviceId,
      type: githubEvent ? `github.${githubEvent}` : 'github.unknown',
      source: 'engine',
      client_event_id: clientEventId,
      payload: {
        event: githubEvent,
        action: body['action'],
        repository: repo
          ? {
              full_name: repo['full_name'],
              default_branch: repo['default_branch'],
            }
          : null,
      },
      occurred_at: new Date().toISOString(),
    })

    if (githubEvent === 'workflow_run') {
      const payload = body as unknown as GitHubWorkflowRunPayload
      void evaluateGitHubWorkflowRun(payload, projectId, deliveryId)
    }

    res.status(202).json({ processed: true, event: githubEvent })
  })()
})
