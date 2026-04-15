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

/**
 * Expand an IPv6 literal into its 8 × 16-bit group representation.
 * Accepts `::` compression and embedded-IPv4 trailer (`::ffff:a.b.c.d`).
 * Returns null on any syntactic problem.
 */
export function expandIPv6(ip: string): number[] | null {
  const lower = ip.toLowerCase()
  // Character allowlist: hex, colon, dot
  if (!/^[0-9a-f:.]+$/.test(lower)) return null

  const doubleColon = lower.split('::')
  if (doubleColon.length > 2) return null

  const parseGroups = (parts: string[]): number[] | null => {
    if (parts.length === 0) return []
    const last = parts[parts.length - 1]!
    let tail: number[] = []
    let hexParts = parts
    if (last.includes('.')) {
      const v4 = last.split('.')
      if (v4.length !== 4) return null
      const octets: number[] = []
      for (const p of v4) {
        if (!/^\d{1,3}$/.test(p)) return null
        const n = Number(p)
        if (!Number.isInteger(n) || n < 0 || n > 255) return null
        octets.push(n)
      }
      tail = [
        ((octets[0]! << 8) | octets[1]!) & 0xffff,
        ((octets[2]! << 8) | octets[3]!) & 0xffff,
      ]
      hexParts = parts.slice(0, -1)
    }
    const hex: number[] = []
    for (const p of hexParts) {
      if (!/^[0-9a-f]{1,4}$/.test(p)) return null
      hex.push(parseInt(p, 16))
    }
    return [...hex, ...tail]
  }

  let left: number[] = []
  let right: number[] = []
  if (doubleColon.length === 2) {
    const leftStr = doubleColon[0]!
    const rightStr = doubleColon[1]!
    const parsedLeft = parseGroups(leftStr === '' ? [] : leftStr.split(':'))
    const parsedRight = parseGroups(rightStr === '' ? [] : rightStr.split(':'))
    if (parsedLeft === null || parsedRight === null) return null
    left = parsedLeft
    right = parsedRight
    const total = left.length + right.length
    if (total > 8) return null
    const pad = new Array<number>(8 - total).fill(0)
    return [...left, ...pad, ...right]
  }
  const parsed = parseGroups(lower.split(':'))
  if (parsed === null) return null
  if (parsed.length !== 8) return null
  return parsed
}

/**
 * If `groups` represents an IPv4-mapped (::ffff:a.b.c.d) or IPv4-compatible
 * (::a.b.c.d, deprecated) address, return the dotted-quad IPv4 form.
 * This normalizes hex trailers like `::ffff:7f00:1` → `127.0.0.1`.
 */
export function tryExtractEmbeddedIPv4(groups: number[]): string | null {
  if (groups.length !== 8) return null
  for (let i = 0; i < 5; i++) if (groups[i] !== 0) return null
  // IPv4-mapped uses group[5] = 0xffff; IPv4-compatible (deprecated) = 0.
  // Both should be treated as IPv4 for private-range checks.
  if (groups[5] !== 0xffff && groups[5] !== 0) return null
  const g6 = groups[6]!
  const g7 = groups[7]!
  return `${(g6 >> 8) & 0xff}.${g6 & 0xff}.${(g7 >> 8) & 0xff}.${g7 & 0xff}`
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p))
  if (
    parts.length !== 4 ||
    parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)
  ) {
    return true
  }
  const [a, b] = parts as [number, number, number, number]
  if (a === 0) return true
  if (a === 10) return true
  if (a === 127) return true
  if (a === 169 && b === 254) return true // link-local + metadata
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true // benchmarking
  if (a >= 224) return true // multicast + reserved
  return false
}

function isPrivateIPv6(ip: string): boolean {
  const groups = expandIPv6(ip)
  if (!groups) return true // unparseable → treat as private/fail-closed

  const embedded = tryExtractEmbeddedIPv4(groups)
  if (embedded) return isPrivateIPv4(embedded)

  // ::1 loopback
  if (groups.slice(0, 7).every((g) => g === 0) && groups[7] === 1) return true
  // :: unspecified
  if (groups.every((g) => g === 0)) return true

  const first = groups[0]!
  // ff00::/8 multicast
  if ((first & 0xff00) === 0xff00) return true
  // fc00::/7 unique-local
  if ((first & 0xfe00) === 0xfc00) return true
  // fe80::/10 link-local
  if ((first & 0xffc0) === 0xfe80) return true

  return false
}

export function isPrivateIp(ip: string): boolean {
  const family = isIP(ip)
  if (family === 4) return isPrivateIPv4(ip)
  if (family === 6) return isPrivateIPv6(ip)
  return true // unknown format → fail-closed
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
