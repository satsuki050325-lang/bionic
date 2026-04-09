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
- 実装優先順序：基盤（②③④）→ コピペ自動化 → リサーチエンジン
- Mediniとの接続タイミング：基盤完成後

### 完了済み
- AGENTS.md / CLAUDE.md / SKILLS.md 作成済み
- docs/AUTOMATION.md 作成済み
- docs/BIONIC_PRODUCT.md（v2）作成済み
- docs/TECHNICAL_DESIGN.md 作成済み
- bionic repo初期化（Ubuntu + GitHub push済み）
- shared型定義（packages/shared/src/types.ts）作成済み
- Engine最小起動（packages/engine）
- Phase 1 API 4エンドポイント実装（POST /api/events, GET /api/status, GET /api/alerts, POST /api/jobs）
- Codexレビュー完了・P1 finding全修正済み

### 進行中
- なし

### 未着手
- engine_eventsをDBに保存
- コピペ自動化
- リサーチエンジン
- SDK最小実装
- App 3画面

---

## 次の1手

### 今すぐやること
engine_eventsをDBに保存する（Supabase接続・テーブル作成・保存処理）

### done条件
- [ ] Supabaseプロジェクトが作成されている
- [ ] engine_eventsテーブルが作成されている
- [ ] POST /api/events でDBに保存される
- [ ] pnpm typecheck が通る

---

## Open Questions

### 要Claude確認
- なし

### 要Codex確認
- なし

---

## 既知リスク

- Phase 0では手動コピペが残る。基盤完成後のコピペ自動化まで許容する
- Electronは未確定。最初はWebコンソールで進める
- status.tsのstartedAtはDB導入時に修正する
- alerts.tsのフィルターはDB導入時に実装する

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

2026-04-09 / Claude
