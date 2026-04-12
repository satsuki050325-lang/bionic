import { supabase } from '../lib/supabase.js'

export interface ApproveActionParams {
  actionId: string
  actorId: string
}

export interface ApproveActionResult {
  success: boolean
  error?: string
}

export async function approveAction(
  params: ApproveActionParams
): Promise<ApproveActionResult> {
  const { data: updated, error } = await supabase
    .from('engine_actions')
    .update({
      status: 'approved',
      approved_by: params.actorId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.actionId)
    .eq('status', 'pending_approval')
    .select('id')

  if (error) {
    return { success: false, error: error.message }
  }

  if (!updated || updated.length === 0) {
    return { success: false, error: 'action is not pending approval' }
  }

  return { success: true }
}

export async function denyAction(
  params: ApproveActionParams
): Promise<ApproveActionResult> {
  const { data: updated, error } = await supabase
    .from('engine_actions')
    .update({
      status: 'denied',
      denied_by: params.actorId,
      denied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.actionId)
    .eq('status', 'pending_approval')
    .select('id')

  if (error) {
    return { success: false, error: error.message }
  }

  if (!updated || updated.length === 0) {
    return { success: false, error: 'action is not pending approval' }
  }

  return { success: true }
}
