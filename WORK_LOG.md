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
- GitHub上の bionic リポジトリの存在確認が必要（pushが通るかどうか）

### 次にやること
- Phase 1 手順3: service interface と local HTTP API の最小仕様
