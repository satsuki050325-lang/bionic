import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UptimeTarget } from '@bionic/shared'

// --- Test doubles ------------------------------------------------------------

const runUptimeCheck = vi.fn()
vi.mock('./check.js', () => ({
  runUptimeCheck: (...args: unknown[]) =>
    runUptimeCheck(...(args as [unknown])),
}))

vi.mock('../decisions/alerts.js', () => ({
  evaluateAlertForEvent: vi.fn(),
}))

// Supabase client mock shared across the tests. We hand-roll the chain so we
// can inspect every call: `.from(t).update(u).eq(k,v)` returns a thenable that
// yields `{error:null}`, and `.from(t).insert(i)` yields the same. `.rpc(name,
// args)` is a separate spy whose return value we control per-test.
const fromUpdates: unknown[] = []
const fromInserts: unknown[] = []
const rpcCalls: Array<{ fn: string; args: unknown }> = []
const rpcReturnQueue: Array<boolean | { data: boolean; error: unknown }> = []

function makeFromChain(table: string) {
  const chain = {
    update: (payload: unknown) => {
      fromUpdates.push({ table, payload })
      return chain
    },
    insert: (payload: unknown) => {
      fromInserts.push({ table, payload })
      return Promise.resolve({ error: null })
    },
    eq: () => chain,
    select: () => chain,
    gte: () => chain,
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
      if (typeof next === 'boolean') {
        return Promise.resolve({ data: next, error: null })
      }
      if (next && typeof next === 'object') {
        return Promise.resolve(next)
      }
      return Promise.resolve({ data: false, error: null })
    },
  },
}))

// --- Subject under test ------------------------------------------------------

import { processTarget } from './runner.js'

function makeTarget(overrides: Partial<UptimeTarget> = {}): UptimeTarget {
  return {
    id: 'tgt_01',
    projectId: 'project_bionic',
    serviceId: 'my-svc',
    url: 'https://example.com/health',
    method: 'GET',
    intervalSeconds: 60,
    timeoutMs: 10000,
    expectedStatusMin: 200,
    expectedStatusMax: 299,
    enabled: true,
    lastCheckedAt: '2026-04-14T00:00:00.000Z',
    lastStatus: 'down',
    lastLatencyMs: 120,
    lastStatusCode: 503,
    lastFailureReason: 'prev failure',
    consecutiveFailures: 2,
    degradedEventEmitted: false,
    createdAt: '2026-04-14T00:00:00.000Z',
    updatedAt: '2026-04-14T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  fromUpdates.length = 0
  fromInserts.length = 0
  rpcCalls.length = 0
  rpcReturnQueue.length = 0
  runUptimeCheck.mockReset()
})

