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
- Deploy→Watch→Alert動作確認完了（ngrok + curl）
- Webhook受信・署名検証・deployment保存を確認
- bionic-ops MCPサーバー実装（packages/mcp）
- Claude Desktop登録・動作確認完了
- 6ツール（get_status/get_alerts/get_actions/get_events/get_research_items/run_research_digest）
- Codexレビュー完了・P1 finding全修正済み
- Engineの実行責務分離（jobs/runner.ts・jobs/repository.ts・jobs/researchDigest.ts）
- routes/jobs.tsをHTTP受付のみに縮小
- policies/notification.ts実装（quiet hours・alert_created・alert_reminder・approval_stale）
- policies/approval.ts実装（48h auto-cancel）
- engine_alertsにlast_notified_at・notification_count追加
- Codexレビュー完了・P1/P2 finding全修正済み
- Discord Bot実装（packages/engine/src/discord/）
- alert新規作成時のDiscord通知結線（shouldNotify判定あり）
- digest通知のDiscord.js移行（Bot未起動時はWebhook継続）
- allowlist fail-closed実装
- Bot通知失敗時のjob状態分離
- actions/service.ts実装（approveAction/denyAction）
- Codexレビュー完了・P1 finding全修正済み
- Discord Bot動作確認完了
- [CRITICAL]アラートのEmbed通知をDiscordで確認
- SECURITY_RELEASE_CHECKLIST.md作成
- GitHub Actions CI設定（typecheck/test/build 3ジョブ）
- Codexレビュー完了・問題なし
- ロードマップ確定（docs/ROADMAP.md作成）
- 第一指示「いいものを作る」をAGENTS.mdに追記
- config.ts導入（env一元管理・validation・singleton・redactConfig）
- Engine内のprocess.env直読みを全て廃止
- config.test.ts 36件通過（validateConfigForStartup・redactConfig含む）
- Codexレビュー完了・P1/P2 finding全修正済み
- pnpm verify追加（typecheck + engine test + app build一発実行）
- Codexレビュー完了・問題なし
- README.md作成（最小起動・Discord Bot・Vercel webhook・MCP・Troubleshooting）
- README P1/P2 finding修正（token設定の明確化）
- Codexレビュー完了・問題なし
- TECHNICAL_DESIGN.mdの実装追従
- Codexレビュー完了・P2 finding全修正済み
- secrets scan CI追加（gitleaks・.gitleaks.toml）
- Codexレビュー完了・P2 finding修正済み
- migration fresh apply確認（Codexによる論理確認・問題なし)
- Phase 1.8: Stabilize Bionic Core 完了
- docs/DESIGN.md作成（Bionicデザインシステム正本・9セクション）
- L1/L2/L3品質層定義
- AGENTS.mdにDESIGN.md参照ルールを追加
- Engine diagnostics画面実装（/api/diagnostics + /diagnostics page）
- runtime/diagnostics.ts（runner state in-memory記録）
- Tailwindカスタムトークン追加（DESIGN.mdのsemantic token）
- StatusBadge共通コンポーネント作成
- Codexレビュー完了・P2/P3 finding全修正済み
- Phase 2.0: Runner / Policy / Approvalの完成
- jobs/state.ts・actions/state.ts（状態遷移一元化）
- runners/approvals.ts・alertReminders.ts・approvedActions.ts
- createApprovalAction実装（sendApprovalNotification結線）
- DB job runner（claimPendingJob・runPendingJobs）
- Scheduler enqueue-only化
- engine_jobs.updated_at追加
- engine_actions.last_notified_at・notification_count追加
- Bot通知関数をPromise<boolean>に変更
- Webhook fallback対応（approval・alert reminder）
- Codexレビュー完了・P1/P2 finding全修正済み
- bionic init実装（packages/cli/src/commands/init.ts）
- Supabase・Engine・Scheduler・Discord・Vercel対話形式セットアップ
- secret値はsummaryで[set]/[auto-generated]表示
- Discord空入力時のskip扱い
- Codexレビュー完了・P2 finding修正済み
- Appオンボーディング画面実装（/onboarding）
- Next.js API route proxy（/api/diagnostics）
- 5秒ポーリング実装
- StatusBadgeにready/missing/degraded/optional/loading追加
- Dashboard offlineにOpen Onboarding CTA追加
- Codexレビュー完了・P2 finding修正済み
- Phase 2.2: Signal Quality完了
- alert resolve flow（手動・自動・audit log）
- fingerprint v2（normalizeMessage・alertType別stableKey）
- SDK rate limit（60/min）・dedupe（30s・health ok 60s・復旧イベント必送）
- client_event_id unique index・重複POST時に202返却
- CaptureEventResult型修正（eventId: string | null）
- VALID_SOURCESにmcp追加
- Codexレビュー完了・全finding修正済み
- Phase 2.3: GitHub連携（CI失敗検知）
- workflow_run.completed → ci_failure alert生成
- X-Hub-Signature-256署名検証
- X-GitHub-Delivery idempotency
- fingerprint v2（workflow name含む）
- Codexレビュー完了・P1/P2 finding全修正済み
- Phase 2.3: Stripe監視（payment_failure・revenue_change alert）
- invoice.payment_failed・dispute・subscription変更検知
- stripe-signature検証・idempotency実装
- customer email/billing details保存なし
- Codexレビュー完了・P2 finding修正済み
- Phase 2.3: Sentry連携（sentry_issue alert）
- new_issue・regressed・spike検知
- sentry-hook-signature検証・idempotency実装
- PII（stacktrace/email/IP）保存なし
- production regressedはcritical
- Codexレビュー完了・P1/P2 finding全修正済み
- Phase 2.3: Deploy→Watch判定精度向上
- baseline比較を同じ経過時間比較に改善
- thresholdをconfig経由に変更（BIONIC_DEPLOYMENT_WATCH_MINUTES等）
- alert messageに判定メタデータ追加
- Codexレビュー完了・問題なし
- Phase 2.3: SDK品質改善（外部組み込み対応）
- fail-open・timeoutMs・stack送信デフォルトoff
- JSDoc追加・SendEventResultのexport追加
- README.mdにSDK Quickstart追加
- Codexレビュー完了・問題なし
- Phase 2.3: Integrations 全タスク完了
- Phase 2.4: bionic doctor実装（Environment/Database/Engine/Discord/Integrations/Summary）
- BIONIC_ENGINE_URL優先のEngine URL解決
- Discord部分設定のWARN検出
- FAILで exit code 1
- Codexレビュー完了・P2 finding全修正済み
- Dashboard UI改善Phase 1（Operational Brief・情報階層強化）
- Dashboard UI改善Phase 2（Incident Brief API・動線重視レイアウト）
- Incident Brief finding修正（DBエラー・redaction・cache）
- ANTHROPIC_API_KEY設定時のPrivacy notice追加
- Codexレビュー完了・全finding修正済み
- Alerts UI改善（severity sort・相対時間・fingerprint折りたたみ・Next Step・Resolve）
- Codexレビュー完了・問題なし
- Actions/Research/Onboarding/共通UI改善
- Settingsページ実装（言語切り替え含む）
- Dashboard 24h error trend sparkline実装
- GET /api/metrics/events API追加
- Codexレビュー完了・P2 finding全修正済み
- LICENSE追加（AGPL-3.0）
- README.md整備（10分Quickstart・init/doctor/demo主役化）
- SECURITY_RELEASE_CHECKLIST.md更新
- docs/SHOW_HN.md作成
- Settingsバグ修正（env読み取り → GET /api/diagnostics経由に変更）
- Dashboardスパークライン非表示バグ修正（CSS変数に変更）
- カラーパレット適用（P25ローラー・リンクベース安全版）
- アイコン導入（lucide-react・AlertSeverityIcon・ActionStatusIcon）
- Actionsのskipped/failed理由表示（humanize対応）
- Codexレビュー完了・P2 finding全修正済み
- Servicesページ実装（engine_events/alertsから推定・GET /api/services追加）
- Add Serviceページ実装（SDK snippet・Direct API・Test Event・Webhook設定）
- ナビゲーションにServices追加
- OnboardingにAdd Service導線追加
- Add Service P1/P2 finding全修正済み（SDK警告・curl Authorization・Windows対応・event id一意化）
- Codexレビュー完了・全finding修正済み
- ナビゲーション整理（6項目・アイコン追加・日本語対応）
- OnboardingをナビからSettingsに移動
- Researchをナビから削除
- ActionsのSUCCEEDED/SKIPPED色改善
- Diagnostics・Settingsのタイトル階層改善
- Codexレビュー完了・問題なし
- Settings階層強化（セクションタイトル・description追加）
- Actions整理（Needs Attention / Recent History分割・サマリーバー）
- ServicesにMissing integrations表示
- Diagnosticsに総合判定バナー追加
- 多言語対応追加（Español・中文）
- LanguageSwitcher4言語対応
- Codexレビュー完了・問題なし
- Dashboard階層改善（セクションタイトルをSettings・Diagnostics同水準に統一）
- 公開前README修正（Direct API主導・clone URL実URL・event id一意化）
- .env.example BIONIC_ENGINE_TOKEN空に変更
- Add Service SDKタブをComing soonのみに変更
- SECURITY_RELEASE_CHECKLIST表記修正
- Codexレビュー完了・全finding修正済み・公開前品質ゲート通過

