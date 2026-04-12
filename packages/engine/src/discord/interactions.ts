import type { Interaction } from 'discord.js'
import { approveAction, denyAction } from '../actions/service.js'

const ALLOWED_USER_IDS = (process.env.BIONIC_DISCORD_APPROVER_IDS ?? '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)

export async function handleInteraction(interaction: Interaction): Promise<void> {
  if (!interaction.isButton()) return

  const { customId, user } = interaction

  if (ALLOWED_USER_IDS.length === 0) {
    await interaction.reply({
      content: '❌ No approvers configured. Set BIONIC_DISCORD_APPROVER_IDS in .env.local',
      ephemeral: true,
    })
    return
  }

  if (!ALLOWED_USER_IDS.includes(user.id)) {
    await interaction.reply({
      content: '❌ You are not authorized to approve/deny actions.',
      ephemeral: true,
    })
    return
  }

  if (customId.startsWith('bionic:approve:')) {
    const actionId = customId.replace('bionic:approve:', '')
    const result = await approveAction({
      actionId,
      actorId: `discord:${user.id}`,
    })

    if (result.success) {
      await interaction.reply({
        content: `✅ Approved by <@${user.id}>`,
        ephemeral: false,
      })
      await interaction.message.edit({ components: [] })
    } else {
      await interaction.reply({
        content: `❌ Failed to approve: ${result.error}`,
        ephemeral: true,
      })
    }
    return
  }

  if (customId.startsWith('bionic:deny:')) {
    const actionId = customId.replace('bionic:deny:', '')
    const result = await denyAction({
      actionId,
      actorId: `discord:${user.id}`,
    })

    if (result.success) {
      await interaction.reply({
        content: `🚫 Denied by <@${user.id}>`,
        ephemeral: false,
      })
      await interaction.message.edit({ components: [] })
    } else {
      await interaction.reply({
        content: `❌ Failed to deny: ${result.error}`,
        ephemeral: true,
      })
    }
    return
  }
}
