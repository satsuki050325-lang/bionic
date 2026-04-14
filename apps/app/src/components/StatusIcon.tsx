import {
  TriangleAlert,
  CircleAlert,
  Info,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock3,
  ShieldQuestion,
  LoaderCircle,
} from 'lucide-react'
import type { ActionStatus as SharedActionStatus } from '@bionic/shared'

type AlertSeverity = 'critical' | 'warning' | 'info'

// Align with @bionic/shared's ActionStatus, plus JobStatus's 'needs_review'
// which can surface in the Actions audit log for failed bot notifications.
export type ActionStatus = SharedActionStatus | 'needs_review'

export function AlertSeverityIcon({
  severity,
  size = 14,
}: {
  severity: AlertSeverity
  size?: number
}) {
  const props = { size, strokeWidth: severity === 'critical' ? 2 : 1.75 }

  if (severity === 'critical') {
    return (
      <TriangleAlert
        {...props}
        className="text-status-critical inline-block shrink-0"
      />
    )
  }
  if (severity === 'warning') {
    return (
      <CircleAlert
        {...props}
        className="text-status-warning inline-block shrink-0"
      />
    )
  }
  return <Info {...props} className="text-status-info inline-block shrink-0" />
}

export function ActionStatusIcon({
  status,
  size = 14,
}: {
  status: ActionStatus
  size?: number
}) {
  const props = { size, strokeWidth: 1.75 }

  switch (status) {
    case 'pending':
      return (
        <Clock3
          {...props}
          className="text-text-muted inline-block shrink-0"
        />
      )
    case 'running':
      return (
        <LoaderCircle
          {...props}
          className="text-accent animate-spin inline-block shrink-0"
        />
      )
    case 'succeeded':
    case 'approved':
      return (
        <CheckCircle2
          {...props}
          className="text-status-success inline-block shrink-0"
        />
      )
    case 'failed':
    case 'denied':
      return (
        <XCircle
          {...props}
          className="text-status-critical inline-block shrink-0"
        />
      )
    case 'skipped':
    case 'cancelled':
      return (
        <MinusCircle
          {...props}
          className="text-text-muted inline-block shrink-0"
        />
      )
    case 'pending_approval':
      return (
        <ShieldQuestion
          {...props}
          className="text-status-warning inline-block shrink-0"
        />
      )
    case 'needs_review':
      return (
        <Clock3
          {...props}
          className="text-status-warning inline-block shrink-0"
        />
      )
    default:
      return null
  }
}
