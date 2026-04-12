import { describe, it, expect } from 'vitest'
import { loadConfig } from './config.js'

describe('loadConfig', () => {
  it('デフォルト値が正しく設定される', () => {
    const config = loadConfig({})
    expect(config.engine.port).toBe(3001)
    expect(config.engine.host).toBe('127.0.0.1')
    expect(config.projectId).toBe('project_bionic')
    expect(config.scheduler.enabled).toBe(false)
    expect(config.scheduler.digestCron).toBe('0 9 * * 1')
    expect(config.discord.mode).toBe('disabled')
    expect(config.notification.quietHoursStart).toBe(23)
    expect(config.notification.quietHoursEnd).toBe(7)
  })

  it('BOT_TOKENとCHANNEL_IDが両方あればmode=botになる', () => {
    const config = loadConfig({
      BIONIC_DISCORD_BOT_TOKEN: 'token',
      BIONIC_DISCORD_CHANNEL_ID: '12345',
    })
    expect(config.discord.mode).toBe('bot')
  })

  it('BOT_TOKENのみでCHANNEL_IDなしでもmode=botになる（warningのみ）', () => {
    const config = loadConfig({
      BIONIC_DISCORD_BOT_TOKEN: 'token',
    })
    expect(config.discord.mode).toBe('bot')
    expect(config.discord.channelId).toBeNull()
  })

  it('WEBHOOK_URLのみあればmode=webhookになる', () => {
    const config = loadConfig({
      DISCORD_WEBHOOK_URL: 'https://discord.com/webhook/xxx',
    })
    expect(config.discord.mode).toBe('webhook')
  })

  it('BOT_TOKENがあればWEBHOOK_URLよりbotを優先する', () => {
    const config = loadConfig({
      BIONIC_DISCORD_BOT_TOKEN: 'token',
      DISCORD_WEBHOOK_URL: 'https://discord.com/webhook/xxx',
      BIONIC_DISCORD_CHANNEL_ID: '12345',
    })
    expect(config.discord.mode).toBe('bot')
  })

  it('不正なPORTはデフォルトにフォールバックする', () => {
    const config = loadConfig({ PORT: 'abc' })
    expect(config.engine.port).toBe(3001)
  })

  it('不正なプロジェクトIDはデフォルトにフォールバックする', () => {
    const config = loadConfig({ BIONIC_PROJECT_ID: 'invalid id!' })
    expect(config.projectId).toBe('project_bionic')
  })

  it('不正なcron式はデフォルトにフォールバックする', () => {
    const config = loadConfig({ BIONIC_DIGEST_CRON: 'invalid' })
    expect(config.scheduler.digestCron).toBe('0 9 * * 1')
  })

  it('許可外のtimezoneはデフォルトにフォールバックする', () => {
    const config = loadConfig({ BIONIC_DIGEST_TIMEZONE: 'Invalid/Zone' })
    expect(config.scheduler.digestTimezone).toBe('Asia/Tokyo')
  })

  it('VERCEL_PROJECT_MAPが正しくパースされる', () => {
    const config = loadConfig({
      BIONIC_VERCEL_PROJECT_MAP: 'prj_xxx:medini-api,prj_yyy:another-api',
    })
    expect(config.vercel.projectMap.get('prj_xxx')).toBe('medini-api')
    expect(config.vercel.projectMap.get('prj_yyy')).toBe('another-api')
  })

  it('BIONIC_DISCORD_APPROVER_IDSがCSVでパースされる', () => {
    const config = loadConfig({
      BIONIC_DISCORD_APPROVER_IDS: '111,222,333',
    })
    expect(config.discord.approverIds).toEqual(['111', '222', '333'])
  })

  it('production環境でtokenがなければvalidateConfigForStartupが終了する', () => {
    const config = loadConfig({ NODE_ENV: 'production' })
    expect(config.engine.isProduction).toBe(true)
    expect(config.engine.token).toBeNull()
  })
})
