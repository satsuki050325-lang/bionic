import { describe, it, expect, vi, afterEach } from 'vitest'
import { loadConfig, validateConfigForStartup, redactConfig } from './config.js'

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

  it('BOT_TOKENのみでCHANNEL_IDなしはwebhookまたはdisabledになる', () => {
    const config1 = loadConfig({
      BIONIC_DISCORD_BOT_TOKEN: 'token',
    })
    expect(config1.discord.mode).toBe('disabled')

    const config2 = loadConfig({
      BIONIC_DISCORD_BOT_TOKEN: 'token',
      DISCORD_WEBHOOK_URL: 'https://discord.com/webhook/xxx',
    })
    expect(config2.discord.mode).toBe('webhook')
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

describe('validateConfigForStartup', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('productionでtokenなしの場合process.exit(1)を呼ぶ', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
    const config = loadConfig({
      NODE_ENV: 'production',
      SUPABASE_URL: 'https://xxx.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'key',
    })
    expect(() => validateConfigForStartup(config)).toThrow('process.exit called')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('productionで全必須envが揃っていればexitしない', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
    const config = loadConfig({
      NODE_ENV: 'production',
      BIONIC_ENGINE_TOKEN: 'token',
      SUPABASE_URL: 'https://xxx.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'key',
      BIONIC_HEARTBEAT_HMAC_KEY: 'prod-pepper-abcdef',
    })
    expect(() => validateConfigForStartup(config)).not.toThrow()
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it('productionでBIONIC_HEARTBEAT_HMAC_KEYが未設定だとexit(1)する', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
    const config = loadConfig({
      NODE_ENV: 'production',
      BIONIC_ENGINE_TOKEN: 'token',
      SUPABASE_URL: 'https://xxx.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'key',
      // BIONIC_HEARTBEAT_HMAC_KEY intentionally missing → must refuse to boot
    })
    expect(() => validateConfigForStartup(config)).toThrow('process.exit called')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('developmentではtoken未設定でもexitしない', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
    const config = loadConfig({ NODE_ENV: 'development' })
    expect(() => validateConfigForStartup(config)).not.toThrow()
    expect(exitSpy).not.toHaveBeenCalled()
  })
})

describe('redactConfig', () => {
  it('secretが出力されないことを確認する', () => {
    const config = loadConfig({
      BIONIC_ENGINE_TOKEN: 'super-secret-token',
      SUPABASE_URL: 'https://xxx.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'super-secret-key',
      BIONIC_DISCORD_BOT_TOKEN: 'super-secret-bot-token',
      VERCEL_WEBHOOK_SECRET: 'super-secret-webhook',
      BIONIC_DISCORD_CHANNEL_ID: '12345',
    })
    const redacted = redactConfig(config)
    const redactedStr = JSON.stringify(redacted)

    expect(redactedStr).not.toContain('super-secret-token')
    expect(redactedStr).not.toContain('super-secret-key')
    expect(redactedStr).not.toContain('super-secret-bot-token')
    expect(redactedStr).not.toContain('super-secret-webhook')
    expect(redactedStr).toContain('[set]')
  })
})
