import { Router } from 'express'
import type { RunJobResult } from '@bionic/shared'
import { enqueueResearchDigestJob, getWeeklyDigestKey } from '../jobs/researchDigest.js'
import { runJob } from '../jobs/runner.js'

export const jobsRouter = Router()

const VALID_TYPES = ['research_digest'] as const
const VALID_SOURCES = ['sdk', 'app', 'cli', 'engine', 'scheduler', 'mcp'] as const

jobsRouter.post('/', async (req, res) => {
  const { type, projectId, requestedBy, dedupeKey } = req.body as {
    type: string
    projectId?: string
    requestedBy?: string
    dedupeKey?: string
  }

  if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    res.status(400).json({ error: `invalid type: ${type}` })
    return
  }

  if (!requestedBy || !VALID_SOURCES.includes(requestedBy as typeof VALID_SOURCES[number])) {
    res.status(400).json({ error: `invalid requestedBy: ${requestedBy}` })
    return
  }

  const targetProjectId = projectId ?? 'project_bionic'
  const dk = dedupeKey ?? getWeeklyDigestKey(new Date(), 'Asia/Tokyo')

  const result = await enqueueResearchDigestJob({
    projectId: targetProjectId,
    requestedBy,
    dedupeKey: dk,
  })

  if (!result.created || !result.jobId) {
    const response: RunJobResult = {
      jobId: null,
      status: 'skipped',
      message: 'job already exists for this period',
    }
    res.status(200).json(response)
    return
  }

  void runJob(result.jobId, type, targetProjectId)

  const response: RunJobResult = {
    jobId: result.jobId,
    status: 'started',
    message: `${type} job started`,
  }
  res.status(202).json(response)
})
