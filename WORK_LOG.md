# Bionic - 作業ログ
> 判断・作業・未解決事項の時系列記録。Claude以外も書いてよい。

---

## 2026-04-13 / Claude

### やったこと
- config.tsを実装してEngine内のenv一元管理を実現した
- 全10ファイルのprocess.env直読みをgetConfig()経由に置換した
- validateConfigForStartup・redactConfigを実装した
- config.test.ts 36件全通過を確認した
- Codexレビュー完了・P1/P2 finding全修正済み

### 判断したこと
- BOT_TOKEN+CHANNEL_IDなし時はwebhook/disabledにフォールバック（起動拒否しない）
- VERCEL_WEBHOOK_SECRET未設定時はrouteだけ401（起動拒否しない）
- singletonで起動時固定・テスト用はloadConfig(env)を使う
- zodは使わない（独自バリデーションで十分）

### 次にやること
- pnpm verify追加

担当：Claude

---

## 2026-04-13 / Claude（config.ts P1/P2 finding修正）

### やったこと
- Discord mode判定を修正: `botToken && !channelId` の場合は Webhook にフォールバックし、webhookUrl もなければ `disabled` に落とす（以前は `mode='bot'` のままだった）
- `validateConfigForStartup` のテストを3件追加（process.exit を spy、production missing / production all set / development）
- `redactConfig` のテストを追加（secret値がJSON化後に出現しないことを検証）
- BOT_TOKENのみのテストケースを修正（期待値を 'disabled' / 'webhook' に更新）
- `pnpm typecheck` 全6パッケージ通過
- `pnpm --filter @bionic/engine test` 全36件通過（config.test は12→16件）

### 判断したこと
- channel_id がない状態で `mode='bot'` のままだと `sendAlertNotification` / `sendDigestNotification` が実質動作しないので、早期にWebhookへフォールバックする方が現場で壊れにくい
- redactConfig はJSON.stringify後の文字列検査でreject。secret名が増えてもテストが検知できる

### 次にやること
- `pnpm verify` 追加（typecheck + engine test + app build）
- README起動手順の整備

担当：Claude

---

## 2026-04-13 / Claude（Phase 1.8 - config.ts導入）

### やったこと
- `packages/engine/src/config.ts` を新規作成（env読み取り・validation・default値・singletonを一元化）
- `packages/engine/src/config.test.ts` を追加（12ケース、デフォルト/Discord mode判定/フォールバック/CSV・Vercel projectMapパース/production判定）
- Engine全体で `process.env` 直読みを撲滅し `getConfig()` 経由に統一
  - `index.ts`（`validateEnvironment` を `validateConfigForStartup` に置換）
  - `lib/supabase.ts` / `middleware/auth.ts` / `actions/notify.ts`
  - `discord/index.ts` / `discord/interactions.ts` / `discord/notifications.ts`
  - `policies/notification.ts`（`getQuietHoursConfig` のvalidationは config.ts に一元化）
  - `scheduler/index.ts`（ローカル `getConfig` と `ALLOWED_TIMEZONES` を削除）
  - `routes/webhooks/vercel.ts` / `sources/vercel.ts`
- `redactConfig` を用意（secretを出さないdiagnostics用）
- `pnpm typecheck` 全6パッケージ通過
- `pnpm --filter @bionic/engine test` 全32件通過（config.test.ts含む）

### 判断したこと
- envのvalidationはload時に行い、invalidな値は warning を出してデフォルトにフォールバックする（cron式・timezone・projectId・int range）
- production必須チェックは起動時のみ（`validateConfigForStartup` で `process.exit(1)`）。middlewareは毎回のrequestで起動拒否しない
- Discord mode判定は load時に一回だけ（bot > webhook > disabled）。bot_tokenがあればchannel_id不足でも `mode='bot'` とし起動時に警告を出す方針
- singletonは `getConfig()`、テストは `loadConfig(env)` で引数注入
- `policies/notification.ts` のローカル `parseHour` は config.ts に吸収して重複を排除

### 次にやること
- `pnpm verify` 追加（typecheck + engine test + app build を一発実行）
- README起動手順の整備

担当：Claude

---

## 2026-04-13 / Claude（ロードマップ確定）

### やったこと
- `docs/ROADMAP.md` を新規作成（Phase 1.8 / 2.0 / 2.1 / 2.2 / 2.3 / 2.4 / 3 を整理）
- CURRENT.md を更新（次の1手を Phase 1.8: config.ts導入 に）

### 判断したこと
- 機能追加より「壊れにくい運用エンジン」を先に固める方針を明文化
- 設計思想・判断基準をROADMAP.mdに書いて、迷ったときの優先順位を明確化

### 次にやること
- Phase 1.8: config.ts導入（env一元管理・validation）

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- 第一指示「いいものを作る」をAGENTS.mdに追記した
- Quality StandardをBIONIC_PRODUCT.mdに追記した

### 判断したこと
- 実装コストを理由にした妥協は今後認めない
- 技術的負債・セキュリティ・保守性・拡張性は常に検討対象とする

担当：Claude

---

## 2026-04-12 / Claude

### やったこと
- SECURITY_RELEASE_CHECKLIST.mdを作成した
- .github/workflows/ci.ymlを作成した（typecheck/test/build 3ジョブ）
- Codexレビュー完了・問題なし

### 判断したこと
- CI上でfresh checkoutでpnpm typecheck・test・buildが全て通ることを確認した

担当：Claude

---

## 2026-04-12 / Claude（SECURITY_RELEASE_CHECKLIST.md + GitHub Actions CI）

### やったこと
- `SECURITY_RELEASE_CHECKLIST.md` を作成（環境変数 / RLS / Engine API / Discord Bot / MCP / リリース前チェック / Supabase key漏洩対応手順）
- `.github/workflows/ci.yml` を作成（typecheck / test / build の3ジョブ、push & PR to main トリガー）
- ルート `package.json` の typecheck スクリプトは既に存在することを確認
- `pnpm typecheck` が全6パッケージで通ることを確認

### 判断したこと
- CIは typecheck / test / build を独立ジョブにして並列実行、いずれかが落ちればmergeを止める方針
- App buildは `NEXT_PUBLIC_ENGINE_URL` のダミー値で実行（CI環境でEngineを起動しないため）
- Webhook secret等のCI実行時に不要な秘密はジョブに渡さない
- セルフレビュー：CIファイルのpnpm/setup-node action versionは現行（v4）、ジョブが3つに分かれているため install が3回走る点はキャッシュで許容範囲

### 次にやること
- needs_review job 再実行導線
- json-rules-engine導入検討（Phase 2後半）

担当：Claude

---

## 2026-04-12 / Claude

### やったこと
- Discord Botの動作確認を完了した
- [CRITICAL] medini-api error reportedのEmbed通知がDiscordに届くことを確認した
- プライベートチャンネルへのBot追加が必要だったことを確認した

### 判断したこと
- チャンネルIDとBot権限の設定が正しければ通知が届く
- プライベートチャンネルの場合はBotをメンバーに追加する必要がある

### 次にやること
- SECURITY_RELEASE_CHECKLIST.md作成
- GitHub Actions CI設定

担当：Claude

---

## 2026-04-12 / Claude

### やったこと
- Discord Botをpackages/engine/src/discord/に実装した
- alert新規作成時にshouldNotify判定を経由してDiscord通知を結線した
- digest通知をDiscord.js経由に移行した（Bot未起動時はWebhook継続）
- allowlist未設定時はfail-closedにした
- Bot通知失敗時はdigest job自体をfailedにしない設計にした
- actions/service.tsを作成してapproveAction/denyActionを切り出した
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- Discord承認ボタンは補助手段（正式承認導線はCLI/App）
- BIONIC_DISCORD_APPROVER_IDS未設定時はfail-closed（全員拒否）
- Bot通知失敗はnotify_discord actionをfailedにしてjobはneeds_reviewにする
- sendApprovalNotificationの結線はpending_approval action実装時に追加する

### 未解決・既知リスク
- sendApprovalNotificationはpending_approval action生成時に結線が必要

### 次にやること
- Discord Botの動作確認

---

## 2026-04-12 / Claude Code（Digest Bot通知失敗時の状態分離）

### やったこと
- `jobs/researchDigest.ts`: Bot通知失敗を `misconfigured` に押し込まず `'failed'` のまま保持
- transport（`discord_bot` / `webhook`）を action の result/error に記録
- Bot通知失敗時: `notify_discord` action を `failAction`、`markJobNeedsReview(jobId)`、`run_research_digest` action は `result='bot_notify_failed'` で `completeAction` → 早期 return
- Webhook `misconfigured` の既存パス（job failed）は維持
- typecheck 全通過 / engine test 20/20 通過

### 判断したこと
- Bot通知失敗は一過性のネットワーク/Discord API 障害の可能性が高いため job 全体を failed にせず needs_review にして人間の確認を促す
- Webhook 未設定は構成ミスなので失敗状態を維持

### 未解決・既知リスク
- needs_review 状態の job を再実行する UI/CLI は未実装

### 次にやること
- needs_review job 再実行導線
- pending_approval を生成する action 設計

---

## 2026-04-12 / Claude Code（Discord Bot P1 finding修正）

### やったこと
- `discord/interactions.ts`: allowlist 未設定時は全員拒否（fail-closed）。メッセージで `BIONIC_DISCORD_APPROVER_IDS` 設定を促す
- `decisions/alerts.ts`: 新規alert作成成功時のみ `shouldNotify({kind:'alert_created'})` で判定し `sendAlertNotification` を非同期発火（update時は通知しない）
- `discord/notifications.ts` に `sendDigestNotification` を追加
- `jobs/researchDigest.ts`: Bot起動中は `sendDigestNotification` を使用、未起動時は既存 Webhook `notifyDigest` を使用
- typecheck 全通過 / engine test 20/20 通過

### 判断したこと
- pending_approval はまだ Engine 側で生成箇所がないため、`sendApprovalNotification` の結線は今回スキップ（Claude 確認事項として CURRENT.md に残す）
- alert_reminder は Scheduler 経由で将来実装（今回は `alert_created` のみ）
- Discord Bot 送信失敗は `misconfigured` にマッピングして既存の状態機械を壊さない
- 通知は `void` で発火してメイン処理を止めない

