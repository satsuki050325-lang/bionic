import { Router } from 'express'
import crypto from 'crypto'
import type { Request, Response } from 'express'
import { supabase } from '../../lib/supabase.js'
import {
  normalizeVercelPayload,
  resolveServiceId,
  type VercelWebhookBody,
} from '../../sources/vercel.js'

export const vercelWebhookRouter = Router()

const WEBHOOK_SECRET = process.env.VERCEL_WEBHOOK_SECRET

function verifySignature(rawBody: Buffer, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('[vercel-webhook] VERCEL_WEBHOOK_SECRET not set. Skipping verification.')
    return true
  }
  const expected = crypto
    .createHmac('sha1', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
  } catch {
    return false
  }
}

vercelWebhookRouter.post(
  '/',
  (req: Request, res: Response): void => {
    void (async () => {
      const signature = req.headers['x-vercel-signature'] as string | undefined
      const rawBody = req.body as Buffer

      if (!signature || !verifySignature(rawBody, signature)) {
        res.status(401).json({ error: 'invalid signature' })
        return
      }

      let body: VercelWebhookBody
      try {
        body = JSON.parse(rawBody.toString()) as VercelWebhookBody
      } catch {
        res.status(400).json({ error: 'invalid json' })
        return
      }

      console.log(`[vercel-webhook] received: ${body.type}`)

      if (body.type !== 'deployment.ready') {
        res.status(200).json({ received: true, processed: false })
        return
      }

      const normalized = normalizeVercelPayload(body)
      if (!normalized) {
        res.status(200).json({ received: true, processed: false })
        return
      }

      const serviceId = resolveServiceId(normalized.providerProjectId)
      if (!serviceId) {
        console.warn(
          `[vercel-webhook] no service mapping for project: ${normalized.providerProjectId}`
        )
        res.status(200).json({ received: true, processed: false })
        return
      }

      const projectId = process.env.BIONIC_PROJECT_ID ?? 'project_bionic'
      const now = new Date()
      const watchUntil = new Date(now.getTime() + 30 * 60 * 1000)

      const baselineStart = new Date(now.getTime() - 30 * 60 * 1000)
      const { count: baselineCount } = await supabase
        .from('engine_events')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('service_id', serviceId)
        .eq('type', 'service.error.reported')
        .gte('created_at', baselineStart.toISOString())
        .lte('created_at', now.toISOString())

      const { error } = await supabase.from('deployments').upsert(
        {
          project_id: projectId,
          service_id: serviceId,
          provider: 'vercel',
          provider_project_id: normalized.providerProjectId,
          provider_deployment_id: normalized.providerDeploymentId,
          deployment_url: normalized.deploymentUrl,
          target: normalized.target,
          git_commit_sha: normalized.gitCommitSha,
          git_commit_message: normalized.gitCommitMessage,
          dashboard_url: normalized.dashboardUrl,
          status: 'ready',
          ready_at: now.toISOString(),
          watch_started_at: now.toISOString(),
          watch_until: watchUntil.toISOString(),
          watch_status: 'watching',
          baseline_error_count: baselineCount ?? 0,
          current_error_count: 0,
          raw_payload: body as unknown as Record<string, unknown>,
          updated_at: now.toISOString(),
        },
        { onConflict: 'provider,provider_deployment_id' }
      )

      if (error) {
        console.error('[vercel-webhook] failed to save deployment:', error)
        res.status(500).json({ error: 'failed to save deployment' })
        return
      }

      console.log(
        `[vercel-webhook] deployment saved: ${normalized.providerDeploymentId} watching until ${watchUntil.toISOString()}`
      )
      res.status(200).json({ received: true, processed: true })
    })()
  }
)
