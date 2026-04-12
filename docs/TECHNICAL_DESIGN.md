# Bionic - 技術設計
> 実装の判断基準。迷ったらここに戻ること。

---

## 核心となる一文

**Bionic EngineはAppの一部ではなく、ローカルで動く独立したバックグラウンドランナーであり、Bionic AppはそのUIである。**

---

## アーキテクチャ

```
Bionic Engine（独立した常駐プロセス）
　↑ local HTTP
　├── Bionic App（Next.js）
　├── Bionic CLI（commander）
　├── @bionic/sdk（各サービスに組み込む）
　└── @bionic/mcp（Claude Desktop MCP server）

　↕ Supabase (Postgres) — 永続化
　↕ Discord (Bot / Webhook) — 通知・承認
　↕ Vercel Webhook — Deploy→Watch→Alert
```

---

## 技術スタック

```
言語            TypeScript / Node.js 20+
フロント        Next.js 14（App Router）
UI              TailwindCSS v4（Retro-Futurism × Anthropic Orange）
DB              Supabase（Postgres + RLS）
スケジューラー  node-cron + luxon（ローカル常駐プロセス内）
AI              Claude API（最小利用・将来）
通知            discord.js（Bot） + Discord Webhook（フォールバック）
通信方式        local HTTP（transport-agnostic service interface）
MCP             @modelcontextprotocol/sdk
配布            npm（SDK・CLI・MCP、将来）
パッケージ管理  pnpm workspace
テスト          Vitest
CI              GitHub Actions（typecheck / engine test / app build）
```

スケジューラーはGitHub Actions Cron/Vercel Cronではなく `node-cron` をEngine常駐プロセス内で走らせる。
（Action Cronは遅延が大きくリアルタイム監視に不向きのため。ROADMAP Phase 2設計思想参照。）

---

## 通信方式

**設計の正はtransport-agnosticなservice interface。今の実装はlocal HTTP。**

```typescript
interface BionicEngineService {
  captureEvent(event: EngineEvent): Promise<void>
  getStatus(): Promise<ServiceStatus>
  listAlerts(): Promise<Alert[]>
  runJob(type: JobType): Promise<Job>
  retryAction(id: string): Promise<void>
  approveAction(id: string): Promise<void>
}
```

```
設計の正     service interface（transport非依存）
今の実装     local HTTP + Bearer token（BIONIC_ENGINE_TOKEN）
Electron固有 IPC（local HTTPを包む補助層、将来）
永続化・jobs DB（Supabase）
```

全クライアント（App / CLI / MCP）は同じtokenをAuthorizationヘッダに載せる。

---

## エンジンの内部構造（5層 → 実装マップ）

```
1. Sources（入力）
   packages/engine/src/sources/
     vercel.ts                 Vercel Webhookペイロード → 正規化
   packages/engine/src/routes/
     events.ts                 SDK経由のイベント受付
     webhooks/vercel.ts        Vercel Webhook受信・署名検証

2. Event Layer（正規化）
   engine_events テーブルに共通形式で保存
   shared/ の EngineEvent 型で統一

3. Decision Layer（判断）
   packages/engine/src/decisions/
     alerts.ts                 Event → Alert 判定（fingerprint重複防止）
     deploymentWatch.ts        Deploy→Watch→Alert 評価
   packages/engine/src/policies/
     notification.ts           通知可否（quiet hours / alert_created / reminder / approval_stale）
     approval.ts               承認の48h auto-cancel

4. Action Layer（実行）
   packages/engine/src/actions/
     logAction.ts              engine_actionsへの監査ログ
     service.ts                approveAction / denyAction
     notify.ts                 Discord Webhookによるdigest通知
   packages/engine/src/discord/
     index.ts                  Bot起動・停止
     client.ts                 discord.js Client生成
     interactions.ts           approve/deny Button処理
     notifications.ts          sendAlert/sendDigest/sendApproval
     embeds.ts                 Embed構築
   packages/engine/src/jobs/
     types.ts                  job status定義
     repository.ts             DB更新（transition系）
     runner.ts                 job種別ディスパッチ
     researchDigest.ts         digest実行本体

5. Memory Layer（蓄積）
   Supabase engine_events / engine_jobs / engine_alerts /
   engine_actions / research_items / deployments
```

---

## モジュール構成

```
bionic/
  packages/
    shared/    型定義・共通インターフェース（EngineEvent / Alert / Job / EngineAction 等）
    engine/    常駐プロセス本体（上記5層）
      src/
        config.ts             env一元管理 (loadConfig / getConfig / validateConfigForStartup / redactConfig)
        index.ts              Express起動
        middleware/auth.ts    Bearer token検証
        lib/supabase.ts       Supabase Client
        routes/               HTTP受付（events / status / alerts / jobs / research / actions / webhooks）
        scheduler/            node-cron + cron式validation + catch-up
        sources/              外部ペイロード正規化
        decisions/            Event→Alert / Deployment評価
        policies/             通知・承認ポリシー
        actions/              アクション実行・監査ログ
        discord/              Bot起動・Interaction・Embed・通知
        jobs/                 job state machine / runner
    sdk/       @bionic/sdk（health / error / usage）
    cli/       bionic CLI（status / approvals / approve / deny）
    mcp/       @bionic/mcp（Claude Desktop 6ツール）

  apps/
    app/       Bionic App（Next.js：Dashboard / Alerts / Actions / Research）

  supabase/
    migrations/  DB変更履歴（README.md 参照）

  docs/
    BIONIC_PRODUCT.md / TECHNICAL_DESIGN.md / ROADMAP.md / MCP.md / AUTOMATION.md
```

