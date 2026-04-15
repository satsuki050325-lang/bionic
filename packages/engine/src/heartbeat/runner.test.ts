import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { HeartbeatTarget } from '@bionic/shared'

vi.mock('../decisions/alerts.js', () => ({
  evaluateAlertForEvent: vi.fn(),
}))

const fromInserts: unknown[] = []
const rpcCalls: Array<{ fn: string; args: unknown }> = []
const rpcReturnQueue: boolean[] = []

function makeFromChain(table: string) {
  const chain = {
    update: () => chain,
    insert: (payload: unknown) => {
      fromInserts.push({ table, payload })
      return Promise.resolve({ error: null })
    },
    eq: () => chain,
    select: () => chain,
    then: (resolve: (v: unknown) => unknown) =>
      resolve({ data: [], error: null }),
  }
  return chain
}

vi.mock('../lib/supabase.js', () => ({
  supabase: {
    from: (t: string) => makeFromChain(t),
    rpc: (fn: string, args: unknown) => {
      rpcCalls.push({ fn, args })
      const next = rpcReturnQueue.shift()
      return Promise.resolve({ data: next ?? false, error: null })
    },
  },
}))

import { processHeartbeat } from './runner.js'

function makeTarget(overrides: Partial<HeartbeatTarget> = {}): HeartbeatTarget {
  return {
    id: 'hb_01',
    projectId: 'project_bionic',
    serviceId: 'daily-job',
    slug: 'daily-reconcile',
    name: null,
    description: null,
    secretAlgo: 'hmac-sha256',
    expectedIntervalSeconds: 60,
    graceSeconds: 60,
    severity: 'warning',
    enabled: true,
    lastPingAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10min ago
    lastPingFromIp: null,
    missedEventEmitted: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  fromInserts.length = 0
  rpcCalls.length = 0
  rpcReturnQueue.length = 0
})

describe('processHeartbeat', () => {
  it('emits missing event exactly once when claim returns true', async () => {
    rpcReturnQueue.push(true)
    await processHeartbeat(makeTarget())
    expect(rpcCalls).toHaveLength(1)
    expect(rpcCalls[0]!.fn).toBe('claim_heartbeat_missing')
    const missEvents = fromInserts.filter(
      (i: unknown) =>
        (i as { table: string }).table === 'engine_events' &&
        (i as { payload: { type: string } }).payload.type ===
          'heartbeat.missing.detected'
    )
    expect(missEvents).toHaveLength(1)
  })

  it('does not emit when claim returns false (other runner won)', async () => {
    rpcReturnQueue.push(false)
    await processHeartbeat(makeTarget())
    const missEvents = fromInserts.filter(
      (i: unknown) =>
        (i as { table: string }).table === 'engine_events' &&
        (i as { payload: { type: string } }).payload.type ===
          'heartbeat.missing.detected'
    )
    expect(missEvents).toHaveLength(0)
  })

  it('skips claim entirely when not yet due', async () => {
    const notDue = makeTarget({
      lastPingAt: new Date().toISOString(), // just pinged
    })
    await processHeartbeat(notDue)
    expect(rpcCalls).toHaveLength(0)
  })

  it('skips claim when missed_event_emitted is already true', async () => {
    await processHeartbeat(makeTarget({ missedEventEmitted: true }))
    expect(rpcCalls).toHaveLength(0)
  })

  it('applies first-miss grace window using created_at when last_ping_at is null', async () => {
    // Created 30s ago, interval 300s + grace 60s → not yet due
    const freshlyCreated = makeTarget({
      lastPingAt: null,
      createdAt: new Date(Date.now() - 30 * 1000).toISOString(),
      expectedIntervalSeconds: 300,
      graceSeconds: 60,
    })
    await processHeartbeat(freshlyCreated)
    expect(rpcCalls).toHaveLength(0)
  })

  it('does become due once created_at + interval + grace has passed with no ping', async () => {
    rpcReturnQueue.push(true)
    const overdueFirstMiss = makeTarget({
      lastPingAt: null,
      createdAt: new Date(Date.now() - 500 * 1000).toISOString(),
      expectedIntervalSeconds: 60,
      graceSeconds: 60,
    })
    await processHeartbeat(overdueFirstMiss)
    expect(rpcCalls).toHaveLength(1)
  })

  it('concurrent runners — only the first claimant emits', async () => {
    rpcReturnQueue.push(true, false)
    await Promise.all([
      processHeartbeat(makeTarget()),
      processHeartbeat(makeTarget()),
    ])
    const missEvents = fromInserts.filter(
      (i: unknown) =>
        (i as { table: string }).table === 'engine_events' &&
        (i as { payload: { type: string } }).payload.type ===
          'heartbeat.missing.detected'
    )
    expect(missEvents).toHaveLength(1)
  })
})