### 未解決・既知リスク
- `sendApprovalNotification` を呼び出す pending_approval 生成箇所の設計が未着手
- alert_reminder Scheduler 未実装

### 次にやること
- pending_approval を生成する action の設計（Level 2 承認導線）
- alert_reminder 用 Scheduler を追加

---

## 2026-04-12 / Claude Code（Discord Bot実装）

### やったこと
- `discord.js` を engine パッケージに追加
- `actions/service.ts` に `approveAction` / `denyAction` を実装（`status='pending_approval'` guard 付き atomic update）
- `discord/` 以下に client / embeds / notifications / interactions / index を実装
- `discord/notifications.ts`: alert/approval 送信と `last_notified_at` / `notification_count` 更新
- `discord/interactions.ts`: ボタン押下時の承認/却下、`BIONIC_DISCORD_APPROVER_IDS` allowlist
- `index.ts`: `BIONIC_DISCORD_BOT_TOKEN` 設定時のみ `startDiscordBot()` を起動（未設定時は Webhook モード継続のログ）
- `.env.example` に `BIONIC_DISCORD_BOT_TOKEN` / `BIONIC_DISCORD_CHANNEL_ID` / `BIONIC_DISCORD_APPROVER_IDS` を追記
- typecheck 全通過 / engine test 20/20 通過

### 判断したこと
- 承認導線の正本は CLI/App（Discord ボタンは補助手段）
- approve/deny は `.eq('status', 'pending_approval')` で atomic guard し、二重承認・race を防止
- Bot は Engine プロセス内で共存（MCP と違い別プロセス化しない）
- `ALLOWED_USER_IDS` 空の場合は全員許可（個人開発中の利便性優先・本番は allowlist 必須）

### 未解決・既知リスク
- sendAlertNotification / sendApprovalNotification の呼び出し結線（Decision 側）は次タスク
- Bot プロセス停止シグナル（SIGTERM）ハンドラは未実装

### 次にやること
- Alert/Approval 発火地点から Discord 通知を呼ぶ結線
- policies/notification を結線する

---

## 2026-04-12 / Claude

### やったこと
- Engineの実行責務分離を実施した
- jobs/runner.ts・jobs/repository.ts・jobs/types.tsを新規作成した
- runResearchDigestをroutes/jobs.tsからjobs/researchDigest.tsに移動した
- routes/jobs.tsをHTTP受付・validation・enqueue・runner起動のみに縮小した
- policies/notification.tsを実装した（quiet hours・alert_created・alert_reminder 30min・approval_stale 24h）
- policies/approval.tsを実装した（48h auto-cancel）
- engine_alertsにlast_notified_at・notification_countを追加した
- Codexレビュー完了・P1/P2 finding全修正済み

### 判断したこと
- Engineの責務分離はDiscord Bot実装前に必須と判断して先に実施した
- dedupeKeyは明示された場合のみ使用する（手動/MCP実行が週次dedupeでskipされるバグを修正）
- needs_reviewはcompleted_atを設定しない（中間状態のため）
- quiet hours環境変数は完全一致バリデーション付き
- 48h auto-cancelは通知ポリシーと分離してpolicies/approval.tsに置いた
- Discord BotはEngine内部からjobs/runner.tsを直接呼ぶ方針

### 未解決・既知リスク
- Discord Bot実装がまだ

### 次にやること
- Discord Bot実装

---

## 2026-04-12 / Claude Code（quiet hoursバリデーション強化）

### やったこと
- `policies/notification.ts#parseHour` に `^\d+$` 完全一致チェックを追加
- `'9abc'` のような `parseInt` で部分的にパースできてしまう値もデフォルトにフォールバック
- 範囲外・パース失敗でログメッセージを分離（`invalid hour value` / `hour out of range`）
- typecheck 全通過 / engine test 20/20 通過

### 判断したこと
- `parseInt('9abc', 10)` は `9` を返すため `isNaN` だけでは不足。正規表現で厳格化

### 未解決・既知リスク
- なし

### 次にやること
- Discord Bot 実装

---

## 2026-04-12 / Claude Code（Engine責務分離 finding修正）

### やったこと
- `routes/jobs.ts`: `dedupeKey` 未指定時は補完せず `undefined` のまま渡す
- `jobs/researchDigest.ts#enqueueResearchDigestJob`: `dedupeKey` を optional 化し、未指定時は insert payload から `dedupe_key` を除外
- `jobs/repository.ts#markJobNeedsReview`: `completed_at` を削除（中間状態）
- `policies/notification.ts#getQuietHoursConfig`: `parseHour` で 0-23 範囲バリデーションを追加し、不正値はデフォルトにフォールバック
- typecheck 全通過 / engine test 20/20 通過

### 判断したこと
- dedupe は caller（scheduler）側の責務。HTTP API は明示指定がなければ dedupe を強制しない
- needs_review は人間の確認待ち状態なので completed_at を打刻しない

### 未解決・既知リスク
- なし

### 次にやること
- Discord Bot 実装で policies/notification を結線

---

## 2026-04-12 / Claude Code（Engine責務分離 + 通知ポリシー）

### やったこと
- IDEAS.md確認: Discord Bot実装前の整理 / quiet hours / 承認stale / 通知優先度のアイデアを反映
- `packages/engine/src/jobs/` にrunner・repository・researchDigest・typesを集約
  - `jobs/types.ts`（EnqueueJobParams・JobExecutionResult）
  - `jobs/repository.ts`（markJobRunning/Completed/Failed/NeedsReview）
  - `jobs/researchDigest.ts` に `runResearchDigest` を移動し repository helper を利用
  - `jobs/runner.ts` で type dispatch
- `routes/jobs.ts` を HTTP受付・validation・enqueue・runner起動 のみに縮小
  - `RunJobResult` を `{ jobId, status, message }` に再設計
- scheduler の import を `runJob('research_digest', ...)` に変更
- `supabase/migrations/20260412000001_alert_notification.sql`（engine_alerts に last_notified_at / notification_count 追加）
- shared Alert 型に `lastNotifiedAt` / `notificationCount` 追加、routes/alerts.ts のマッピング更新
- `packages/engine/src/policies/notification.ts`（quiet hours・digest・alert_created・alert_reminder・approval_stale）
- `packages/engine/src/policies/approval.ts`（48h auto-cancel）
- typecheck 全通過 / engine test 20/20 通過

### 判断したこと
- `RunJobResult` を Job ラッパーから軽量な start/skipped 応答に変更（非同期起動に合わせる）
- Discord Bot から共通で使えるよう通知判断を純関数に分離
- quiet hours は `BIONIC_QUIET_HOURS_START/END/TIMEZONE` で設定、critical は例外で通す
- stale approval 閾値は 48h（IDEAS.md 24/48/72h のうち中央値を採用）

### 未解決・既知リスク
- Supabase への `20260412000001_alert_notification.sql` 手動適用が必要
- policies のユニットテストは未追加（Discord Bot 実装時に組み込み予定）

### 次にやること
- Discord Bot 実装で policies/notification を呼び出す結線
- policies のテスト追加

---

## 2026-04-12 / Claude

### やったこと
- bionic-ops MCPサーバーをpackages/mcpとして実装した
- Claude Desktop登録・動作確認を完了した
- 「Bionicのステータスを見せて」でEngine状態・アラート一覧を取得できることを確認した
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- approve_action/deny_actionはPhase 1.5では含めない（承認はCLI/Appで行う思想を維持）
- tool出力は英語（英語市場メイン）
- Claude Desktop設定はdocs/MCP.mdに記載
- WindowsのMSIXインストーラーでは設定ファイルのパスが異なる
  （%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\）

### 次にやること
- Discord Bot実装（Phase 2後半）

---

## 2026-04-12 / Claude Code（MCP P1 finding修正）

### やったこと
- `run_research_digest` のbodyに `requestedBy: 'mcp'` を追加
- `EventSource` 型に `'mcp'` を追加
- Engine `routes/jobs.ts` の `VALID_SOURCES` に `'mcp'` を追加
- `packages/mcp/tsconfig.json` に `"types": ["node"]` を追加
- typecheck/build 全成功、engine test 20/20 通過

### 判断したこと
- `EventSource` を共通型として拡張し、SDK/CLI/MCP/Engine 全てで一貫性を保つ

### 未解決・既知リスク
- なし

### 次にやること
- Codex 再レビュー
- Claude Desktop 設定で接続テスト

---

## 2026-04-12 / Claude Code

### やったこと
- bionic-ops MCPサーバーを `packages/mcp` として実装した
- 6ツール登録: `get_status` / `get_alerts` / `get_actions` / `get_events` / `get_research_items` / `run_research_digest`
- Engine HTTP API クライアント（`lib/engineClient.ts`）と format helper を実装
- StdioServerTransport で Claude Desktop から接続可能
- `docs/MCP.md` を作成（セットアップ手順・claude_desktop_config 例）
- pnpm install / typecheck / build 全成功

### 判断したこと
- MCPはSupabaseに直接接続せず、必ず Engine HTTP API を経由する（権限分離）
- 401時はBIONIC_ENGINE_TOKEN設定を促すメッセージ
- fetch失敗時はEngineオフライン判定し起動コマンドを案内
- pnpm-workspace.yaml は既に `packages/*` を含むため変更不要

### 未解決・既知リスク
- Codexレビュー未実施
- Claude Desktopでの接続実機テストは未実施

### 次にやること
- Claude Desktop 設定で接続テスト
- Codex レビュー

---

## 2026-04-12 / Claude

### やったこと
- Deploy→Watch→Alertの動作確認を完了した
- ngrok + curlでWebhook受信・署名検証・deployment保存を確認した
- Engineログで「deployment saved: dpl_test123 watching until ...」を確認した

### 判断したこと
- ngrok無料プランで動作確認は十分できた
- Vercel ProプランなしでもcurlでWebhookをシミュレートできる

### 次にやること
- bionic-ops MCPサーバー（packages/mcp として独立）

---

## 2026-04-12 / Claude

### やったこと
- Deploy→Watch→Alertを実装した
- deploymentsテーブルを作成した（RLS有効化済み）
- Vercel Webhook受信（HMAC-SHA1署名検証・raw body処理）を実装した
- 5分ごとのdeployment watch schedulerを追加した
- deployment_regression alertの生成を実装した
- Codexレビュー完了・P1/P2 finding全修正済み

