-- engine_alertsにfingerprintとdedup用カラムを追加
alter table public.engine_alerts
  add column if not exists fingerprint text,
  add column if not exists last_seen_at timestamptz not null default now(),
  add column if not exists count integer not null default 1,
  add column if not exists last_event_id text;

-- fingerprintによる重複防止のpartial unique index
-- status='open'のalertに対してfingerprintの一意性を保証する
create unique index if not exists engine_alerts_open_fingerprint_unique
  on public.engine_alerts (fingerprint)
  where status = 'open';
