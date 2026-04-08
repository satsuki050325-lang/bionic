# Bionic - 今の状態
> このファイルはチャットが変わっても文脈を引き継ぐための正本。
> 作業開始前に必ず読むこと。

---

## 現在のフェーズ

**Phase 0 運用中 / Phase 1 準備中**
自動化フロー：Phase 0（手動）

---

## プロジェクトの状態

### 確定済み
- 製品名：Bionic（仮称）
- 本体ランナー：Bionic Engine
- repoフォルダ構成：`bionic/` 配下に6フォルダ
- 技術スタック：TypeScript / Node.js / Next.js / Supabase / GitHub Actions / Vercel Cron
- 通信方式：local HTTP（transport-agnostic service interface）
- 開発環境：VSCode内蔵ターミナル（Ubuntu）+ Claude Code

### 進行中
- AGENTS.md / CLAUDE.md / SKILLS.md 作成済み
- docs/AUTOMATION.md 作成済み
- docs/BIONIC_PRODUCT.md（v2）作成済み
- bionic repoのローカル雛形作成済み

### 未着手
- Ubuntu作業環境側の `bionic/` 初期化
- shared型定義
- service interfaceとlocal HTTP APIの最小仕様
- Engine最小起動
- SDK最小実装

---

## 次の1手

### 今すぐやること
```
1. Ubuntu作業環境にも bionic フォルダを作成する
2. 以下の構成でフォルダを初期化する

bionic/
  apps/
  packages/
  docs/
  scripts/
  infra/
  research/

3. 今日作成したmdを適切なフォルダに配置する
4. pnpm workspaceを初期化する
5. GitHubにpushする
```

### done条件
- [ ] Ubuntu作業環境に `bionic/` フォルダが存在する
- [ ] 6つのフォルダが作成されている
- [ ] mdファイルが適切な場所に配置されている
- [ ] pnpm workspaceが初期化されている
- [ ] GitHubにpushされている

---

## Open Questions

### 要Claude確認
- [ ] リサーチエンジンとコピペ自動化、どちらを先に実装するか
- [ ] Mediniとの接続タイミング

### 要Codex確認
- [ ] shared型の最小定義（EngineEvent/DecisionResult/EngineAction/BionicEngineService）
- [ ] local HTTP APIの最小仕様

---

## 既知リスク

- Phase 0では手動コピペが残る。Phase 1実装まで許容する
- Electronは未確定。最初はWebコンソールで進める

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

2026-04-08 / Claude