### 設計確定（Phase 2方針）
- 存在意義：競合（Claude Code・Codex・OpenClaw）はセッションベースでLLM推論コストがかかる。Bionicはルールベース処理をローカルで完結しコスト実質$0
- ルールエンジン：json-rules-engine（ルールをDBにJSON保存・段階的導入）
- スケジューラー：node-cron（GitHub Actions Cronは遅延が大きく不適切）
- ローカルDB：将来はbetter-sqlite3 + drizzle-ormで対応（今はSupabaseのみ）
- Discord Bot：Phase 2以降（今はWebhook通知で十分）
- MCPサーバー：packages/mcpとして独立パッケージ（Engine内に混在させない）
- RLS：本番前ゲートとして設計を早めに固める

### 未着手（Phase 2）
- CLI拡張

---

## 次の1手

### 今すぐやること
- **[必須] uptime RPC atomic claim の実DB検証**: migration 適用後、
  `SELECT public.claim_uptime_degraded(...)` を2セッションで同時実行し、
  片方のみ `true` を返すことを確認する。
  確認前は atomic claim を「実装済み・未検証」として扱うこと
- Phase 2.4: GitHub公開（リポジトリをpublicに変更）

### done条件
- [x] Settingsのenv読み取りバグ修正（[not set]問題）
- [x] Dashboard sparkline非表示バグ修正
- [x] カラーパレット適用（P25ベース）
- [x] アイコン導入
- [x] Actionsのskipped理由表示

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
bionic-ops MCPサーバー（packages/mcp として独立）（完了）
Discord Bot（Phase 2後半）（完了）
Discord Bot動作確認（完了）
SECURITY_RELEASE_CHECKLIST.md作成 / GitHub Actions CI（完了）
ロードマップ確定（完了）
Phase 1.8: config.ts導入（完了）
Phase 1.8: pnpm verify追加（完了）
Phase 1.8: README起動手順の整備（完了）
Phase 1.8: TECHNICAL_DESIGN.mdの実装追従（完了）
Phase 1.8: secrets scan CI追加（完了）
Phase 1.8: migration fresh apply確認（完了）
Phase 1.8: Stabilize Bionic Core 完了
Phase 2.0: Runner / Policy / Approvalの完成（完了）
Phase 2.1: Engine diagnostics画面（完了）
Phase 2.1: bionic init最小実装（完了）
Phase 2.1: Appオンボーディング画面（完了）
Phase 2.1: Productizable Setup 完了
Phase 2.2: Signal Quality（完了）
Phase 2.3-1: GitHub連携 CI失敗検知（完了）
Phase 2.3-2: Stripe監視（完了）
Phase 2.3-3: Sentry連携（完了）
Phase 2.3-4: Deploy→Watch判定精度向上（完了）
Phase 2.3-5: SDK品質改善（完了）
Phase 2.3: Integrations 完了
Phase 2.4: bionic doctor実装（完了）
Phase 2.4: bionic demo実装（完了）
Phase 2.4: Dashboard UI改善（完了）
Phase 2.4: Alerts UI改善（完了）
Phase 2.4: Public Preview公開準備（LICENSE・README・CHECKLIST・SHOW_HN 完了）
Phase 2.4: UI最終仕上げ（今ここ）


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
- sendApprovalNotificationはpending_approval action生成時に結線が必要（将来タスク）

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

2026-04-14 / Claude
