-- engine_alertsにresolve関連カラムを追加する
alter table public.engine_alerts
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by text,
  add column if not exists resolved_reason text;
