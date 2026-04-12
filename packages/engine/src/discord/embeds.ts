import type { Alert, EngineAction } from '@bionic/shared'

const SEVERITY_COLORS = {
  critical: 0xe5484d,
  warning: 0xf59e0b,
  info: 0x3b82f6,
} as const

export function buildAlertEmbed(alert: Alert) {
  const color = SEVERITY_COLORS[alert.severity as keyof typeof SEVERITY_COLORS] ?? 0x64748b
  const severityLabel = alert.severity.toUpperCase()

  return {
    title: `[${severityLabel}] ${alert.title}`,
    description: alert.message,
    color,
    fields: [
      { name: 'Service', value: alert.serviceId ?? 'unknown', inline: true },
      { name: 'Type', value: alert.type, inline: true },
      { name: 'Count', value: String(alert.count ?? 1), inline: true },
      { name: 'Status', value: alert.status, inline: true },
      { name: 'Fingerprint', value: alert.fingerprint ?? 'n/a', inline: false },
    ],
    footer: { text: `Bionic Alert · ${alert.id}` },
    timestamp: new Date(alert.createdAt).toISOString(),
  }
}

export function buildApprovalEmbed(action: EngineAction) {
  return {
    title: `⏳ Approval Required`,
    description: action.title,
    color: 0xe8611a,
    fields: [
      { name: 'Type', value: action.type, inline: true },
      { name: 'Mode', value: action.mode, inline: true },
      { name: 'Requested by', value: action.requestedBy, inline: true },
      { name: 'Action ID', value: action.id, inline: false },
    ],
    footer: { text: `Approve or deny via CLI: bionic approve ${action.id}` },
    timestamp: new Date(action.createdAt).toISOString(),
  }
}
