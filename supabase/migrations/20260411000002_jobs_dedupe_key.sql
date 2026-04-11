-- engine_jobsにdedupe_keyカラムを追加する
alter table public.engine_jobs
  add column if not exists dedupe_key text;

-- project_id + type + dedupe_keyの組み合わせでユニーク制約を追加する
create unique index if not exists engine_jobs_dedupe_key_unique
  on public.engine_jobs(project_id, type, dedupe_key)
  where dedupe_key is not null;