### 判断したこと
- VERCEL_WEBHOOK_SECRET未設定時は常時401（開発中も例外なし）
- baselineは直前30分のerror件数
- alert判定は監視終了チェックより前に実行する
- alert作成済みの場合はcompleted更新をスキップする
- ngrokで動作確認する（無料プラン・URLは毎回変わる）

### 未解決・既知リスク
- ngrok動作確認はまだ未実施
- BIONIC_VERCEL_PROJECT_MAPの設定が必要

### 次にやること
- ngrokでトンネルを開いてVercel Webhookを設定して動作確認する

---

## 2026-04-12 / Claude Code（finding修正 #2）

### やったこと
- `createDeploymentRegressionAlert` の戻り値を boolean 化（alert作成有無を返す）
- `evaluateSingleDeployment` で alert作成時は completed 更新をスキップ（alerted→completed上書き競合の解消）
- vercel webhook: baseline count取得時の error を捕捉し失敗時は 500 を返す
- pnpm typecheck 全通過 / pnpm --filter @bionic/engine test 全20通過

### 判断したこと
- alerted は最終状態として保持する。次回ループでは `alreadyAlerted` で重複を防ぐため completed への遷移は不要

### 未解決・既知リスク
- なし

### 次にやること
- bionic-ops MCPサーバー（packages/mcp）

---

## 2026-04-12 / Claude Code（finding修正）

### やったこと
- Deploy→Watch→Alert P1/P2 finding 4件修正
  - vercel webhook: `VERCEL_WEBHOOK_SECRET` 未設定時は常時401（開発例外を撤去）
  - migration: `deployments` テーブルRLSを `enable` に変更
  - deploymentWatch: alert判定を監視終了チェックの前に移動（境界時点でも発火するように）
  - deploymentWatch: error count取得・update・alert後update のDBエラーを捕捉して `watch_status='failed'` に遷移
  - alert発火処理を `createDeploymentRegressionAlert` に切り出し
- 不要だった `evaluateAlertForEvent` / `EngineEvent` import削除
- pnpm typecheck 全通過 / pnpm --filter @bionic/engine test 全20通過

### 判断したこと
- secret未設定時に通すと本番混入リスクが大きすぎるため開発でも拒否する方針に統一
- alert後のdeployments update失敗時は alert は残したまま `failed` に遷移させ、次回ループで重複alertを生まないようにする

### 未解決・既知リスク
- 既存DBに対しては手動で `alter table public.deployments enable row level security;` を実行する必要がある

### 次にやること
- bionic-ops MCPサーバー（packages/mcp）

---

## 2026-04-12 / Claude Code

### やったこと
- Deploy→Watch→Alert実装
  - shared型: AlertType / ActionType拡張・DeploymentWatchStatus・Deployment追加
  - supabase/migrations/20260412000000_deployments.sql 作成
  - packages/engine/src/sources/vercel.ts 新規（payload正規化・project mapping）
  - packages/engine/src/routes/webhooks/vercel.ts 新規（HMAC SHA1検証・baseline集計・upsert）
  - packages/engine/src/decisions/deploymentWatch.ts 新規（5min cron評価・deployment_regression alert発火）
  - scheduler/index.ts に */5 cronを追加
  - index.tsで `/api/webhooks/vercel` をengineAuthMiddlewareより前にraw bodyでmount
  - .env.exampleにVERCEL_WEBHOOK_SECRET / BIONIC_VERCEL_PROJECT_MAP追加
- pnpm typecheck 全通過
- pnpm --filter @bionic/engine test 全20テスト通過

### 判断したこと
- IDEAS.md確認：Deploy→Watch→Alertのアイデアはタスク仕様に既に反映済み。追加変更なし
- syntheticEvent / evaluateAlertForEvent はspecどおり残しつつ未使用警告を出さないよう `void` で吸収
- baselineは直前30分のerror件数を採用、watch期間は30分

### 未解決・既知リスク
- Supabase本番への migration適用は手動SQL Editorで実施が必要
- ngrokでのローカル受信動作確認は別途実施
- VERCEL_WEBHOOK_SECRET未設定時は署名検証スキップ（開発時のみ許可）

### 次にやること
- Supabaseに 20260412000000_deployments.sql を適用する
- Vercelプロジェクト側でWebhook設定 + ngrok起動
- bionic-ops MCPサーバー（packages/mcp）

---

## 書き方

```markdown
## YYYY-MM-DD / [担当]

### やったこと
- 

### 判断したこと
- 

### 未解決・既知リスク
- 

### 次にやること
- 
```

---

## 2026-04-08 / Claude

### やったこと
- Bionicプロジェクトの全体設計を決定した
- 以下のmdを作成した
  - AGENTS.md
  - CLAUDE.md
  - SKILLS.md
  - docs/AUTOMATION.md
  - CURRENT.md
  - WORK_LOG.md
  - docs/BIONIC_PRODUCT.md（v2）
  - docs/TECHNICAL_DESIGN.md
  - HANDOFF.md

### 判断したこと
- 製品名：Bionic（仮称）、本体ランナー：Bionic Engine
- 思想としての「OS」は内部メモに留める
- repoフォルダ名：bionic（スペースなし）
- 構成：apps / packages / docs / scripts / infra / research の6フォルダ
- 技術スタック：TypeScript / Node.js / Next.js / Supabase / GitHub Actions / Vercel Cron
- 通信方式：local HTTP（transport-agnostic service interface）
- job状態：6つ（pending / running / completed / failed / needs_review / cancelled）
- resolution_reason：別カラムで持つ
- event命名：suffixで統一
- Electronは「予定・候補」として未確定
- マルチテナント：single-tenant first, multi-tenant ready。将来の製品化に備えて今は project_id / service_id を持つ
- Phase 0（手動）から始めてPhase 1（通知自動化）へ進む
- 完全自動化はしない。人間が止められる中間点を必ず置く
- AIは補助。ルールベースが主体

### 未解決・既知リスク
- リサーチエンジンとコピペ自動化、どちらを先に実装するか未確定
- Mediniとの接続タイミング未確定
- Phase 0では手動コピペが残る

### 次にやること
- Ubuntu作業環境にも bionic フォルダを作成する
- pnpm workspaceを初期化する
- GitHubにpushする
- shared型定義を作成する

---

## 2026-04-09 / Codex

### やったこと
- Windows側の `bionic` ルートフォルダを作成した
- 6フォルダ構成を作成した
- 初期の運用文書・製品文書・技術文書の雛形を配置した
- AGENTS.md / SKILLS.md / docs/AUTOMATION.md / CURRENT.md を、合意した内容に沿って更新した
- WORK_LOG.md / docs/TECHNICAL_DESIGN.md / HANDOFF.md を、実態に合わせて更新した

### 判断したこと
- repo名・フォルダ名は `Bionic OS` ではなく `bionic` に統一する
- 自動化フローは AGENTS.md では概要のみ持ち、詳細は docs/AUTOMATION.md に分離する
- `CURRENT.md` は人間向け正本、`engine_jobs` は機械向け実行キューとして役割分離する

### 未解決・既知リスク
- Ubuntu作業環境側の repo 初期化はまだ未着手
- GitHub への push はまだ未着手
- `CLAUDE.md` はまだ最終文面への更新余地がある

### 次にやること
- Ubuntu作業環境に同じ構成を作成する
- pnpm workspace を初期化する
- `shared` 型の最小定義を切る

---

## 2026-04-09 / Claude Code

### やったこと
- Ubuntu作業環境（~/bionic）にフォルダ構成を作成した（apps/app, packages/shared/engine/sdk/cli, docs, scripts, infra, research）
- Windows側の既存md 10ファイルをUbuntu側に配置した
- pnpm workspace を初期化した（pnpm-workspace.yaml + ルートpackage.json）
- TypeScript 6.0.2 をインストールした
- ルート tsconfig.json + packages/shared/tsconfig.json を作成した
- packages/shared/src/types.ts に TECHNICAL_DESIGN.md に基づく型定義を作成した
  - EngineEvent, JobStatus, ResolutionReason, EngineJob, DecisionResult, EngineAction, ServiceStatus, Alert, BionicEngineService
- packages/shared/src/index.ts でre-exportした
- `pnpm typecheck` がエラーなく通ることを確認した
- git init → commit → push 完了

### 判断したこと
- 型定義は依頼仕様書の通りに作成。TECHNICAL_DESIGN.md の設計と一致していることを確認
- docs/BIONIC_PRODUCT.md と docs/TECHNICAL_DESIGN.md は内容を変更せずにコピーした

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1 手順3: service interface と local HTTP API の最小仕様

---

## 2026-04-09 / Claude Code（2回目）

### やったこと
- CURRENT.md を最新の状態に更新した
  - 完了済みセクションにrepo初期化・shared型定義を追加
  - 進行中セクションにservice interface /refine待ちを追加
  - 実装優先順序・Medini接続タイミングの確定事項を追加
  - Open Questionsを整理（要Claude確認→なし、要Codex確認→API仕様2件）

### 判断したこと
- CURRENT.md の内容はClaude（チャット側）からの指示通りに上書きした

### 未解決・既知リスク
- なし

### 次にやること
- Codex /refine の結果を待つ

---

## 2026-04-09 / Claude Code（3回目）

### やったこと
- packages/shared/src/types.ts を新しい型定義で上書きした（BionicEngineService, EngineEvent, ServiceStatus, Alert, Job 等）
- packages/engine パッケージを新規作成した
  - Express HTTPサーバー（ポート3001）
  - 4エンドポイント実装: POST /api/events, GET /api/status, GET /api/alerts, POST /api/jobs
- `pnpm typecheck` がshared・engine両方でエラーなく通ることを確認した
- 4エンドポイント全てでcurlレスポンスを確認した
  - POST /api/events → 202 {accepted: true, eventId}
  - GET /api/status → 200 {engine, queue, alerts, lastEventAt}
  - GET /api/alerts → 200 {alerts: []}
  - POST /api/jobs → 202 {job: {id, type, status, ...}}

