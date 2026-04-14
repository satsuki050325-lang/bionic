const SKIP_REASON_LABELS: Record<string, string> = {
  'no items to digest': 'No digest items were available.',
  'no digest items': 'No digest items were available.',
  'race condition: duplicate insert skipped':
    'Duplicate already created by another runner.',
  'discord not configured': 'Discord is not configured.',
  'quiet hours': 'Notification suppressed during quiet hours.',
}

export function humanizeSkipReason(reason: string): string {
  return SKIP_REASON_LABELS[reason.toLowerCase()] ?? reason
}

export function getActionOutcome(action: {
  status: string
  result?: Record<string, unknown>
  error?: Record<string, unknown> | null
}): string | null {
  if (action.status === 'skipped') {
    const reason = action.result?.['reason']
    if (typeof reason === 'string') return humanizeSkipReason(reason)
    return 'Skipped by policy.'
  }
  if (action.status === 'failed') {
    const reason =
      action.error?.['reason'] ?? action.error?.['message']
    if (typeof reason === 'string') return reason
    return 'Action failed.'
  }
  return null
}
