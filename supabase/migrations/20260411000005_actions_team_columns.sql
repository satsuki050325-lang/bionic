-- チーム利用に向けてapproved_by / denied_byを追加する
alter table public.engine_actions
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz,
  add column if not exists denied_by text,
  add column if not exists denied_at timestamptz;