### 判断したこと
- データはインメモリのみ（指示通り、DB保存は次ステップ）
- import パスに .js 拡張子を付与（NodeNext moduleResolution の要件）
- express のバージョンは pnpm resolve に任せた（^4.18.2 指定）

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1 手順5: SDK最小実装（health/error/usage）
- Phase 1 手順6: engine_eventsをDBに保存

---

## 2026-04-09 / Claude Code（4回目）

### やったこと
- Codex P1 finding 2件を修正した
  - events.ts: EngineEventの全必須フィールド（id, projectId, serviceId, type, occurredAt, source, payload）を検証するよう拡張
  - jobs.ts: requestedByの存在チェックとEventSource値のバリデーションを追加
- `pnpm typecheck` がエラーなく通ることを確認した
- curlで5パターンのテストを実施し全て期待通りの結果を確認した

### 判断したこと
- P2 finding（status.ts / alerts.ts）は指示通り今回触らない
- VALID_SOURCESはルートハンドラ内にローカル定義（共通化は将来必要時に）

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1 手順5: SDK最小実装（health/error/usage）
- Phase 1 手順6: engine_eventsをDBに保存

---

## 2026-04-09 / Claude Code（5回目）

### やったこと
- Codex P1 finding 2件を修正した（events.ts バリデーション強化）
  - EventType許可リスト検証を追加（不明なtypeは400）
  - EventSource許可リスト検証を追加（不明なsourceは400）
  - payload型検証を追加（null・配列・非オブジェクトは400）
- `pnpm typecheck` エラーなし確認
- curl 5パターンで全て期待通りの結果を確認

### 判断したこと
- VALID_EVENT_TYPES / VALID_SOURCESはモジュールスコープに定義（リクエストごとの再生成を回避）

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1 手順5: SDK最小実装（health/error/usage）
- Phase 1 手順6: engine_eventsをDBに保存

---

## 2026-04-09 / Claude

### やったこと
- service interface・local HTTP API仕様をCodexと確定した
- Phase 1 API 4エンドポイントをClaude Codeで実装した
- Codexレビューで出たP1 finding 3件を全修正した
- Windows側でgit cloneしてCodexのレビュー環境を整備した

### 判断したこと
- approveAction / retryAction はPhase 2まで実装しない
- runJobはresearch_digestのみ。alert_evaluationは同期処理
- payload は当面 Record<string, unknown>
- P2 finding（status.ts / alerts.ts）はDB導入時に対応する

### 未解決・既知リスク
- status.tsのstartedAtはDB導入時に修正する
- alerts.tsのフィルターはDB導入時に実装する

### 次にやること
- engine_eventsをSupabaseに保存する

---

## 2026-04-09 / Claude Code（6回目）

### やったこと
- Supabase接続を実装した（TECHNICAL_DESIGN.md 実装順序⑥）
  - .env.local にSupabase接続情報を配置（.gitignore済み）
  - @supabase/supabase-js をengineパッケージに追加
  - packages/engine/src/lib/supabase.ts にクライアントを作成
  - packages/engine/src/routes/events.ts にSupabase insert処理を追加
  - engine_events テーブル作成SQL を出力（手動実行待ち）
- `pnpm typecheck` エラーなし確認

### 判断したこと
- EngineEventのcamelCaseフィールドをDB側のsnake_caseカラムにマッピングした
- insert失敗時は500を返し、console.errorでログ出力する
- テーブル作成SQLはClaude Codeから直接実行できないため出力のみ

### 未解決・既知リスク
- engine_eventsテーブルがSupabase上にまだ作成されていない（SQL手動実行待ち）
- RLSポリシー未設定（anon keyではinsertがRLSでブロックされる可能性あり）

### 次にやること
- Supabase SQL Editorでテーブル作成SQLを実行する
- RLSポリシーを設定する
- curlで実際のDB保存を確認する
- Phase 1 手順5: SDK最小実装（health/error/usage）

---

## 2026-04-09 / Claude Code（7回目）

### やったこと
- dotenvを導入し、.env.local自動読み込みを実装した
  - devスクリプトを `DOTENV_CONFIG_PATH=../../.env.local tsx watch --require dotenv/config src/index.ts` に変更
  - `--require dotenv/config` でESM import解決前に環境変数をロード
  - index.tsへのdotenv importは不要（preload方式のため）
- `pnpm typecheck` エラーなし確認
- `pnpm --filter @bionic/engine dev` だけで起動→Supabase保存成功を確認

### 判断したこと
- コード内でdotenv.config()を呼ぶ方式はESMのimport hoistingにより失敗するため、`--require`によるpreload方式を採用
- DOTENV_CONFIG_PATHでモノレポルートの.env.localを相対パス指定（`../../.env.local`）

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1 手順5: SDK最小実装（health/error/usage）

---

## 2026-04-09 / Claude Code（8回目）

### やったこと
- Codex P1 finding 2件を修正した
  - supabase.ts: anon key → service_role key に切り替え、auth設定を追加
  - events.ts: insert時のidフィールドをclient_event_idに変更（DB側でuuid自動生成）
  - .env.local にSUPABASE_SERVICE_ROLE_KEYを追加
  - engine_eventsテーブル変更SQLを出力（手動実行待ち）
- `pnpm typecheck` エラーなし確認

### 判断したこと
- service_role keyはRLSをバイパスするため、サーバーサイド専用の設定（autoRefreshToken: false, persistSession: false）を付与
- idカラムはtext型のまま、gen_random_uuid()::textでデフォルト値を設定する方針

### 未解決・既知リスク
- engine_eventsテーブルのスキーマ変更SQL未実行（手動実行待ち）

### 次にやること
- Supabase SQL Editorでスキーマ変更SQLを実行する
- Phase 1 手順5: SDK最小実装（health/error/usage）

---

## 2026-04-10 / Claude

### やったこと
- engine_eventsのSupabase保存処理を実装した
- dotenvをpreload方式で導入した
- service_role keyに切り替えた
- client_event_idを導入しDB側でuuidを自動生成する設計にした
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- anon keyではなくservice_role keyをEngine側で使う
- 呼び出し元のIDはclient_event_idとして保存、DBのidはgen_random_uuid()で自動生成
- RLSは開発中は無効。本番前に有効化する

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- engine_jobs / engine_alerts / research_items はまだ未実装

### 次にやること
- engine_jobs / engine_alerts / research_items テーブルの作成と保存処理

---

## 2026-04-10 / Claude Code（9回目）

### やったこと
- jobs.ts: POST /api/jobsでengine_jobsテーブルにinsert、.select().single()でDB生成値を返却
- alerts.ts: GET /api/alertsでengine_alertsテーブルからselect、status/severity/limitフィルター対応
- status.ts: GET /api/statusでengine_jobs/engine_alerts/engine_eventsから集計（Promise.all並列）、ENGINE_START_TIMEをモジュールスコープで保持
- `pnpm typecheck` エラーなし確認

### 判断したこと
- jobs.tsのproject_idはinput.projectId ?? 'default'でフォールバック（型定義でoptionalのため）
- status.tsのstartedAtはモジュールスコープの定数で保持（プロセス起動時刻を正しく返す）
- alerts.tsのsnake_case→camelCase変換をmap内で実施

### 未解決・既知リスク
- なし

### 次にやること
- 動作確認（curl テスト）
- Phase 1 手順5: SDK最小実装（health/error/usage）

---

## 2026-04-10 / Claude Code（10回目）

### やったこと
- status.tsにDB障害検知を追加（Codex P1 finding修正）
  - Promise.allの3クエリのいずれかがエラーを返した場合に503を返す
  - console.errorで各クエリのエラー詳細をログ出力
- `pnpm typecheck` エラーなし確認
- 動作確認: 正常時200、不正URL時503を確認済み

### 判断したこと
- エラーチェックはデータ集計の前に配置（早期リターン）
- 503 Service Unavailableが適切（DBが利用不可）

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1 手順5: SDK最小実装（health/error/usage）

---

## 2026-04-10 / Claude（2回目）

### やったこと
- engine_jobs / engine_alerts / research_items テーブルをSupabaseに作成した
- POST /api/jobs でDBにjobを保存する処理を実装した
- GET /api/alerts でDBからalertを取得する処理を実装した
- GET /api/status でDB集計・lastEventAtを実装した
- GET /api/status のDB障害時503対応を実装した
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- status.tsはDB障害を503で正直に報告する。ゼロ値で誤魔化さない

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- research_itemsの保存処理はSDK実装後に追加する

### 次にやること
- SDK最小実装（@bionic/sdk: health / error / usage の3メソッド）

---

## 2026-04-10 / Claude Code（11回目）

### やったこと
- @bionic/sdk パッケージを新規作成した
  - packages/sdk/package.json, tsconfig.json
  - packages/sdk/src/client.ts — BionicClientクラス（health/error/usage 3メソッド）
  - packages/sdk/src/index.ts — re-export
- `pnpm typecheck` が shared + engine + sdk 全3パッケージでエラーなし確認

### 判断したこと
- fetchはNode.js 18以上の標準APIを使用（外部依存追加なし）
- イベントIDは `evt_{timestamp}_{random}` 形式で生成（DB側でuuidも自動生成される）
- health()はstatusが'ok'なら'service.health.reported'、それ以外は'service.health.degraded'を送信
- sourceはデフォルト'sdk'、コンストラクタで変更可能

### 未解決・既知リスク
- なし

### 次にやること
- SDKの動作確認（Engine起動→SDK経由でイベント送信→Supabase確認）
- Medini接続準備

---

## 2026-04-10 / Claude Code（12回目）

### やったこと
- Codex P1 finding修正: SDK package.jsonのmain/typesをdist/配下に変更
- tsconfig.jsonにdeclaration: trueを追加（.d.ts生成に必要）
- `pnpm typecheck` エラーなし、`pnpm --filter @bionic/sdk build` 成功確認
- dist/index.js, dist/index.d.ts の生成を確認

### 判断したこと
- declaration: trueがないと.d.tsが生成されないため追加した

### 未解決・既知リスク
- なし

### 次にやること
- SDKの動作確認（Engine起動→SDK経由でイベント送信→Supabase確認）

---

## 2026-04-10 / Claude（3回目）

### やったこと
- @bionic/sdk を実装した（health / error / usage の3メソッド）
- SDK package entrypointをdist/配下に修正した
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- SDKはfetchのみ使用。外部依存なし
- entrypointはdist/index.js・dist/index.d.tsを正本とする

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要

