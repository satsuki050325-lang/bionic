# Bionic - 作業ログ
> 判断・作業・未解決事項の時系列記録。Claude以外も書いてよい。

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
