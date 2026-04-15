import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('../actions/logAction.js', () => ({
  createAction: vi.fn().mockResolvedValue('action_123'),
  completeAction: vi.fn().mockResolvedValue(undefined),
  failAction: vi.fn().mockResolvedValue(undefined),
  skipAction: vi.fn().mockResolvedValue(undefined),
}))

import { evaluateAlertForEvent } from './alerts.js'
import { supabase } from '../lib/supabase.js'
import type { EngineEvent } from '@bionic/shared'

function makeEvent(overrides: Partial<EngineEvent> = {}): EngineEvent {
  return {
    id: 'evt_001',
    projectId: 'project_bionic',
    serviceId: 'medini-api',
    type: 'service.health.degraded',
    occurredAt: '2026-04-11T00:00:00.000Z',
    source: 'sdk',
    payload: { status: 'degraded' },
    ...overrides,
  }
}

function makeMockChain(results: unknown[]) {
  let callCount = 0
  return {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockImplementation(() => {
      return Promise.resolve(results[callCount++] ?? { data: null, error: null })
    }),
  }
}

describe('evaluateAlertForEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('対象外eventではsupabaseを呼ばない', async () => {
    const event = makeEvent({ type: 'service.health.reported' })
    const ok = await evaluateAlertForEvent(event)
    expect(supabase.from).not.toHaveBeenCalled()
    expect(ok).toBe(true)
  })

  it('service.health.degradedでopen alertがない場合insertする', async () => {
    const chain = makeMockChain([
      { data: null, error: null },
    ])
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await evaluateAlertForEvent(makeEvent())
    expect(chain.insert).toHaveBeenCalled()
  })

  it('status=downの場合severityがcriticalになる', async () => {
    const chain = makeMockChain([
      { data: null, error: null },
    ])
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await evaluateAlertForEvent(
      makeEvent({ payload: { status: 'down' } })
    )
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'critical' })
    )
  })

  it('既存open alertがある場合updateする', async () => {
    const chain = makeMockChain([
      { data: { id: 'alert_001', count: 3 }, error: null },
    ])
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await evaluateAlertForEvent(makeEvent())
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ count: 4 })
    )
  })

  it('service.error.reportedでcritical codeならcriticalになる', async () => {
    const chain = makeMockChain([
      { data: null, error: null },
    ])
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await evaluateAlertForEvent(
      makeEvent({
        type: 'service.error.reported',
        payload: { code: 'DB_CONNECTION_FAILED', message: 'connection failed' },
      })
    )
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'critical' })
    )
  })

  it('unknown error codeならwarningになる', async () => {
    const chain = makeMockChain([
      { data: null, error: null },
    ])
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await evaluateAlertForEvent(
      makeEvent({
        type: 'service.error.reported',
        payload: { code: 'UNKNOWN_CODE', message: 'something went wrong' },
      })
    )
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning' })
    )
  })

  it('select失敗時はfalseを返す（throwしない）', async () => {
    const chain = makeMockChain([
      { data: null, error: { code: '500', message: 'db error' } },
    ])
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await evaluateAlertForEvent(makeEvent())
    expect(result).toBe(false)
  })

  it('insert時に23505が返った場合skipActionが呼ばれtrueを返す（alert存在=成功）', async () => {
    const { skipAction } = await import('../actions/logAction.js')

    const chain = makeMockChain([
      { data: null, error: null },
    ])
    // insertのmaybeSingleで23505を返す
    chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: '23505', message: 'duplicate key' } })
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await evaluateAlertForEvent(makeEvent())
    expect(result).toBe(true)
    expect(skipAction).toHaveBeenCalled()
  })
})
