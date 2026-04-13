export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    failed: 'bg-status-critical/10 text-status-critical border border-status-critical/30',
    denied: 'bg-status-critical/10 text-status-critical border border-status-critical/30',
    critical: 'bg-status-critical/10 text-status-critical border border-status-critical/30',
    alerted: 'bg-status-critical/10 text-status-critical border border-status-critical/30',
    watching: 'bg-status-warning/10 text-status-warning border border-status-warning/30',
    running: 'bg-status-warning/10 text-status-warning border border-status-warning/30',
    pending: 'bg-status-warning/10 text-status-warning border border-status-warning/30',
    pending_approval:
      'bg-status-warning/10 text-status-warning border border-status-warning/30',
    completed: 'bg-status-success/10 text-status-success border border-status-success/30',
    succeeded: 'bg-status-success/10 text-status-success border border-status-success/30',
    approved: 'bg-status-success/10 text-status-success border border-status-success/30',
    ready: 'bg-status-success/10 text-status-success border border-status-success/30',
    missing: 'bg-status-critical/10 text-status-critical border border-status-critical/30',
    degraded: 'bg-status-warning/10 text-status-warning border border-status-warning/30',
    optional:
      'bg-status-neutral/10 text-status-neutral border border-status-neutral/30',
    loading:
      'bg-status-neutral/10 text-status-neutral border border-status-neutral/30',
  }
  const style =
    styles[status] ??
    'bg-status-neutral/10 text-status-neutral border border-status-neutral/30'
  return (
    <span
      className={`font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${style}`}
    >
      {status}
    </span>
  )
}
