import { Router } from 'express'
import type { RunJobInput, RunJobResult } from '@bionic/shared'

export const jobsRouter = Router()

jobsRouter.post('/', (req, res) => {
  const input = req.body as RunJobInput

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
