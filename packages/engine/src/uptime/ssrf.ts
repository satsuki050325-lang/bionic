import { lookup as dnsLookupCb } from 'node:dns'
import { promisify } from 'node:util'
import { isIP } from 'node:net'

const dnsLookup = promisify(dnsLookupCb)

export interface ResolvedTarget {
  ok: true
  url: URL
  ip: string
  family: 4 | 6
}

export interface RejectedTarget {
  ok: false
  reason: string
}

export type ResolveResult = ResolvedTarget | RejectedTarget

const FORBIDDEN_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'broadcasthost',
])

export function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) {
    const lower = ip.toLowerCase()
    if (lower === '::1' || lower === '::') return true
    if (lower.startsWith('::ffff:')) {
      const mapped = lower.slice('::ffff:'.length)
      if (isIP(mapped) === 4) return isPrivateIp(mapped)
    }
    // fc00::/7 (unique local) — fc/fd prefix
    if (/^f[cd]/.test(lower)) return true
    // fe80::/10 (link-local)
    if (/^fe[89ab]/.test(lower)) return true
    // ff00::/8 (multicast)
    if (lower.startsWith('ff')) return true
    return false
  }

  const parts = ip.split('.').map((p) => Number(p))
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    return true
  }
  const [a, b] = parts
  if (a === 0) return true
  if (a === 10) return true
  if (a === 127) return true
  if (a === 169 && b === 254) return true // link-local + metadata
  if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b !== undefined && b >= 64 && b <= 127) return true // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true // benchmarking
  if (a >= 224) return true // multicast + reserved
  return false
}

export async function resolveForUptime(rawUrl: string): Promise<ResolveResult> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return { ok: false, reason: 'invalid URL' }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'only http/https protocols are allowed' }
  }

  const hostname = url.hostname
  if (!hostname) return { ok: false, reason: 'missing hostname' }

  const lowerHost = hostname.toLowerCase()
  if (FORBIDDEN_HOSTNAMES.has(lowerHost)) {
    return { ok: false, reason: 'hostname is not allowed' }
  }
  if (lowerHost.endsWith('.local') || lowerHost.endsWith('.internal')) {
    return { ok: false, reason: 'internal hostname is not allowed' }
  }

  const literalFamily = isIP(hostname)
  if (literalFamily !== 0) {
    if (isPrivateIp(hostname)) {
      return { ok: false, reason: `address ${hostname} is private/reserved` }
    }
    return {
      ok: true,
      url,
      ip: hostname,
      family: literalFamily === 4 ? 4 : 6,
    }
  }

  let resolved: { address: string; family: number }[]
  try {
    resolved = await dnsLookup(hostname, { all: true })
  } catch (err) {
    return {
      ok: false,
      reason: `DNS lookup failed: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  if (resolved.length === 0) {
    return { ok: false, reason: 'DNS returned no addresses' }
  }

  for (const addr of resolved) {
    if (isPrivateIp(addr.address)) {
      return {
        ok: false,
        reason: `hostname resolved to private/reserved address ${addr.address}`,
      }
    }
  }

  const primary = resolved[0]!
  return {
    ok: true,
    url,
    ip: primary.address,
    family: primary.family === 6 ? 6 : 4,
  }
}