### 次にやること
- App 3画面実装（Dashboard / Alerts / Research）

---

## 2026-04-10 / Claude Code（13回目）

### やったこと
- apps/app を Next.js 14 App Routerで新規作成した
  - Dashboard画面（/）: GET /api/status の内容を表示
  - Alerts画面（/alerts）: GET /api/alerts の内容を表示
  - Research画面（/research）: 準備中プレースホルダー
  - src/lib/engine.ts: Engine APIクライアント（getStatus, getAlerts）
  - layout.tsx: ナビゲーション付きレイアウト
- `pnpm --filter @bionic/app build` 成功、`pnpm --filter @bionic/app typecheck` エラーなし
- .gitignoreに.next/を追加

### 判断したこと
- Next.js 14はnext.config.tsをサポートしないため、next.config.mjsを使用
- Server ComponentからEngine APIをfetchで直接呼び出し（cache: 'no-store'）
- Engine未起動時はnullを返してフォールバックUIを表示

### 未解決・既知リスク
- なし

### 次にやること
- 動作確認（Engine起動→App起動→画面表示確認）
- Medini接続準備

---

## 2026-04-10 / Claude（4回目）

### やったこと
- apps/app を Next.js App Router で作成した
- Dashboard / Alerts / Research の3画面を実装した
- EngineURLをNEXT_PUBLIC_ENGINE_URLで環境変数管理する設計にした
- Codexレビュー完了・問題なし

### 判断したこと
- Engine未起動時は画面内に「Engineが起動していません」と表示する
- ResearchページはPhase 1ではstub
- Vercel配備は将来の選択肢として残す。Phase 1はローカル運用

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- GET /api/research はPhase 2で追加する

### 次にやること
- MediniへのSDK組み込み

---

## 2026-04-10 / Claude Code（14回目）

### やったこと
- MediniにBionic SDKを組み込んだ
  - @bionic/sdk と @bionic/shared を file:参照でインストール
  - src/lib/bionic.ts を新規作成（sendHealth/sendError/sendUsage）
  - with-auth.ts に sendHealth('ok') / sendError() を追加（fireforget）
  - plan.ts の incrementUsage() に sendUsage() を追加（fireforget）
  - .env.local にBIONIC_ENGINE_URL/PROJECT_ID/SERVICE_IDを追加
- pnpm build がMediniで成功（既存動作を壊さない）

### 判断したこと
- workspace:*参照はMonorepo外では解決できないため、pnpm overridesで@bionic/sharedをfile:参照にオーバーライドした
- sendHealth/sendError/sendUsageはvoidでfireforget呼び出し（Mediniのレスポンスをブロックしない）
- 環境変数がない場合はbionicクライアントがnullになり何も送らない設計

### 未解決・既知リスク
- Mediniのgit commitは未実施（指示通り）

### 次にやること
- 動作確認（Engine + Medini起動→health event送信→Supabase確認）

---

## 2026-04-10 / Claude Code（15回目）

### やったこと
- with-auth.ts のsendError送信条件を修正した（Codex P1 finding）
  - 認証エラー（Unauthorized/Forbidden/認証）はsendErrorをスキップ
  - 予期しない例外（DB接続失敗等）のみsendErrorを送信
- pnpm build がMediniで成功確認

### 判断したこと
- catch節に到達するのは基本的に予期しない例外のみだが、Supabase auth.getUser()がthrowする可能性を考慮してフィルタを追加

### 未解決・既知リスク
- Mediniのgit commitは未実施（指示通り）

### 次にやること
- CURRENT.md / WORK_LOG.md の更新

---

## 2026-04-10 / Claude Code（16回目）

### やったこと
- with-auth.ts のisAuthError判定を削除した（Codex P1 finding）
  - catch節で無条件にsendErrorを呼ぶよう簡素化
- pnpm build がMediniで成功確認

### 判断したこと
- with-auth.tsの構造上、認証失敗はtry内でreturnされるためcatch節に到達しない。isAuthError判定は不要

### 未解決・既知リスク
- Mediniのgit commitは未実施（指示通り）

### 次にやること
- CURRENT.md / WORK_LOG.md の更新

---

## 2026-04-10 / Claude（5回目）

### やったこと
- MediniにBionic SDKをfile:参照で組み込んだ
- with-auth.ts にhealth / error を組み込んだ
- plan.ts にusage を組み込んだ
- sendError送信条件を修正した（isAuthError削除・catch節で無条件送信）
- Codexレビュー完了・P1 finding全修正済み
- Phase 1成功条件「MediniがSDK経由でhealth eventを送れる」を達成した

### 判断したこと
- with-auth.tsのcatch節に到達する時点で全て予期しない例外なのでisAuthError判定は不要
- sendHealth('ok')の位置はhandler実行前で概念的に正しい（認証レイヤーが生きているという意味）

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- sendHealth('ok')の位置についてはPhase 2で再検討余地あり

### 次にやること
- Phase 1の成功条件を全て確認する（/ship判断）

---

## 2026-04-10 / Claude Code（17回目）

### やったこと
- research digest Discord通知処理を実装した
  - packages/engine/src/actions/notify.ts — Discord webhook通知（将来差し替え可能な構造）
  - packages/engine/src/routes/jobs.ts — research_digest job起動時にdigest処理を非同期実行
  - job状態遷移: pending → running → completed/failed
  - research_itemsのis_digest_sentフラグを更新
  - .env.local にDISCORD_WEBHOOK_URLを追加
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- digest処理はvoidで非同期実行（APIレスポンスをブロックしない）
- 通知先はDiscord webhook。notify.tsに閉じ込めて将来Slack等に差し替え可能
- 未送信アイテムをimportance_score降順で最大10件取得

### 未解決・既知リスク
- research_itemsにテストデータがまだない（SQL手動実行待ち）

### 次にやること
- テストデータ挿入→digest動作確認
- Phase 1成功条件の全体確認

---

## 2026-04-10 / Claude Code（18回目）

### やったこと
- Codex finding 2件を修正した
  - notify.ts: notifyDigest()がbooleanを返すよう変更、3件上限、2000文字切り詰め
  - jobs.ts: sent===trueの時だけis_digest_sentを更新、limit 10→3
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- DISCORD_WEBHOOK_URL未設定時はfalseを返し、呼び出し元でis_digest_sent更新をスキップ
- digest件数は3件に絞り、省略数を「他X件は省略」で表示

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1成功条件の全体確認

---

## 2026-04-10 / Claude Code（19回目）

### やったこと
- digest job完了条件を修正した（Codex P1 finding）
  - notifyDigest()の戻り値を boolean → 'sent' | 'skipped' | 'misconfigured' に変更
  - misconfigured時はjob status = failed、sent/skipped時はcompleted
  - is_digest_sent更新はresult === 'sent'の時だけ
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- アイテムゼロ（skipped）は正常完了。Webhook未設定（misconfigured）は設定不備なのでfailed

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1成功条件の全体確認

---

## 2026-04-10 / Claude（6回目）

### やったこと
- research digest Discord通知を実装した
- digest件数を3件に絞った
- 2000文字超過時の切り詰め処理を実装した
- NotifyResult型（sent/skipped/misconfigured）を導入した
- Webhook未設定時はjob failedとして扱う実装にした
- Codexレビュー完了・P1 finding全修正済み
- Phase 1成功条件全て達成を確認した

### 判断したこと
- digest件数は上位3件（importance_score降順）
- アイテムゼロはcompleted・Webhook未設定はfailed
- is_digest_sentの更新はresult === 'sent'の時だけ

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- リサーチ収集処理（どこから情報を取ってくるか）は未実装

### 次にやること
- リサーチ収集処理の設計

---

## 2026-04-10 / Claude Code（20回目）

### やったこと
- GET /api/research と POST /api/research を実装した
  - packages/shared/src/types.ts にResearchItem関連型を追加
  - packages/engine/src/routes/research.ts を新規作成
  - packages/engine/src/index.ts にresearchRouterを追加
- research_itemsテーブルにcategoryカラム追加SQLを出力
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- GET: importance_score降順、category/is_digest_sent/limitフィルター対応
- POST: title/summary/importanceScore必須、importanceScore 0-100バリデーション
- snake_case↔camelCase変換はrouter内で実施

### 未解決・既知リスク
- research_itemsテーブルにcategoryカラムが未追加（SQL手動実行待ち）

### 次にやること
- categoryカラム追加SQLをSupabaseで実行
- Research画面をAPIに接続する

---

## 2026-04-10 / Claude（7回目）

### やったこと
- Research API（GET/POST /api/research）を実装した
- shared型にResearchItem関連の型を追加した
- research_itemsにcategoryカラムを追加した

### 判断したこと
- summaryのみ（contentなし）
- 手動保存もdigest対象に含める（is_digest_sent: false）
- categoryフィールドを持つ
- リサーチ収集は自動収集ではなく手動保存＋閲覧に方針転換した
- チャット内蔵・Electron化は将来のタスクとしてIDEAS.mdに記録する

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- チャット内蔵・Electron化は将来検討

### 次にやること
- Codex /review（Research API）
- Bionic App Research画面実装（保存フォーム + 一覧表示）

---

## 2026-04-11 / Claude Code（21回目）

### やったこと
- Codex Research APIレビューのfinding 2件を修正した
  - P1: GET /api/research にproject_idフィルタを追加（projectIdクエリパラメータ、省略時は'default'）
  - P2: CreateResearchItemInputのprojectIdをオプショナル化（省略時はEngine側で'default'を使用）
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- GET側のprojectIdフォールバックをPOST側（既存の`input.projectId ?? 'default'`）と同じ'default'に統一
- projectIdがクエリパラメータに含まれない場合でも必ずproject_idフィルタが適用される設計

### 未解決・既知リスク
- なし

### 次にやること
- Bionic App Research画面実装（保存フォーム + 一覧表示）

---

## 2026-04-11 / Claude Code（22回目）

### やったこと
- Bionic App Research画面を実装した
  - apps/app/src/lib/engine.ts にgetResearchItems/createResearchItemを追加
  - apps/app/src/app/research/actions.ts を新規作成（Server Action）
  - apps/app/src/app/research/page.tsx を保存フォーム+一覧表示に実装
