import type { HeartbeatTarget } from '@bionic/shared'

export function mapHeartbeatRow(
  row: Record<string, unknown>
): HeartbeatTarget {
  return {
    id: row['id'] as string,
    projectId: row['project_id'] as string,
    serviceId: row['service_id'] as string,
    slug: row['slug'] as string,
    name: (row['name'] as string | null) ?? null,
    description: (row['description'] as string | null) ?? null,
    secretAlgo: (row['secret_algo'] as 'hmac-sha256') ?? 'hmac-sha256',
    expectedIntervalSeconds: row['expected_interval_seconds'] as number,
    graceSeconds: (row['grace_seconds'] as number) ?? 60,
    severity: (row['severity'] as 'info' | 'warning' | 'critical') ?? 'warning',
    enabled: (row['enabled'] as boolean) ?? true,
    lastPingAt: (row['last_ping_at'] as string | null) ?? null,
    lastPingFromIp: (row['last_ping_from_ip'] as string | null) ?? null,
    missedEventEmitted: (row['missed_event_emitted'] as boolean) ?? false,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  }
}
