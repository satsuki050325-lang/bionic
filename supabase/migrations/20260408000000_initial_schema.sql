-- engine_events
create table if not exists public.engine_events (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  service_id text not null,
  type text not null,
  occurred_at timestamptz not null,
  source text not null,
  payload jsonb not null default '{}',
  client_event_id text,
  created_at timestamptz not null default now()
);
create index if not exists engine_events_project_id_idx on public.engine_events(project_id);
create index if not exists engine_events_type_idx on public.engine_events(type);
create index if not exists engine_events_occurred_at_idx on public.engine_events(occurred_at desc);
create index if not exists engine_events_client_event_id_idx on public.engine_events(client_event_id);
alter table public.engine_events disable row level security;

-- engine_jobs
create table if not exists public.engine_jobs (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  type text not null,
  status text not null default 'pending',
  resolution_reason text,
  requested_by text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);
create index if not exists engine_jobs_project_id_idx on public.engine_jobs(project_id);
create index if not exists engine_jobs_status_idx on public.engine_jobs(status);
create index if not exists engine_jobs_type_idx on public.engine_jobs(type);
create index if not exists engine_jobs_created_at_idx on public.engine_jobs(created_at desc);
alter table public.engine_jobs disable row level security;

-- engine_alerts
create table if not exists public.engine_alerts (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  service_id text,
  type text not null,
  severity text not null,
  title text not null,
  message text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists engine_alerts_project_id_idx on public.engine_alerts(project_id);
create index if not exists engine_alerts_status_idx on public.engine_alerts(status);
create index if not exists engine_alerts_severity_idx on public.engine_alerts(severity);
create index if not exists engine_alerts_created_at_idx on public.engine_alerts(created_at desc);
alter table public.engine_alerts disable row level security;

-- research_items
create table if not exists public.research_items (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  title text not null,
  summary text not null,
  url text,
  source text not null,
  importance_score integer not null default 0,
  is_digest_sent boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists research_items_project_id_idx on public.research_items(project_id);
create index if not exists research_items_importance_score_idx on public.research_items(importance_score desc);
create index if not exists research_items_is_digest_sent_idx on public.research_items(is_digest_sent);
create index if not exists research_items_created_at_idx on public.research_items(created_at desc);
alter table public.research_items disable row level security;
