import { supabase } from '../lib/supabase.js'
import { createAction, completeAction, failAction } from '../actions/logAction.js'
import {
  type GitHubWorkflowRunPayload,
  classifyWorkflowRunSeverity,
  buildCiFailureFingerprint,
  resolveGitHubServiceId,
} from '../sources/github.js'

const FAILED_CONCLUSIONS = new Set(['failure', 'timed_out', 'action_required'])

export async function evaluateGitHubWorkflowRun(
  payload: GitHubWorkflowRunPayload,
  projectId: string,
  deliveryId: string
): Promise<void> {
  const { workflow_run, repository } = payload

  if (!FAILED_CONCLUSIONS.has(workflow_run.conclusion ?? '')) {
    return
  }

  const repoFullName = repository.full_name
  const serviceId = resolveGitHubServiceId(repoFullName)
  const severity = classifyWorkflowRunSeverity(payload)
  const fingerprint = buildCiFailureFingerprint(
    projectId,
    repoFullName,
    workflow_run.name,
    workflow_run.head_branch,
    repository.default_branch
  )

  const title = `${repoFullName} CI failed: ${workflow_run.name}`
  const message = `Workflow "${workflow_run.name}" failed on ${workflow_run.head_branch} (${workflow_run.head_sha.slice(0, 7)})`
  const now = new Date().toISOString()

  const actionId = await createAction({
    projectId,
    serviceId,
    type: 'create_alert',
    mode: 'automatic',
    title: `CI failure alert evaluate: ${title}`,
    reason: `workflow conclusion: ${workflow_run.conclusion}`,
    input: {
      repoFullName,
      workflowName: workflow_run.name,
      branch: workflow_run.head_branch,
      conclusion: workflow_run.conclusion,
      htmlUrl: workflow_run.html_url,
      deliveryId,
    },
    requestedBy: 'engine',
  })

  try {
    const { data: existing } = await supabase
      .from('engine_alerts')
      .select('id, count')
      .eq('fingerprint', fingerprint)
      .eq('status', 'open')
      .maybeSingle()

    if (existing) {
      await supabase
        .from('engine_alerts')
        .update({
          count: (existing.count ?? 1) + 1,
          last_seen_at: now,
          message,
          updated_at: now,
        })
        .eq('id', existing.id)

      console.log(`[decisions/github] updated existing ci_failure alert: ${existing.id}`)
      if (actionId) {
        await completeAction(actionId, {
          operation: 'updated',
          alertId: existing.id,
          newCount: (existing.count ?? 1) + 1,
        })
      }
      return
    }

    const { data: newAlert, error } = await supabase
      .from('engine_alerts')
      .insert({
        project_id: projectId,
        service_id: serviceId,
        type: 'ci_failure',
        severity,
        status: 'open',
        title,
        message,
        fingerprint,
        count: 1,
        last_seen_at: now,
        last_event_id: deliveryId,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[decisions/github] failed to create ci_failure alert:', error)
      if (actionId) {
        await failAction(actionId, { message: 'insert failed', code: error.code })
      }
      return
    }

    console.log(`[decisions/github] created ci_failure alert: ${newAlert.id}`)
    if (actionId) {
      await completeAction(actionId, {
        operation: 'created',
        alertId: newAlert.id,
      })
    }
  } catch (err) {
    console.error('[decisions/github] unexpected error:', err)
    if (actionId) {
      await failAction(actionId, { message: String(err) })
    }
  }
}
