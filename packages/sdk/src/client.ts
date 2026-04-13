import type { EngineEvent, EventSource } from '@bionic/shared'

/**
 * Configuration for the Bionic SDK client.
 */
export interface BionicSDKConfig {
  /** Bionic Engine base URL, e.g. `http://localhost:3001`. */
  engineUrl: string
  /** Project identifier (e.g. `project_bionic`). */
  projectId: string
  /** Service identifier — what your application calls itself in Bionic (e.g. `my-api`). */
  serviceId: string
  /** Where this event originated. Defaults to `'sdk'`. */
  source?: EventSource
  /** Engine bearer token. Required in production deployments. */
  token?: string
  /** Default dedupe window in ms. Defaults to 30_000. */
  dedupeWindowMs?: number
  /** Max events sent per minute. Defaults to 60. */
  rateLimitPerMinute?: number
  /** Dedupe window for `health.status=ok` events. Defaults to 60_000. */
  healthOkDedupeMs?: number
  /** HTTP request timeout in ms. Defaults to 3000. */
  timeoutMs?: number
  /**
   * If `true`, network/HTTP failures will throw. Defaults to `false` (fail-open).
   * Fail-open means SDK errors never disrupt your application.
   */
  throwOnError?: boolean
}

/**
 * Result returned from sending an event.
 */
export interface SendEventResult {
  /** `true` if Engine accepted the event. */
  accepted: boolean
  /** Server-assigned event id, or `null` if the event was not delivered. */
  eventId: string | null
  /** Why the event was not accepted (only set when `accepted=false`). */
  reason?: 'rate_limited' | 'duplicate' | 'failed' | string
}

/**
 * Bionic SDK Client.
 *
 * Sends observability events to Bionic Engine.
 * SDK failures are fail-open by default — they will not throw or disrupt your application.
 *
 * IMPORTANT: This SDK should only be used server-side.
 * Never expose your Engine token in browser environments.
 *
 * @example
 * ```ts
 * const bionic = new BionicClient({
 *   engineUrl: process.env.BIONIC_ENGINE_URL!,
 *   token: process.env.BIONIC_ENGINE_TOKEN,
 *   projectId: 'project_bionic',
 *   serviceId: 'my-api',
 * })
 *
 * // Fire-and-forget (recommended)
 * void bionic.health({ status: 'ok' })
 *
 * // With result
 * const result = await bionic.error({ code: 'DB_ERROR', message: '...' })
 * ```
 */
export class BionicClient {
  private engineUrl: string
  private projectId: string
  private serviceId: string
  private source: EventSource
  private token: string | undefined
  private dedupeWindowMs: number
  private rateLimitPerMinute: number
  private healthOkDedupeMs: number
  private timeoutMs: number
  private throwOnError: boolean

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
    this.timeoutMs = config.timeoutMs ?? 3000
    this.throwOnError = config.throwOnError ?? false
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

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const res = await fetch(`${this.engineUrl}/api/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ event }),
        signal: controller.signal,
      })

      if (!res.ok) {
        if (this.throwOnError) {
          throw new Error(`Failed to send event: ${res.status} ${res.statusText}`)
        }
        console.warn(`[bionic-sdk] engine returned ${res.status}`)
        return { accepted: false, eventId: null, reason: `http_${res.status}` }
      }

      this.recordSent(eventKey)
      this.recordHealthStatus(type, payload)
      return { accepted: true, eventId: event.id }
    } catch (err) {
      if (this.throwOnError) throw err
      console.warn('[bionic-sdk] failed to send event:', err)
      return { accepted: false, eventId: null, reason: 'failed' }
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Report service health. Use `status: 'ok'` for healthy, `'degraded'` for partial issues,
   * `'down'` for outage.
   */
  async health(payload: {
    status: 'ok' | 'degraded' | 'down'
    latencyMs?: number
    [key: string]: unknown
  }): Promise<SendEventResult> {
    const type =
      payload.status === 'ok'
        ? 'service.health.reported'
        : 'service.health.degraded'
    return this.sendEvent(type, payload)
  }

  /**
   * Report a service error.
   *
   * Note: stack traces are NOT sent by default to avoid leaking sensitive information.
   * Pass `includeStack: true` explicitly if you need stack traces.
   */
  async error(payload: {
    message: string
    code?: string
    name?: string
    stack?: string
    includeStack?: boolean
    [key: string]: unknown
  }): Promise<SendEventResult> {
    const { includeStack = false, stack, ...rest } = payload
    const finalPayload =
      includeStack && stack ? { ...rest, stack } : rest
    return this.sendEvent('service.error.reported', finalPayload)
  }

  /**
   * Report usage signals (request counts, active users, etc.).
   */
  async usage(payload: {
    activeUsers?: number
    requestCount?: number
    [key: string]: unknown
  }): Promise<SendEventResult> {
    return this.sendEvent('service.usage.reported', payload)
  }
}
