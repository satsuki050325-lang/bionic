# Bionic - Security & Release Checklist

本番リリース・公開前に必ず確認すること。

---

## セキュリティチェック

### 環境変数
- [ ] `.env.local` が `.gitignore` に含まれていることを確認する
- [ ] `.env.example` に値が入っていないことを確認する（変数名のみ）
- [ ] `SUPABASE_SERVICE_ROLE_KEY` が App/Client bundle に含まれていないことを確認する
- [ ] `NEXT_PUBLIC_` プレフィックスの変数に機密情報が含まれていないことを確認する
- [ ] `BIONIC_ENGINE_TOKEN` が本番環境で設定されていることを確認する
- [ ] `BIONIC_DISCORD_BOT_TOKEN` が公開リポジトリにコミットされていないことを確認する
- [ ] `VERCEL_WEBHOOK_SECRET` が設定されていることを確認する

### Supabase / RLS
- [ ] 全テーブルのRLSが有効化されていることを確認する
- [ ] policyなし・service_roleのEngineのみ操作できることを確認する
- [ ] Supabase直接readをAppに許可していないことを確認する
- [ ] anon keyがApp側に露出していないことを確認する

### Engine API
- [ ] `NODE_ENV=production` で `BIONIC_ENGINE_TOKEN` 未設定時に起動拒否することを確認する
- [ ] Engine listen hostが `127.0.0.1` デフォルトであることを確認する
- [ ] CORSが localhost のみ許可されていることを確認する
- [ ] JSON body size limitが設定されていることを確認する（1MB）
- [ ] Vercel Webhook署名検証が有効であることを確認する

### Discord Bot
- [ ] `BIONIC_DISCORD_APPROVER_IDS` が設定されていることを確認する
- [ ] allowlist未設定時にfail-closedになることを確認する
- [ ] Bot tokenが公開リポジトリにコミットされていないことを確認する

### MCP
- [ ] `SUPABASE_SERVICE_ROLE_KEY` がpackages/mcpに渡されていないことを確認する
- [ ] MCPサーバーがEngine HTTP API経由のみでデータにアクセスしていることを確認する

---

## リリース前チェック

### コード品質
- [ ] `pnpm typecheck` が全パッケージで通ることを確認する
- [ ] `pnpm --filter @bionic/engine test` が全テスト通過することを確認する
- [ ] `pnpm --filter @bionic/app build` が成功することを確認する

### DB Migration
- [ ] 全migrationが `supabase/migrations/` に記録されていることを確認する
- [ ] `supabase/migrations/README.md` の適用済みテーブルが最新であることを確認する
- [ ] 新しいDBカラムがshared型に反映されていることを確認する

### ドキュメント
- [ ] `docs/MCP.md` のClaude Desktop設定が最新であることを確認する
- [ ] `.env.example` の変数が最新であることを確認する
- [ ] `README.md` の起動手順が正確であることを確認する

### GitHub公開前（将来）
- [ ] OSS公開範囲を確認する（`src/tools/` のみ等）
- [ ] AGPL-3.0 + CLA + 商用デュアルライセンスの設定を確認する
- [ ] CLIのbin/dist設計を確認する（IDEAS.mdのメモ参照）
- [ ] HN投稿文を準備する（IDEAS.mdのタイトル候補参照）

---

## Supabase key漏洩時の対応手順

1. Supabaseダッシュボード → Settings → API → Rotate keys
2. `.env.local` の `SUPABASE_SERVICE_ROLE_KEY` を新しいkeyに更新する
3. Vercel等のホスティング環境の環境変数を更新する
4. Engineを再起動する

---

_最終更新: 2026-04-12_
