# Bionic - DB Migration管理

## 方針
- DB変更は必ずここにSQLファイルとして記録する
- ファイル名: `YYYYMMDDHHMMSS_description.sql`
- Supabaseへの適用は手動SQL Editorで実行する（Supabase CLIは今は使わない）
- 新しいDB変更を加える時は新しいmigrationファイルを作成する

## 適用済みmigration

| ファイル | 内容 | 適用日 |
|---------|------|--------|
| 20260408000000_initial_schema.sql | 全テーブル初期作成 | 2026-04-08 |
| 20260409000000_add_columns.sql | category / client_event_id追加 | 2026-04-09 |
| 20260411000000_alert_dedup.sql | fingerprint / dedup columns追加 | 2026-04-11 |
| 20260411000001_research_source_default.sql | research_items.source DEFAULT 'manual'追加 | 2026-04-11 |
| 20260411000002_jobs_dedupe_key.sql | engine_jobs.dedupe_key追加・ユニーク制約 | 2026-04-11 |
| 20260411000003_engine_actions.sql | engine_actionsテーブル作成 | 2026-04-11 |

## 新しいDB変更を加える手順
1. supabase/migrations/ に新しいSQLファイルを作成する
2. Supabaseのダッシュボード → SQL Editorで実行する
3. このREADMEの適用済みテーブルを更新する
4. git commit && git push する
