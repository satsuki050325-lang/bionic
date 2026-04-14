# Bionic - チャット引き継ぎ
> チャットが変わる時に書く。新しいセッションの冒頭で必ず読む。

---

## 使い方

**チャット終了前にやること**
1. このファイルに現在の状態を書く
2. WORK_LOG.mdに判断記録を残す
3. GitHubにpushする

**新しいチャット開始時にやること**
1. このファイルを読む
2. CURRENT.mdを読む
3. WORK_LOG.mdの直近エントリを読む
4. 状態を把握してから作業を始める

---

## 現在の状態（2026-04-08）

### プロジェクト
Bionicの全体設計が完了した。主要mdの初版作成も完了し、次はUbuntu作業環境でrepoを初期化する段階。

### 完了済み
- Bionicの全体設計（製品仕様・技術設計・開発体制）
- AGENTS.md / CLAUDE.md / SKILLS.md / docs/AUTOMATION.md
- CURRENT.md / WORK_LOG.md / HANDOFF.md
- docs/BIONIC_PRODUCT.md（v2）/ docs/TECHNICAL_DESIGN.md
- Windows側の `bionic/` ローカル雛形作成

### 次のステップ
1. Ubuntu作業環境でbionicフォルダを作成・初期化する
2. 6フォルダ構成で初期化する（apps/packages/docs/scripts/infra/research）
3. 作成済みのmdを適切な場所に配置する
4. pnpm workspaceを初期化する
5. GitHubにpushする

### 未解決
- リサーチエンジンとコピペ自動化、どちらを先に実装するか
- Mediniとの接続タイミング

### 重要な決定事項
- 製品名は `Bionic`、本体ランナーは `Bionic Engine`
- フォルダ名・repo名は `bionic`
- `CURRENT.md` は人間向け正本、`engine_jobs` は機械向け実行キュー
- 自動化は Phase 0（手動）から始め、完全自動化は目指さない

---

## 引き継ぎフォーマット

チャットが変わる時はここを上書きして使う。

```markdown
## 現在の状態（YYYY-MM-DD）

### プロジェクト
[今何をやっているか]

### 完了済み
- 

### 次のステップ
1. 
2. 
3. 

### 未解決
- 

### 重要な決定事項
- 
```

---

_最終更新：2026-04-08 / Claude_
