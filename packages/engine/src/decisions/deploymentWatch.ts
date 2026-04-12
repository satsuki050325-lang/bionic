import { supabase } from '../lib/supabase.js'
import { createAction, completeAction, failAction } from '../actions/logAction.js'

const ERROR_THRESHOLD_COUNT = 5
const ERROR_THRESHOLD_PERCENT = 200

export async function evaluateWatchingDeployments(): Promise<void> {
  const now = new Date()

  const { data: deployments, error } = await supabase
    .from('deployments')
    .select('*')
    .eq('watch_status', 'watching')
    .lte('watch_started_at', now.toISOString())

  if (error) {
    console.error('[deploymentWatch] failed to fetch deployments:', error)
    return
  }

  for (const deployment of deployments ?? []) {
    await evaluateSingleDeployment(deployment, now)
  }
}

async function evaluateSingleDeployment(
  deployment: Record<string, unknown>,
  now: Date
): Promise<void> {
  const watchUntil = new Date(deployment.watch_until as string)
  const projectId = deployment.project_id as string
  const serviceId = deployment.service_id as string
  const readyAt = new Date(deployment.ready_at as string)

  const { count: postDeployCount, error: countError } = await supabase
    .from('engine_events')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('service_id', serviceId)
    .eq('type', 'service.error.reported')
    .gte('created_at', readyAt.toISOString())
    .lte('created_at', now.toISOString())

  if (countError) {
    console.error('[deploymentWatch] failed to count errors:', countError)
    await supabase
      .from('deployments')
      .update({ watch_status: 'failed', updated_at: now.toISOString() })
      .eq('id', deployment.id)
    return
  }

  const baselineCount = deployment.baseline_error_count as number
  const currentCount = postDeployCount ?? 0
  const elapsedMinutes = Math.round(
    (now.getTime() - readyAt.getTime()) / 60000
  )

  let increasePercent: number | null = null
  if (baselineCount > 0) {
    increasePercent = Math.round(
      ((currentCount - baselineCount) / baselineCount) * 100
    )
  }

  const { error: updateError } = await supabase
    .from('deployments')
    .update({
      current_error_count: currentCount,
      error_increase_percent: increasePercent,
      updated_at: now.toISOString(),
    })
    .eq('id', deployment.id)

  if (updateError) {
    console.error('[deploymentWatch] failed to update deployment:', updateError)
  }

  const shouldAlert =
    currentCount >= ERROR_THRESHOLD_COUNT &&
    (baselineCount === 0
      ? currentCount >= ERROR_THRESHOLD_COUNT
      : increasePercent !== null &&
        increasePercent >= ERROR_THRESHOLD_PERCENT)

  const alreadyAlerted = (deployment.alert_id as string | null) !== null

  if (shouldAlert && !alreadyAlerted) {
    await createDeploymentRegressionAlert({
      deployment,
      projectId,
      serviceId,
      currentCount,
      baselineCount,
      increasePercent,
      elapsedMinutes,
      now,
    })
  }

  if (now >= watchUntil) {
    await supabase
      .from('deployments')
      .update({
        watch_status: 'completed',
        updated_at: now.toISOString(),
      })
      .eq('id', deployment.id)
    console.log(
      `[deploymentWatch] watch completed: ${deployment.provider_deployment_id as string}`
    )
  }
}

async function createDeploymentRegressionAlert(params: {
  deployment: Record<string, unknown>
  projectId: string
  serviceId: string
  currentCount: number
  baselineCount: number
  increasePercent: number | null
  elapsedMinutes: number
  now: Date
}): Promise<void> {
  const {
    deployment, projectId, serviceId,
    currentCount, baselineCount, increasePercent, elapsedMinutes, now,
  } = params

  const deploymentId = deployment.provider_deployment_id as string
  const severity =
    currentCount >= 10 && (increasePercent === null || increasePercent >= 300)
      ? 'critical'
      : 'warning'

  const title = `${serviceId} errors increased after deploy`
  const message =
    baselineCount === 0
      ? `${elapsedMinutes} minutes after deployment ${deploymentId}, ` +
        `${currentCount} errors detected (baseline: 0).`
      : `${elapsedMinutes} minutes after deployment ${deploymentId}, ` +
        `service.error.reported increased from ${baselineCount} to ${currentCount} ` +
        `(+${increasePercent ?? 0}%).`
  const fingerprint = `${projectId}:${serviceId}:deployment_regression:${deploymentId}`

  const actionId = await createAction({
    projectId,
    serviceId,
    type: 'evaluate_deployment_watch',
    title: `Evaluate deployment watch: ${deploymentId}`,
    input: { deploymentId, baselineCount, currentCount, increasePercent, elapsedMinutes },
    requestedBy: 'scheduler',
  })

  const { data: alertData, error: alertError } = await supabase
    .from('engine_alerts')
    .insert({
      project_id: projectId,
      service_id: serviceId,
      type: 'deployment_regression',
      severity,
      title,
      message,
      status: 'open',
      fingerprint,
      count: 1,
      last_seen_at: now.toISOString(),
    })
    .select('id')
    .single()

  if (alertError) {
    console.error('[deploymentWatch] failed to create alert:', alertError)
    if (actionId) await failAction(actionId, { message: alertError.message })
    return
  }

  const { error: alertUpdateError } = await supabase
    .from('deployments')
    .update({
      alert_id: alertData.id,
      watch_status: 'alerted',
      updated_at: now.toISOString(),
    })
    .eq('id', deployment.id)

  if (alertUpdateError) {
    console.error('[deploymentWatch] failed to update deployment after alert:', alertUpdateError)
    await supabase
      .from('deployments')
      .update({ watch_status: 'failed', updated_at: now.toISOString() })
      .eq('id', deployment.id)
    if (actionId) await failAction(actionId, { message: alertUpdateError.message })
    return
  }

  if (actionId) {
    await completeAction(actionId, {
      alertId: alertData.id,
      severity,
      currentCount,
      increasePercent,
    })
  }

  console.log(
    `[deploymentWatch] alert created: ${alertData.id as string} for deployment ${deploymentId}`
  )
}
