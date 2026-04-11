# Bionic - 今の状態
> このファイルはチャットが変わっても文脈を引き継ぐための正本。
> 作業開始前に必ず読むこと。

---

## 現在のフェーズ

**Phase 1 完了 / Phase 2 設計確定**
自動化フロー：Phase 0（手動）

---

## プロジェクトの状態

### 確定済み
- 製品名：Bionic（仮称）
- 本体ランナー：Bionic Engine
- repoフォルダ構成：`bionic/` 配下に6フォルダ
- 技術スタック：TypeScript / Node.js / Next.js / Supabase / Discord / Vercel Cron
- 通信方式：local HTTP（transport-agnostic service interface）
- 開発環境：VSCode内蔵ターミナル（Ubuntu）+ Claude Code
- ターゲット：英語市場（一次）/ 日本市場（二次）
- 将来：個人開発者 + 小チーム（2〜5人）対応予定

### Phase 1 完了済み
- shared型定義（EngineEvent / ServiceStatus / Alert / Job / ResearchItem）
- Engine最小起動（Express + local HTTP API 4エンドポイント）
- Supabase接続・engine_eventsテーブル保存
- engine_jobs / engine_alerts / research_items テーブル作成
- POST /api/jobs でengine_jobsに保存・digest実行
- GET /api/alerts でengine_alertsから取得
- GET /api/status でDB集計（DB障害時503対応）
- SDK最小実装（@bionic/sdk: health / error / usage）
- Discord digest通知（上位3件・2000文字上限・NotifyResult型）
- MediniへのSDK組み込み（with-auth.ts / plan.ts）
- Bionic App 3画面（Dashboard / Alerts / Research）
- Research保存フォーム + 一覧表示
- Engine未起動時の適切なエラー表示
- GET /api/research / POST /api/research 実装
- research_itemsにcategoryカラム追加
- Event → Alert 最小Decision実装（decisions/alerts.ts）
- Alert.typeにservice_error追加
- fingerprintによる重複防止・race condition対応
- supabase/migrations整備（DB変更の再現性確保）
- Codexレビュー完了・P1 finding全修正済み

### 設計確定（Phase 2方針）
- 存在意義：競合（Claude Code・Codex・OpenClaw）はセッションベースでLLM推論コストがかかる。Bionicはルールベース処理をローカルで完結しコスト実質$0
- ルールエンジン：json-rules-engine（ルールをDBにJSON保存・段階的導入）
- スケジューラー：node-cron（GitHub Actions Cronは遅延が大きく不適切）
- ローカルDB：将来はbetter-sqlite3 + drizzle-ormで対応（今はSupabaseのみ）
- Discord Bot：Phase 2以降（今はWebhook通知で十分）
- MCPサーバー：packages/mcpとして独立パッケージ（Engine内に混在させない）
- RLS：本番前ゲートとして設計を早めに固める

### 未着手（Phase 2）
- Scheduler（node-cron）（次の1手）
- project_bionic / default 混在整理
- App UI改善 + Recent Events表示
- RLS / Security設計
- Deploy→Watch→Alert（Vercel Webhook連携）
- bionic-ops MCPサーバー（packages/mcp）
- Discord Bot
- CLI

---

## 次の1手

### 今すぐやること
Scheduler実装（node-cronでweekly digest自動実行）

### done条件
- [ ] node-cronがEngine起動時にスケジュール登録される
- [ ] 毎週月曜朝にresearch digestが自動実行される
- [ ] pnpm typecheck がエラーなく通る

---

## 確定優先順位（Phase 2）

Scheduler（node-cronでweekly digest自動実行）（今ここ）
project_bionic / default 混在整理
App UI改善 + Recent Events表示
RLS / Security設計
Deploy→Watch→Alert（Vercel Webhook連携）
bionic-ops MCPサーバー（packages/mcp として独立）
Discord Bot（Phase 2後半）


---

## Open Questions

### 要Claude確認
- なし（優先順位確定済み）

### 要Codex確認
- json-rules-engineのDB保存ルール設計

---

## 既知リスク

- RLSは開発中無効。本番前に有効化が必要
- project_bionic / default が混在している。Scheduler実装前に整理が必要
- Discord Bot常駐・外部API監視・LLM要約が増えるとコストが発生する（今は実質$0）
- GitHub ActionsでCI（typecheck/build）を必須化していない
- SECURITY_RELEASE_CHECKLIST.mdがまだない

---

## 参照ドキュメント

- `AGENTS.md` — 役割分担・行動規範
- `CLAUDE.md` — Claudeへの指示
- `SKILLS.md` — コマンドごとの担当と手順
- `docs/AUTOMATION.md` — 自動化フローの詳細
- `docs/BIONIC_PRODUCT.md` — 製品仕様書
- `docs/TECHNICAL_DESIGN.md` — 技術設計

---

## 最終更新

2026-04-11 / Claude
