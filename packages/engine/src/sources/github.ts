import * as crypto from 'crypto'
import { getConfig } from '../config.js'

export interface GitHubWorkflowRunPayload {
  action: string
  workflow_run: {
    id: number
    name: string
    head_branch: string
    head_sha: string
    conclusion: string | null
    html_url: string
  }
  repository: {
    full_name: string
    default_branch: string
  }
  sender: {
    login: string
  }
}

export function verifyGitHubSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader) return false
  const expected = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')}`
  const a = Buffer.from(signatureHeader)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  try {
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function resolveGitHubServiceId(repoFullName: string): string {
  const config = getConfig()
  return config.github.repoMap.get(repoFullName) ?? repoFullName
}

export function classifyWorkflowRunSeverity(
  payload: GitHubWorkflowRunPayload
): 'critical' | 'warning' {
  const defaultBranch = payload.repository.default_branch
  const headBranch = payload.workflow_run.head_branch
  if (
    headBranch === defaultBranch ||
    headBranch.startsWith('release/') ||
    headBranch.startsWith('hotfix/')
  ) {
    return 'critical'
  }
  return 'warning'
}

export function buildCiFailureFingerprint(
  projectId: string,
  repoFullName: string,
  _workflowRunId: number,
  headBranch: string,
  defaultBranch: string
): string {
  const serviceId = resolveGitHubServiceId(repoFullName)
  const scope =
    headBranch === defaultBranch
      ? `main:${headBranch}`
      : headBranch.startsWith('refs/pull/')
        ? `pr:${headBranch.replace('refs/pull/', '').replace('/merge', '')}`
        : `branch:${headBranch}`

  return [
    'v2',
    projectId,
    serviceId,
    'ci_failure',
    repoFullName.replace('/', '_'),
    scope,
  ].join(':')
}
