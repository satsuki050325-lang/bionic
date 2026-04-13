import { supabase } from '../lib/supabase.js'
import { createAction, completeAction, failAction } from '../actions/logAction.js'
import { getConfig } from '../config.js'

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
  const config = getConfig()
  const watchMinutes = config.deploymentWatch.watchMinutes
  const thresholdErrorCount = config.deploymentWatch.thresholdErrorCount
  const thresholdIncreasePercent = config.deploymentWatch.thresholdIncreasePercent

  const watchUntil = new Date(deployment.watch_until as string)
  const projectId = deployment.project_id as string
  const serviceId = deployment.service_id as string
  const readyAt = new Date(deployment.ready_at as string)

  const elapsedMs = Math.max(0, now.getTime() - readyAt.getTime())
  const watchMs = watchMinutes * 60 * 1000
  const windowMs = Math.min(elapsedMs, watchMs)
  const elapsedMinutes = Math.max(1, Math.floor(windowMs / 60000))

  const baselineStart = new Date(readyAt.getTime() - windowMs)
  const baselineEnd = readyAt
  const currentStart = readyAt
  const currentEnd = new Date(readyAt.getTime() + windowMs)

  const { count: baselineCountRaw, error: baselineError } = await supabase
    .from('engine_events')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('service_id', serviceId)
    .eq('type', 'service.error.reported')
    .gte('created_at', baselineStart.toISOString())
    .lt('created_at', baselineEnd.toISOString())

  if (baselineError) {
    console.error('[deploymentWatch] failed to count baseline:', baselineError)
    await supabase
      .from('deployments')
      .update({ watch_status: 'failed', updated_at: now.toISOString() })
      .eq('id', deployment.id)
    return
  }

  const { count: currentCountRaw, error: countError } = await supabase
    .from('engine_events')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('service_id', serviceId)
    .eq('type', 'service.error.reported')
    .gte('created_at', currentStart.toISOString())
    .lte('created_at', currentEnd.toISOString())

  if (countError) {
    console.error('[deploymentWatch] failed to count errors:', countError)
    await supabase
      .from('deployments')
      .update({ watch_status: 'failed', updated_at: now.toISOString() })
      .eq('id', deployment.id)
    return
  }

  const baselineCount = baselineCountRaw ?? 0
  const currentCount = currentCountRaw ?? 0

  let increasePercent: number | null = null
  if (baselineCount > 0) {
    increasePercent = Math.round(
      ((currentCount - baselineCount) / baselineCount) * 100
    )
  }

  const { error: updateError } = await supabase
    .from('deployments')
    .update({
      baseline_error_count: baselineCount,
      current_error_count: currentCount,
      error_increase_percent: increasePercent,
      updated_at: now.toISOString(),
    })
    .eq('id', deployment.id)

  if (updateError) {
    console.error('[deploymentWatch] failed to update deployment:', updateError)
  }

  const shouldAlert =
    currentCount >= thresholdErrorCount &&
    (baselineCount === 0
      ? currentCount >= thresholdErrorCount
      : increasePercent !== null &&
        increasePercent >= thresholdIncreasePercent)

  const alreadyAlerted = (deployment.alert_id as string | null) !== null

  let alertCreated = false
  if (shouldAlert && !alreadyAlerted) {
    alertCreated = await createDeploymentRegressionAlert({
      deployment,
      projectId,
      serviceId,
      currentCount,
      baselineCount,
      increasePercent,
      elapsedMinutes,
      thresholdErrorCount,
      thresholdIncreasePercent,
      now,
    })
  }

  if (now >= watchUntil && !alertCreated) {
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
  thresholdErrorCount: number
  thresholdIncreasePercent: number
  now: Date
}): Promise<boolean> {
  const {
    deployment, projectId, serviceId,
    currentCount, baselineCount, increasePercent, elapsedMinutes,
    thresholdErrorCount, thresholdIncreasePercent, now,
  } = params

  const deploymentId = deployment.provider_deployment_id as string
  const severity =
    currentCount >= thresholdErrorCount * 2 &&
    (increasePercent === null || increasePercent >= thresholdIncreasePercent * 1.5)
      ? 'critical'
      : 'warning'

  const title = `${serviceId} errors increased after deploy`
  const message = [
    `Error event count increased from ${baselineCount} to ${currentCount}`,
    `within ${elapsedMinutes} minutes after deployment.`,
    `Increase: ${increasePercent !== null ? `+${increasePercent}%` : 'n/a (baseline=0)'}`,
    `Threshold: count>=${thresholdErrorCount} && increase>=${thresholdIncreasePercent}%`,
    `Deployment: ${deploymentId}`,
  ].join(' ')
  const fingerprint = `${projectId}:${serviceId}:deployment_regression:${deploymentId}`

  const actionId = await createAction({
    projectId,
    serviceId,
    type: 'evaluate_deployment_watch',
    title: `Evaluate deployment watch: ${deploymentId}`,
    input: {
      deploymentId,
      baselineWindowMinutes: elapsedMinutes,
      elapsedMinutes,
      baselineCount,
      currentCount,
      increasePercent,
      thresholdErrorCount,
      thresholdIncreasePercent,
    },
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
    return false
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
    return false
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
  return true
}
