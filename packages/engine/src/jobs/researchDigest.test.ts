import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { enqueueResearchDigestJob } from './researchDigest.js'
import { supabase } from '../lib/supabase.js'

function makeMockQuery(result: unknown) {
  const mock = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  }
  return mock
}

describe('enqueueResearchDigestJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('正常insertで{ created: true, jobId }を返す', async () => {
    const mockQuery = makeMockQuery({ data: { id: 'job_123' }, error: null })
    vi.mocked(supabase.from).mockReturnValue(mockQuery as never)

    const result = await enqueueResearchDigestJob({
      projectId: 'project_bionic',
      requestedBy: 'scheduler',
      dedupeKey: 'research_digest:2026-W15',
    })

    expect(result.created).toBe(true)
    expect(result.jobId).toBe('job_123')

    expect(mockQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'project_bionic',
        type: 'research_digest',
        status: 'pending',
        requested_by: 'scheduler',
        dedupe_key: 'research_digest:2026-W15',
      })
    )
  })

  it('unique violation(23505)では{ created: false }を返しthrowしない', async () => {
    const mockQuery = makeMockQuery({
      data: null,
      error: { code: '23505', message: 'duplicate key' },
    })
    vi.mocked(supabase.from).mockReturnValue(mockQuery as never)

    const result = await enqueueResearchDigestJob({
      projectId: 'project_bionic',
      requestedBy: 'scheduler',
      dedupeKey: 'research_digest:2026-W15',
    })

    expect(result.created).toBe(false)
    expect(result.jobId).toBeUndefined()
  })

  it('その他DBエラーでも{ created: false }を返しthrowしない', async () => {
    const mockQuery = makeMockQuery({
      data: null,
      error: { code: '500', message: 'internal error' },
    })
    vi.mocked(supabase.from).mockReturnValue(mockQuery as never)

    const result = await enqueueResearchDigestJob({
      projectId: 'project_bionic',
      requestedBy: 'scheduler',
      dedupeKey: 'research_digest:2026-W15',
    })

    expect(result.created).toBe(false)
  })
})
