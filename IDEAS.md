# Bionic - Ideas
> まだ仕様化していない発想、違和感、仮説、あとで育てたい話を書く場所。

---

## このファイルの役割

`IDEAS.md` は **まだ実行タスクにしない内容** を置く。

ここに書いてよいもの：
- 思いついた機能案
- まだ調べ切っていない仮説
- 会話の中で出た面白い方向性
- 将来やるかもしれない設計案
- すぐ決めない論点

ここに書かないもの：
- 今すぐやる作業
- 実行中のタスク
- 完了報告
- 現在の正本状態

---

## 他ファイルとの違い

- `CURRENT.md`
  - 今この瞬間の状態と次の1手
- `WORK_LOG.md`
  - 実際にやったこと、判断、未解決
- `HANDOFF.md`
  - チャットをまたぐための圧縮サマリ
- `IDEAS.md`
  - まだ仕様化していない発想の保管庫

---

## 運用ルール

1. アイデアは思いついた時点で短く書いてよい
2. 実装する段階になったら `CURRENT.md` または仕様書へ昇格させる
3. 却下したアイデアも消さずに「保留 / 却下」と明記して残してよい
4. 長い議論になった場合は、最後に要点だけここへ圧縮して残す

---

## 書き方

```markdown
## YYYY-MM-DD / [担当]

### アイデア
- 

### なぜ気になったか
- 

### いまの判断
- 保留 / 要調査 / 後で仕様化 / 却下

### 次にやるなら
- 
```

---

## 2026-04-09 / Codex

### アイデア
- `IDEAS.md` を、実行タスクと未成熟な発想を分けるための保管場所として追加する

### なぜ気になったか
- `CURRENT.md` や `WORK_LOG.md` にアイデアが混ざると、今やることと将来考えることの境界が崩れやすい

### いまの判断
- 後で仕様化

### 次にやるなら
- Bionic の会話で出た未整理アイデアをここへ移していく

---

## 2026-04-11 / Claude

### アイデア
- Discordからメッセージを送ってBionic Engineを操作する（Discord Bot統合）

### 内容
- discord.jsをpackages/engine内に組み込む
- `!digest` → research digestを即時実行
- `!status` → Engineステータスを返す
- `!research [トピック]` → リサーチを実行して保存
- `!approve [job_id]` → jobを承認して実行
- コストはDiscord Bot作成・運用ともに無料
- リサーチにClaude APIを使う場合のみAPIコストがかかる

### なぜ気になったか
- 将来的にDiscordを「人間が止められる中間点」として活用できる
- 通知だけでなく双方向操作にすることでBionicの価値が上がる
- アプリを開かずにDiscordだけで運用できる可能性がある

### いまの判断
- 後で仕様化

### 次にやるなら
- discord.jsの調査
- packages/engine/src/discord/ モジュールの設計
- Bionic EngineへのBot統合

---

## 2026-04-11 / Claude（リサーチ統合）

### アイデア群（外部リサーチから）

#### Deploy→Watch→Alert
- Vercelデプロイ後30分間のエラー率変化を自動監視
- 「デプロイabc123の12分後にチェックアウトAPIのエラーが340%増加」という形で相関を報告
- いまの判断：Phase 2中期（#6）
- 参照タイミング：Vercel Webhook連携を実装する時（優先順位#8）

#### bionic-ops MCPサーバー
- packages/mcpとして独立
- Claude Desktopから「Mediniの今日のエラーを見せて」と聞けるようになる
- 現在MCPエコシステムにDevOps/監視系サーバーは極端に少ない。差別化余地あり
- いまの判断：Phase 2中期（#7）
- 参照タイミング：packages/mcpの実装を開始する時（優先順位#9）

#### Raycast拡張
- 現在オペレーション特化のRaycast拡張は存在しない
- LinearのRaycast拡張は202,000以上のインストール
- Bionicのステータス・アラートを確認できるRaycast拡張は配布チャンネルになる
- いまの判断：長期
- 参照タイミング：公開後の配布チャンネルを検討する時

