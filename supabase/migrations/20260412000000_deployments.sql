create table if not exists public.deployments (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  service_id text not null,

  provider text not null default 'vercel',
  provider_project_id text not null,
  provider_deployment_id text not null,
  deployment_url text not null,
  target text,
  git_commit_sha text,
  git_commit_message text,
  dashboard_url text,

  status text not null,
  ready_at timestamptz,
  watch_started_at timestamptz,
  watch_until timestamptz,
  watch_status text not null default 'pending',

  baseline_error_count integer not null default 0,
  current_error_count integer not null default 0,
  error_increase_percent integer,

  alert_id text,
  raw_payload jsonb not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists deployments_provider_deployment_unique
  on public.deployments(provider, provider_deployment_id);

create index if not exists deployments_watch_status_idx
  on public.deployments(watch_status, watch_until);

create index if not exists deployments_project_service_ready_idx
  on public.deployments(project_id, service_id, ready_at desc);

alter table public.deployments enable row level security;
