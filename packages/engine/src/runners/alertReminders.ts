import { supabase } from '../lib/supabase.js'
import { shouldNotify } from '../policies/notification.js'
import { getDiscordClient } from '../discord/index.js'
import {
  sendAlertNotification,
  sendAlertNotificationViaWebhook,
} from '../discord/notifications.js'
import { getConfig } from '../config.js'
import type { Alert } from '@bionic/shared'

export async function runCriticalAlertReminders(): Promise<void> {
  const now = new Date()
  const config = getConfig()
  const discordClient = getDiscordClient()

  const { data: alerts, error } = await supabase
    .from('engine_alerts')
    .select('*')
    .eq('status', 'open')
    .eq('severity', 'critical')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[runners/alertReminders] failed to fetch alerts:', error)
    return
  }

  for (const row of alerts ?? []) {
    const decision = shouldNotify({
      kind: 'alert_reminder',
      severity: 'critical',
      status: 'open',
      lastNotifiedAt: row['last_notified_at'] as string | null,
      now,
    })

    if (!decision.shouldNotify) continue

    const alert = row as unknown as Alert
    let notified = false

    if (discordClient) {
      try {
        await sendAlertNotification(discordClient, alert)
        notified = true
      } catch (err) {
        console.error('[runners/alertReminders] Bot notification failed:', err)
        notified = false
      }
    } else if (config.discord.webhookUrl) {
      notified = await sendAlertNotificationViaWebhook(config.discord.webhookUrl, alert)
    }

    if (notified) {
      await supabase
        .from('engine_alerts')
        .update({
          last_notified_at: now.toISOString(),
          notification_count: ((row['notification_count'] as number) ?? 0) + 1,
          updated_at: now.toISOString(),
        })
        .eq('id', row['id'])
    }
  }
}
