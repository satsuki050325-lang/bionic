-- research_items.sourceにデフォルト値を設定する
-- 手動保存のリサーチはsource='manual'をデフォルトとして使用する
alter table public.research_items
  alter column source set default 'manual';
