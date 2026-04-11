-- 全テーブルのRLSを有効化する
-- policyは作らない（service_roleのEngineのみが操作できる）
-- App/CLI/anon keyからのSupabase直接アクセスは拒否される
alter table public.engine_events enable row level security;
alter table public.engine_jobs enable row level security;
alter table public.engine_alerts enable row level security;
alter table public.engine_actions enable row level security;
alter table public.research_items enable row level security;
