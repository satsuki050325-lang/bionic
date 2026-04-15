import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import type { UptimeCheckOutcome } from '@bionic/shared'
import { resolveForUptime } from './ssrf.js'

interface RunCheckOptions {
  url: string
  method: 'GET' | 'HEAD'
  timeoutMs: number
  expectedStatusMin: number
  expectedStatusMax: number
}

export async function runUptimeCheck(
  options: RunCheckOptions
): Promise<UptimeCheckOutcome> {
  const resolved = await resolveForUptime(options.url)
  if (!resolved.ok) {
    return {
      ok: false,
      statusCode: null,
      latencyMs: null,
      reason: resolved.reason,
    }
  }

  const { url, ip, family } = resolved
  const isHttps = url.protocol === 'https:'
  const requester = isHttps ? httpsRequest : httpRequest
  const defaultPort = isHttps ? 443 : 80

  const start = Date.now()

  return new Promise<UptimeCheckOutcome>((resolvePromise) => {
    let settled = false
    const settle = (outcome: UptimeCheckOutcome) => {
      if (settled) return
      settled = true
      resolvePromise(outcome)
    }

    const req = requester({
      method: options.method,
      host: ip,
      port: url.port ? Number(url.port) : defaultPort,
      path: (url.pathname || '/') + (url.search || ''),
      headers: {
        host: url.host,
        'user-agent': 'bionic-uptime/1.0',
        accept: '*/*',
        connection: 'close',
      },
      timeout: options.timeoutMs,
      family,
      ...(isHttps ? { servername: url.hostname } : {}),
    })

    req.on('response', (res) => {
      const statusCode = res.statusCode ?? 0
      const latencyMs = Date.now() - start
      const ok =
        statusCode >= options.expectedStatusMin &&
        statusCode <= options.expectedStatusMax
      res.resume()
      settle({
        ok,
        statusCode,
        latencyMs,
        reason: ok ? null : `unexpected status ${statusCode}`,
      })
    })

    req.on('timeout', () => {
      req.destroy(new Error('timeout'))
    })

    req.on('error', (err) => {
      settle({
        ok: false,
        statusCode: null,
        latencyMs: Date.now() - start,
        reason: err.message || 'request failed',
      })
    })

    req.end()
  })
}