#### AIコンフィデンススコアリング（4段階）
- 🔴 即座に割り込む（Discord DM）：本番停止・決済失敗
- 🟡 手が空いたら確認（チャンネル投稿）：エラー率上昇
- 🟢 デイリーダイジェスト：軽微な異常
- いまの判断：長期
- 参照タイミング：engine_alertsのurgency/impactカラムを設計する時、Discord通知の優先度設計を始める時

#### 自己生成ランブック
- インシデント発生→解決の履歴からLLMがランブックを自動生成
- いまの判断：長期
- 参照タイミング：engine_actionsのパターン学習を設計する時（Phase 3）

#### ローカルLLM推論（Ollama）
- M4 Pro 24GB以上でQwen 3.5-35B等が実用的に動く
- プライバシー重視ユーザー向けにCloud AI不要の選択肢
- いまの判断：長期
- 参照タイミング：Phase 3の自律運用設計を始める時

#### 価格設計案
- Free：$0 / 1プロジェクト・3連携・デイリーダイジェスト・7日間履歴
- Solo Pro：$14/月 / 無制限連携・リアルタイムアラート・90日履歴・AIスコアリング・デプロイ相関
- Team：$29/月 / 複数プロジェクト・共有ダッシュボード・ランブック生成・API
- いまの判断：製品化フェーズで確定
- 参照タイミング：製品化フェーズに入る時、GitHubでの公開準備を始める時

---

## 2026-04-11 / Claude

### アイデア
- GitHubおよび技術ブログでのBionic公開戦略

### 内容

**公開タイミング（以下が揃ったら）**
- Event → Alert Decision（自動alertが生成される）
- Scheduler（自動digestが届く）
- Deploy→Watch→Alert（デプロイ後の相関通知）
- bionic-ops MCPサーバー（Claude Desktopから操作できる）

**GitHub公開方針**
- OSSとして公開（AGPL-3.0 + 商用デュアルライセンス）
- Nectaで経験済みの構成を踏襲
- MCPエコシステムへの参加・Hacker Newsでの注目・コントリビューター獲得を狙う

**技術ブログのタイトル候補（英語）**
- "I built a local-first ops engine because Claude Code sleeps when I close my terminal"
- "Why I stopped using AI tools for monitoring and built a deterministic alternative"
- どちらもHN上位に来やすい「Why I stopped using X」「I built Y because Z」パターン

**準備として今からやること**
- READMEとドキュメントを実装と並行して整備する
- 公開時の労力を下げるため、機能追加のたびにREADMEを更新する習慣をつける

**配布チャンネルの優先順位**
1. Hacker News（Show HN）
2. GitHub（スター・フォーク・コントリビューター）
3. MCPエコシステム（bionic-ops MCPサーバーの登録）
4. Raycast拡張（将来）
5. Product Hunt

### なぜ気になったか
- 「個人開発者向けローカルファーストopsエンジン」というカテゴリーは存在しない
- 最初に言語化して公開した人がカテゴリーのオーナーになる
- 英語市場の開発者コミュニティへの入口として技術ブログ・GitHubが最優先

### いまの判断
- 後で仕様化（公開タイミングは上記4条件が揃ったとき）

### 次にやるなら
- 実装と並行してREADMEを整備する
- 公開タイミングの4条件が揃ったらHN投稿文を作成する

### 参照タイミング
- GitHub公開準備を始める時
- 技術ブログ執筆を始める時
- Show HN投稿を準備する時

---

## 2026-04-11 / Claude

### アイデア
- セットアップフローでの自動化レベル・権限の設定

### 内容

最近のプロダクトトレンドとして、初回セットアップ時に
ユーザーが詳細を設定していく体験（オンボーディングフロー）が主流になっている。

Bionicのセットアップでユーザーに選択させるべき項目候補：

**自動化レベルの設定**
- 「どこまで自動実行を許可するか」を最初に選ばせる
- 例：Conservative（通知のみ）/ Balanced（安全な自動修復）/ Autonomous（積極的に自動化）
- 後からCLIで変更可能にする

**通知設定**
- quiet hoursの時間帯
- criticalアラートのquiet hours例外を有効にするか
- 再通知の間隔（30分 / 1時間 / 2時間）

