import { describe, expect, it } from 'vitest'
import {
  expandIPv6,
  isPrivateIp,
  resolveForUptime,
  tryExtractEmbeddedIPv4,
} from './ssrf.js'

describe('expandIPv6', () => {
  it('expands :: to all zeros', () => {
    expect(expandIPv6('::')).toEqual([0, 0, 0, 0, 0, 0, 0, 0])
  })
  it('expands ::1 to loopback form', () => {
    expect(expandIPv6('::1')).toEqual([0, 0, 0, 0, 0, 0, 0, 1])
  })
  it('expands full form', () => {
    expect(expandIPv6('2001:db8:85a3:0:0:8a2e:370:7334')).toEqual([
      0x2001, 0x0db8, 0x85a3, 0, 0, 0x8a2e, 0x0370, 0x7334,
    ])
  })
  it('expands embedded IPv4-mapped (dotted)', () => {
    expect(expandIPv6('::ffff:127.0.0.1')).toEqual([
      0, 0, 0, 0, 0, 0xffff, 0x7f00, 0x0001,
    ])
  })
  it('expands embedded IPv4-mapped (hex)', () => {
    expect(expandIPv6('::ffff:7f00:1')).toEqual([
      0, 0, 0, 0, 0, 0xffff, 0x7f00, 0x0001,
    ])
  })
  it('rejects garbage', () => {
    expect(expandIPv6('not-an-ip')).toBeNull()
    expect(expandIPv6(':::')).toBeNull()
  })
})

describe('tryExtractEmbeddedIPv4', () => {
  it('extracts from IPv4-mapped (ffff prefix)', () => {
    expect(
      tryExtractEmbeddedIPv4([0, 0, 0, 0, 0, 0xffff, 0x7f00, 0x0001])
    ).toBe('127.0.0.1')
  })
  it('extracts from IPv4-compatible (all-zero prefix)', () => {
    expect(
      tryExtractEmbeddedIPv4([0, 0, 0, 0, 0, 0, 0x7f00, 0x0001])
    ).toBe('127.0.0.1')
  })
  it('returns null for non-embedded addresses', () => {
    expect(
      tryExtractEmbeddedIPv4([0x2001, 0, 0, 0, 0, 0, 0, 1])
    ).toBeNull()
  })
})

describe('isPrivateIp — IPv4', () => {
  it.each([
    '127.0.0.1',
    '10.0.0.1',
    '172.16.5.5',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254', // AWS metadata
    '0.0.0.0',
    '100.64.0.1', // CGNAT
    '198.18.0.1', // benchmarking
    '224.0.0.1', // multicast
    '255.255.255.255',
  ])('rejects %s', (ip) => {
    expect(isPrivateIp(ip)).toBe(true)
  })
  it.each(['8.8.8.8', '1.1.1.1', '93.184.216.34'])(
    'accepts %s',
    (ip) => {
      expect(isPrivateIp(ip)).toBe(false)
    }
  )
})

describe('isPrivateIp — IPv6', () => {
  it.each([
    '::1', // loopback
    '::', // unspecified
    'fc00::1', // ULA
    'fd12:3456::1', // ULA
    'fe80::1', // link-local
    'ff02::1', // multicast
    '::ffff:127.0.0.1', // IPv4-mapped dotted
    '::ffff:7f00:1', // IPv4-mapped hex (regression for Codex P1)
    '::ffff:0a00:1', // IPv4-mapped hex for 10.0.0.1
    '::ffff:c0a8:1', // IPv4-mapped hex for 192.168.0.1
    '::ffff:a9fe:a9fe', // IPv4-mapped hex for 169.254.169.254 (metadata)
    '0:0:0:0:0:ffff:7f00:1', // full-form IPv4-mapped hex
    '::127.0.0.1', // IPv4-compatible (deprecated)
  ])('rejects %s', (ip) => {
    expect(isPrivateIp(ip)).toBe(true)
  })
  it.each(['2001:4860:4860::8888', '2606:4700:4700::1111'])(
    'accepts public %s',
    (ip) => {
      expect(isPrivateIp(ip)).toBe(false)
    }
  )
})

describe('resolveForUptime — synchronous rejections', () => {
  it('rejects non-http(s) protocols', async () => {
    const r = await resolveForUptime('ftp://example.com/')
    expect(r.ok).toBe(false)
  })
  it('rejects invalid URL', async () => {
    const r = await resolveForUptime('not a url')
    expect(r.ok).toBe(false)
  })
  it('rejects localhost literal', async () => {
    const r = await resolveForUptime('http://localhost/')
    expect(r.ok).toBe(false)
  })
  it('rejects .internal suffix', async () => {
    const r = await resolveForUptime('http://foo.internal/')
    expect(r.ok).toBe(false)
  })
  it('rejects private IP literal', async () => {
    const r = await resolveForUptime('http://127.0.0.1/')
    expect(r.ok).toBe(false)
  })
  it('rejects IPv4-mapped IPv6 literal (hex form)', async () => {
    const r = await resolveForUptime('http://[::ffff:7f00:1]/')
    expect(r.ok).toBe(false)
  })
  it('rejects AWS metadata IP', async () => {
    const r = await resolveForUptime('http://169.254.169.254/latest/meta-data/')
    expect(r.ok).toBe(false)
  })
})
