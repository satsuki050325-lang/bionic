-- engine_actionsに通知履歴カラムを追加する
alter table public.engine_actions
  add column if not exists last_notified_at timestamptz,
  add column if not exists notification_count integer not null default 0;
