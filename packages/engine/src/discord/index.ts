import { createDiscordClient } from './client.js'
import { handleInteraction } from './interactions.js'
import type { Client } from 'discord.js'

const BOT_TOKEN = process.env.BIONIC_DISCORD_BOT_TOKEN

let discordClient: Client | null = null

export async function startDiscordBot(): Promise<Client | null> {
  if (!BOT_TOKEN) {
    console.log('[discord] BIONIC_DISCORD_BOT_TOKEN not set. Using Webhook mode.')
    return null
  }

  const client = createDiscordClient()

  client.once('ready', (c) => {
    console.log(`[discord] Bot ready: ${c.user.tag}`)
  })

  client.on('interactionCreate', async (interaction) => {
    await handleInteraction(interaction)
  })

  await client.login(BOT_TOKEN)
  discordClient = client
  return client
}

export function getDiscordClient(): Client | null {
  return discordClient
}

export async function stopDiscordBot(): Promise<void> {
  if (discordClient) {
    discordClient.destroy()
    discordClient = null
    console.log('[discord] Bot stopped.')
  }
}
