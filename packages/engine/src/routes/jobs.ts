import { Router } from 'express'
import type { EventSource, RunJobInput, RunJobResult } from '@bionic/shared'

export const jobsRouter = Router()

jobsRouter.post('/', (req, res) => {
  const input = req.body as RunJobInput

  const VALID_SOURCES: EventSource[] = ['sdk', 'app', 'cli', 'engine', 'scheduler']

  if (!input.requestedBy || !VALID_SOURCES.includes(input.requestedBy)) {
    res.status(400).json({ error: 'invalid requestedBy' })
    return
  }

  if (input.type !== 'research_digest') {
    res.status(400).json({ error: 'unsupported job type' })
    return
  }

  const result: RunJobResult = {
    job: {
      id: `job_${Date.now()}`,
      type: 'research_digest',
      status: 'pending',
      requestedBy: input.requestedBy,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
    },
  }

  res.status(202).json(result)
})
