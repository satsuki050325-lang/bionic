export interface VercelWebhookBody {
  type:
    | 'deployment.created'
    | 'deployment.ready'
    | 'deployment.error'
    | 'deployment.canceled'
  payload: {
    team?: { id: string | null }
    user?: { id: string }
    deployment?: {
      id: string
      url: string
      name: string
      meta?: Record<string, unknown>
    }
    project?: { id: string; name?: string }
    target?: 'production' | 'staging' | null
    links?: {
      deployment?: string
      project?: string
    }
    regions?: string[]
  }
}

export interface NormalizedDeployment {
  providerDeploymentId: string
  providerProjectId: string
  deploymentUrl: string
  target: string | null
  gitCommitSha: string | null
  gitCommitMessage: string | null
  dashboardUrl: string | null
  status: string
}

export function normalizeVercelPayload(
  body: VercelWebhookBody
): NormalizedDeployment | null {
  const { payload } = body
  if (!payload.deployment?.id || !payload.project?.id) return null

  return {
    providerDeploymentId: payload.deployment.id,
    providerProjectId: payload.project.id,
    deploymentUrl: payload.deployment.url,
    target: payload.target ?? null,
    gitCommitSha:
      (payload.deployment.meta?.['githubCommitSha'] as string) ?? null,
    gitCommitMessage:
      (payload.deployment.meta?.['githubCommitMessage'] as string) ?? null,
    dashboardUrl: payload.links?.deployment ?? null,
    status: body.type === 'deployment.ready' ? 'ready' : body.type,
  }
}

export function resolveServiceId(providerProjectId: string): string | null {
  const mapStr = process.env.BIONIC_VERCEL_PROJECT_MAP ?? ''
  if (!mapStr) return null

  for (const entry of mapStr.split(',')) {
    const [projectId, serviceId] = entry.trim().split(':')
    if (projectId === providerProjectId) return serviceId ?? null
  }
  return null
}
