import type { EngineEvent, EventSource } from '@bionic/shared'

export interface BionicSDKConfig {
  engineUrl: string
  projectId: string
  serviceId: string
  source?: EventSource
  token?: string
}

export class BionicClient {
  private engineUrl: string
  private projectId: string
  private serviceId: string
  private source: EventSource
  private token: string | undefined

  constructor(config: BionicSDKConfig) {
    this.engineUrl = config.engineUrl.replace(/\/$/, '')
    this.projectId = config.projectId
    this.serviceId = config.serviceId
    this.source = config.source ?? 'sdk'
    this.token = config.token
  }

  private async sendEvent(
    type: EngineEvent['type'],
    payload: Record<string, unknown>
  ): Promise<void> {
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
  }

  async health(payload: { status: 'ok' | 'degraded' | 'down'; latencyMs?: number }): Promise<void> {
    const type = payload.status === 'ok'
      ? 'service.health.reported'
      : 'service.health.degraded'
    await this.sendEvent(type, payload)
  }

  async error(payload: { message: string; code?: string; stack?: string }): Promise<void> {
    await this.sendEvent('service.error.reported', payload)
  }

  async usage(payload: { activeUsers?: number; requestCount?: number; [key: string]: unknown }): Promise<void> {
    await this.sendEvent('service.usage.reported', payload)
  }
}
