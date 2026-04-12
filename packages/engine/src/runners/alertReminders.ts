import { supabase } from '../lib/supabase.js'
import { shouldNotify } from '../policies/notification.js'
import { getDiscordClient } from '../discord/index.js'
import { sendAlertNotification } from '../discord/notifications.js'
import type { Alert } from '@bionic/shared'

export async function runCriticalAlertReminders(): Promise<void> {
  const now = new Date()

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

  const discordClient = getDiscordClient()
  if (!discordClient) return

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
    void sendAlertNotification(discordClient, alert)
  }
}
