# Bionic - 自動化フロー
> コピペをなくし、Claude・Codex・Claude Codeの連携を自動化する段階的な設計

---

## 現在のフェーズ

**Phase 0（手動）で運用中。**

---

## ドキュメントの役割分担

| ファイル | 役割 | 更新者 |
|---------|------|--------|
| `CURRENT.md` | 今の状態・次の1手・指示書の正本 | Claude / 人間 |
| `WORK_LOG.md` | 作業履歴・完了報告・判断記録 | Claude Code |
| `engine_jobs` | 実行キュー（Phase 1以降） | Bionic Engine / 人間（承認時） |
| `engine_events` | 機械ログ（何が起きたか） | Bionic Engine |

**重要**：`CURRENT.md` と `engine_jobs` は役割が違う。
- `CURRENT.md` = 人間が読む正本
- `engine_jobs` = 機械が処理する実行キュー

---

## Phase 0（現在・手動）

コピペを最小化しながら手動で回す。

```
Claude/Codexで話し合う
　↓
CURRENT.mdに指示を書く（Claudeが書く）
　↓ 手動トリガー
Claude Codeが CURRENT.md を読んで実行する
　↓
WORK_LOG.mdに完了報告を書いてpush
　↓ 手動確認
Claude/Codexが読む
```

### CURRENT.mdの指示書フォーマット

```markdown
## 次のタスク

### タスク名
[タスクの名前]

### 背景
[なぜこれをやるか・どこから来た判断か]

### done条件
- [ ] 条件1
- [ ] 条件2

### 注意点
[やってはいけないこと・気をつけること]

### 参照ファイル
- [関連するファイルのパス]
```

---

## Phase 1（通知と検知の自動化）

`bionic start` で起動すると、未処理のjobを自動で検知してClaude Codeに渡す。

```
bionic start で起動
　↓ 自動
未処理のjobを engine_jobs から取得
　↓ 自動
実行可能なjobだけ Claude Code に渡す
　↓ 自動
完了を engine_events に記録
　↓ 自動通知（3種類）
Claude/Codexに届く
```

### 通知の3種類

| 種類 | 意味 | 次のアクション |
|------|------|--------------|
| `info` | 完了した・参考情報 | 確認のみ |
| `review_required` | Codexが見るべき | Codexに依頼 |
| `decision_required` | 人間が判断すべき | Claudeに持ち込む |

---

## Phase 1.5（指示書ドラフトの自動生成）

話し合いの後、次のjob候補を自動でdraftとして生成する。人間が承認したものだけ実行に回る。

```
Claude/Codexで話し合う
　↓ 自動
次のjob候補をdraftとして生成
　↓ needs_review（人間確認が必要）
承認したものだけ implementation_task へ昇格
　↓ 自動
Claude Codeが実行する
　↓ 自動通知
完了がClaude/Codexに届く
```

---

## Phase 2（承認付き半自動ループ）

approvedなjobだけ実行する。完了後に次の候補をdraftして人間確認に回す。完全自動化はしない。

```
approvedなjobを実行する
　↓ 自動
完了を取り込む
　↓ 自動
次の候補をdraftする
　↓ needs_review（人間確認が必要）
承認されたら次へ
```

**完全自動化をしない理由**：会話の誤読・文脈の取り違えによる誤差が自己増幅するリスクがある。人間が必ず止められる中間点を置く。

---

## job typeの分類

| type | 意味 | 承認要否 |
|------|------|---------|
| `instruction_draft` | 指示候補（自動生成） | 必要 |
| `implementation_task` | 承認済み実行タスク | 追加承認不要 |
| `review_task` | レビュー依頼 | 不要 |
| `followup_suggestion` | 次の提案（自動生成） | 必要 |

---

## 人間が必ず介在する中間点

```
1. 指示書をdraftから承認する時
2. 完了報告を確認してから次に進む時
3. 危険なアクションの前
```

---

## 文脈の引き継ぎ

チャットが変わっても文脈を失わないために。

```
チャット終了前
　→ CURRENT.mdに現在の状態・次の1手・未解決事項を書く
　→ WORK_LOG.mdに判断記録を残す
　→ GitHubにpushする

新しいチャット開始時
　→ CURRENT.mdを読む
　→ WORK_LOG.mdの直近エントリを読む
　→ 状態を把握してから作業を始める
```

**補足**：Phase 0では `CURRENT.md` が運用の正本。Phase 1以降も `CURRENT.md` は人間向けの要約正本として残す。

---

_最終更新：2026-04-08_
_現在のフェーズ：Phase 0_
