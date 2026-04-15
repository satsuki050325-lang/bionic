# Bionic - チャット引き継ぎ
> チャットが変わる時に書く。新しいセッションの冒頭で必ず読む。

---

## 新しいチャットを始めるとき

1. `AGENTS.md` を読む（役割分担・行動規範）
2. このファイル（`docs/internal/HANDOFF.md`）を読む
3. `docs/internal/CURRENT.md` を読む
4. `docs/internal/WORK_LOG.md` の直近エントリを確認する
5. 現状把握してから作業を始める

---

## 現在の状態（2026-04-15）

### プロジェクト
- GitHub: https://github.com/satsuki050325-lang/bionic（**Public公開済み**）
- Phase 2.4: **完了**（Public Preview公開・UI最終仕上げまで）
- Phase 2.5a: **Uptime ping監視 実装済み**（コミット: `eb472b7`）
- Supabaseマイグレーション（`20260413000004_uptime_targets.sql`）: **未適用**

### 直近の完了項目（Phase 2.5a: Uptime監視）
- `uptime_targets` テーブル設計（interval 30/60/300, method GET/HEAD, SSRF前提のcheck制約）
- SSRFガード（`packages/engine/src/uptime/ssrf.ts`）: localhost/.local/.internal拒否、`dns.lookup`で全解決IPを検査、private/loopback/link-local/ULA/CGNAT/multicast/benchmarkingをブロック、IPv4-mapped IPv6展開
- SSRFハードニング（`packages/engine/src/uptime/check.ts`）: `http(s).request` の `host: resolvedIp` + `Host` header + `servername` でIPピン留めしDNS rebinding TOCTOUも塞ぐ
- runner（`packages/engine/src/uptime/runner.ts`）: 3回連続失敗で `service.health.degraded` 初回のみ発火、degraded状態からの復旧時のみ `service.health.reported` 発火。`degraded_event_emitted` フラグで二重発火防止
- REST API: GET/POST/PATCH/DELETE `/api/uptime-targets` + `POST /:id/test`
- Scheduler: 毎分 `uptime_runner` 追加、diagnostics runner stateに登録
- UI: Servicesページに Uptime バッジ（UP / DOWN / MIXED / PENDING）、Add Serviceに "URL Monitoring" タブ（URL入力・interval選択・Start/Test ボタン）
- `pnpm verify` 全通過（typecheck 6 projects / engine test 36件 / app build 13 routes）

### 次のステップ（優先順）
1. **[必須] uptime RPC atomic claim の実DB検証**: migration 適用後、`SELECT public.claim_uptime_degraded(...)` を2セッションで同時実行し、片方のみ `true` を返すことを確認する。確認前は atomic claim を「実装済み・未検証」として扱うこと
2. **Supabaseに uptime_targets マイグレーションを適用する**（`supabase db push` または `npx supabase migration up`）
3. **Codexによる `eb472b7` のレビュー**（SSRFガードの抜け漏れ、状態遷移のrace、RLS前提の確認）
4. **Uptime監視の動作確認**（実URL登録→毎分cron実行→degraded/reported両イベント発火確認）
5. **Phase 2.5b: Cron heartbeat監視**（将来タスク・未着手）

### 未解決・既知リスク
- `pnpm-lock.yaml` は Windows環境生成のため WSL/Linux で native binding エラーが出る場合がある（既知・公開後対応）
- Uptime機能は実DBに適用されるまで end-to-end で検証できていない
- `app` 側の UptimeTarget 型は shared とは別に再宣言している（RSC境界の都合・Codex要確認）
- **fingerprint断絶**: Group 2（`f5f41b1`）デプロイ直後、旧 fingerprint（`v2:...:health:down:uptime`）を持つ open alert は新 fingerprint（`v2:...:health:target:<id>`）の recovery と一致しない。デプロイ後に手動 resolve が必要
- **atomic claim 実DB未検証**: Task1（`9007c93`）で導入した `claim_uptime_degraded` / `claim_uptime_recovery` RPC は unit test の mock queue で並行挙動を再現済みだが、実 Supabase DB での2プロセス並行 UPDATE 検証は未実施（supabase CLI がローカル未導入のため）。migration 適用時に確認すること

### 重要な決定事項
- SDK npm公開は Phase 2.5 以降（現在は Direct API を主導線に）
- `BIONIC_ENGINE_TOKEN` は `.env.example` では空値（ローカルは空・本番は `openssl rand -hex 32`）
- Uptime機能の SSRF は DNS rebinding まで考慮して `http(s).request` ピン留め方式を採用（`fetch` は不採用）
- degraded/reportedイベントの発火は状態変化時のみ（成功毎の保存は避ける）

---

## 開発体制・ルール