- `pnpm typecheck` 全4パッケージでエラーなし確認
- `pnpm --filter @bionic/app build` 成功確認

### 判断したこと
- Server Actionの戻り値をvoidにした（Next.js 14のform action型制約: `(formData: FormData) => void | Promise<void>`）
- revalidatePath('/research')で保存後の一覧自動更新を実現
- projectIdは'project_bionic'をハードコード（現時点でマルチプロジェクト切替UIは不要）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（Research画面）

---

## 2026-04-11 / Claude Code（23回目）

### やったこと
- P1 finding修正: Engine未起動時にフォームを非表示にした
  - resultがnullの場合は早期リターンで「Engineが起動していません」メッセージのみ表示
  - Engine起動時のみフォームと一覧を表示する構造に変更
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- early returnパターンを採用（nullチェック後にフォーム+一覧を表示）
- 一覧部分の`!result`分岐も不要になったため削除（early returnでnullが除外済み）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（Research画面・再レビュー）

---

## 2026-04-11 / Claude

### やったこと
- Research画面を実装した（保存フォーム + 一覧表示）
- Engine未起動時にフォームを非表示にした
- Codexレビュー完了・P1 finding全修正済み
- IDEAS.mdにDiscord Bot統合アイデアを追加した

### 判断したこと
- Engine未起動時はフォームを非表示にする（データ消失防止）
- Server ActionはNext.js 14の型制約によりvoid返却に変更

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- Server Actionのエラーハンドリングは将来Client Component化で対応

### 次にやること
- Bionic App のUI改善（TailwindCSS導入）

---

## 2026-04-11 / Claude

### やったこと
- 外部リサーチを2回実施した（個人開発者向けopsエンジン・AI市場・競合・セキュリティ・技術アーキテクチャ）
- CodexによるBionic Engine現状整理・候補評価を実施した
- リサーチとCodex分析を統合してPhase 2方針を確定した

### 判断したこと
- Bionicの存在意義：競合はセッションベース＋LLM推論コストあり。BionicはローカルルールベースでコストO
- Discord Botは早すぎる。現状Webhook通知で十分。Phase 2後半に移動
- RLSを後回しにしすぎていた。本番前ゲートとして設計を早めに固める
- json-rules-engineは段階的に導入。最初は最小Decisionから始める
- MCPサーバーはpackages/mcpとして独立させる（Engine内に混在させない）
- project_bionic / default 混在はScheduler前に整理が必要
- node-cronはGitHub Actions Cronより信頼性が高い（GH Actionsは15〜60分遅延あり）
- better-sqlite3は将来のローカルファースト対応として温存。今はSupabaseのみ
- ターゲットは英語市場（一次）/ 日本（二次）
- 将来は個人＋小チーム（2〜5人）対応を見越した設計

### 未解決・既知リスク
- engine_alertsの重複防止fingerprint設計が未確定
- project_bionic / default 混在の整理タイミング
- RLS設計の具体化

### 次にやること
- Event → Alert 最小Decisionの実装（Codexに/refineを依頼）

---

## 2026-04-11 / Claude Code（24回目）

### やったこと
- Event → Alert 最小Decisionを実装した（Decision Layer初実装）
  - packages/shared/src/types.ts: Alert型にservice_error / fingerprint / count / lastSeenAtを追加
  - packages/engine/src/decisions/alerts.ts を新規作成（evaluateAlertForEvent）
  - packages/engine/src/routes/events.ts にvoid evaluateAlertForEvent(e)を追加
  - packages/engine/src/routes/alerts.ts のレスポンスマッピングを更新
- engine_alertsテーブルのスキーマ変更SQLを出力した（手動実行待ち）
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- evaluateAlertForEventはvoidで呼ぶ（event captureのレスポンスタイムをブロックしない）
- fingerprint設計: `{projectId}:{serviceId}:{alertType}:{normalizedKey}` の4要素
- 重複alertはcountをインクリメント、last_seen_atを更新
- CRITICAL_CODES（DB_ERROR, PAYMENT_FAILED等）は'critical'、それ以外は'warning'
- Decision失敗はconsole.errorで記録するがevent captureは202を返す

### 未解決・既知リスク
- engine_alertsテーブルのスキーマ変更SQL未実行（手動実行待ち）

### 次にやること
- Supabase SQL Editorでスキーマ変更SQLを実行する
- curlで動作確認（service.health.degraded → alert生成）

---

## 2026-04-11 / Claude Code（25回目）

### やったこと
- Codex P1 finding 2件を修正した（decisions/alerts.ts）
  - select / update / insert の全てで{ error }を確認してconsole.errorでログ出力
  - insertでconflict error（23505）が返った場合はconsole.warnでスキップ（race condition対応）
  - selectエラー時は早期returnで後続処理を実行しない
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- upsertではなくselect→update/insertの2ステップを維持（partial unique indexとの相性問題を回避）
- 23505はwarnレベル（データ不整合ではなく正常な競合回避）
- selectエラー時はreturn（後続のinsertで不整合が起きるのを防止）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（decisions/alerts.ts）

---

## 2026-04-11 / Claude Code（26回目）

### やったこと
- supabase/migrations/フォルダを作成し、これまでの全DB変更をmigrationファイルとして記録した
  - 20260408000000_initial_schema.sql: engine_events / engine_jobs / engine_alerts / research_items の初期スキーマ
  - 20260409000000_add_columns.sql: categoryカラム追加 / client_event_idデフォルト値
  - 20260411000000_alert_dedup.sql: fingerprint / count / last_seen_at / partial unique index
- supabase/migrations/README.md にmigration管理方針と適用済み一覧を記録した

### 判断したこと
- Supabase CLIは今は使わず手動SQL Editor適用（migration管理はファイルベース）
- 既存DBには適用済みのためSQLは実行不要（リポジトリへの記録が目的）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（migrations）

---

## 2026-04-11 / Claude Code（27回目）

### やったこと
- research_items.sourceカラムにDEFAULT 'manual'を追加した（migration修正）
- Supabase適用用SQLを出力した（手動実行待ち）
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- sourceカラムがnot nullだがAPIでinsertしていないため、DEFAULT 'manual'で手動保存を表現

### 未解決・既知リスク
- Supabaseへの`alter column source set default 'manual'`が未実行（手動実行待ち）

### 次にやること
- Supabase SQL EditorでDEFAULT変更SQLを実行する

---

## 2026-04-11 / Claude Code（28回目）

### やったこと
- research_items.source DEFAULT 'manual'のmigration記録を追加した
  - supabase/migrations/20260411000001_research_source_default.sql を作成
  - supabase/migrations/README.md の適用済みテーブルを更新

### 判断したこと
- Supabaseに適用済みのためSQLは再実行不要（リポジトリへの記録が目的）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review

---

## 2026-04-11 / Claude

### やったこと
- Event → Alert 最小Decision Layerを実装した（decisions/alerts.ts）
- Alert.typeにservice_errorを追加した
- fingerprintによる重複防止を実装した
- race condition対応（23505エラーハンドリング）を実装した
- supabase/migrationsを整備してDB変更の再現性を確保した
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- evaluateAlertForEventはvoid呼び出し（event captureをDecision失敗でブロックしない）
- service.error.reportedのseverityはcode有無で判定（全criticalより精度が高い）
- research_items.sourceはDEFAULT 'manual'（手動保存のデフォルト値）
- migration管理はsupabase/migrations/に記録する運用を確立した

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- GitHub ActionsでCI（typecheck/build）を必須化していない
- SECURITY_RELEASE_CHECKLIST.mdがまだない
- project_bionic / default 混在はScheduler前に整理が必要

### 次にやること
- Scheduler実装（node-cronでweekly digest自動実行）

---

## 2026-04-11 / Claude（設計思想更新）

### やったこと
- Bionicの設計思想を3フェーズに更新した
- BIONIC_PRODUCT.mdを全面更新した
- TECHNICAL_DESIGN.mdの設計原則を更新した
- 自動実行OK・承認必須・永遠に自動化しないの3段階を定義した
- engine_actionsをPhase 1.5として前倒しすることを決定した
- 承認フローのUX原則を確定した（Discord=気づき / CLI/App=承認）
- criticalアラートの2回通知仕様を確定した
- stale approval（24h再通知・48h自動キャンセル）を確定した

### 判断したこと
- タイムアウト承認は採用しない
- 信頼スコアは最初は表示・提案のみ。権限変更は人間が明示的に設定
- セキュリティ関連（認証・課金・ユーザーデータ）は永遠に自動化しない
- リサーチ思想（知性ある秘書）はフェーズ1の実装指針として有効
- 颯紀さんの思想（自律運用AI）はフェーズ3の到達点として正しい
- 両者は矛盾しない。フェーズ1を丁寧に作ることがフェーズ3への最短経路

### 未解決・既知リスク
- engine_actionsの詳細スキーマはCodexに/refineを依頼する
- project_bionic / default 混在はScheduler前に整理が必要
- RLSは開発中無効

### 次にやること
- Scheduler実装（node-cronでweekly digest自動実行）
- その後engine_actions設計

---

## 2026-04-11 / Claude Code（29回目）

### やったこと
- project_idを'default'から'project_bionic'に全箇所統一した
  - packages/engine/src/routes/research.ts（GET/POST）
  - packages/engine/src/routes/jobs.ts（insert/runResearchDigest呼び出し）
- engine_jobs.dedupe_keyのmigration SQLを作成した
- Schedulerモジュールを実装した
  - packages/engine/src/jobs/researchDigest.ts（dedupeKey生成・job登録）
  - packages/engine/src/scheduler/index.ts（node-cron・catch-up・config）
  - packages/engine/src/routes/jobs.ts のrunResearchDigestをexport化
  - packages/engine/src/index.ts にstartScheduler()を追加
- node-cron / @types/node-cron をインストールした
- .env.localにScheduler設定を追加した
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- project_id統一をScheduler実装前に完了（混在状態の解消）
- dedupeKeyはISO週番号ベース（`research_digest:2026-W15`形式）で週1回の重複防止
- catch-up機能: Engine起動時に今週分が未実行なら即時実行する
- BIONIC_SCHEDULER_ENABLED=falseでSchedulerを無効化可能（開発時の制御）
- runResearchDigestのexportは既存ロジックを変更しない（関数シグネチャ維持）

