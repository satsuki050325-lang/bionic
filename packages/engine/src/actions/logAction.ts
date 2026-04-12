import { supabase } from '../lib/supabase.js'
import type { ActionType, ActionMode, EngineAction } from '@bionic/shared'
import { getDiscordClient } from '../discord/index.js'
import { sendApprovalNotification } from '../discord/notifications.js'

interface CreateActionParams {
  projectId: string
  serviceId?: string
  eventId?: string
  alertId?: string
  jobId?: string
  type: ActionType
  mode?: ActionMode
  title: string
  reason?: string
  input?: Record<string, unknown>
  requestedBy?: string
}

export async function createAction(params: CreateActionParams): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('engine_actions')
      .insert({
        project_id: params.projectId,
        service_id: params.serviceId ?? null,
        event_id: params.eventId ?? null,
        alert_id: params.alertId ?? null,
        job_id: params.jobId ?? null,
        type: params.type,
        mode: params.mode ?? 'automatic',
        status: 'running',
        title: params.title,
        reason: params.reason ?? null,
        input: params.input ?? {},
        requested_by: params.requestedBy ?? 'engine',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('[logAction] failed to create action:', error)
      return null
    }

    return data.id
  } catch (err) {
    console.error('[logAction] unexpected error in createAction:', err)
    return null
  }
}

export async function completeAction(
  actionId: string,
  result: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('engine_actions')
      .update({
        status: 'succeeded',
        result,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', actionId)

    if (error) {
      console.error('[logAction] failed to complete action:', error)
    }
  } catch (err) {
    console.error('[logAction] unexpected error in completeAction:', err)
  }
}

export async function failAction(
  actionId: string,
  error: Record<string, unknown>
): Promise<void> {
  try {
    const { error: dbError } = await supabase
      .from('engine_actions')
      .update({
        status: 'failed',
        error,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', actionId)

    if (dbError) {
      console.error('[logAction] failed to fail action:', dbError)
    }
  } catch (err) {
    console.error('[logAction] unexpected error in failAction:', err)
  }
}

interface CreateApprovalActionParams {
  projectId: string
  serviceId?: string
  alertId?: string
  jobId?: string
  type: ActionType
  title: string
  reason?: string
  input?: Record<string, unknown>
  requestedBy?: string
}

export async function createApprovalAction(
  params: CreateApprovalActionParams
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('engine_actions')
      .insert({
        project_id: params.projectId,
        service_id: params.serviceId ?? null,
        alert_id: params.alertId ?? null,
        job_id: params.jobId ?? null,
        type: params.type,
        mode: 'approval_required',
        status: 'pending_approval',
        title: params.title,
        reason: params.reason ?? null,
        input: params.input ?? {},
        requested_by: params.requestedBy ?? 'engine',
        started_at: null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[logAction] failed to create approval action:', error)
      return null
    }

    const discordClient = getDiscordClient()
    if (discordClient && data) {
      const now = new Date().toISOString()
      const action: EngineAction = {
        id: data.id,
        projectId: params.projectId,
        serviceId: params.serviceId ?? null,
        eventId: null,
        alertId: params.alertId ?? null,
        jobId: params.jobId ?? null,
        type: params.type,
        mode: 'approval_required',
        status: 'pending_approval',
        title: params.title,
        reason: params.reason ?? null,
        input: params.input ?? {},
        result: {},
        error: null,
        requestedBy: params.requestedBy ?? 'engine',
        approvedBy: null,
        approvedAt: null,
        deniedBy: null,
        deniedAt: null,
        startedAt: null,
        completedAt: null,
        lastNotifiedAt: null,
        notificationCount: 0,
        createdAt: now,
        updatedAt: now,
      }
      void sendApprovalNotification(discordClient, action)
    }

    return data.id
  } catch (err) {
    console.error('[logAction] unexpected error in createApprovalAction:', err)
    return null
  }
}

export async function skipAction(
  actionId: string,
  reason: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('engine_actions')
      .update({
        status: 'skipped',
        result: { reason },
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', actionId)

    if (error) {
      console.error('[logAction] failed to skip action:', error)
    }
  } catch (err) {
    console.error('[logAction] unexpected error in skipAction:', err)
  }
}