---

## 設定（config.ts）

Engine全体のenv読み取りは `packages/engine/src/config.ts` に一元化している。

- `loadConfig(env)` でプレーンに構築、`getConfig()` が singleton
- 不正な cron式 / timezone / projectId / int range は warning を出してデフォルトにフォールバック
- production必須envは `validateConfigForStartup(config)` で起動時のみ検査し、欠落なら `process.exit(1)`
- Discord modeは load 時に判定（bot / webhook / disabled）
  - `BOT_TOKEN + CHANNEL_ID` → bot
  - `BOT_TOKEN` だけ → webhookへフォールバック（webhookもなければ disabled）
  - `WEBHOOK_URL` のみ → webhook
- `redactConfig(config)` がsecretを `[set]` / `[not set]` に置換してdiagnosticsに返す

全modules は `process.env` を直接読まず、`getConfig()` 経由で参照する。

---

## データモデル（実装済み）

```sql
projects                  -- project_id の単位（今は project_bionic 固定）
services                  -- service_id の単位（Mediniなど）
engine_events             -- 全イベントの中心
engine_jobs               -- ジョブの状態管理
engine_alerts             -- アラート
research_items            -- リサーチ収集結果
engine_actions            -- アクション監査ログ（Phase 1.5）
deployments               -- Vercel Deploy→Watch→Alert
```

### engine_events
外部から届いたシグナルの正規化保存。`client_event_id` でSDK側からの再送重複を防ぐ。

### engine_jobs
- `status`: pending / running / completed / failed / needs_review / cancelled
- `resolution_reason`: user_cancelled / superseded / manual_resolution / timeout / dependency_error
- `dedupe_key`: 週次digestなどで同一枠の二重enqueue防止（UNIQUE制約）

### engine_alerts
- `type`: service_down / error_spike / cost_overrun / service_error / deployment_regression …
- `fingerprint`: 重複alert抑止用（service_id + type などから生成）
- `last_seen_at` / `count` / `last_event_id`: 集約情報
- `last_notified_at` / `notification_count`: policies/notification.ts による再通知判断

### research_items
- `source`: 既定値 `'manual'`
- `category`: 任意カテゴリ

### engine_actions
全自動アクションの監査ログ。`approveAction` / `denyAction` から approver を書き込む。
- `type`: run_research_digest / notify_discord / create_alert / mark_digest_sent …
- `status`: pending / in_progress / completed / failed / needs_review / skipped
- `approved_by` / `approved_at` / `denied_by` / `denied_at`: 承認フロー
- `result` / `error` / `payload`: 実行コンテキスト

### deployments
Vercel Deployごとに1行。`watch_until` まで error eventsを集計。
- `watch_status`: watching / ok / regression
- `baseline_error_count` / `current_error_count`
- `provider + provider_deployment_id` UNIQUE

### RLS
全テーブルでRLS有効化、policyなし。service_role（Engine）のみ操作可能。
App/CLI/MCPはEngine HTTP API経由でアクセスする。

---

## engine_jobsの状態

```
status
  pending        実行待ち
  running        実行中
  completed      正常完了
  failed         失敗
  needs_review   人間の確認が必要（中間状態）
  cancelled      意図的に止めた（終端状態）

resolution_reason（別カラム）
  user_cancelled      人間がキャンセルした
  superseded          別の手段で対応済み
  manual_resolution   手動で解決した
  timeout             タイムアウト
  dependency_error    外部依存の失敗
```

---

## job状態遷移

```
pending → running → completed
                  → needs_review → approval.requested → approval.granted → running再開 → completed
                                                       → approval.denied → cancelled
                  → failed
```

`needs_review` は終端状態ではなく、人間判断待ちの中間状態。
`approval.*` は job status ではなく、承認フローを表す event として扱う。

---

## eventの命名規則

```
.detected     システムが検知した（自明な場合は省略可）
.requested    人間またはシステムが要求した
.started      実行開始
.completed    正常完了
.failed       失敗
.granted      承認された
.denied       拒否された
```

**eventの例**
```
research.item.detected
service.health.degraded
service.error.reported
cost.threshold.exceeded
deployment.ready
repair.started
repair.completed
repair.failed
approval.requested
approval.granted
approval.denied
```

---

## SDKの最初の責務（3つに絞る）

```typescript
bionic.health({ status: 'ok', latencyMs: 120 })
bionic.error({ message: 'DB connection failed' })
bionic.usage({ activeUsers: 3 })
```