### 未解決・既知リスク
- engine_jobs.dedupe_keyのmigration SQLがSupabaseに未適用（手動実行待ち）

### 次にやること
- Supabase SQL Editorでdedupe_key migration SQLを実行する
- Scheduler動作確認（Engine起動→catch-up実行確認）
- Codex /review（Scheduler）

---

## 2026-04-11 / Claude Code（30回目）

### やったこと
- Scheduler catch-upに予定時刻チェックを追加した（P1 finding修正）
  - getScheduledTimeThisWeek()で今週の予定実行時刻を計算
  - now < scheduledTimeの場合はcatch-upをスキップ
- 環境変数のセキュリティ検証を追加した
  - cron式: 「分 時 * * 曜日」形式のみ許可、範囲チェック
  - timezone: 9つのホワイトリストのみ許可
  - projectId: `[a-zA-Z0-9_-]+` のみ許可
  - 無効値はデフォルトにフォールバック＋console.errorでログ
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- catch-upは予定時刻を過ぎた場合のみ実行（月曜09:00前に起動しても実行しない）
- timezoneはホワイトリスト方式（任意文字列を受け入れない）
- 無効値はエラーログ+デフォルトフォールバック（Engineの起動を止めない）

### 未解決・既知リスク
- engine_jobs.dedupe_keyのmigration SQLがSupabaseに未適用（手動実行待ち）

### 次にやること
- Supabase SQL Editorでdedupe_key migration SQLを実行する
- Scheduler動作確認
- Codex /review（Scheduler）

---

## 2026-04-11 / Claude Code（31回目）

### やったこと
- luxonを導入してtimezone計算を正確化した（Intl.DateTimeFormatハック廃止）
- cron式バリデーションを`^\d+$`完全一致に強化した（'0 9-17 * * 1'等を拒否）
- 許可timezoneリストを9→17に拡大した（主要タイムゾーンをカバー）
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- luxonのweekdayは1=月〜7=日、cronは0=日〜6=土。変換ロジックを実装
- getScheduledTimeThisWeekはluxon DateTimeを返すよう変更（Date→DateTime）
- catch-upの時刻比較もluxon DateTime同士で実施（timezone-aware）

### 未解決・既知リスク
- engine_jobs.dedupe_keyのmigration SQLがSupabaseに未適用（手動実行待ち）

### 次にやること
- Supabase SQL Editorでdedupe_key migration SQLを実行する
- Scheduler動作確認
- Codex /review（Scheduler）

---

## 2026-04-11 / Claude Code（32回目）

### やったこと
- catch-up処理のdedupeKeyを起動日基準→予定日基準に変更した（P2 finding修正）
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- 年跨ぎ等でnowInTzとscheduledTimeの週番号がずれるケースを防止

### 未解決・既知リスク
- engine_jobs.dedupe_keyのmigration SQLがSupabaseに未適用（手動実行待ち）

### 次にやること
- Supabase SQL Editorでdedupe_key migration SQLを実行する
- Scheduler動作確認

---

## 2026-04-11 / Claude Code（33回目）

### やったこと
- triggerWeeklyDigestにoverrideDedupeKey引数を追加した（P2 finding修正）
- catch-upからscheduledTime基準のdedupeKeyを渡すよう変更した
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- catch-up: scheduledTime基準のdedupeKeyを一貫して使用（確認→insert間の不整合を防止）
- cron起動時: new Date()基準のまま（overrideDedupeKey未指定時のフォールバック）

### 未解決・既知リスク
- engine_jobs.dedupe_keyのmigration SQLがSupabaseに未適用（手動実行待ち）

### 次にやること
- Supabase SQL Editorでdedupe_key migration SQLを実行する
- Scheduler動作確認

---

## 2026-04-11 / Claude

### やったこと
- Schedulerをnode-cron + luxonで実装した
- project_idをproject_bionicに統一した
- engine_jobs.dedupe_keyを追加してmigration管理に記録した
- catch-up処理を実装した（予定時刻チェック・timezone正確化・dedupe_key一貫性）
- セキュリティ検証を追加した（cron式・timezone・projectIdのバリデーション）
- Codexレビュー完了・P1/P2 finding全修正済み

### 判断したこと
- luxonを導入してtimezone計算を正確にした（将来の海外対応を見越す）
- 許可timezoneを17タイムゾーンに拡大した
- cron式は「分 時 * * 曜日」の形式のみ許可（^\d+$による完全一致）
- デフォルトは毎週月曜09:00 JST（BIONIC_DIGEST_CRONで変更可能）
- catch-upはscheduledTime基準のdedupeKeyを一貫して使う

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- project_bionic / default 混在の最終確認が必要
- engine_actionsはPhase 1.5として次に実装する

### 次にやること
- project混在の最終確認
- engine_actions最小設計・実装

---

## 2026-04-11 / Claude Code（34回目）

### やったこと
- engine_actionsテーブルとAudit Log基盤を実装した（Phase 1.5）
  - shared型: ActionType / ActionMode / ActionStatus / EngineAction / ListActionsResult追加
  - ServiceStatusにpendingActions追加
  - migration: 20260411000003_engine_actions.sql作成
  - logAction.ts: createAction / completeAction / failAction / skipAction
  - routes/actions.ts: GET /api/actions エンドポイント
  - routes/jobs.ts: runResearchDigestにlogAction組み込み
  - decisions/alerts.ts: evaluateAlertForEventにlogAction組み込み
  - routes/status.ts: pending_approval件数をカウント
  - index.ts: actionsRouterを追加
  - Dashboard: pendingActions表示追加
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- logAction失敗はメイン処理を止めない（actionId nullチェックでガード）
- alerts.tsのinsertに.select('id').maybeSingle()を追加（actionログにalertIdを含めるため）
- pendingActionsはcount: 'exact', head: trueで効率的にカウント
- GET /api/actionsのlimitは最大100、デフォルト50

### 未解決・既知リスク
- engine_actionsテーブルのmigration SQLがSupabaseに未適用（手動実行待ち）

### 次にやること
- Supabase SQL Editorでengine_actions migration SQLを実行する
- 動作確認
- Codex /review（engine_actions）

---

## 2026-04-11 / Claude Code（35回目）

### やったこと
- engine_actionsのP1/P2 finding 3件を修正した
  - logAction全helper関数にtry/catchを追加（例外がメイン処理に伝播しない）
  - mark_digest_sentのDB更新結果を確認、失敗時にfailActionを呼ぶ
  - notifyDigest前後でnotify_discordアクションを記録する
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- notify_discordとrun_research_digestは別のアクションとして記録（関心の分離）
- mark_digest_sentはcreateAction→DB更新→結果に応じてcomplete/failの順序で実行
- logActionの各関数は全てベストエフォート（try/catchで例外を握る）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（engine_actions finding修正）

---

## 2026-04-11 / Claude Code（36回目）

### やったこと
- engine_actionsのP1/P2 finding 2件を修正した
  - notifyActionIdをtry外で宣言、catch節で例外時にfailAction呼び出し（P1）
  - mark_digest_sent失敗時にjobをneeds_reviewに更新（P2）
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- notifyDigest例外時: notify_discordとrun_research_digest両方をfailする
- mark失敗時: Discord送信は成功しているためrun_research_digestはsucceeded（markDigestSent: 'failed'付き）
- mark失敗時: jobはneeds_reviewにして人間の確認を待つ（completedにしない）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（engine_actions finding修正）

---

## 2026-04-11 / Claude

### やったこと
- engine_actionsテーブルを作成した（Phase 1.5 Audit Log）
- logActionヘルパーを作成した（ベストエフォート・例外はcatchしてvoid返却）
- run_research_digest / notify_discord / create_alert / mark_digest_sentを記録対象にした
- GET /api/actionsエンドポイントを追加した
- GET /api/statusにpendingActionsを追加した
- notifyDigest例外時にnotify_discord actionをfailoverする実装をした
- mark_digest_sent失敗時にjobをneeds_reviewにする実装をした
- Codexレビュー完了・P1/P2 finding全修正済み

### 判断したこと
- logActionはベストエフォート（例外をcatchしてメイン処理を止めない）
- mark_digest_sent失敗時はjobをneeds_reviewにする（Discord送信成功・mark失敗の状態を人間が確認できるようにする）
- notify_discord actionはrun_research_digestと独立して記録する

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- テストコードがまだない（最小テスト追加はUI改善後に実施）
- App UIはまだ素のHTMLのみ

### 次にやること
- App UI改善（TailwindCSS導入）

---

## 2026-04-11 / Claude Code（37回目）

### やったこと
- TailwindCSS v4を導入した（@tailwindcss/postcss + CSS-first設定）
- 全4画面をRetro-Futurism × Anthropic Orangeデザインに刷新した
  - Dashboard: ステータスカード4枚（pendingJobs/pendingApprovals/openAlerts/lastEvent）+ Engine情報
  - Alerts: severity別バッジ・fingerprint表示・count表示
  - Actions: Audit Log一覧（status/type/title/timestamp）
  - Research: 保存フォーム + 一覧をTailwind対応
- Actions画面を新規追加した（/actions）
- engine.tsにgetActions関数を追加した
- globals.cssでカスタムユーティリティ（card/badge/accent-bar）を定義した
- `pnpm typecheck` + `pnpm --filter @bionic/app build` 成功確認

### 判断したこと
- TailwindCSS v4はCSS-first設定（tailwind.config.ts不要・@theme + @utilityで定義）
- PostCSS pluginは@tailwindcss/postcssに変更（v4の破壊的変更に対応）
- フォント: Space Grotesk（見出し）/ Inter（本文）/ JetBrains Mono（コード・ID）
- カラー: #0A0A0A背景 + #E8611Aアクセント（TVA×Anthropicの琥珀色）
- Engine Offline時は共通の◆アイコン + 起動コマンド表示

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（UI改善）

---

## 2026-04-11 / Claude

### やったこと
- TailwindCSS v4を導入した
- 黒×オレンジ（Retro-Futurism × Anthropic Orange）のデザインシステムを構築した
- Dashboard / Alerts / Actions / Research 全画面をスタイル適用した
- Actions画面を新規追加した（Audit Log表示）
- getActions()をengine.tsに追加した
- Codexレビュー完了・問題なし