describe('processTarget — degraded claim', () => {
  it('emits degraded event exactly once when claim RPC returns true', async () => {
    runUptimeCheck.mockResolvedValue({
      ok: false,
      statusCode: 503,
      latencyMs: 200,
      reason: 'upstream error',
    })
    rpcReturnQueue.push(true) // claim_uptime_degraded → true

    await processTarget(makeTarget())

    expect(rpcCalls).toHaveLength(1)
    expect(rpcCalls[0]!.fn).toBe('claim_uptime_degraded')
    expect(rpcCalls[0]!.args).toEqual({
      p_target_id: 'tgt_01',
      p_threshold: 3,
    })
    const degradedEvents = fromInserts.filter(
      (i: unknown) =>
        (i as { table: string }).table === 'engine_events' &&
        (i as { payload: { type: string } }).payload.type ===
          'service.health.degraded'
    )
    expect(degradedEvents).toHaveLength(1)
  })

  it('does NOT emit degraded event when claim RPC returns false', async () => {
    runUptimeCheck.mockResolvedValue({
      ok: false,
      statusCode: 503,
      latencyMs: 200,
      reason: 'upstream error',
    })
    rpcReturnQueue.push(false) // another runner already claimed

    await processTarget(makeTarget())

    expect(rpcCalls).toHaveLength(1)
    const degradedEvents = fromInserts.filter(
      (i: unknown) =>
        (i as { table: string }).table === 'engine_events' &&
        (i as { payload: { type: string } }).payload.type ===
          'service.health.degraded'
    )
    expect(degradedEvents).toHaveLength(0)
  })

  it('simulates two concurrent runners — only the first claimant emits', async () => {
    // Mirror DB behavior: first UPDATE flips flag true (returns true);
    // second UPDATE sees flag=true so WHERE-clause filters it out (returns false).
    runUptimeCheck.mockResolvedValue({
      ok: false,
      statusCode: 503,
      latencyMs: 200,
      reason: 'upstream error',
    })
    rpcReturnQueue.push(true, false)

    await Promise.all([processTarget(makeTarget()), processTarget(makeTarget())])

    expect(rpcCalls).toHaveLength(2)
    expect(rpcCalls.every((c) => c.fn === 'claim_uptime_degraded')).toBe(true)
    const degradedEvents = fromInserts.filter(
      (i: unknown) =>
        (i as { table: string }).table === 'engine_events' &&
        (i as { payload: { type: string } }).payload.type ===
          'service.health.degraded'
    )
    expect(degradedEvents).toHaveLength(1)
  })

  it('skips claim RPC when consecutive_failures is below threshold', async () => {
    runUptimeCheck.mockResolvedValue({
      ok: false,
      statusCode: 503,
      latencyMs: 200,
      reason: 'upstream error',
    })

    await processTarget(
      makeTarget({ consecutiveFailures: 0, lastStatus: 'up' })
    )

    expect(rpcCalls).toHaveLength(0)
    const degradedEvents = fromInserts.filter(
      (i: unknown) =>
        (i as { table: string }).table === 'engine_events' &&
        (i as { payload: { type: string } }).payload.type ===
          'service.health.degraded'
    )
    expect(degradedEvents).toHaveLength(0)
  })
})

describe('processTarget — recovery claim', () => {
  it('emits recovery event exactly once when RPC returns true', async () => {
    runUptimeCheck.mockResolvedValue({
      ok: true,
      statusCode: 200,
      latencyMs: 42,
      reason: null,
    })
    rpcReturnQueue.push(true) // claim_uptime_recovery → true

    await processTarget(
      makeTarget({
        lastStatus: 'down',
        consecutiveFailures: 5,
        degradedEventEmitted: true,
      })
    )

    expect(rpcCalls).toHaveLength(1)
    expect(rpcCalls[0]!.fn).toBe('claim_uptime_recovery')
    const recoveryEvents = fromInserts.filter(
      (i: unknown) =>
        (i as { table: string }).table === 'engine_events' &&
        (i as { payload: { type: string } }).payload.type ===
          'service.health.reported'
    )
    expect(recoveryEvents).toHaveLength(1)
    expect(
      (recoveryEvents[0] as { payload: { payload: { targetId: string } } })
        .payload.payload.targetId
    ).toBe('tgt_01')
  })

  it('does NOT emit recovery event when RPC returns false (no transition)', async () => {
    runUptimeCheck.mockResolvedValue({
      ok: true,
      statusCode: 200,
      latencyMs: 42,
      reason: null,
    })
    rpcReturnQueue.push(false) // already up

    await processTarget(
      makeTarget({ lastStatus: 'up', consecutiveFailures: 0 })
    )

    const recoveryEvents = fromInserts.filter(
      (i: unknown) =>
        (i as { table: string }).table === 'engine_events' &&
        (i as { payload: { type: string } }).payload.type ===
          'service.health.reported'
    )
    expect(recoveryEvents).toHaveLength(0)
  })

  it('concurrent recovery — only the first claimant emits', async () => {
    runUptimeCheck.mockResolvedValue({
      ok: true,
      statusCode: 200,
      latencyMs: 42,
      reason: null,
    })
    rpcReturnQueue.push(true, false)

    await Promise.all([
      processTarget(makeTarget({ lastStatus: 'down', degradedEventEmitted: true })),
      processTarget(makeTarget({ lastStatus: 'down', degradedEventEmitted: true })),
    ])

    const recoveryEvents = fromInserts.filter(
      (i: unknown) =>
        (i as { table: string }).table === 'engine_events' &&
        (i as { payload: { type: string } }).payload.type ===
          'service.health.reported'
    )
    expect(recoveryEvents).toHaveLength(1)
  })
})
