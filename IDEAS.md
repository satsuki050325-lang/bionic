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

#### bionic-ops MCPサーバー
- packages/mcpとして独立
- Claude Desktopから「Mediniの今日のエラーを見せて」と聞けるようになる
- 現在MCPエコシステムにDevOps/監視系サーバーは極端に少ない。差別化余地あり
- いまの判断：Phase 2中期（#7）

#### Raycast拡張
- 現在オペレーション特化のRaycast拡張は存在しない
- LinearのRaycast拡張は202,000以上のインストール
- Bionicのステータス・アラートを確認できるRaycast拡張は配布チャンネルになる
- いまの判断：長期

#### AIコンフィデンススコアリング（4段階）
- 🔴 即座に割り込む（Discord DM）：本番停止・決済失敗
- 🟡 手が空いたら確認（チャンネル投稿）：エラー率上昇
- 🟢 デイリーダイジェスト：軽微な異常
- いまの判断：長期

#### 自己生成ランブック
- インシデント発生→解決の履歴からLLMがランブックを自動生成
- いまの判断：長期

#### ローカルLLM推論（Ollama）
- M4 Pro 24GB以上でQwen 3.5-35B等が実用的に動く
- プライバシー重視ユーザー向けにCloud AI不要の選択肢
- いまの判断：長期

#### 価格設計案
- Free：$0 / 1プロジェクト・3連携・デイリーダイジェスト・7日間履歴
- Solo Pro：$14/月 / 無制限連携・リアルタイムアラート・90日履歴・AIスコアリング・デプロイ相関
- Team：$29/月 / 複数プロジェクト・共有ダッシュボード・ランブック生成・API
- いまの判断：製品化フェーズで確定

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

---

### アイデア4: 信頼スコアによる自動化範囲の拡大

実績が積まれると自動化できる範囲が広がる仕組み。

設計原則：
- 最初は表示・提案のみ（自動化権限の変更には使わない）
- 人間がCLIで明示的に「このaction typeは自動化してよい」と設定した場合のみ自動化範囲が広がる
- 信頼スコアはDashboardに表示してユーザーが把握できるようにする

いまの判断：後で仕様化（Phase 3）

---

### アイデア5: Audit Logの改ざん対策

監査ログの信頼性を高めるための設計。

候補：
- append-only化（updateを禁止してinsertのみ許可）
- 署名/hash chain（前のレコードのハッシュを次のレコードに含める）
- Supabase Edge Functionsでの検証

いまの判断：後で仕様化（製品化フェーズ）
