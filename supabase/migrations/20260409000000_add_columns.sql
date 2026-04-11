-- engine_eventsにclient_event_idのデフォルト値設定
alter table public.engine_events
  alter column id set default gen_random_uuid()::text;

-- research_itemsにcategoryカラム追加
alter table public.research_items
  add column if not exists category text;
create index if not exists research_items_category_idx
  on public.research_items(category);