**承認フローの設定**
- デフォルトの承認チャンネル（CLI / App / 両方）
- stale approvalの自動キャンセル期限（24h / 48h / 72h）

**サービス接続**
- どのSaaSを監視対象にするか
- SDKをどのサービスに組み込むか
- Discord Webhook URLの設定

**参考プロダクト**
- Linear（プロジェクト設定フロー）
- Vercel（初回デプロイ設定）
- Raycast（拡張機能の初期設定）
- Notion（ワークスペース作成フロー）
- Clerk（認証設定ウィザード）

### なぜ気になったか
- セットアップ時に選択肢を与えることでユーザーが自分のワークフローに合わせられる
- 最初から全部決め打ちにすると、ユーザーによって合わない設定が出てくる
- オンボーディングフローはプロダクトの第一印象を決める

### いまの判断
- 後で仕様化（CLI / App実装時に組み込む）

### 次にやるなら
- セットアップウィザードの画面設計
- bionic init コマンドの実装
- 設定をDBまたはローカルファイルに保存する設計

### 参照タイミング
- CLIにbionic initコマンドを追加する時
- Bionic Appにオンボーディング画面を追加する時

---

## 2026-04-11 / Claude

### アイデア
- CLI配布時のbin構成移行（Phase 1.5→公開時）

### 内容
現在はtsx経由でのdev起動のみ（package.jsonのbinを削除済み）。
将来公開・配布する時に以下の対応が必要:
- pnpm buildでdist/配下にJavaScriptをコンパイルする
- package.jsonのbinをdist/index.jsに向ける
- shebang（#!/usr/bin/env node）をdist/index.jsに含める
- npm publishまたはGitHub Packagesで配布する

### いまの判断
- 後で仕様化（公開タイミングで対応）

### 次にやるなら
- packages/cli/tsconfig.jsonのoutDir確認
- dist/index.jsへのbinの向け直し
- npm publish設定

### 参照タイミング
- GitHub公開準備を始める時
- npm publish設定を行う時

---

## 2026-04-11 / Claude（抜け漏れ補完）

### アイデア1: Supabase直接read（ハイブリッド設計）

Phase 2でAuth・RLS・project_membersとセットで実装する。

現在の設計：App → Engine → Supabase（Engine経由のみ）
将来の設計：読み取りはApp → Supabase直接 / 書き込みはApp → Engine → Supabase

必要になるもの：
- Supabase Auth（ユーザー認証）
- project_membersテーブル（誰がどのプロジェクトを見られるか）
- 各テーブルのRLSポリシー（auth.uid()ベース）
- NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY

メリット：Engineがオフラインでもダッシュボードが見える。将来のVercelデプロイにも対応。

いまの判断：Phase 2で実装（Auth・RLS・project_membersとセット）

### 参照タイミング
- Phase 2のチーム利用設計を始める時
- Bionic AppをVercelにデプロイする時

---

### アイデア2: チーム利用時のproject_members設計

チーム利用（2〜5人）に向けて必要になる設計。

必要なもの：
- project_membersテーブル（user_id / project_id / role）
- engine_actionsのapproved_by / denied_byカラム（追加済み）
- 誰がどのprojectを見られるかのRLSポリシー
- Discordのチームチャンネル設定
- CLIの--actor-idオプション

いまの判断：Phase 2で実装（チーム利用開始時）

### 参照タイミング
- Phase 2のチーム利用設計を始める時
- Discord Botの権限設計を始める時

---

### アイデア3: 自己修復の段階的実装定義

3段階の自動化レベル：

Level 1（自動実行・副作用なし）：
- キャッシュクリア・接続プールリセット・job retry（冪等のみ）・通知送信
- 実行後にAudit Logに記録

Level 2（承認必要・副作用あり）：
- デプロイロールバック・サービス再起動・DB接続フェイルオーバー
- Discordで提案→CLIまたはAppで承認

Level 3（永遠に自動化しない）：
- 認証情報・シークレットの変更
- 課金設定の変更
- ユーザーデータの削除・変更
- 権限設定の変更

いまの判断：後で仕様化（engine_actions実装後）

### 参照タイミング
- Action Layerの実装を始める時（Phase 2）
- repair runnerを設計する時

---

