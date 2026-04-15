-- heartbeat_targets: push-style death-watch monitoring targets.
-- The monitored job sends POST /api/heartbeats/:slug on each execution.
-- When pings stop arriving within (interval + grace), the runner raises a
-- cron_missing alert. Recovery happens when a ping arrives after a miss.
--
-- See docs/HEARTBEAT_SPEC.md for the full design.

create table if not exists public.heartbeat_targets (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  service_id text not null,

  slug text not null,
  name text,
  description text,

  secret_hash text not null,
  secret_algo text not null default 'hmac-sha256',

  expected_interval_seconds integer not null,
  grace_seconds integer not null default 60,
  severity text not null default 'warning',
  enabled boolean not null default true,

  last_ping_at timestamptz,
  last_ping_from_ip text,
  missed_event_emitted boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint heartbeat_targets_interval_check
    check (expected_interval_seconds between 60 and 86400),
  constraint heartbeat_targets_grace_check
    check (grace_seconds between 0 and 3600),
  constraint heartbeat_targets_severity_check
    check (severity in ('info', 'warning', 'critical')),
  constraint heartbeat_targets_algo_check
    check (secret_algo in ('hmac-sha256')),
  constraint heartbeat_targets_slug_format_check
    check (slug ~ '^[a-z0-9-]{3,64}$')
);

create unique index if not exists heartbeat_targets_project_slug_unique
  on public.heartbeat_targets(project_id, slug);

create index if not exists heartbeat_targets_enabled_last_ping_idx
  on public.heartbeat_targets(enabled, last_ping_at);

create index if not exists heartbeat_targets_project_service_idx
  on public.heartbeat_targets(project_id, service_id);

alter table public.heartbeat_targets enable row level security;
