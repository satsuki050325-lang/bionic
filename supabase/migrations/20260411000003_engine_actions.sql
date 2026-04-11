-- engine_actionsテーブル作成
create table if not exists public.engine_actions (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  service_id text,
  event_id text,
  alert_id text,
  job_id text,
  type text not null,
  mode text not null default 'automatic',
  status text not null,
  title text not null,
  reason text,
  input jsonb not null default '{}',
  result jsonb not null default '{}',
  error jsonb,
  requested_by text not null default 'engine',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists engine_actions_project_id_idx on public.engine_actions(project_id);
create index if not exists engine_actions_status_idx on public.engine_actions(status);
create index if not exists engine_actions_type_idx on public.engine_actions(type);
create index if not exists engine_actions_created_at_idx on public.engine_actions(created_at desc);
create index if not exists engine_actions_job_id_idx on public.engine_actions(job_id);
create index if not exists engine_actions_alert_id_idx on public.engine_actions(alert_id);

alter table public.engine_actions disable row level security;
