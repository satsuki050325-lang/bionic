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
- Scheduler実装（node-cron + luxon）
- project_id統一（project_bionic）
- engine_jobs.dedupe_key追加
- catch-up処理（予定時刻チェック・timezone正確化・dedupe_key一貫性）
- セキュリティ検証（cron式・timezone・projectIdバリデーション）
- Codexレビュー完了・P1/P2 finding全修正済み
- engine_actions実装（Phase 1.5 Audit Log）
- logActionヘルパー作成（createAction/completeAction/failAction/skipAction）
- run_research_digest / notify_discord / create_alert / mark_digest_sent の記録
- GET /api/actions エンドポイント追加
- GET /api/status にpendingActions追加
- notifyDigest例外時のnotify_discord action failover
- mark_digest_sent失敗時のneeds_review対応
- Codexレビュー完了・P1/P2 finding全修正済み
- App UI改善（TailwindCSS v4導入・Retro-Futurism × Anthropic Orangeデザイン）
- Dashboard / Alerts / Actions / Research 全画面スタイル適用
- Actions画面新規追加（Audit Log表示）
- getActions()をengine.tsに追加
- Codexレビュー完了・問題なし
- Recent Events表示（GET /api/events + Dashboard Recent Eventsセクション）
- Codexレビュー完了・問題なし
- CLI最小実装（bionic status / approvals / approve / deny）
- approve/deny 404/409・atomic update対応
- Codexレビュー完了・P1 finding全修正済み
- RLS有効化（全テーブル・policyなし・service_roleのEngineのみ操作）
- BIONIC_ENGINE_TOKEN認証middleware実装
- Engineのlisten host環境変数化（デフォルト127.0.0.1）
- チーム利用設計（approved_by / denied_byカラム追加）
- 本番環境でのTOKEN未設定時の起動拒否（validateEnvironment）
- App / CLI のAuthorizationヘッダー追加
- .env.example作成
- CORS・JSON body size limit設定
- IDEAS.md参照タイミング構造化（全21アイデアに追加）
- AGENTS.mdに「タスク開始前の確認」ルール追加
- Codexレビュー完了・P1 finding全修正済み
- 最小テスト追加（Vitest・全20テスト通過）
- validateCronExpressionをcron.tsに切り出し
- cron.test.ts / researchDigest.test.ts / alerts.test.ts 追加
- Codexレビュー完了・P2 finding全修正済み
- Deploy→Watch→Alert実装（Vercel Webhook連携）
- deploymentsテーブル作成・RLS有効化
- HMAC-SHA1署名検証・raw body処理
- 5分ごとのdeployment watch scheduler
- deployment_regression alert生成
- Codexレビュー完了・P1/P2 finding全修正済み

### 設計確定（Phase 2方針）
- 存在意義：競合（Claude Code・Codex・OpenClaw）はセッションベースでLLM推論コストがかかる。Bionicはルールベース処理をローカルで完結しコスト実質$0
- ルールエンジン：json-rules-engine（ルールをDBにJSON保存・段階的導入）
- スケジューラー：node-cron（GitHub Actions Cronは遅延が大きく不適切）
- ローカルDB：将来はbetter-sqlite3 + drizzle-ormで対応（今はSupabaseのみ）
- Discord Bot：Phase 2以降（今はWebhook通知で十分）
- MCPサーバー：packages/mcpとして独立パッケージ（Engine内に混在させない）
- RLS：本番前ゲートとして設計を早めに固める

### 未着手（Phase 2）
- bionic-ops MCPサーバー（packages/mcp）
- Discord Bot
- CLI

---

## 次の1手

### 今すぐやること
- Deploy→Watch→Alert動作確認（ngrok + Vercel Webhook設定）

### done条件
- [ ] ngrokトンネル経由でVercel Webhookを受信できる
- [ ] deploymentsテーブルにレコードが入る
- [ ] watch期間中にerror件数が記録される

---

## 確定優先順位（Phase 2）

Event → Alert 最小Decision（完了）
Scheduler（完了）
project_bionic / default 混在整理（完了）
engine_actions実装（完了）
App UI改善（完了）
Recent Events表示（完了）
承認待ちAPI / CLI最小実装（完了）
RLS / Security設計（完了）
最小テスト追加（完了）
Deploy→Watch→Alert（完了）
bionic-ops MCPサーバー（packages/mcp として独立）（今ここ）
Discord Bot（Phase 2後半）


---

## Open Questions

### 要Claude確認
- なし（優先順位確定済み）

### 要Codex確認
- json-rules-engineのDB保存ルール設計

---

## 既知リスク

- テストコードがまだない（次のタスク）
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

2026-04-12 / Claude Code
