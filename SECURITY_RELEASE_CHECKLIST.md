# Bionic - Security & Release Checklist

本番リリース・公開前に必ず確認すること。

---

## セキュリティチェック

### 環境変数
- [x] `.env.local` が `.gitignore` に含まれていることを確認する
- [x] `.env.example` に実 secret が含まれていないことを確認する（placeholder またはコメントのみ）
- [x] `SUPABASE_SERVICE_ROLE_KEY` が App/Client bundle に含まれていないことを確認する
- [x] `NEXT_PUBLIC_` プレフィックスの変数に機密情報が含まれていないことを確認する
- [ ] `BIONIC_ENGINE_TOKEN` が本番環境で設定されていることを確認する（本番デプロイ時に確認）
- [x] `BIONIC_DISCORD_BOT_TOKEN` が公開リポジトリにコミットされていないことを確認する
- [x] `VERCEL_WEBHOOK_SECRET` が設定されていることを確認する（利用環境では生成済み）

### Supabase / RLS
- [ ] 全テーブルのRLSが有効化されていることを確認する（GitHub公開時に再確認）
- [x] policyなし・service_roleのEngineのみ操作できることを確認する
- [x] Supabase直接readをAppに許可していないことを確認する
- [x] anon keyがApp側に露出していないことを確認する

### Engine API
- [ ] `NODE_ENV=production` で `BIONIC_ENGINE_TOKEN` 未設定時に起動拒否することを確認する（本番デプロイ時に確認）
- [x] Engine listen hostが `127.0.0.1` デフォルトであることを確認する
- [x] CORSが localhost のみ許可されていることを確認する
- [x] JSON body size limitが設定されていることを確認する（1MB）
- [x] Vercel Webhook署名検証が有効であることを確認する

### Webhook 署名検証
- [x] Vercel Webhook HMAC-SHA1 検証
- [x] GitHub Webhook X-Hub-Signature-256 検証
- [x] Stripe Webhook stripe-signature 検証
- [x] Sentry Webhook sentry-hook-signature 検証

### Discord Bot
- [ ] `BIONIC_DISCORD_APPROVER_IDS` が設定されていることを確認する（利用者ごとに設定）
- [x] allowlist未設定時にfail-closedになることを確認する
- [x] Bot tokenが公開リポジトリにコミットされていないことを確認する

### MCP
- [x] `SUPABASE_SERVICE_ROLE_KEY` がpackages/mcpに渡されていないことを確認する
- [x] MCPサーバーがEngine HTTP API経由のみでデータにアクセスしていることを確認する

### External AI (Incident Brief)
- [x] `ANTHROPIC_API_KEY` はオプション・デフォルト無効
- [x] 送信データは redact 済み（title / message / PII を含まない）
- [x] README とコメントでプライバシー方針を明記

---

## リリース前チェック

### コード品質
- [x] `pnpm typecheck` が全パッケージで通ることを確認する
- [x] `pnpm --filter @bionic/engine test` が全テスト通過することを確認する
- [x] `pnpm --filter @bionic/app build` が成功することを確認する

### DB Migration
- [x] 全migrationが `supabase/migrations/` に記録されていることを確認する
- [x] `supabase/migrations/README.md` の適用済みテーブルが最新であることを確認する
- [x] 新しいDBカラムがshared型に反映されていることを確認する

### ドキュメント
- [x] `docs/MCP.md` のClaude Desktop設定が最新であることを確認する
- [x] `.env.example` の変数が最新であることを確認する
- [x] `README.md` の起動手順が正確であることを確認する
- [x] 10-minute Quickstart が README に含まれる
- [x] OSSライセンス方針確定（AGPL-3.0 + `LICENSE` ファイル配置済み）

### GitHub公開前
- [x] LICENSE（AGPL-3.0）が repo root に配置されている
- [x] README の License セクションが AGPL-3.0 を明記（planned 表記なし）
- [x] `docs/SHOW_HN.md` に投稿文がある
- [ ] gitleaks CI 結果を直前に再確認する
- [ ] クリーン環境で `pnpm install && pnpm verify` を流す
- [ ] 公開直前に最新ブランチで `gh secret list` 等を使って秘匿情報のコミット漏れを再確認する

---

## Supabase key漏洩時の対応手順

1. Supabaseダッシュボード → Settings → API → Rotate keys
2. `.env.local` の `SUPABASE_SERVICE_ROLE_KEY` を新しいkeyに更新する
3. Vercel等のホスティング環境の環境変数を更新する
4. Engineを再起動する

---

_最終更新: 2026-04-14_
