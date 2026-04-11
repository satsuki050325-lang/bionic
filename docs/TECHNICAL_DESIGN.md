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
　├── Bionic App（Next.js → Electron候補）
　├── Bionic CLI（commander）
　└── @bionic/sdk（各サービスに組み込む）
```

---

## 技術スタック

```
言語            TypeScript / Node.js
フロント        Next.js（App Router）
DB              Supabase（Postgres）
スケジューラー  GitHub Actions / Vercel Cron
AI              Claude API（最小利用）
監視            Sentry
通信方式        local HTTP（transport-agnostic service interface）
デスクトップ    Electron（予定・候補）
配布            npm（SDK・CLI）
パッケージ管理  pnpm workspace
```

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
今の実装     local HTTP
Electron固有 IPC（local HTTPを包む補助層）
永続化・jobs DB
```

---

## エンジンの内部構造（5層）

```
1. Sources（入力）
   外部世界、サービス状態、コスト、利用ログ

2. Event Layer（正規化）
   全入力を共通イベントに変換する

3. Decision Layer（判断）
   何が異常か、自動実行か人間確認かを決める

4. Action Layer（実行）
   通知、再起動、キャッシュクリア、バックアップ

5. Memory Layer（蓄積）
   イベント、実行履歴、リサーチ、ポリシー
```

---

## モジュール構成

```
packages/
  shared/    型定義・共通インターフェース（最初に作る）
  engine/    常駐プロセス本体
  sdk/       @bionic/sdk
  cli/       bionic CLI

apps/
  app/       Bionic App（Next.js）
```

---

## データモデル（Phase 1）

```sql
projects                  -- project_id の単位
services                  -- service_id の単位（Mediniなど）
engine_events             -- 全イベントの中心
engine_jobs               -- ジョブの状態管理
engine_alerts             -- アラート
research_items            -- リサーチ収集結果
```

engine_actionsはPhase 2で追加する。最初から広げすぎないため、Phase 1では扱わない。

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
cost.threshold.exceeded
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

**Three-phase architecture**
Phase 1: Intelligent Secretary（知性ある秘書）
Phase 2: Trust-Based Delegation（信頼に基づく委任）
Phase 3: Autonomous Operations（自律運用）

**engine_actions is the audit backbone**
全ての自動アクションはengine_actionsに記録する。
「AIが何をしたかを絶対に追える台帳」がなければ透明性の思想は実現しない。
engine_actionsはPhase 1.5として前倒し実装する。

**Two-axis alert design**
Axis 1: Severity → notification intensity
Axis 2: ActionMode (automatic / approval_required / manual) → action taken
These axes are independent. Never conflate them.

**Approval without interruption**
Discord = awareness channel (notification only)
CLI/App = approval channel (when starting work)
No timeout-based auto-approval.

**Trust score is display-only initially**
信頼スコアは最初は表示・提案のみ。
自動化権限の変更はCLIで人間が明示的に設定した場合のみ。

**single-tenant first, multi-tenant ready**
最初からproject_idとservice_idを持つ。

**event-centered**
実態はcron＋DBジョブ＋必要に応じてevent capture。

**DB駆動ジョブ**
Temporalは使わない。engine_jobsテーブルで状態管理する。

**AIは補助から委任へ段階的に移行する**
観察と実行の大半はルールベース。
AIは説明・優先順位づけ・修復提案を担う。
信頼の蓄積に応じてAIの権限範囲が広がる。

**判断の主体は人間（フェーズ1-2）→ 監査者（フェーズ3）**
自動でできることはエンジンに入れる。
判断が必要なものはエンジンが拾って人間に返す。
フェーズ3では人間は監査と重大判断のみを担う。

---

## コスト設計

月額固定費をほぼゼロに抑える。

| 項目 | サービス | 月額 |
|------|---------|------|
| DB | Supabase Free | $0 |
| ホスティング | Vercel Free | $0 |
| スケジューラー | GitHub Actions | $0 |
| AI | Claude API | 使った分だけ |
| 監視 | Sentry Free | $0 |

Claude APIは以下だけに使う。
- research要約
- 優先度スコアリング
- 異常の説明文

死活監視・閾値判定・コスト集計はAIを使わない。

---

## Phase 1の成功条件

```
✅ MediniでSDKを使ってhealth eventを拾える
✅ 重要なresearchが1日1回digestで届く
✅ alertが1画面で見える
✅ 自動修復なしでも「今日見る価値」がある
```

---

## Phase 1の実装順序

```
1. repo初期化（Mediniとは別repo）
2. shared型定義（EngineEvent/DecisionResult/EngineAction/BionicEngineService）
3. service interfaceとlocal HTTP APIの最小仕様
4. Engine最小起動
5. SDK最小実装（health/error/usageの3つ）
6. engine_eventsをDBに保存
7. App 3画面（Dashboard/Alerts/Research）
8. Medini接続
```

---

_最終更新：2026-04-08_
