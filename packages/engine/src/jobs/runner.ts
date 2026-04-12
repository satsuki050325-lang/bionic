import { runResearchDigest } from './researchDigest.js'

export async function runJob(
  jobId: string,
  type: string,
  projectId: string
): Promise<void> {
  console.log(`[jobs/runner] running job: ${type} (${jobId})`)

  switch (type) {
    case 'research_digest':
      await runResearchDigest(jobId, projectId)
      break
    default:
      console.warn(`[jobs/runner] unknown job type: ${type}`)
  }
}