### アイデア4: 信頼スコアによる自動化範囲の拡大

実績が積まれると自動化できる範囲が広がる仕組み。

設計原則：
- 最初は表示・提案のみ（自動化権限の変更には使わない）
- 人間がCLIで明示的に「このaction typeは自動化してよい」と設定した場合のみ自動化範囲が広がる
- 信頼スコアはDashboardに表示してユーザーが把握できるようにする

いまの判断：後で仕様化（Phase 3）

### 参照タイミング
- Phase 3の自律運用設計を始める時
- engine_actionsのconfidence_scoreを使い始める時

---

### アイデア5: Audit Logの改ざん対策

監査ログの信頼性を高めるための設計。

候補：
- append-only化（updateを禁止してinsertのみ許可）
- 署名/hash chain（前のレコードのハッシュを次のレコードに含める）
- Supabase Edge Functionsでの検証

いまの判断：後で仕様化（製品化フェーズ）

### 参照タイミング
- 製品化フェーズに入る時
- engine_actionsをappend-only設計に変更する時

---

## 2026-04-11 / Codex + Claude（設計負債・将来懸念）

### アイデア1: Engineの実行責務分離

現状の問題：
routes/jobs.tsがjob実行・Decision呼び出し・Action記録を全部やっている。
Discord Bot・MCP・repair runnerが増えると崩れる。

目標設計：
- HTTP routeは受付・バリデーションのみ
- 実処理はservice/job/action層に分離
- routes/ → services/ → jobs/ → actions/ の依存方向を守る

いまの判断：後で仕様化（Discord Bot実装前に整理）

### 参照タイミング
- Discord Bot実装を始める前
- MCPサーバー実装を始める前
- repair runner設計を始める時

---

### アイデア2: DB job runnerの明確化

現状の問題：
cronがその場で実行・HTTP routeもその場で実行という混在状態。
approval後の再開・crash recoveryができない。

目標設計：
- engine_jobsのpendingを拾う専用runner
- retry・crash recovery・approval後再開を統一的に処理
- 冪等性キー・最大retry回数・前回error保持を定義する

いまの判断：後で仕様化（Phase 2）

### 参照タイミング
- retry_job actionを実装する時
- approval後の再実行フローを設計する時

---

### アイデア3: SDKイベントのrate limit・dedupe

現状の問題：
Medini起動時のcatch節が連続でerrorを送った件が発生済み。
根本的な対策がまだない。

必要な対策：
- rate limit（同一serviceIdから1分間に最大N件）
- client_event_idによるdedupe（同じIDは1回だけ処理）
- source filteringによるノイズ除去
- payload sizeの上限（現在1MB body limitのみ）

いまの判断：後で仕様化（SDK v2設計時）

### 参照タイミング
- SDK v2の設計を始める時
- Medini以外のサービスにSDKを組み込む時

---

### アイデア4: job/action状態遷移の一元化

現状の問題：
状態遷移（pending→running→completed等）がrouteごとに直接updateされている。
不正遷移を防げない。

目標設計：
- 状態遷移専用関数（transitionJobStatus / transitionActionStatus）
- 不正遷移時はエラーを返す
- 遷移ログをengine_eventsに記録する

いまの判断：後で仕様化（Phase 2）

### 参照タイミング
- repair runnerを設計する時
- retry_jobを実装する時
- Discord Botの承認フローを実装する時

---

### アイデア5: 通知ポリシーモジュール

現状の問題：
Discord通知はActionだが「通知すべきか」「何回送るか」「quiet hoursか」がDecision/Policy寄り。
今後critical再通知・stale approval通知を入れるとrouteが複雑になる。

目標設計：
- packages/engine/src/policies/notification.ts
- 通知条件・頻度・quiet hoursをルールとして管理
- json-rules-engineと組み合わせる

いまの判断：後で仕様化（Discord Bot実装前）

### 参照タイミング
- Discord Botを実装する前
- critical再通知・stale approval通知を実装する時

---

### アイデア6: eventのpayload schema versioning

現状の問題：
payloadがRecord<string, unknown>のまま運用データが貯まると後から型を締めるのが困難。

