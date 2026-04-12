-- engine_jobsにupdated_atカラムを追加する
alter table public.engine_jobs
  add column if not exists updated_at timestamptz not null default now();