何でも送れるより、よくある運営シグナルを数行で送れることが最初の価値。

---

## 設計原則

**Three-phase architecture（ROADMAP.mdで詳細化）**
Phase 1: Intelligent Secretary（知性ある秘書） — 完了
Phase 1.8: Stabilize Bionic Core — 進行中
Phase 2.0–2.4: Runner / Policy / Productizable / Signal / Integrations / Public Preview
Phase 3: Autonomous Operations（自律運用）

**engine_actions is the audit backbone**
全ての自動アクションはengine_actionsに記録する。
「AIが何をしたかを絶対に追える台帳」がなければ透明性の思想は実現しない。
engine_actionsはPhase 1.5で実装済み。

**Two-axis alert design**
Axis 1: Severity → notification intensity
Axis 2: ActionMode (automatic / approval_required / manual) → action taken
These axes are independent. Never conflate them.

**Centralized config**
env読み取り・validation・default適用・secret redactionは `config.ts` に閉じ込める。
各module は `getConfig()` 経由でアクセスし、`process.env` を直接読まない。

**Centralized notification policy**
Discord通知の可否判定は `policies/notification.ts` の `shouldNotify()` に集約する。
quiet hours / critical reminder / approval stale / digest を NotificationKind で区別する。

**Approval without interruption**
Discord = awareness + quick action（Bot Embed + Button）
CLI/App = 正式な承認導線（作業開始時に自然に通る）
No timeout-based auto-approval（ただし48h経過でauto-cancelはあり）

**Fail-closed on security-sensitive paths**
- 本番で `BIONIC_ENGINE_TOKEN` が未設定 → 起動拒否
- Vercel Webhook署名検証失敗 → 401
- Discord approver allowlist未設定 → 全員拒否（fail-closed）

**Trust score is display-only initially**
信頼スコアは最初は表示・提案のみ。
自動化権限の変更はCLIで人間が明示的に設定した場合のみ。

**single-tenant first, multi-tenant ready**
最初からproject_idとservice_idを持つ。projectIdは正規表現validation（英数字・ハイフン・アンダースコア）。

**event-centered**
実態はcron（node-cron）＋DBジョブ＋必要に応じてevent capture。

**DB駆動ジョブ**
Temporalは使わない。engine_jobsテーブルで状態管理する。
`jobs/repository.ts` が transition を集約（Phase 2で `transitionJobStatus` / `transitionActionStatus` に統一予定）。

**AIは補助から委任へ段階的に移行する**
観察と実行の大半はルールベース（コスト実質$0）。
AIは説明・優先順位づけ・修復提案を担う。
信頼の蓄積に応じてAIの権限範囲が広がる。

**判断の主体は人間（Phase 1–2）→ 監査者（Phase 3）**
自動でできることはエンジンに入れる。
判断が必要なものはエンジンが拾って人間に返す。
Phase 3では人間は監査と重大判断のみを担う。

---

## コスト設計

月額固定費をほぼゼロに抑える。

| 項目 | サービス | 月額 |
|------|---------|------|
| DB | Supabase Free | $0 |
| ホスティング | ローカル常駐（App/Engineは手元） | $0 |
| スケジューラー | node-cron（常駐プロセス内） | $0 |
| AI | Claude API（将来） | 使った分だけ |
| 監視 | （将来：Sentry Free等） | $0 |

競合（Claude Code / Codex / OpenClaw等）はセッションベースでLLM推論コストが都度かかるのに対し、
Bionicはルールベース処理をローカルで完結する前提なのでコストが実質$0になる、というのが存在意義。

Claude APIは以下だけに使う（将来）:
- research要約
- 優先度スコアリング
- 異常の説明文

死活監視・閾値判定・コスト集計・通知判定にはAIを使わない。

---

## Phase 1の成功条件（達成済み）

```
✅ MediniでSDKを使ってhealth eventを拾える
✅ 重要なresearchが1日1回digestで届く
✅ alertが1画面で見える
✅ 自動修復なしでも「今日見る価値」がある
```

---

## 実装済み主要機能

- Engine HTTP API（events / status / alerts / jobs / research / actions / webhooks）
- SDK（health / error / usage）+ Medini組み込み
- App 4画面（Dashboard / Alerts / Research / Actions）
- Scheduler（weekly digest + deployment watch 5min）+ catch-up
- engine_actions 監査ログ
- RLS有効化 + Bearer token認証
- Deploy→Watch→Alert（Vercel Webhook + HMAC検証）
- MCP server（6ツール、Claude Desktop連携）
- Engine実行責務の分離（routes / jobs / decisions / policies / actions / discord / sources）
- policies/notification.ts + policies/approval.ts
- Discord Bot（Embed通知 + approve/deny Button + allowlist fail-closed）
- config.ts（env一元管理 + redactConfig）
- GitHub Actions CI（typecheck / test / build）
- pnpm verify（一発実行）
- SECURITY_RELEASE_CHECKLIST.md / README.md / ROADMAP.md

---

_最終更新：2026-04-13_
