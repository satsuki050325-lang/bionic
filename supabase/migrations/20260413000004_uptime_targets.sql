-- uptime_targets: URL-based external monitoring targets
-- Each row describes a URL that the Engine polls on a fixed interval.
-- Consecutive failures drive service.health.degraded events (threshold = 3),
-- and the first recovery after a degraded state emits service.health.reported.

create table if not exists public.uptime_targets (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  service_id text not null,

  url text not null,
  method text not null default 'GET',
  interval_seconds integer not null,
  timeout_ms integer not null default 10000,
  expected_status_min integer not null default 200,
  expected_status_max integer not null default 299,
  enabled boolean not null default true,

  last_checked_at timestamptz,
  last_status text,
  last_latency_ms integer,
  last_status_code integer,
  last_failure_reason text,
  consecutive_failures integer not null default 0,
  degraded_event_emitted boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uptime_targets_interval_check
    check (interval_seconds in (30, 60, 300)),
  constraint uptime_targets_method_check
    check (method in ('GET', 'HEAD')),
  constraint uptime_targets_status_range_check
    check (expected_status_min between 100 and 599
       and expected_status_max between 100 and 599
       and expected_status_min <= expected_status_max),
  constraint uptime_targets_timeout_check
    check (timeout_ms between 1000 and 30000),
  constraint uptime_targets_last_status_check
    check (last_status is null or last_status in ('up', 'down'))
);

create unique index if not exists uptime_targets_project_service_url_unique
  on public.uptime_targets(project_id, service_id, url);

create index if not exists uptime_targets_enabled_last_checked_idx
  on public.uptime_targets(enabled, last_checked_at);

create index if not exists uptime_targets_project_service_idx
  on public.uptime_targets(project_id, service_id);

alter table public.uptime_targets enable row level security;
