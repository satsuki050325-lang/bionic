import type { Client, TextChannel } from 'discord.js'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import type { Alert, EngineAction } from '@bionic/shared'
import { buildAlertEmbed, buildApprovalEmbed } from './embeds.js'
import { supabase } from '../lib/supabase.js'
import { getConfig } from '../config.js'

export async function sendAlertNotification(
  client: Client,
  alert: Alert
): Promise<boolean> {
  const channelId = getConfig().discord.channelId
  if (!channelId) {
    console.warn('[discord] BIONIC_DISCORD_CHANNEL_ID not set')
    return false
  }

  try {
    const channel = await client.channels.fetch(channelId)
    if (!channel?.isTextBased()) {
      console.error('[discord] channel is not text based')
      return false
    }

    const embed = buildAlertEmbed(alert)
    await (channel as TextChannel).send({ embeds: [embed] })

    await supabase
      .from('engine_alerts')
      .update({
        last_notified_at: new Date().toISOString(),
        notification_count: (alert.notificationCount ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alert.id)

    console.log(`[discord] alert notification sent: ${alert.id}`)
    return true
  } catch (err) {
    console.error('[discord] failed to send alert notification:', err)
    return false
  }
}

export async function sendDigestNotification(
  client: Client,
  items: Array<{ title: string; summary: string; importanceScore: number }>,
  projectId: string
): Promise<'sent' | 'skipped' | 'failed'> {
  const channelId = getConfig().discord.channelId
  if (!channelId) return 'failed'
  if (items.length === 0) return 'skipped'

  try {
    const channel = await client.channels.fetch(channelId)
    if (!channel?.isTextBased()) return 'failed'

    const topItems = items.slice(0, 3)
    const embed = {
      title: '📋 Weekly Research Digest',
      description: `${items.length} research item(s) this week`,
      color: 0xe8611a,
      fields: topItems.map((item, i) => ({
        name: `${i + 1}. [Score: ${item.importanceScore}] ${item.title}`,
        value: item.summary.slice(0, 200) + (item.summary.length > 200 ? '...' : ''),
        inline: false,
      })),
      footer: { text: `Bionic Research Digest · ${projectId}` },
      timestamp: new Date().toISOString(),
    }

    await (channel as TextChannel).send({ embeds: [embed] })
    return 'sent'
  } catch (err) {
    console.error('[discord] failed to send digest notification:', err)
    return 'failed'
  }
}

export async function sendApprovalNotificationViaWebhook(
  webhookUrl: string,
  action: EngineAction
): Promise<boolean> {
  try {
    const payload = {
      content: `⏳ **Approval Required**: ${action.title}\nType: ${action.type} | ID: \`${action.id}\`\nApprove via CLI: \`bionic approve ${action.id}\``,
    }
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function sendAlertNotificationViaWebhook(
  webhookUrl: string,
  alert: Alert
): Promise<boolean> {
  try {
    const severityEmoji =
      alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵'
    const payload = {
      content: `${severityEmoji} **[${alert.severity.toUpperCase()}] ${alert.title}**\n${alert.message}\nService: ${alert.serviceId ?? 'unknown'} | Count: ${alert.count ?? 1}`,
    }
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function sendApprovalNotification(
  client: Client,
  action: EngineAction
): Promise<boolean> {
  const channelId = getConfig().discord.channelId
  if (!channelId) {
    console.warn('[discord] BIONIC_DISCORD_CHANNEL_ID not set')
    return false
  }

  try {
    const channel = await client.channels.fetch(channelId)
    if (!channel?.isTextBased()) return false

    const embed = buildApprovalEmbed(action)

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`bionic:approve:${action.id}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`bionic:deny:${action.id}`)
        .setLabel('Deny')
        .setStyle(ButtonStyle.Danger)
    )

    await (channel as TextChannel).send({
      embeds: [embed],
      components: [row],
    })

    console.log(`[discord] approval notification sent: ${action.id}`)
    return true
  } catch (err) {
    console.error('[discord] failed to send approval notification:', err)
    return false
  }
}
