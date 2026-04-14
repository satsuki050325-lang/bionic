# Bionic - ロードマップ

> 実装の指針。タスク開始前に必ず参照すること。
> 更新日: 2026-04-13

---

## 設計思想

機能を増やすより「壊れにくい運用エンジン」を先に作る。
承認・再通知・再実行・状態遷移が安定してから、自律化へ進む。

---

## Phase 1.8: Stabilize Bionic Core（今ここ）

土台を締める。ここをやると今後の機能追加が安全になる。

- [x] ✅ `config.ts` 導入（env読み取り・validation・default値を一元化）
- [x] `pnpm verify` 追加（typecheck + engine test + app build を一発実行）
- [x] README起動手順の整備（最小起動・Discord Botあり・MCPあり・Vercel webhook/ngrokあり）
- [x] `TECHNICAL_DESIGN.md` の実装追従（既に実装済みなのに古い記述が残っている箇所を更新）
- [x] secrets scan CI追加（gitleaksをCIに組み込む）
- [x] migration fresh apply確認（空DBにmigration適用してEngineが動くことを確認）

---

## Phase 2.0: Runner / Policy / Approvalの完成

Bionicが「ただ通知するツール」から「運用エンジン」になる。

- [x] DB job runnerの明確化（`pending` jobを拾って実行する専用runner）
- [x] job/action状態遷移の一元化（`transitionJobStatus` / `transitionActionStatus`）
- [x] stale approval runner（24h再通知・48h auto-cancel）
- [x] critical alert reminder（30分後再通知）
- [x] `sendApprovalNotification` の結線(pending_approval action生成時にDiscord通知)
- [x] approved action runner（`approved` になったactionを誰が再開するか決める）
- [x] retry_job最小実装（冪等なjobだけ再試行）

---

## Phase 2.1: Productizable Setup

「自分だけが分かる開発中ツール」から「他の個人開発者も試せるプロダクト」になる。

- [x] `bionic init` 最小実装（.env.local生成・Discord Bot設定確認・Supabase接続確認）
- [x] Engine diagnostics画面（Scheduler稼働・Discord接続・DB接続・Webhook状態）
- [x] Appオンボーディング画面

---

## Phase 2.2: Signal Quality

通知が多すぎると価値が落ちる。ノイズを減らす。

- [x] SDK event rate limit・dedupe
- [x] payload schema versioning
- [x] alert fingerprint見直し
- [x] service別しきい値設定
- [x] deployment regression閾値調整
- [x] alert resolve flow

---

## Phase 2.3: Integrations That Prove Value

新しい外部連携を足す。

1. ~~GitHub連携（issue/PR/CI失敗）~~ — CI失敗検知 完了（Phase 2.3-1）
2. ~~Stripe監視（payment failed / MRR change）~~ — 完了（Phase 2.3-2）
3. ~~Sentry連携~~ — 完了（Phase 2.3-3）
4. ~~Deploy→Watch判定精度向上（Vercel Runtime Logs連携は次段階）~~ — 完了（Phase 2.3-4）
5. ~~Medini以外のSDK組み込み~~ — SDK品質改善で完了（Phase 2.3-5）

---

## Phase 2.4: Public Preview

外に出す準備。

- [x] `bionic doctor`（ローカル環境診断コマンド）
- [x] Dashboard UI改善（Operational Brief・Incident Brief・動線強化）
- [x] Alerts UI改善（Resolve導線・Next Step・相対時間）
- [x] Settingsページ実装（言語切り替え・Advanced設定表示）
- [x] Dashboard sparkline実装
- [x] アイコン導入・Actions skipped理由表示
- [x] Servicesページ・Add Service実装
- [ ] README英語化
- [ ] SECURITY_RELEASE_CHECKLIST完了確認
- [ ] LICENSE方針確定（AGPL-3.0 + 商用デュアルライセンス）
- [ ] CLI bin/dist対応（IDEAS.mdのメモ参照）
- [ ] MCP docs整備
- [ ] demo動画/GIF
- [ ] Show HN投稿文（IDEAS.mdのタイトル候補参照）
- [ ] GitHub公開
- [ ] 最小サンプルアプリ追加

---

## Phase 3: Autonomous Ops

承認・runner・通知・状態遷移が固まってから着手する。

- [ ] repair runner
- [ ] runbook自動生成
- [ ] trust score（最初は表示のみ）
- [ ] json-rules-engine DB保存
- [ ] automatic safe repairs（Level 1）
- [ ] approval_required repairs（Level 2）
- [ ] local SQLite/outbox（ローカルファースト強化）
- [ ] local LLM/Ollama
- [ ] Raycast extension

---

## 判断基準

迷ったらこの順で判断する：

1. 「いいものを作る」が第一。実装コストを理由にした妥協は却下。
2. 壊れにくいか・再現性があるか・回復できるか。
3. 設計思想（BIONIC_PRODUCT.md）と整合しているか。
4. 将来の拡張を妨げないか。