### 判断したこと
- カラーパレット：#0A0A0A背景・#E8611Aアクセント（TVA×Anthropicの琥珀色）
- フォント：Space Grotesk（見出し）/ Inter（本文）/ JetBrains Mono（コード・ID）
- カードはシャドウなし・薄いボーダーのみ（官僚的な整然さ）

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- テストコードがまだない

### 次にやること
- Recent Events表示

---

## 2026-04-11 / Claude Code（38回目）

### やったこと
- GET /api/events エンドポイントを追加した（project_id/type/limitフィルター対応）
- shared型にEventSummary / ListEventsResultを追加した
- engine.tsにgetEvents関数を追加した
- DashboardにRecent Eventsセクションを追加した（直近10件を表示）
- `pnpm typecheck` + `pnpm --filter @bionic/app build` 成功確認

### 判断したこと
- GETエンドポイントはpayloadを返さない（一覧ではサマリーのみ・詳細表示は将来追加）
- DashboardではgetStatusとgetEventsをPromise.allで並列取得
- limit最大100・デフォルト20

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（Recent Events）

---

## 2026-04-11 / Claude

### やったこと
- GET /api/events エンドポイントを追加した
- DashboardにRecent Eventsセクションを追加した
- shared型にEventSummary / ListEventsResultを追加した
- Codexレビュー完了・問題なし

### 判断したこと
- GETレスポンスはpayloadを含まない（サマリーのみ・一覧表示に最適化）
- DashboardではgetStatusとgetEventsをPromise.allで並列取得（レスポンス高速化）

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- テストコードがまだない

### 次にやること
- 承認待ちAPI / CLI最小実装

---

## 2026-04-11 / Claude Code（39回目）

### やったこと
- packages/cliを新規作成した（@bionic/cli）
  - bionic status: Engine状態を表示
  - bionic approvals: 承認待ちアクション一覧
  - bionic approve <id>: アクションを承認
  - bionic deny <id>: アクションを却下
- Engine側にPOST /api/actions/:id/approve と /api/actions/:id/deny を追加した
- `pnpm typecheck` 全5パッケージでエラーなし確認（cli追加）
- CLIの動作確認済み（status / approvals コマンド）

### 判断したこと
- CLIはcommander + chalk構成（軽量・カラー表示）
- Engine APIクライアントはfetch直接利用（SDK依存なし）
- approve/denyはstatus='pending_approval'のレコードのみ更新（状態チェック付き）
- デザイン: Anthropicオレンジ(#E8611A)をCLI表示にも統一

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（CLI）

---

## 2026-04-11 / Claude Code（40回目）

### やったこと
- approve/denyに対象確認ロジックを追加した（P1 finding修正）
  - 存在しないIDは404を返す
  - pending_approval以外のstatusは409を返す
- package.jsonのbinフィールドを削除した（tsx経由起動に統一）
- scriptsにstatus/approvalsショートカットを追加した
- IDEAS.mdにCLI配布時のbin構成移行メモを追加した
- `pnpm typecheck` 全5パッケージでエラーなし確認

### 判断したこと
- select→statusチェック→updateの3ステップで安全に状態遷移する
- bin構成は公開タイミングで対応する（今はtsx経由で十分）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（CLI P1 finding修正）

---

## 2026-04-11 / Claude Code（41回目）

### やったこと
- approve/denyのupdateに.eq('status', 'pending_approval')を追加した（P1 finding修正）
- update結果が0件の場合に409を返すようにした
- `pnpm typecheck` 全5パッケージでエラーなし確認

### 判断したこと
- select→updateの間にstatusが変わるrace conditionを防止するため、updateにもstatus条件を追加
- .select('id')で更新行数を確認し、0件なら409（concurrent修正で先に状態が変わった場合）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（approve/deny atomic保証）

---

## 2026-04-11 / Claude

### やったこと
- GET /api/eventsエンドポイントを追加した
- DashboardにRecent Eventsセクションを追加した
- packages/cliを作成してbionic status / approvals / approve / denyを実装した
- approve/denyに404/409・atomic updateを実装した
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- CLIはPhase 1.5ではtsx経由起動のみ（binなし）
- 将来の配布時にdist/配下に移行する（IDEAS.mdに記録済み）
- approve/denyはselect後のupdateにもstatus条件を追加してatomicな保証にした

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- テストコードがまだない

### 次にやること
- RLS / Security設計

---

## 2026-04-11 / Claude Code（42回目）

### やったこと
- 全5テーブルのRLSを有効化するmigrationを作成した
- engine_actionsにapproved_by/approved_at/denied_by/denied_atカラムを追加した
- BIONIC_ENGINE_TOKEN認証middlewareを作成した
- CORS設定を追加した（localhost:3000のみ許可）
- JSON body size limitを1MBに設定した
- Engineのlisten hostをBIONIC_ENGINE_HOSTで環境変数化した
- approve/denyにX-Actor-Idヘッダーからactorを記録するようにした
- App/CLI/SDKの全fetchにAuthorizationヘッダーを追加した
- .env.exampleを作成した
- shared型のEngineActionにapprovedBy/deniedBy関連フィールドを追加した
- `pnpm typecheck` 全5パッケージでエラーなし確認

### 判断したこと
- TOKEN未設定時は開発モードのみ許可（production時は起動拒否）
- RLSは有効化するがpolicyは作らない（service_role keyのみがアクセス可能）
- actorIdはX-Actor-Idヘッダーから取得、未設定時は'cli'をデフォルト値に
- CORSはlocalhost:3000/127.0.0.1:3000のみ（将来カスタムドメイン追加時に拡張）

### 未解決・既知リスク
- RLS有効化・team columns追加のmigration SQLがSupabaseに未適用（手動実行待ち）

### 次にやること
- Supabase SQL Editorでmigration SQLを実行する
- Codex /review（RLS/Security）

---

## 2026-04-11 / Claude Code（43回目）

### やったこと
- 本番起動前のvalidateEnvironment()を追加した（P1 finding修正）
  - NODE_ENV=production時にBIONIC_ENGINE_TOKEN / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEYを検証
  - 未設定時はprocess.exit(1)で即時停止
- `pnpm typecheck` 全5パッケージでエラーなし確認

### 判断したこと
- validateEnvironment()はapp.listen()の直前に配置（ルーティング設定後・起動前の最終チェック）
- 開発モード（NODE_ENV未設定）ではスキップ（既存のmiddleware warningで十分）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（validateEnvironment）

---

## 2026-04-11 / Claude

### やったこと
- RLS有効化migration追加（全テーブル・policyなし）
- BIONIC_ENGINE_TOKEN認証middlewareを実装した
- Engineのlisten hostをBIONIC_ENGINE_HOSTで環境変数化した
- チーム利用設計を追加した（approved_by / denied_byカラム）
- 本番環境でのTOKEN未設定時の起動拒否を実装した（validateEnvironment）
- App / CLIのfetchにAuthorizationヘッダーを追加した
- .env.exampleを作成した
- CORS・JSON body size limitを設定した
- IDEAS.mdの全21アイデアに参照タイミングを追加した
- AGENTS.mdに「タスク開始前の確認」ルールを追加した
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- RLSはpolicyなし・service_roleのEngineのみ操作する設計にした
- Supabase直接readはPhase 2でAuth・RLS・project_membersとセットで実装する
- チーム利用設計（listen host・TOKEN・approved_by）は今から入れた
- TOKEN未設定は開発中のみ許可・本番は起動拒否にした
- IDEAS.mdの参照タイミングをAGENTS.mdのルールと組み合わせて機能させる

### 未解決・既知リスク
- テストコードがまだない（次のタスク）

### 次にやること
- 最小テスト追加

---

## 2026-04-11 / Claude Code（44回目）

### やったこと
- Vitestをインストールしてテスト基盤を構築した
- validateCronExpressionをcron.tsに切り出した（テスタビリティ向上）
- 3つのテストファイルを作成した（合計19テスト）
  - cron.test.ts: 9テスト（有効/無効のcron式バリデーション）
  - researchDigest.test.ts: 3テスト（正常insert / 23505 dedupe / DBエラー）
  - alerts.test.ts: 7テスト（対象外スキップ / insert / update / severity判定 / エラー耐性）
- `pnpm --filter @bionic/engine test`: 全19テスト通過
- `pnpm typecheck`: 全5パッケージ通過

### 判断したこと
- Supabaseはvi.mockでモック（テストからDB接続しない）
- logActionもvi.mockでモック（Audit Log記録のテストは統合テストで行う）
- validateCronExpressionは純粋関数なのでモック不要

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（テスト）

---

## 2026-04-11 / Claude Code（45回目）

### やったこと
- テストP2 finding 2件を修正した
  - researchDigest.test.ts: insert payloadにdedupe_keyが含まれることを検証追加
  - alerts.test.ts: 23505 race conditionでskipActionが呼ばれることを検証追加
- `pnpm --filter @bionic/engine test`: 全20テスト通過（+1新規、+1強化）

### 判断したこと
- insert payloadの検証はexpect.objectContainingで主要フィールドのみ検証（timestampは除外）
- 23505テストはmockのmaybeSingle呼び出し順序で制御

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（テストP2 finding修正）

---

## 2026-04-11 / Claude

### やったこと
- Vitestを導入して最小テストを追加した（全20テスト通過）
- validateCronExpressionをscheduler/cron.tsに切り出した
- cron.test.ts（11件）/ researchDigest.test.ts（3件）/ alerts.test.ts（6件）を追加した
- Codexレビュー完了・P2 finding全修正済み

### 判断したこと
- テストフレームワークはVitest（TypeScript/ESM/monorepoとの相性が良い）
- テストはco-located（対象ファイルの横に配置）
- Supabaseはvi.mockでモック（Supabase local統合テストはPhase 2）
- Audit Log呼び出しはテストで固定しない（壊れやすくなるデメリットが大きい）
- validateCronExpressionはpure functionなのでcron.tsに切り出した

### 未解決・既知リスク
- apps/appのglobals.css側のtypecheck警告（認証実装とは別系統）
- Codex環境でVitestの依存解決に問題あり（@rolldown/binding-win32-x64-msvc欠落）

### 次にやること
- Deploy→Watch→Alert（Vercel Webhook連携）
