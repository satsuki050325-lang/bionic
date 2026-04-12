import type { Client, TextChannel } from 'discord.js'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import type { Alert, EngineAction } from '@bionic/shared'
import { buildAlertEmbed, buildApprovalEmbed } from './embeds.js'
import { supabase } from '../lib/supabase.js'

const CHANNEL_ID = process.env.BIONIC_DISCORD_CHANNEL_ID

export async function sendAlertNotification(
  client: Client,
  alert: Alert
): Promise<void> {
  if (!CHANNEL_ID) {
    console.warn('[discord] BIONIC_DISCORD_CHANNEL_ID not set')
    return
  }

  try {
    const channel = await client.channels.fetch(CHANNEL_ID)
    if (!channel?.isTextBased()) {
      console.error('[discord] channel is not text based')
      return
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
  } catch (err) {
    console.error('[discord] failed to send alert notification:', err)
  }
}

export async function sendApprovalNotification(
  client: Client,
  action: EngineAction
): Promise<void> {
  if (!CHANNEL_ID) {
    console.warn('[discord] BIONIC_DISCORD_CHANNEL_ID not set')
    return
  }

  try {
    const channel = await client.channels.fetch(CHANNEL_ID)
    if (!channel?.isTextBased()) return

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
  } catch (err) {
    console.error('[discord] failed to send approval notification:', err)
  }
}
