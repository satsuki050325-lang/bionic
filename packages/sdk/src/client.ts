import type { EngineEvent, EventSource } from '@bionic/shared'

export interface BionicSDKConfig {
  engineUrl: string
  projectId: string
  serviceId: string
  source?: EventSource
  token?: string
  dedupeWindowMs?: number
  rateLimitPerMinute?: number
  healthOkDedupeMs?: number
}

export interface SendEventResult {
  accepted: boolean
  eventId: string | null
  reason?: 'rate_limited' | 'duplicate' | 'failed'
}

export class BionicClient {
  private engineUrl: string
  private projectId: string
  private serviceId: string
  private source: EventSource
  private token: string | undefined
  private dedupeWindowMs: number
  private rateLimitPerMinute: number
  private healthOkDedupeMs: number

  private readonly dedupeCache = new Map<string, number>()
  private readonly rateLimitWindow: number[] = []
  private readonly lastHealthStatus = new Map<string, string>()

  constructor(config: BionicSDKConfig) {
    this.engineUrl = config.engineUrl.replace(/\/$/, '')
    this.projectId = config.projectId
    this.serviceId = config.serviceId
    this.source = config.source ?? 'sdk'
    this.token = config.token
    this.dedupeWindowMs = config.dedupeWindowMs ?? 30_000
    this.rateLimitPerMinute = config.rateLimitPerMinute ?? 60
    this.healthOkDedupeMs = config.healthOkDedupeMs ?? 60_000
  }

  private getEventKey(type: string, payload: Record<string, unknown>): string {
    const stableKey =
      (payload.fingerprint as string | undefined) ??
      (payload.code as string | undefined) ??
      (payload.status as string | undefined) ??
      (payload.message as string | undefined)?.slice(0, 80) ??
      'default'
    return `${type}:${stableKey}`
  }

  private isRateLimited(): boolean {
    const now = Date.now()
    const windowMs = 60_000
    while (
      this.rateLimitWindow.length > 0 &&
      this.rateLimitWindow[0] < now - windowMs
    ) {
      this.rateLimitWindow.shift()
    }
    return this.rateLimitWindow.length >= this.rateLimitPerMinute
  }

  private isDuplicate(
    eventKey: string,
    dedupeMs: number,
    type: string,
    payload: Record<string, unknown>
  ): boolean {
    if (type === 'service.health.reported' && payload.status === 'ok') {
      const serviceKey = (payload.serviceId as string | undefined) ?? this.serviceId
      const prev = this.lastHealthStatus.get(serviceKey)
      if (prev && prev !== 'ok') {
        return false
      }
    }
    const lastSentAt = this.dedupeCache.get(eventKey)
    if (!lastSentAt) return false
    return Date.now() - lastSentAt < dedupeMs
  }

  private recordHealthStatus(type: string, payload: Record<string, unknown>): void {
    if (type.startsWith('service.health.')) {
      const serviceKey = (payload.serviceId as string | undefined) ?? this.serviceId
      const status = (payload.status as string | undefined) ?? 'unknown'
      this.lastHealthStatus.set(serviceKey, status)
    }
  }

  private recordSent(eventKey: string): void {
    const now = Date.now()
    this.dedupeCache.set(eventKey, now)
    this.rateLimitWindow.push(now)
  }

  private async sendEvent(
    type: EngineEvent['type'],
    payload: Record<string, unknown>
  ): Promise<SendEventResult> {
    if (this.isRateLimited()) {
      console.warn('[bionic-sdk] rate limit reached. event dropped.')
      return { accepted: false, eventId: null, reason: 'rate_limited' }
    }

    const dedupeMs =
      type.includes('health') && payload.status === 'ok'
        ? this.healthOkDedupeMs
        : this.dedupeWindowMs

    const eventKey = this.getEventKey(type, payload)
    if (this.isDuplicate(eventKey, dedupeMs, type, payload)) {
      console.debug('[bionic-sdk] duplicate event. skipped.')
      return { accepted: false, eventId: null, reason: 'duplicate' }
    }

    const event: EngineEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      projectId: this.projectId,
      serviceId: this.serviceId,
      type,
      occurredAt: new Date().toISOString(),
      source: this.source,
      payload,
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const res = await fetch(`${this.engineUrl}/api/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ event }),
    })

    if (!res.ok) {
      throw new Error(`Failed to send event: ${res.status} ${res.statusText}`)
    }

    this.recordSent(eventKey)
    this.recordHealthStatus(type, payload)
    return { accepted: true, eventId: event.id }
  }

  async health(payload: {
    status: 'ok' | 'degraded' | 'down'
    latencyMs?: number
  }): Promise<SendEventResult> {
    const type =
      payload.status === 'ok'
        ? 'service.health.reported'
        : 'service.health.degraded'
    return this.sendEvent(type, payload)
  }

  async error(payload: {
    message: string
    code?: string
    stack?: string
  }): Promise<SendEventResult> {
    return this.sendEvent('service.error.reported', payload)
  }

  async usage(payload: {
    activeUsers?: number
    requestCount?: number
    [key: string]: unknown
  }): Promise<SendEventResult> {
    return this.sendEvent('service.usage.reported', payload)
  }
}
