import { supabase } from '../lib/supabase.js'
import { shouldNotify } from '../policies/notification.js'
import { evaluateApprovalLifecycle } from '../policies/approval.js'
import { transitionActionStatus } from '../actions/state.js'
import { getDiscordClient } from '../discord/index.js'
import {
  sendApprovalNotification,
  sendApprovalNotificationViaWebhook,
} from '../discord/notifications.js'
import { getConfig } from '../config.js'
import type { EngineAction } from '@bionic/shared'

export async function runStaleApprovalCheck(): Promise<void> {
  const now = new Date()
  const config = getConfig()
  const discordClient = getDiscordClient()

  const { data: actions, error } = await supabase
    .from('engine_actions')
    .select('*')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[runners/approvals] failed to fetch pending actions:', error)
    return
  }

  for (const row of actions ?? []) {
    const action = row as Record<string, unknown>

    const lifecycleDecision = evaluateApprovalLifecycle({
      createdAt: action['created_at'] as string,
      now,
    })

    if (lifecycleDecision.shouldAutoCancel) {
      await transitionActionStatus(
        action['id'] as string,
        { to: 'cancelled', reason: lifecycleDecision.reason },
        { from: ['pending_approval'] }
      )
      console.log(`[runners/approvals] auto-cancelled: ${action['id']}`)
      continue
    }

    const notifyDecision = shouldNotify({
      kind: 'approval_stale',
      createdAt: action['created_at'] as string,
      lastNotifiedAt: action['last_notified_at'] as string | null,
      now,
    })

    if (!notifyDecision.shouldNotify) continue

    const engineAction = action as unknown as EngineAction
    let notified = false

    if (discordClient) {
      try {
        await sendApprovalNotification(discordClient, engineAction)
        notified = true
      } catch (err) {
        console.error('[runners/approvals] Bot notification failed:', err)
        notified = false
      }
    } else if (config.discord.webhookUrl) {
      notified = await sendApprovalNotificationViaWebhook(
        config.discord.webhookUrl,
        engineAction
      )
    }

    if (notified) {
      await supabase
        .from('engine_actions')
        .update({
          last_notified_at: now.toISOString(),
          notification_count: ((action['notification_count'] as number) ?? 0) + 1,
          updated_at: now.toISOString(),
        })
        .eq('id', action['id'])
    }
  }
}