### 役割分担
- **Claude（Chat）**: 設計・戦略・UI確認・ドキュメント・コミュニケーション
- **Claude Code**: 実装・git操作・ビルド確認
- **Codex**: コードレビュー・品質確認・finding報告

### セッションの進め方
1. Claude Codeは**まず `AGENTS.md` を読んでから**実装を開始する
2. 実装後は `pnpm verify` で確認する
3. 完了後は `docs/internal/WORK_LOG.md` にエントリを記録する
4. `git commit && git push` まで行う
5. **コミットハッシュを報告する**

---

## Claudeへの行動規則

- **颯紀さんは直接的なフィードバックと pushback を求めている。賛同より正直な評価を優先する**
- 実装提案には必ずセルフレビューを含める
- 曖昧な指示は実装前に確認する
- 「問題なし」は**Codexが明言した場合のみ**使う
- premature summarization や抽象的な質問を避ける
- 設計判断で妥協するときは「これは妥協である」と明示する

### 指示文のフォーマット規則

Claude Code / Codex への指示文は以下のフォーマットで書く：

- 文頭に「Claude Code へ、」または「Codex へ、」と宛先を書く
- 文末に「担当：Claude」と書く
- 指示文全体をコードブロック（\`\`\`）の中に入れる

**例：**

````
Codex へ、

コミット `abc1234` のレビューを依頼します。
変更は加えず、以下の観点だけ見てください。
（中略）

担当：Claude
````

---

## Claude Codeへの行動規則

- **`AGENTS.md` を必ず最初に読む**
- `pnpm verify` が通らない場合は**止まってエラーを報告する**（勝手に修正しない）
- **`AGENTS.md` ・ `ROADMAP.md` は変更しない**
- **hex直書き禁止**（CSS変数・Tailwind semantic tokenを使う）
- UI実装前に `docs/DESIGN.md` を参照する
- DB変更時はスキーマ・既存マイグレーション・モデルを調査してから着手する
- `docs/BIONIC_PRODUCT.md` ・ `docs/TECHNICAL_DESIGN.md` は触らない
- 作業開始前に `WORK_LOG.md` に開始エントリ、終了時に完了エントリを書く

---

## Codexへの行動規則

- **変更は加えない**（レビューのみ）
- findingがなければ**「問題なし」と明言する**
- **P1/P2/P3の優先度**をつけてfindingを報告する
  - P1: 動かない・セキュリティリスク・公開すると危険
  - P2: 期待仕様とのズレ・再現性欠如
  - P3: 改善提案
- レビュー前に `git pull` を実行してから確認する
- findingは「どこが・なぜ・どう直すか」を具体的に書く

---

## 技術スタック

- **Engine**: Express + Supabase + node-cron（port 3001）
- **App**: Next.js 14 App Router + TypeScript + TailwindCSS（port 3000）
- **SDK**: `@bionic/sdk`（monorepo内包、npm未公開）
- **CLI**: `bionic init` / `bionic doctor` / `bionic demo` / `bionic status` / `bionic approve|deny`
- **MCP**: `packages/mcp`（Claude Desktop登録済み・6ツール）
- **DB**: Supabase（RLS有効・service_role経由のみ）

### 起動コマンド

```bash
cd /mnt/c/Users/owner/Desktop/bionic && claude --dangerously-skip-permissions
```

### 既知の環境問題
- `pnpm-lock.yaml` は Windows側で生成されたもの。WSL/Linux で native binding エラーが出る場合がある（公開後対応予定）

---

## 参照ドキュメント

- `AGENTS.md` — 役割分担・行動規範（変更禁止）
- `CLAUDE.md` — Claudeの担当範囲
- `SKILLS.md` — コマンドごとの担当と手順
- `docs/BIONIC_PRODUCT.md` — 製品仕様書（変更禁止）
- `docs/TECHNICAL_DESIGN.md` — 技術設計（変更禁止）
- `docs/DESIGN.md` — デザインシステム正本
- `docs/ROADMAP.md` — フェーズ・優先順位
- `docs/AUTOMATION.md` — 自動化フェーズ
- `docs/internal/CURRENT.md` — 今の状態・次の1手
- `docs/internal/WORK_LOG.md` — 時系列作業記録
- `IDEAS.md` — 未成熟な発想の保管庫（参照タイミング付き）

---

## 引き継ぎフォーマット（次回以降の上書き用）

```markdown
## 現在の状態（YYYY-MM-DD）

### プロジェクト
[今何をやっているか・1-2文]

### 直近の完了項目
- [今回のチャットで終わったこと]

### 次のステップ（優先順）
1.
2.
3.

### 未解決・既知リスク
-

### 重要な決定事項
- [今回のチャットで決めたこと]
```

---

_最終更新：2026-04-15 / Claude Code（Phase 2.5a Uptime監視実装直後）_