目標設計：
- EngineEvent.payloadにschemaVersionフィールドを追加する余地を持つ
- event typeごとのpayload定義をdocsに残す
- 将来の移行時にschemaVersionで分岐できるようにする

いまの判断：後で仕様化（SDK v2設計時）

### 参照タイミング
- SDK v2の設計を始める時
- event typeを追加する時

---

### アイデア7: ローカルファーストとSupabase依存の緊張

現状の問題：
Supabaseが落ちるとEngineの記録・判断が止まる。
「ローカルファースト」を強く打ち出すなら矛盾する。

目標設計：
- SQLite/buffered write/outbox設計
- Supabaseへの書き込みが失敗した場合はローカルにバッファ
- 復帰時に同期する

いまの判断：後で仕様化（Phase 2・better-sqlite3導入時）

### 参照タイミング
- better-sqlite3を導入する時（Phase 2）
- ローカルファーストを強く打ち出す時

---

### アイデア8: 承認UXの見落とし防止

現状の問題：
「Discordは気づく・CLI/Appで承認」は良い思想だが承認待ちが埋もれるリスクがある。

必要な対策：
- CLI起動時のpending表示（bionic statusでpendingActionsを強調）
- AppのDashboardにbadge表示
- 24h stale approval再通知（BIONIC_PRODUCT.mdに記載済み）
- 48h auto-cancel（BIONIC_PRODUCT.mdに記載済み）
- stale approvalの処理をSchedulerに追加する

いまの判断：後で仕様化（Discord Bot実装後）

### 参照タイミング
- Discord Botを実装する時
- CLIにstale approval表示を追加する時
- Schedulerにstale approval再通知を追加する時

---

## 2026-04-15 / Claude Code（Phase 2.5a uptime実装の派生）

### アイデア9: Servicesのstatus表現の役割分担整理

**現状の問題**
- Servicesページは Engine `/api/services` のレスポンスに基づいて status/sources バッジを出している（`'uptime'` source含む）
- 同じページが `/api/uptime-targets` も直接叩き、「UPTIME UP / DOWN / MIXED / PENDING」という独自バッジを追加表示している
- 両者は情報の重なりがあり、UP/DOWN を2つのバッジが別表現で語っている状態

**整理案**
- Engine `/api/services` にサービスごとの uptime サマリ（target数・down数・latest latency）を含めて、App側は1経路で描画する
- またはバッジ2つの役割を明示的に分ける: source pill は「Uptime監視が有効」、詳細バッジは「現在のupタイミング・Nms遅延」のように読み解かせる

### なぜ気になったか
- 情報密度が高いダッシュボードで「同じ事実を2つの場所で語る」のは可読性を下げる
- 将来 Cron heartbeat / Synthetic monitoring を足すと同じ重複構造が増える

### いまの判断
- 後で仕様化（Phase 2.5b Cron heartbeat 実装時にまとめて再設計する）

### 参照タイミング
- Phase 2.5b Cron heartbeat 監視を着手する時
- ダッシュボード情報密度を見直す時

---

### アイデア10: ServiceSource型の shared 昇格

**現状の問題**
- `ServiceSource` 型は `packages/engine/src/routes/services.ts` と `apps/app/src/lib/engine.ts` で別々に宣言されている（Phase 2.5a で `'uptime'` を両方に追加済み）
- 同じ union を二箇所で保守しており、新 source を追加するたびに片方更新漏れのリスクがある

**改善案**
- `packages/shared/src/types.ts` に `ServiceSource` / `ServiceStatus` / `ServiceSummary` を昇格
- Engine/App の両方でそれを import してローカル宣言を削除
- 他の UI 型（`ServiceWatchStatus`等）も機械的に昇格できる

### なぜ気になったか
- `@bionic/shared` のための分離なのに、境界で drift すると型安全の意義が薄れる
- Next.js の RSC 境界で `@bionic/shared` import が bundle 問題を起こす懸念は Phase 2.5a の実装時に取り越し苦労だった可能性がある（再検証要）

### いまの判断
- 後で仕様化（次の shared 型追加タスクと合流）

### 参照タイミング
- `@bionic/shared` に型を追加するタスクの時
- App 側の Next.js bundling 問題を再検証する時
