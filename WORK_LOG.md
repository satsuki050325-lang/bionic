# Bionic - 作業ログ
> 判断・作業・未解決事項の時系列記録。Claude以外も書いてよい。

---

## 2026-04-14 / Claude Code

### やったこと
- Actions status バッジの彩度を再調整: `STATUS_CLASS` map を導入し、`succeeded` / `failed` / `pending_approval` / `running` は 20% 塗り + full-intensity text + `font-semibold` でハッキリ。`skipped` / `cancelled` / `pending` は `bg-bg-elevated` + `text-text-secondary` 系で muted に寄せた。`approved` / `denied` / `needs_review` は同色カテゴリの semibold なし版
- Diagnostics の 3 階層を整理: セクションタイトル（Block title）を `text-text-muted` + `mb-4` に、KV label を `text-xs text-text-muted tracking-wide`、KV value を既定 `text-sm font-bold`（テキスト値）+ 新規 `size="lg"` prop で `text-lg font-bold`（JOB QUEUE / ACTIONS の数値 10 カ所に適用）
- Settings も同じ階層ルールに寄せた: `SettingSection` タイトル色を `text-text-muted` に、`SettingRow` ラベルを `text-xs text-text-muted`、値を `text-sm`（従来 `text-xs`）に拡大。Preferences / Language の custom 行も同じラベル色に揃えた
- pnpm verify 通過（typecheck + engine test 36件 + app build 13 routes）

### 判断したこと
- Actions の status クラスを map に切り出した: 9+ 状態を if 連鎖で回すと読みづらく、状態追加のたびに分岐漏れが発生する。map + `STATUS_CLASS[status] ?? STATUS_CLASS['pending']` で fallback を 1 箇所に集約
- `font-heading` を値表示から外した: Space Grotesk は見出し・決定ラベル用途（DESIGN.md §3）。ここは「監視盤の値」なので `font-mono` が一貫。数値比較と ID が隣接するため、mono 揃えの方が grid を読みやすい
- JOB QUEUE / ACTIONS だけ `size="lg"`: DESIGN.md の「ダッシュボードの数値は大きく」を踏襲。時刻表示（OLDEST PENDING）はテキスト寄りなので sm に残す
- Settings 値を `text-sm` に: 旧 `text-xs` は label と同サイズで視覚階層が潰れていた。`font-bold` は入れずサイズ差だけで分離（値は多く並ぶため太字は重くなる）

### 次にやること
- Phase 2.4: 最終確認・GitHub公開

担当：Claude Code

---

## 2026-04-14 / Claude Code

### やったこと
- ナビゲーションを 6 項目に整理（Dashboard / Services / Alerts / Actions / Diagnostics / Settings）。Onboarding と Research をナビから削除（ルートは存続）
- ナビ各リンクに lucide アイコンを追加（LayoutDashboard / Layers / TriangleAlert / ScrollText / Activity / Settings、14px、strokeWidth 1.75、`text-text-muted`）
- Settings 下部 CTA に `System Check →`（`/onboarding`）リンクを追加（en/ja 辞書に `systemCheck` を追加）
- Actions 一覧の各行を固定幅レイアウトに: `w-44` 状態 + `w-48` type + `flex-1` title + shrink-0 timestamp。縦に整列
- SUCCEEDED バッジを明るく（`text-status-success border-status-success/50 bg-status-success/15`、`badge-success` utility の 20/30 より視認性を高めた）。他のステータスは `badge-*` utility を継続利用
- Diagnostics の KV ラベル色を `text-text-secondary` → `text-text-muted` に、tracking を `widest` に変更して値との視覚階層を強化
- Scheduler Runners セクションを `grid-cols-[200px_96px_1fr_auto]` に再構築。名前 → バッジ → 直近エラーメッセージ → 最終実行時刻の 4 カラムで縦揃い
- pnpm verify 通過（typecheck + engine test 36件 + app build 13 routes）

### 判断したこと
- Onboarding/Research を nav から外しつつ route は残す: Settings からリンクがあれば初回セットアップ導線は維持できる。Research は今は主要動線に乗せず将来 Dashboard 内部セクションに統合する余地を残す
- SUCCEEDED だけ `badge-success` utility を避けて explicit クラスにした: utility を変更すると Diagnostics 側の「OK」バッジなど広範に影響するため、局所上書きで副作用を封じる
- Runner の 3 列目に `lastError` を表示: 既存の空表示から「最新の失敗理由」を一覧時点で見せる方が運用価値が高い（成功時は空文字で見た目が崩れない）
- ナビアイコンは `text-text-muted` で常時薄く、テキスト側のみ hover で accent に遷移: Nav は DESIGN.md の「decoration ではなく functional label」原則に沿い、アイコン色の強調は避けた

### 次にやること
- Phase 2.4: 最終確認・GitHub公開

担当：Claude Code

---

## 2026-04-14 / Claude

### やったこと
- Servicesページを実装した（engine_events/alertsから推定）
- GET /api/servicesをEngineに追加した
- Add Serviceページを実装した（4ステップウィザード）
- Direct API（curl）をデフォルト推奨にした
- Bash/PowerShell両対応のcurl snippetを実装した
- SDK workspace依存の警告を追加した
- Test Eventボタン（Server Action）を実装した
- Webhook設定手順（コロン区切り形式）を追加した
- ナビゲーションにServicesを追加した（Dashboard直後）
- OnboardingにAdd Service導線を追加した
- Codexレビュー完了・全finding修正済み

### 判断したこと
- SDKはworkspace依存のため公開前はDirect APIを推奨
- servicesテーブルはPhase 2.4では作らない（推定で足りる）
- Phase 2.5でUptime ping監視を追加する

### 次にやること
- Phase 2.4: 最終確認・GitHub公開

担当：Claude

---

## 2026-04-14 / Claude Code

### やったこと
- Add Service curl snippet に OS タブ（Bash / PowerShell）を追加
- `generatePowerShellSnippet` を新設: `Invoke-RestMethod` + `ConvertTo-Json -Depth 5`、`$env:BIONIC_ENGINE_TOKEN` 参照、`(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")` で ISO-8601 UTC を生成。health/error の 2 例を出力
- Direct API ブロック冒頭にシェルタブを配置（Bash が左デフォルト、PowerShell が右）。ラベルは `Bash (macOS / Linux / WSL)` / `PowerShell (Windows)` で使用環境を明示
- 注釈を「timestamp は置換」から「snippet がランタイムで occurredAt を計算」に更新（bash の `$(date)` も PowerShell の `Get-Date` も実行時評価なので正確）
- pnpm verify 通過（typecheck + engine test 36件 + app build 13 routes）

### 判断したこと
- PowerShell の日時は `.ToUniversalTime().ToString(...)` を採用。`Get-Date -Format` は既定でローカル TZ を返すため、UTC `Z` サフィックスと食い違う。UTC へ明示変換してから ISO-8601 Z 形式で emit
- ヘッダーを Hashtable でまとめる方式に統一（`Invoke-RestMethod -Headers @{...}`）。Bash snippet の `-H` 複数指定と対称になる
- Bash タブラベルに `WSL` を明記: Windows ユーザーで WSL 派の取りこぼしを防ぐ
- ConvertTo-Json の `-Depth 5` は `payload` がネスト構造になり得ることを想定した安全側の値（既定 2 だと深いペイロードで切れる）

### 次にやること
- 最終 UI レビュー・公開判断

担当：Claude Code

---

## 2026-04-14 / Claude Code

### やったこと
- Add Service の P1/P2 finding 2件を追加修正
- P1: Direct API (curl) をデフォルト & 推奨表示に変更（`useState<InstallMethod>('curl')`、タブ順序を curl 左 / sdk 右に、ラベルを `Direct API (recommended)` / `TypeScript SDK (advanced)` に）。SDK タブ選択時は `bg-status-warning/10` の警告ボックスで「@bionic/shared 依存のため npm publish 前は単独 install 不可」を明示
- P2: curl snippet に `Authorization: Bearer $BIONIC_ENGINE_TOKEN` ヘッダを追加。ヘッダ冒頭コメントで「token 未設定なら Authorization 行を削除」を案内。`occurredAt` を `'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'` のシェル展開でランタイム生成（固定文字列の誤解を防ぐ）
- pnpm verify 通過（typecheck + engine test 36件 + app build 13 routes）

### 判断したこと
- デフォルトを curl にする判断: 外部ユーザーが「コピペ→即動作」できる体験を最短にする。SDK は npm publish 後に推奨へ昇格する想定
- Authorization ヘッダはトークン未設定環境でもそのまま動く（Engine 側 middleware が空 Bearer を 401 にしない構成のはず）が、コメントで明示的に削除を促す方が誤配ミス（本番で空 token 送信）を防げる
- date シェル展開は POSIX (`-u +Y-%m-%dT%H:%M:%SZ`) を採用。GNU/BSD 両系で動作

### 次にやること
- 最終 UI レビュー・公開判断

担当：Claude Code

---

## 2026-04-14 / Claude Code

### やったこと
- Add Service の P1/P2 finding 4件を修正
- P1 #1: SDK install を現実に即した内容に再構成。Step 02 を「Choose how to integrate」に拡張し `TypeScript SDK` / `Direct API (curl)` トグルを追加。SDK 側は monorepo cp / npm link / 将来 npm 公開予定を明記。Direct API 側は `curl -X POST /api/events` の health/error 2 例を生成（外部ユーザーが SDK なしで即試せる）
- P1 #2: Webhook env のフォーマット誤りを修正。`{"prj_xxx":"svc"}` JSON → `prj_xxx:svc` コロン区切り（Engine の `readVercelProjectMap` / `readGitHubRepoMap` が `split(':')` を使っているため。複数は `,` で連結）。各項目に hint 行（プレースホルダ説明・複数指定の書式）を追加
- P2 #1: `/api/services` の DB エラーハンドリング追加。events 取得失敗時は 503 を返却、alerts 取得失敗時は警告ログを残して空配列で継続（events のみで service 列挙は機能継続できる）
- P2 #2: open alert のみあって直近 500 件 events に出てこないサービスも一覧化。alertMap loop 内で `serviceMap.has(sid)` が false なら lastEventAt=null のエントリを追加。`ServiceSummary.lastEventAt` は元から nullable
- 状態判定を null 安全に: `lastEventAt === null` のサービスは critical alert があれば `alerting`、なければ `stale` に分類
- pnpm verify 通過（typecheck + engine test 36件 + app build 13 routes）

### 判断したこと
- npm publish は Phase 2.4 のスコープ外（パッケージング・semver・dist整備が必要）。リリース時の選択肢として明示しつつ、現状で動く手段（cp / npm link）を一級扱いにした
- curl snippet の `occurredAt` は固定文字列 + UI 説明で代替（client 描画時の `new Date()` で hydration mismatch を起こすリスクを避ける）。説明文で「現在時刻に置換」を明記
- Direct API トグル時は framework 選択を非表示（curl は framework 非依存）
- alerts 取得失敗を fatal にしない判断: services 一覧は events ベースでも有用、alert 部分が欠けても運用継続できる方が UX 上望ましい
- alert-only サービスの status 判定は「critical あれば alerting、なければ stale」に統一。alert があるのに events ゼロ＝既に静かなはずなので receiving/quiet には絶対分類しない

### 次にやること
- 最終 UI レビュー・公開判断

担当：Claude Code

---

## 2026-04-14 / Claude Code

### やったこと
- Engine に `GET /api/services` を新設（`packages/engine/src/routes/services.ts`）: engine_events と engine_alerts を service_id でグルーピングし、status（alerting/receiving/quiet/stale/demo）・eventCount24h・sources（SDK/Vercel/GitHub/Stripe/Sentry/CLI 推論）・nextStep を返す
- `packages/engine/src/index.ts` に servicesRouter を登録（`/api/services`）
- `apps/app/src/lib/engine.ts` に `ServiceWatchStatus` / `ServiceSource` / `ServiceSummary` / `ListServicesResult` 型と `getServices()` を追加
- `apps/app/src/app/services/page.tsx` を新設: service カードリスト、空状態（◈ + Add your first service）、alerting カードは `border-status-critical/30` で浮かせる
- `apps/app/src/app/services/new/page.tsx` を Client Component で新設: 4 ステップ（Name → Framework → SDK snippet → Test signal）+ Optional webhooks トグル。Next.js / Express / Other の 3 フレームワーク対応スニペット生成
- `apps/app/src/app/services/new/actions.ts` を Server Action で新設: `sendTestServiceEvent(serviceId)`。`BIONIC_ENGINE_TOKEN` は server-only で使用、POST /api/events へ `service.health.reported` を送る。入力は server 側でも `^[a-z0-9-]+$` で再バリデーション
- ナビゲーションに Services を追加（Dashboard の直後、en=`Services` / ja=`サービス`）
- Onboarding の All Good state に「Next Mission: Add Service →」動線を追加
- pnpm verify 通過（typecheck + engine test 36件 + app build 13 routes）

### 判断したこと
- 型名は `ServiceStatus` にすると shared の `ServiceStatus`（Engine runtime 状態）と衝突するため `ServiceWatchStatus` に改名。サービス単位の「監視下の状態」と意味論的にも分離できた
- Server Action では入力を再バリデーション（クライアント JS を迂回した呼び出し対策）。regex は client と同一で DRY より安全側
- Test signal は `source: 'app'` を使う（既存の VALID_SOURCES に含まれる）。専用の `test_signal` source を増やすと SDK 含む既存コードに影響が出る
- isDemo の判定は `serviceId === 'demo-api' || startsWith('demo-')` と緩めに。`bionic demo` が生成するサンプルを拡張する際に一緒に掴める
- `sources` の推論は「SDK は `service.*` event か source=sdk」「Vercel は deployment_regression alert か payload.provider」「GitHub/Stripe/Sentry は alert type ベース」。Engine 側のイベント名前空間が `github.*` 等で整備されていない前提に立って、alertTypes を優先ソースに利用
- /services の alert-count 表示は critical > 0 のときのみ critical を出す（critical と open の二重表示を避ける）

### 既知リスク / 未解決
- /api/services は engine_events から最新 500 件を走査する単純実装。プロジェクト規模が大きくなると重くなるため、Phase 3 以降で service_id の直接インデックス集計（DB view か materialized view）に置換する余地あり

### 次にやること
- 最終 UI レビュー・公開判断

担当：Claude Code

---

## 2026-04-14 / Claude Code

### やったこと
- ナビゲーションのブランドロゴに `◈` シンボルを追加（`BIONIC / ENGINE` の左、`text-accent font-mono text-lg leading-none`）。ブランドブロック全体を `<a href="/">` でラップしてクリック可能に
- Settings ページのコンテナ幅を `max-w-3xl` → `max-w-5xl` に変更（layout の main と同じ幅に揃える）
- ナビの全リンクラベルを `bionic-locale` cookie に連動させる。`navLabels` 辞書（en/ja）を layout.tsx に定義し、ja では ダッシュボード / セットアップ / アラート / 操作ログ / リサーチ / 診断 / 設定 を表示
- pnpm verify 通過（typecheck + engine test 36件 + app build 11 routes）

### 判断したこと
- `ENGINE` サブラベルは翻訳せず固定（製品名の一部として扱う。DESIGN.md の「ALL CAPS monospace = operational category label」に沿う）
- ブランドブロックを `<a>` でラップ: 従来ロゴはリンクではなかったが、ヘッダーロゴ = ホームが一般慣習。ナビ右側の Dashboard リンクは locale 連動なので機能重複ではない
- ナビリンクは uppercase クラスを外した（日本語では UPPERCASE が機能しないため）。英語時も Settings 等の Title Case にして辞書値を尊重（DESIGN.md は ALL CAPS を mono 専用としているが、ナビは識別よりラベル色・タイポで階層を作る方向に寄せる）
- Settings 幅統一は layout.tsx の main が `max-w-5xl` なので、page 側で再度 `max-w-3xl` を指定すると二重制約で視覚的に中途半端に寄る。5xl に揃えて main のコンテナに任せる

### 次にやること
- 最終 UI レビュー・公開判断

担当：Claude Code

---

## 2026-04-14 / Claude

### やったこと
- lucide-reactを導入した
- AlertSeverityIcon（critical/warning/info）を実装した
- ActionStatusIcon（全状態対応）を実装した
- Alertsのseverity badge左にアイコンを追加した
- Actionsのstatus badge左にアイコンを追加した
- skipped/failedの理由をhumanizeして表示するようにした
- pending_approvalセクションにもbadge・アイコンを追加した
- DESIGN.mdにIcon rulesセクションを追加した
- Codexレビュー完了・P2 finding全修正済み

### 判断したこと
- Navにアイコンは追加しない（Bionicらしさ維持）
- ◈はlucideで置き換えない
- アイコンは必ずテキストラベルと併用

### 次にやること
- 最終UIレビュー・公開判断

担当：Claude

---

## 2026-04-14 / Claude Code

### やったこと
- StatusIcon.tsx の ActionStatus 型を `@bionic/shared` の `SharedActionStatus` + `'needs_review'` 拡張に変更（shared 型の全9状態 pending/running/succeeded/failed/skipped/pending_approval/approved/denied/cancelled + needs_review を網羅）
- `ActionStatusIcon` の switch を全状態対応に拡張: approved→CheckCircle2(success), denied→XCircle(critical), cancelled→MinusCircle(muted), pending→Clock3(muted) を追加。needs_review は Clock3(warning) のまま維持
- Actions ページの pending_approval セクションの各行に ActionStatusIcon + `PENDING_APPROVAL` badge を追加（他の行と視覚的に一貫）
- pnpm verify 通過（typecheck + engine test 36件 + app build 11 routes）

### 判断したこと
- `needs_review` は shared の `ActionStatus` には含まれないが `JobStatus` にある。Engine の notify_discord 失敗時に job 側を needs_review にする実装があり、Actions UI 側の既存 badgeClass もそれを扱っていたため、UI 側の耐性として union 拡張として扱う（ランタイムで万一混入しても壊れない）
- approved / denied のアイコンは succeeded / failed と同じ図案を使う: 運用者にとって「承認＝完了に向かう」「拒否＝失敗系」と視覚同期させた方が審査履歴として読みやすい
- pending_approval の badge は既存 utility `badge-warning` を流用（CSS の単一の真実のソース）。インライン Tailwind でのハードコード色指定は CSS 変数の差し替えが効かなくなるため避けた

### 次にやること
- Phase 2.4 Public Preview 残タスク（スクリーンショット更新・GitHub 公開準備）

担当：Claude Code

---

## 2026-04-14 / Claude Code

### やったこと
- `lucide-react` を `apps/app` に追加
- `apps/app/src/components/StatusIcon.tsx` を新設: `AlertSeverityIcon` / `ActionStatusIcon` の2コンポーネント、7種のステータス対応（succeeded/failed/skipped/pending_approval/running/needs_review + severity 3種）
- `apps/app/src/lib/actionUtils.ts` を新設: `humanizeSkipReason` + `getActionOutcome`。Engine 側で既知の skip 理由 5種を英語短文に変換、未知理由は原文表示（fail-safe）
- Alerts ページの severity badge 左にアイコンを挿入（既存の badge・service ラベル構造は維持）
- Actions ページの status badge 左にアイコンを挿入、skipped/failed 行に outcome 行を追加（`Skipped: ...` / `Failed: ...`）。failed は `text-status-critical`、skipped は `text-text-muted` で彩度を抑える
- `EngineAction.result` / `.error` の型（`Record<string, unknown>` / `Record<string, unknown> | null`）を尊重し、`typeof reason === 'string'` で narrow
- DESIGN.md に Icon rules セクションを追加（Typography 直後）: サイズ・stroke width・色マッピング・Avoid リスト（filled / label なし / AI themed / ◈ 置換 / 1要素複数アイコン）
- pnpm verify 通過（typecheck + engine test 36件 + app build 11 routes）

### 判断したこと
- Nav にはアイコンを入れない（タスク指示通り。テキストラベルのみで情報階層を保つ）
- `running` は `LoaderCircle + animate-spin`、`needs_review` は `Clock3` を選定（DESIGN.md の「functional labels, not decoration」原則に沿う）
- `skipped` は `MinusCircle + text-text-muted`。critical 系の警告色にすると「スキップ＝悪」と誤読されるため muted で透かす
- outcome 行は status badge の真下ではなく action.title の直下に配置（タイトルと説明の文脈が自然につながるため）
- 未知の skip reason はエンジン側の文字列をそのまま表示（humanize辞書の取りこぼしで空欄になるより、生テキストの方が運用上有用）

### 次にやること
- Phase 2.4 Public Preview 残タスク（スクリーンショット更新・GitHub 公開準備）

担当：Claude Code

---

## 2026-04-14 / Claude

### やったこと
- Settingsのenv読み取りバグを修正した（GET /api/diagnostics経由に変更）
- Dashboardのsparkline非表示バグを修正した（style={{ fill: 'var()' }}に変更）
- カラーパレットを更新した（P25ローラー・リンクベース安全版）
- 黒基調を維持しつつborder/text/statusにレトロな管制室感を追加した
- DESIGN.mdを新パレットに更新した
- Codexレビュー完了・全finding修正済み

### 判断したこと
- --accent: #E8611A（Anthropic Orange）は維持
- --accent-warm: #FAA45Bを追加（Onboarding等の生命感）
- bg-baseはほぼ黒維持（#090D0E）
- text-primaryをwarm white（#F5F0E8）に変更

### 次にやること
- アイコン導入
- Actionsのskipped理由表示

担当：Claude

---

## 2026-04-14 / Claude Code

### やったこと
- カラーパレットをレトロフューチャー安全版へ更新（P25「ローラー・リンク」から温度のみ借用）
- `apps/app/src/app/globals.css` の `@theme` と `:root` の両ブロックを同期更新（Tailwind v4 は `@theme` からユーティリティを生成するため両方必要）
- 背景: `#0A0A0A → #090D0E` 系の blackened navy に置換（bg-base/surface/elevated/hover）
- ボーダー: グレー → dusty teal（`#263437 / #34464A / #465C61`）
- テキスト: `#F5F5F5 → #F5F0E8`（warm white）、secondary は blue-gray `#8E9C9E`
- ステータス色: warning/success/info/neutral を彩度控えめに再調整（`#D8962A / #4FAF73 / #568DAC / #617F7F`）
- アクセントに `--accent-warm: #FAA45B` を追加、status-bg（12% alpha 版）4色を追加
- 既存の `--color-status-danger` エイリアスは維持（badge-critical @utility が参照）
- docs/DESIGN.md section 2（Color Palette）と section 6（Tailwind Mapping）を新パレット値へ反映
- pnpm verify 通過（typecheck + engine test 36件 + app build 11 routes）

### 判断したこと
- `@theme` と `:root` は同じ値を二重定義するが、これは Tailwind v4 の仕様: ユーティリティクラス（`bg-bg-base` 等）は `@theme` の `--color-*` から生成され、コンポーネント内で `var(--bg-base)` を直接参照するコード（ErrorSparkline 等）は `:root` を見る。片方だけ更新すると乖離するため両方を更新
- `--color-accent-dim` は旧 `@theme` 値（33）と `:root` 値（20）が乖離していたので spec 通りの `20` に統一
- P25 パレットから「温度」だけ借りる方針を厳守: ネイビー強調なし、パステル化なし、彩度控えめ。管制室感は border の teal シフトと text の warm white で表現
- `--color-status-danger` エイリアスは DESIGN.md には記載しない（legacy 互換目的のため、公式パレットではない）

担当：Claude Code

---

## 2026-04-14 / Claude Code

### やったこと
- Settings の env 読み取りバグを修正: `apps/app/src/app/settings/page.tsx` で `process.env.*` 直読みを廃止し、Engine の `GET /api/diagnostics` から redacted config を取得する方式へ変更
- `apps/app/src/lib/engine.ts` に `RedactedEngineConfig` 型を追加し、`Diagnostics.config` を `Record<string, unknown>` から強く型付けされたインターフェイスに置換
- Settings にエンジンオフライン時の警告バナーを追加（en/ja 両対応の辞書エントリを追加）
- Quiet Hours の表示を `HH:00` フォーマットで統一（notification.quietHoursStart/End は number）
- Dashboard の `ErrorSparkline` を CSS 変数直接指定 (`style={{ fill: 'var(--status-critical)' }}`) に書き換え、Tailwind の `fill-*` 依存を除去
- `ErrorSparkline` を points 空でも描画するようにし、Dashboard 側の `metrics?.points.length > 0` ガードを撤去（データなしでも細線を描画）
- `pnpm verify` 通過（typecheck + engine test 36件 + app build 11 routes）

### 判断したこと
- Settings の env 読み取りは apps/app 側に .env.local が届いていないのが根本原因。symlink や Next.js の monorepo env 解決に頼るより、Engine の /api/diagnostics（すでに redactConfig 済み）を単一のソースにする方が安全（secret 値が app プロセスに露出しない + 表示と Engine の実設定が常に一致する）
- Quiet Hours は Engine 側では hour (0-23) の number。`HH:00` に整形して表示することで未設定判定（`notSetParens`）との見分けが自然になる
- Sparkline は Tailwind v4 で `fill-status-critical` が一応動くが、SVG + CSS カスタムプロパティへの direct 参照の方が堅牢で、将来 Tailwind 変更の影響を受けない
- sparkline エリアは常時描画（データなしは細線）。これにより「バグで消えている」と「本当にデータがない」が UI 上区別できない問題が解消する

### 未解決 / 既知リスク
- Engine が BIONIC_ENGINE_TOKEN を要求する構成では、app プロセスにも同じトークンを渡す必要がある（既存の getStatus 等と同挙動なので追加の回帰ではない）

担当：Claude Code

---

## 2026-04-14 / Claude

### やったこと
- LICENSE（AGPL-3.0）を追加した
- README.mdを整備した（10分Quickstart・init/doctor/demo）
- SECURITY_RELEASE_CHECKLIST.mdを更新した
- docs/SHOW_HN.mdを作成した
- 全ページUIスクリーンショットを颯紀さんに確認してもらった
- Codexによる最終UIレビューを実施した

### 判断したこと
- 公開前に修正が必要なもの：
  - Settingsのenv読み取りバグ（[not set]問題）
  - Dashboardのsparkline非表示バグ
  - Actionsのskipped理由表示
  - カラーパレット適用（P25ベース）
  - アイコン導入
- Onboarding・Diagnostics・Alerts・Researchは公開可能な品質
- DashboardとActionsはもう一段改善が必要

### 次にやること
- Settingsバグ修正・Dashboardsparklineバグ修正
- カラーパレット適用（Codexに設計確認後）
- アイコン導入

担当：Claude

---

## 2026-04-14 / Claude Code

### やったこと
- Phase 2.4 GitHub公開準備: LICENSE / README / SECURITY_RELEASE_CHECKLIST / SHOW_HN を整備
- LICENSE を repo root に配置（AGPL-3.0 フルテキスト + 末尾に `Copyright (c) 2026 Satsuki`）
- README.md の冒頭 description を「local-first ops cockpit for solo developers and small SaaS teams」に刷新し、キャッチコピーと価値提案を前面に
- README.md に「10-minute Quickstart」セクション（clone → Supabase → init → doctor → engine → demo → app の7手順）を追加
- CLI Usage セクションを再構成し `bionic init` / `doctor` / `demo` の3コマンドを主役化、既存の status / approvals / approve / deny は Engine status and approvals として残置
- README の License セクションを「AGPL-3.0 + 商用ライセンス問い合わせ」に確定（`planned` 表記を除去）
- SECURITY_RELEASE_CHECKLIST を更新：確認済み項目をチェック化、Webhook 署名検証 / External AI / GitHub公開前 ブロックを追加、最終更新日を 2026-04-14 に
- docs/SHOW_HN.md を新設（Show HN 投稿文。demo コマンド・local-first 方針・フィードバック依頼を含む）
- pnpm verify 通過（typecheck + engine test 36件 + app build）

### 判断したこと
- LICENSE は FSF 公式の AGPL-3.0 フルテキストをそのまま配置し、Copyright 行を末尾に追加する方式にした（本文改変は行わない）
- SECURITY_RELEASE_CHECKLIST は「事前に確認済み」と「本番デプロイ/GitHub 公開直前に確認」を明示分離（デプロイ固有項目をコードのチェックと混ぜない）
- Show HN 投稿文は demo コマンド + privacy notice を前面に（local-first を最初のフックにする）
- 既存の SDK Quickstart / Incident Brief privacy notice / MCP / Webhook セクションは変更せず、Quickstart セクションを Prerequisites の上に挿入する構成にした（既存ユーザー体験を壊さない）

### 未解決 / 既知リスク
- 本番での `BIONIC_ENGINE_TOKEN` 運用 / 全テーブル RLS 有効化 / gitleaks 最新結果 / クリーン環境での verify は GitHub 公開直前に改めて再確認する（CHECKLIST 未チェック項目として明示）

### 次にやること
- Phase 2.4 最終: 公開直前のクリーンチェック → GitHub 公開 → Show HN 投稿

担当：Claude Code

---

## 2026-04-14 / Claude

### やったこと
- Actions/Research/Onboarding/共通UI改善を実装した
- formatRelativeTimeをtime.tsに共通化した
- Settingsページを実装した（9セクション・read-only・言語切り替え）
- 言語切り替え（en/ja）をcookieベースで実装した
- Dashboard Open Alertsカードに24h error trend sparklineを追加した
- GET /api/metrics/eventsをEngineに追加した
- AdvancedセクションにDeployment Watch・Quiet Hours設定を追加した
- Codexレビュー完了・P2 finding全修正済み

### 判断したこと
- グラフはDashboardのみ（数値判断が必要な場所のみ）
- Settingsは表示のみ（.env.local編集はCLI前提）
- 言語切り替えはSettingsページのみ翻訳（全ページ翻訳は別タスク）
- sparklineは自前SVG（Recharts追加依存なし）

### 次にやること
- Phase 2.4: README整備・LICENSE確定・Show HN投稿文・GitHub公開準備

担当：Claude

---

## 2026-04-14 / Claude Code

### やったこと
- Settings P2 finding 2件を修正
- layout.tsx で `bionic-locale` cookie を読み、`<html lang>` を en/ja で動的設定（cookie値のサニタイズ付き: 'ja' 以外は 'en' に落とす）
- Settings ページに i18n 辞書（en/ja）を導入し、9セクション全てのラベルと値文言を切替（全ページ翻訳は別タスク、範囲は明示的に Settings のみ）
- Advanced セクションを追加: Deployment Watch Window / Error Count Threshold / Error Increase Threshold / Quiet Hours Start・End を表示、未設定は status=missing で色分け
- pnpm verify 通過（typecheck + engine test 36件 + app build）

### 判断したこと
- cookie の locale 値は 'ja' と比較して white-list 的に絞る（未知の値が `<html lang>` に反映されないよう）
- Quiet Hours の notSetParens は locale 別に `(not set)`/`(未設定)` を辞書から参照。比較も同じ値を使うので表示と判定が一貫する
- root layout が cookies() を使うと全ルートが Dynamic 扱いになるが、Bionic のアプリは SSR 前提なので許容（onboarding のみ静的だったが、i18n を入れる以上は動的化が妥当）

### 次にやること
- Phase 2.4 Public Preview 残タスク（README整備・LICENSE確定・GitHub公開準備）
- 後工程: 他ページ（Dashboard / Alerts / Actions など）の i18n 辞書適用

担当：Claude Code

---

## 2026-04-14 / Claude Code

### やったこと
- Phase 2.4: Settings ページ と Dashboard 用 Event Metrics を実装した
- Engine に `GET /api/metrics/events` を追加（packages/engine/src/routes/metrics.ts）
  - window 6h/24h・bucket 1h/6h をホワイトリスト検証、projectId 未指定時は config.projectId
  - 各 bucket で errors / healthDegraded / total を集計して points 配列を返す
  - DBエラー時は 500 を返す（UIは null にフォールバック）
- index.ts に router 登録（/api/metrics）
- apps/app/src/lib/engine.ts に `getEventMetrics` と EventMetrics / EventMetricPoint 型を追加
- apps/app/src/components/ErrorSparkline.tsx を新設（SVG sparkline、critical/warning スタック、空 bucket は border-subtle の細バー）
- Dashboard の Open Alerts hero 右カラムに 24h sparkline + `24h` ラベルを配置
- /settings ページを新設（apps/app/src/app/settings/page.tsx）
  - Preferences（Language switcher）/ Project / Engine / Supabase / Scheduler / Discord / Integrations / Privacy & AI / Security の9セクション
  - 全て server component で process.env を読み、secret は [configured]/[not set] のみ表示（生値は出さない）
  - status=ok/warn/missing を semantic token で色分け
  - ANTHROPIC_API_KEY 有効時はプライバシー文言を併記、Diagnostics へのリンクを配置
- LanguageSwitcher をクライアントコンポーネントとして分離（`bionic-locale` cookie に en/ja を保存、year-long max-age、ページをリロードして適用）
- layout.tsx のナビに SETTINGS リンクを追加
- hex直書きなし、semantic token のみ
- pnpm verify 通過（typecheck + engine test 36件 + app build）

### 判断したこと
- Settings は「読み取り専用 + .env.local への誘導」に徹した（秘匿情報のブラウザからの変更は設計上スコープ外）
- LanguageSwitcher の永続化は cookie（SSR で読める、middleware 不要）
- 実翻訳は今回スコープ外。cookieとUI切替までを整備しておくことで、後工程で i18n 辞書をかぶせやすい
- Sparkline は server component から描画可能な inline SVG で実装（recharts などを引き込まずバンドルを増やさない）
- window / bucket はホワイトリスト検証（任意文字列を SQL へ流さない）

### 次にやること
- Phase 2.4 Public Preview 残タスク（README整備・LICENSE確定・GitHub公開準備）
- 後工程: 実UIの日本語辞書適用（LanguageSwitcher 前提）

担当：Claude Code

---

## 2026-04-14 / Claude Code

### やったこと
- Phase 2.4: Actions / Research / Onboarding / 共通 の UI を改善した
- apps/app/src/lib/time.ts を新設し、Alerts から formatRelativeTime を移動して共通化。Actions / Onboarding / Dashboard からも利用
- Actions: ページヘッダーを Audit Log 表記に統一、pending_approval を Awaiting Approval 専用セクションとして最上部に表示（CLI approve コマンドを提示）、その他行には requestedBy・linked alert 抜粋・相対時間を追加し、succeeded/skipped は opacity-60 で弱める
- Research: ページヘッダーを uppercase + saved件数のサブラベルに刷新。保存済みアイテムを上部へ、フォームを `<details>+ Add Research Item</details>` で折りたたみ、既存の入力UIはそのまま格納。空状態は ◈ アイコンに変更。デフォルトボタンの text-white を text-inverse に変更
- Onboarding: All good state に `Run Demo ↗` CTA を追加（クライアントコンポーネントの RunDemoButton でクリップボードコピー + 「Copied ✓」表示）。ターミナル向けコマンドも併記
- Dashboard: `alertsResult` を取得して `service_id === 'demo-api'` の open alert があるときに Demo Mode バナーを Operational Brief の上に表示（status-info 系）。cleanup コマンドを併記
- hex直書きなし、semantic token のみ
- pnpm verify 通過（typecheck + engine test 36件 + app build）

### 判断したこと
- pending_approval の CLI approve 提示は id 先頭8桁（視認性優先。衝突時はフル ID で代替する設計余地あり）
- Research のフォームは折りたたみデフォルト close にした（Saved の閲覧が主、追加は目的駆動で開く）
- Onboarding の Run Demo は `navigator.clipboard.writeText` でコピーのみ。Web UIから terminal実行はできないのでコマンドコピー+案内のUXに統一
- Dashboard の Demo Mode バナーは getAlerts() の結果で判定（getStatus() には serviceId情報が無いため）。追加ラウンドトリップは許容（Dashboard は n=1 のSSR）

### 次にやること
- Phase 2.4 Public Preview 残タスク（README整備・LICENSE確定・GitHub公開準備）

担当：Claude Code

---

## 2026-04-14 / Claude

### やったこと
- Alerts UIを改善した
- critical→warning→infoのseverity sortを追加した
- 相対時間表示（Last seen 3m ago）を追加した
- fingerprintをTechnical detailsに折りたたんだ
- ルールベースのNext Step（6種のalert type別）を追加した
- ResolveボタンとServer Actionを実装した
- 空状態を◈ All systems quietに変更した
- Codexレビュー完了・問題なし

### 次にやること
- Phase 2.4: README整備・LICENSE確定・GitHub公開準備

担当：Claude

---

## 2026-04-14 / Claude Code

### やったこと
- Phase 2.4: Alerts UI を刷新した（apps/app/src/app/alerts/page.tsx）
- severity ソート（critical→warning→info）を実装、同severity内は lastSeenAt desc
- 相対時間表示（`formatRelativeTime`）で "Last seen 3m ago" + `×count` を表示、`First seen Apr 13 17:30` を補助表示
- fingerprint を `<details>Technical details</details>` に折りたたみ
- Next Step をルールベース関数（deployment_regression / service_error / service_health / ci_failure / payment_failure / sentry_issue 他）で生成
- Resolve Server Action を追加（apps/app/src/app/alerts/actions.ts）。Engine `/api/alerts/:id/resolve` に POST し、成功時 revalidatePath('/alerts') と '/'
- ResolveButton を Client Component として分離（useTransition・エラー表示）
- critical は `border-l-2 border-l-status-critical bg-status-critical/5` + font-semibold、warning/info は `border-l-status-warning`/`border-l-status-info`
- ページヘッダーを `UPPERCASE + tracking-wide` に刷新、サブラベルに `N critical · M open` を表示
- 空状態を `◈ ALL SYSTEMS QUIET` に変更
- hex直書きなし、semantic token のみ
- pnpm verify 通過（typecheck + engine test 36件 + app build）

### 判断したこと
- ResolveButton は `useTransition` を使って pending 状態とエラー表示を両立（`disabled:opacity-50 + cursor-not-allowed`）
- Server Action の resolvedBy は `app:local`（将来、実アクター名に差し替える余地あり）
- Tailwind の border-l ユーティリティは `border-l-2` + `border-l-<color>` の組み合わせで semantic token 経由にした

### 次にやること
- Phase 2.4 Public Preview 残タスク

担当：Claude Code

---

## 2026-04-14 / Claude

### やったこと
- Dashboard UIを大幅改善した（Operational Brief・What Needs Attention・Incident Brief）
- Claude Haiku APIでIncident Briefを動的生成するAPIを実装した（5分キャッシュ・alert変化で即失効）
- ANTHROPIC_API_KEY未設定時はavailable:falseでフォールバック表示
- Anthropicへの送信はtype/severity/service_id/count/last_seen_atのみ（title/message除外）
- Privacy noticeを.env.exampleとREADMEに追加した
- Codexレビュー完了・全finding修正済み

### 判断したこと
- Incident Briefはopt-in（ANTHROPIC_API_KEY未設定でも動作する）
- 外部AI送信はredacted（title/messageは送らない）
- キャッシュキーはalert数とupdated_atで管理する

### 次にやること
- Alerts UIの改善（fingerprint折りたたみ・resolve導線・時間表示）

担当：Claude

---

## 2026-04-13 / Claude Code

### やったこと
- Incident Brief API の P1/P2 finding 3件 + ドキュメント修正を適用
- DBエラー時は `cachedBrief` に書かず 503 + `available:false` を返すようにした（以前は alert=[] として正常扱い→古いキャッシュを覆う可能性があった）
- Anthropic に送る alert 文面から `title` と `message` を除外。送信するのは type / severity / service_id / count / last_seen_at のみ（本番エラー文・顧客影響を含む可能性を遮断）
- キャッシュキーを `count:latestUpdatedAt` に変更。TTL内でも alert 集合が変わった瞬間にキャッシュが外れる。engine_alerts の select に `updated_at` を追加
- .env.example の ANTHROPIC_API_KEY にプライバシー警告コメントを追加、デフォルト値を空に
- README.md に「Incident Brief (AI-powered, optional)」セクションを追加（Privacy notice: title/message/PIIは送信しない旨を明記）
- pnpm verify 通過（typecheck + engine test 36件 + app build）

### 判断したこと
- DBエラーは 503 で返す（5xx）。UIのgetIncidentBrief() は !res.ok で null を返すのでフォールバック分岐に入る
- キャッシュキーは「count」と「最新updated_at」の組。order は severity 昇順でも updated_at の最大値は集合に依存しないので問題なし
- 空のalert状態にもキャッシュキーを適用（`0:`）することで、「alert 0件のBrief」と「alertありのBrief」の混同を防ぐ
- title/message は今回完全に送らない方針。将来どうしても必要な場面が出たら明示的なredaction層を噛ませる

### 次にやること
- Phase 2.4 Public Preview 残タスク

担当：Claude Code

---

## 2026-04-13 / Claude Code

### やったこと
- Dashboard 改善 Phase 2: Incident Brief 生成API と 動線重視レイアウトを実装
- Engine に `GET /api/incident-brief` を追加（packages/engine/src/routes/incidentBrief.ts）
  - open alerts を最大10件取得し claude-haiku-4-5-20251001 に要約させる
  - レスポンスは summary / startHere / affectedServices / topIssueType / generatedAt / cached / available
  - ANTHROPIC_API_KEY 未設定時は `available: false` を返し、UI側フォールバックで動作する
  - メモリ上 5分キャッシュ（2度目以降は cached: true）、alert 0件時は定型Brief返却
- config.ts に anthropic { apiKey, enabled } を追加、redactConfig にも反映
- @anthropic-ai/sdk ^0.88.0 を packages/engine に追加
- Engine index.ts に router 登録（/api/incident-brief）
- apps/app/src/lib/engine.ts に getIncidentBrief() と IncidentBrief 型を追加
- Dashboard を動線重視レイアウトに再構成（Page Header → Brief → What Needs Attention → Key Metrics → System Strip → Recent Signal）
  - Operational Brief: Claude生成のsummary+startHereを表示、未設定時はカウントベースのフォールバック
  - What Needs Attention を stat cards の上に移動、critical行に affectedServices を表示、各行を Link 化して hover:bg-bg-hover の -mx-5 px-5 フルブリードにした
  - Open Alerts hero カードに右カラム追加（topIssueType + View all →）
  - nothingPending 時は中央に "All systems nominal" ブロックを表示（以前はAttention内のみ）
  - Recent Signal の event.type は text-only の color coding（critical/warning/success/muted）、bg付きbadgeは廃止
- .env.example に ANTHROPIC_API_KEY を追加
- 検証: engine typecheck 通過 / engine test 36件全通過 / app build 通過 / pnpm verify 通過

### 判断したこと
- キャッシュはプロセスメモリ内（5分）。永続化は今回スコープ外（Engineが再起動すれば再生成でよい）
- max_tokens=300・JSON mode（markdownなし）で応答を安定化
- availableフラグはフロントで判定しやすいよう boolean で返す（summary が null のパターンも検出可能）
- critical時の Brief バーと中のラベルは status-critical、それ以外は accent で統一（色の過剰投入を避けつつ緊急度は伝える）
- What Needs Attention を stat cards より上に移したので、"0件だけど Attention が何もない" ケースを考慮し、nothingPending の時は代わりに独立ブロックを表示
- LLM出力の JSON.parse は try/catch のcatch節で500を返す設計（UIはフォールバック表示に落ちる）

### 未解決 / 既知リスク
- Anthropic APIのレイテンシとコスト: Haiku + max_tokens:300 + 5分キャッシュでラフに低コストだが、ダッシュボードアクセス頻度が高い環境ではキャッシュTTLを伸ばす検討余地あり
- JSON.parse失敗時に500→UIフォールバックに落ちる挙動は現状正しいが、今後 strict JSON モードや zod validation を入れる余地あり
- Engine再起動でキャッシュが飛ぶ。永続キャッシュは将来Redis/DBで対応

### 次にやること
- Phase 2.4 Public Preview 残タスク

担当：Claude Code

---

## 2026-04-13 / Claude Code

### やったこと
- Dashboard UI を Operational Brief 型に刷新（apps/app/src/app/page.tsx）
- Page Header に今日の日付と runtime status dot を追加
- Operational Brief セクション：openAlerts>0 のときのみ表示、critical ありは status-critical バー、無しは accent バー
- Stat cards を 3枚構成に変更（Open Alertsを md:col-span-2 で主役化、text-5xl、critical時は status-critical 配色）
- Pending Jobs / Pending Approvals は text-4xl、Last Event カードは廃止
- What Needs Attention セクションを新設（Critical / Approval / Jobs をバッジ付きで列挙、何もなければ「All systems nominal」）
- Engine 情報を Diagnostics へのリンクカードに縮約（v{version} · Started {time}）
- Recent Events を Recent Signal にリネームして下部に配置、event.type を color coding（error→critical / degraded→warning / health→success / その他→muted）
- hex直書きは無し。全て globals.css のsemantic token（bg-surface / border-subtle / accent / status-critical / status-warning / status-success / status-info / text-primary / text-secondary / text-muted）経由
- pnpm verify 通過（typecheck + engine test + app build 全通過）

### 判断したこと
- Operational Brief は criticalなしでもopenAlerts>0なら表示（仕様通り、かつ心理的な導線として妥当）
- critical時のBriefバーは accent ではなく status-critical に振り分けた（視覚的な緊急度と一致させるため）
- Last Event を stat cards から外し、Engine Info カードの補助情報へ移した（主要KPI＝Alerts/Jobs/Approvalsに集中）
- What Needs Attention は critical/approval/jobs の3行を優先度順に並べ、バッジはそれぞれ status-critical / status-warning / status-info に統一

### 次にやること
- Dashboard の動作確認はSSRで実施（ブラウザでの見た目確認が別途必要な場合は担当者と調整）
- 他画面（Alerts / Actions / Research / Diagnostics）のL2リファインは別タスク

担当：Claude Code

---

## 2026-04-13 / Claude Code

### やったこと
- Phase 2.4: bionic demoコマンドを実装した
- packages/cli/src/commands/demo.ts 新規作成
- Engine `/api/status` で疎通確認→`/api/events` に 7種のデモイベントをsource='cli'で投入
- serviceId は 'demo-api' 固定、payload.demo=true / demoRunId でラン単位を識別
- --fast（遅延なし）/ --cleanup（Supabase直接DELETE）/ --service / --engine-url オプション対応
- index.ts に demo サブコマンドを登録
- pnpm --filter @bionic/cli typecheck / build 通過
- 動作確認: demo --fast で7イベント全てSEND→DONE、demo --cleanup で engine_events/alerts/actions の service_id='demo-api' 行が削除されるのを確認
- Engine未起動時は FAIL で exit 1

### 判断したこと
- Engine URL解決順序は doctor と揃えた（--engine-url > BIONIC_ENGINE_URL > NEXT_PUBLIC_ENGINE_URL > localhost:3001）
- cleanupはSupabaseへ直接DELETE（CLIローカル運用前提、service_idフィルタで本番データを巻き込まないよう限定）
- payloadに demo:true と demoRunId を含めて将来のフィルタリングや可視化に使えるようにした

### 次にやること
- Phase 2.4: Public Preview準備の残タスク（README英語化・LICENSE確定・CLI bin/dist対応・MCP docs・demo動画/GIF・GitHub公開）

担当：Claude Code

---

## 2026-04-13 / Claude

### やったこと
- bionic doctorコマンドを実装した
- Environment/Database/Engine/Discord/Integrationsの6セクション確認
- BIONIC_ENGINE_URLを優先したEngine URL解決を実装した
- Discord部分設定（Bot tokenのみ・Channel IDのみ）をWARNで検出した
- FAILがある場合はexit code 1を返すようにした
- Codexレビュー完了・P2 finding全修正済み

### 次にやること
- Phase 2.4: bionic demo実装

担当：Claude

---

## 2026-04-13 / Claude Code

### やったこと
- bionic doctor P2 finding 2件を修正した
- Engine URL解決順序に BIONIC_ENGINE_URL を追加（`--engine-url` > BIONIC_ENGINE_URL > NEXT_PUBLIC_ENGINE_URL > localhost:3001）
- Discord 部分設定（bot tokenのみ / channel IDのみ）を SKIP より前に WARN として検出する分岐を追加
- pnpm --filter @bionic/cli typecheck / build 通過
- 動作確認: BIONIC_ENGINE_URLを優先で解決することを確認、bot-tokenのみ・channel-IDのみの各ケースでWARNが出ることを確認

### 判断したこと
- 部分設定WARNは discordMode() 判定より前に置くことで、最終的にdisabledと判定されてSKIPになる場合でも警告が消えないようにした

### 次にやること
- Phase 2.4: Public Preview準備の残タスク（npm公開準備・ドキュメント整備）

担当：Claude Code

---

## 2026-04-13 / Claude Code

### やったこと
- Phase 2.4: bionic doctor コマンドを実装した
- packages/cli/src/commands/doctor.ts 新規作成（Environment / Database / Engine / Discord / Integrations / Summary 5セクション + サマリ）
- packages/cli/src/lib/envLoader.ts 新規作成（.env.localをprocess.envにmerge・既存値優先・quoted value対応）
- packages/cli/src/index.ts に doctor サブコマンド追加（--engine-url オプション付き）
- packages/cli/package.json に @supabase/supabase-js ^2.103.0 を追加
- Supabase接続・必須テーブル6種・重要カラム確認（information_schema → per-columnフォールバック）
- Engine `/api/status` に対する 200/401/503/接続失敗の4分岐ハンドリング
- Discord mode（bot/webhook/disabled）と approver IDs の検証
- 4 integrations（Vercel/GitHub/Stripe/Sentry）の secret ⇄ map/serviceId ペア検証
- 出力はASCII（OK/WARN/FAIL/SKIP）のみ、絵文字未使用
- 終了コードは FAIL なしで 0 / FAIL ありで 1
- pnpm typecheck 通過、pnpm --filter @bionic/cli build 通過
- 動作確認: 実環境で22チェック実行（20 OK / 2 WARN / 1 FAIL (Engine未起動) / 3 SKIP）
- --engine-url オーバーライドで別URLを指定したときも FAIL で exit 1 を確認

### 判断したこと
- カラム確認は information_schema.columns が PostgREST 経由で取得できる環境を優先し、取れない場合は各カラムへの select(col) limit(0) でフォールバックした（Supabase構成差異を吸収するため）
- Engine 未起動は FAIL として扱うが doctor 全体は最後まで走り切らせる（他セクションの診断結果をブロックしない方針）
- BIONIC_ENGINE_TOKEN 未設定は WARN（ローカル開発では必須ではないが、本番では required）
- Summary の Next step は最初の FAIL の fix を優先、なければ最初の WARN の fix、それもなければ Engine 起動案内

### 未解決 / 既知リスク
- information_schema.columns が PostgREST のデフォルト露出でないため、フォールバックパス（per-column probe）が主経路になる可能性がある。現状の実環境では OK で通過したが、運用で表示される FAIL カラムが 0 の場合と区別できるよう、将来 detail にどちらの方式で確認したかのメタ情報を足してもよい

### 次にやること
- Phase 2.4: npm公開準備（private解除・workspace:*の解決）
- Phase 2.4: Public Preview向けドキュメント整備

担当：Claude Code

---

## 2026-04-13 / Claude

### やったこと
- Phase 2.3: Sentry連携を実装した（sentry_issue alert）
- new_issue・regressed・spike をalert化した
- sentry-hook-signature検証・client_event_id idempotencyを実装した
- PII（stacktrace全文・user email・IP）は保存しない設計にした
- productionのregressedはcritical、それ以外はwarningにした
- Codexレビュー完了・P1/P2 finding全修正済み

### 判断したこと
- AlertTypeはsentry_issueのみ（最小構成）
- performance劣化はPhase 2.3に含めない
- serviceIdはBIONIC_SENTRY_SERVICE_IDで設定（デフォルト'sentry'）

### 次にやること
- Phase 2.3: Vercel logs深掘り

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- Phase 2.3: Deploy→Watch判定精度向上を実装した
- baseline比較を「deploy前30分固定」から「同じ経過時間比較」に改善した
- threshold（errorCount/increasePercent/watchMinutes）をconfig経由に変更した
- alert messageに診断メタデータ（baseline/current/increase/threshold/deploymentId）を追加した
- Codexレビュー完了・問題なし

### 判断したこと
- Vercel Runtime Logs API連携は次段階に切る
- service.usage.requestCountがあってもPhase 2.3では「error count increase」として扱う

### 次にやること
- Phase 2.3: Medini以外のSDK組み込み

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- Phase 2.3: SDK品質改善を実装した（外部開発者が安心して組み込めるSDK）
- fail-open設計にした（fetch失敗・timeoutでthrowしない）
- timeoutMs（デフォルト3000ms）をAbortControllerで実装した
- stack送信をデフォルトoffにした（includeStack: trueで明示opt-in）
- JSDocをBionicClient・BionicSDKConfig・主要メソッドに追加した
- SendEventResultをindex.tsからexportした
- README.mdにSDK Quickstart（Next.js/Express例含む）を追加した
- Phase 2.3: Integrations全タスク完了

### 判断したこと
- throwOnError: falseがデフォルト（Medini互換を維持）
- npm公開準備（private: true解除・workspace:*の扱い）はPhase 2.4で実施
- Vercel Runtime Logs API連携は次段階に切る

### 次にやること
- Phase 2.4: Public Preview準備

担当：Claude

---

## 2026-04-13 / Claude（SDK品質改善・外部組み込み対応）

### やったこと
- BionicClient.sendEvent を fail-open に変更（fetch例外・非2xxを catch して SendEventResult.reason='failed'/'http_xxx' を返す）
- timeoutMs オプションを追加（デフォルト 3000ms、AbortController でタイムアウト制御）
- throwOnError オプションを追加（デフォルト false、true で旧挙動）
- error() の stack送信をデフォルト off に変更（includeStack: true で明示）
- BionicClient / BionicSDKConfig / SendEventResult / health / error / usage に JSDoc 追加
- index.ts から SendEventResult を export
- README.md に SDK Quickstart セクション追加（Basic / Next.js / Express examples + fail-open / browser-only 警告）
- `pnpm verify` 全通過

### 判断したこと
- throwOnError=false デフォルトで Medini の既存 `await bionic.error(...)` 呼び出しは戻り値破棄のため互換維持
- stack はデフォルト off にして PII / ソースパス漏洩リスクを下げる（明示 opt-in）
- timeout は 3000ms 固定推奨ではなくオプション化、Engine slow時の application latency 影響を最小化

### 次にやること
- 後続タスク

担当：Claude

---

## 2026-04-13 / Claude（Phase 2.3 Deploy→Watch判定精度向上）

### やったこと
- config.ts に `deploymentWatch` を追加（watchMinutes / thresholdErrorCount / thresholdIncreasePercent）
- decisions/deploymentWatch.ts のbaseline比較を「同じ経過時間ウィンドウ」に書き換え
  - baseline: `[readyAt - elapsedMs, readyAt)` （deploy前同等時間）
  - current: `[readyAt, readyAt + elapsedMs]`
  - elapsed = min(now - readyAt, watchWindow)
- baseline_error_count を毎回再計算してDB更新
- threshold値（5件・200%）を config 経由に置き換え、severity判定もthresholdの倍数で計算
- routes/webhooks/vercel.ts の30分ハードコードを config.deploymentWatch.watchMinutes に置き換え
- alert message に判定メタデータ（baseline / current / increase / threshold / deploymentId）を含める
- action.input に baselineWindowMinutes と threshold値を追加
- .env.example に BIONIC_DEPLOYMENT_WATCH_MINUTES / THRESHOLD_ERROR_COUNT / THRESHOLD_INCREASE_PERCENT を追加
- `pnpm verify` 全通過

### 判断したこと
- 同じ経過時間ウィンドウ比較で「開始5分時点は直前5分 vs デプロイ後5分」になり早期判定のノイズが減る
- baseline_error_count を毎回更新することで「baselineが古い」問題を解消
- severity critical条件は `count >= threshold*2 && increase >= threshold*1.5` （旧10件/300%のハードコード相当）

### 次にやること
- 後続タスク

担当：Claude

---

## 2026-04-13 / Claude（Phase 2.3 Sentry finding修正）

### やったこと
- sources/sentry.ts: SentryWebhookEvent.data.issue に environment?: string を追加
- decisions/sentry.ts: classifySentrySeverity に issue.environment を渡して production regressed を critical 判定
- decisions/sentry.ts: 既存alert update のerrorを確認、失敗時は failAction(actionId, ...) で audit log に記録
- `pnpm verify` 全通過

### 判断したこと
- 既存 evaluateSentryEvent 開始時の actionId を再利用して update 失敗を failAction で記録（spec の logAction は無いので createAction/failAction で代替）

### 次にやること
- 後続タスク

担当：Claude

---

## 2026-04-13 / Claude（Phase 2.3 Sentry連携）

### やったこと
- config.ts に sentry 設定を追加（webhookSecret / serviceId / enabled + redactConfig）
- shared 型に AlertType `sentry_issue`、EventType `sentry.issue` / `sentry.metric_alert` を追加
- packages/engine/src/sources/sentry.ts 新規作成（HMAC-SHA256署名検証 / triggerKind分類 / fingerprint v2 / title・message builder）
- packages/engine/src/decisions/sentry.ts 新規作成（resolved以外のtriggerをalert化・update-or-create + audit log）
- packages/engine/src/routes/webhooks/sentry.ts 新規作成（sentry-hook-signature検証 / client_event_id idempotency / 23505→202）
- index.ts に raw body middleware + sentryWebhookRouter を追加
- .env.example / README.md に Sentry Webhook Setup セクションを追加
- `pnpm verify` 全通過

### 判断したこと
- PII保護: stacktrace全文 / user email / IP は engine_events に保存しない（issueId / shortId / projectSlug / level / title 200文字制限 / permalink のみ）
- triggerKindごとに別fingerprint（new_issue と regressed を別alertとして扱う）
- resolved action はalert化しない（将来 auto-resolve flow と統合余地）
- severity: regressed(production)=critical / new_issue(fatal,error)=warning / それ以外=info

### 次にやること
- 後続タスク

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- Phase 2.3: Stripe監視を実装した
- invoice.payment_failed・charge.dispute.created・subscription変更をalert化した
- stripe-signature検証・client_event_id idempotencyを実装した
- customer email/billing detailsは保存しない設計にした
- Stripe event typeをshared型と一致するドット区切りに正規化した
- Codexレビュー完了・P2 finding修正済み

### 判断したこと
- alert typeはpayment_failure/revenue_changeの2種類（最小構成）
- subscription.updatedはpast_due/cancel_at_period_endのみalert化
- serviceIdはBIONIC_STRIPE_SERVICE_IDで設定（デフォルト'stripe'）
- App/DiagnosticsでcustomerId等は末尾4〜6桁表示を将来適用する

### 次にやること
- Phase 2.3: Sentry連携

担当：Claude

---

## 2026-04-13 / Claude（Phase 2.3 Stripe event type正規化）

### やったこと
- routes/webhooks/stripe.ts に `STRIPE_EVENT_TYPE_MAP` を追加（dot区切りで shared EventType と一致）
- `event.type.replace(/\./g, '_')` を廃止して明示マッピング → fallback `stripe.${event.type}`
- `pnpm verify` 全通過

### 判断したこと
- 明示マッピングで shared EventType（stripe.invoice.payment_failed 等）と完全一致させる
- 未知のevent typeは `stripe.${event.type}` でドット区切りのまま保存

### 次にやること
- 後続タスク

担当：Claude

---

## 2026-04-13 / Claude（Phase 2.3 Stripe監視）

### やったこと
- packages/engine に stripe@22 を追加
- config.ts に stripe 設定を追加（webhookSecret / serviceId / enabled + redactConfig）
- shared 型に AlertType `payment_failure` / `revenue_change`、EventType `stripe.*` 6種を追加
- packages/engine/src/sources/stripe.ts 新規作成（severity分類 / fingerprint v2 / title / message / alertType解決）
- packages/engine/src/decisions/stripe.ts 新規作成（subscription.updatedはpast_due/cancel_scheduledのみ alert・audit log結線）
- packages/engine/src/routes/webhooks/stripe.ts 新規作成（Stripe SDKでstripe-signature検証・client_event_id idempotency・insert失敗時の23505→202）
- index.ts に raw body middleware + stripeWebhookRouter を追加
- .env.example / README.md に Stripe Webhook Setup セクションを追加
- `pnpm verify` 全通過

### 判断したこと
- customer email / billing details は engine_events に保存しない（id / type / objectId / objectType のみ）
- subscription.updated は status=past_due または cancel_at_period_end=true のときだけ alert化
- fingerprint stableKey は subscription_id（invoice）/ payment_intent_id / charge_id / `subId:changeKind` で同一事象を集約
- alert type は payment_failure（決済系障害）と revenue_change（解約・返金）の2種

### 次にやること
- 後続タスク

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- Phase 2.3: GitHub連携を実装した（CI失敗検知）
- workflow_run.completed + conclusion=failure/timed_out/action_requiredでci_failure alertを生成した
- X-Hub-Signature-256署名検証・X-GitHub-Delivery idempotencyを実装した
- default branch失敗→critical、PR branch失敗→warningに分類した
- fingerprint v2にworkflow nameを含めて別workflowの失敗を分けた
- private repoのbody全文は保存しない設計にした
- Codexレビュー完了・P1/P2 finding全修正済み

### 判断したこと
- alert typeはci_failure（将来GitHub以外のCIにも対応できる）
- Issue alert・PR・dependabotはPhase 2.3では含めない
- event typeはgithub.workflow.failedに正規化する

### 次にやること
- Phase 2.3: Stripe監視

担当：Claude

---

## 2026-04-13 / Claude（Phase 2.3 GitHub連携 finding修正）

### やったこと
- routes/webhooks/github.ts: insert結果を確認、23505 は 202 duplicate、その他エラーは 500、insert成功時のみ評価処理を実行
- routes/webhooks/github.ts: workflow_run event は `github.workflow.failed` に正規化、それ以外は `github.{event}` のまま
- sources/github.ts: buildCiFailureFingerprint に workflowName を追加（小文字＋non-alnum→`_`）して別workflowの失敗を分離
- decisions/github.ts: 呼び出しに workflow_run.name を渡すよう更新
- `pnpm verify` 全通過

### 判断したこと
- workflowNameをfingerprintに含めることで「testは赤・lintは緑」のような同branch複数workflowの状態を正しく分離
- insert失敗時は評価処理を呼ばないことで race condition による二重alertを防止

### 次にやること
- 後続タスク

担当：Claude

---

## 2026-04-13 / Claude（Phase 2.3 GitHub連携）

### やったこと
- config.ts に github 設定を追加（webhookSecret / repoMap / enabled + redactConfig 対応）
- shared 型に AlertType='ci_failure' と EventType='github.*' を追加
- packages/engine/src/sources/github.ts 新規作成（HMAC-SHA256署名検証 / severity分類 / fingerprint v2）
- packages/engine/src/decisions/github.ts 新規作成（workflow_run failure → ci_failure alert・audit log結線）
- packages/engine/src/routes/webhooks/github.ts 新規作成（secret未設定は401・署名検証・X-GitHub-Delivery idempotency）
- index.ts に raw body middleware + githubWebhookRouter を追加
- .env.example / README.md に GitHub Webhook Setup セクションを追加
- `pnpm verify` 全通過

### 判断したこと
- private repo対策として payload は repository.full_name/default_branch と action のみ engine_events に保存（body全文は保存しない）
- fingerprint v2 では workflowRunId は含めない（毎実行で別alertになるのを防ぎ、同branch/同workflowはcount++）
- default branch / release/* / hotfix/* を critical、それ以外を warning
- failed conclusion は failure / timed_out / action_required の3種
- raw body limit は 5mb（GitHub Webhookは比較的大きい）
- X-GitHub-Delivery を client_event_id として idempotency 確保

### 次にやること
- 後続タスク

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- Phase 2.2: Signal Quality全タスクを完了した
- alert resolve flowを実装した（手動POST /api/alerts/:id/resolve・service.health ok時の自動resolve）
- fingerprint v2を実装した（normalizeMessage・alertType別stableKey）
- SDKにrate limit（60/min）とdedupe（30s・health ok 60s）を実装した
- health degraded後の復旧イベントは必ずdedupe対象外にした
- client_event_id unique indexを追加してPOST重複時に202を返すようにした
- CaptureEventResultのeventIdをstring | nullに変更した
- VALID_SOURCESにmcpを追加した
- Codexレビュー完了・全finding修正済み

### 判断したこと
- service_errorの自動resolveはPhase 2.2に含めない（手動のみ）
- CaptureEventResultのeventIdはDBクエリ追加ではなく型変更で対応
- fingerprint v2は新規alertから適用（既存open alertはそのまま）

### 次にやること
- Phase 2.3: Integrations

担当：Claude

---

## 2026-04-13 / Claude（Phase 2.2 VALID_SOURCESにmcp追加）

### やったこと
- events.ts の VALID_SOURCES に `'mcp'` を追加
- `pnpm verify` 全通過

### 次にやること
- 後続タスク

担当：Claude

---

## 2026-04-13 / Claude（Phase 2.2 CaptureEventResult型修正）

### やったこと
- `CaptureEventResult` の型を `{ accepted: boolean, eventId: string | null, duplicate?: boolean }` に変更
- events.ts の duplicate 応答が型と一致することを確認
- `pnpm verify` 全通過

### 判断したこと
- Medini・bionic 本体で eventId を参照する呼び出し元がないことを確認済みなので、破壊的変更なし

### 次にやること
- 後続タスク

担当：Claude

---

## 2026-04-13 / Claude（Phase 2.2 finding修正）

### やったこと
- SDK: 前回health statusを `lastHealthStatus` Map で保持、degraded/down → ok の復旧イベントは dedupe 対象外に
- SDK: `isDuplicate` に type/payload を渡し、`recordHealthStatus` を送信成功後に呼び出し
- engine/routes/events.ts: insert時の 23505 (unique violation) を 202 で返す idempotent レスポンス化
- `pnpm verify` 全通過（typecheck + test 36件 + app build）

### 判断したこと
- recordHealthStatusは `service.health.*` 両タイプで記録（そうしないと degraded→ok の遷移を検知できない）
- 23505は500ではなく202（accepted, duplicate: true）で返す（リトライ側のUXを壊さない）

### 次にやること
- 後続タスク

担当：Claude

---

## 2026-04-13 / Claude（Phase 2.2 Signal Quality）

### やったこと
- migration 2件追加（engine_alerts resolve columns / engine_events.client_event_id unique index）
- shared型に Alert.resolvedAt/resolvedBy/resolvedReason と ActionType='resolve_alert' を追加
- packages/engine/src/alerts/service.ts を新規作成（resolveAlert / autoResolveHealthAlerts + audit log）
- POST /api/alerts/:id/resolve を追加（projectId自動解決・404/409対応）
- decisions/alerts.ts で service.health.reported status=ok の自動解決を実装
- fingerprint v2 を実装（v2: プレフィックス・normalizeMessage で数値/UUID/URL/pathを抽象化・alertType毎の stableKey）
- SDK に rate limit (60/min) / dedupe window (30s) / health-ok dedupe (60s) を実装、sendEvent戻り値を SendEventResult に変更
- `pnpm verify` 全通過（typecheck + engine test 36件 + app build）

### 判断したこと
- fingerprint v2 は新規alertのみ適用（既存open alertは resolve で閉じてから次で新fingerprintに遷移）
- health.reported with status=ok は同一serviceのopen service_health alert を engine名義で resolve する
- SDK の rate limit 超過・dedupe hit は throw せず SendEventResult.reason で返す（呼び出し元のUXを壊さない）
- client_event_id unique index 適用前に重複削除（id が大きい方を削除）

### 次にやること
- 後続タスク

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- Appオンボーディング画面を実装した（/onboarding）
- Next.js API routeでEngineへのproxyを実装した（BIONIC_ENGINE_TOKENはserver-only維持）
- 5秒ポーリングでEngine状態が自動更新されるようにした
- StatusBadgeにready/missing/degraded/optional/loadingを追加した
- Dashboard offlineにOpen Onboarding CTAを追加した
- Codexレビュー完了・P2 finding修正済み
- Phase 2.1: Productizable Setup 全タスク完了

### 判断したこと
- オンボーディングはClient Component + API route proxy（server-only token維持・ポーリングあり）
- Engine+DBを必須、Scheduler/Discord/VercelはOPTIONAL扱い
- /onboardingはNavに常設

### 次にやること
- Phase 2.2: Signal Quality

担当：Claude

---

## 2026-04-13 / Claude（オンボーディング P2 finding修正）

### やったこと
- `apps/app/src/app/api/diagnostics/route.ts` を新規作成（Engine → Next.js server → client のproxy）
- onboarding/page.tsx の fetch を `/api/diagnostics` に変更
- 5秒ごとのポーリング + cancelled guard + cleanup（clearInterval）を実装
- `pnpm verify` 全通過（typecheck + test 36件 + app build）

### 判断したこと
- BIONIC_ENGINE_TOKENはNEXT_PUBLIC_をつけず server-only のまま維持（secretをclientに漏らさない）
- Engine offline時もポーリング継続することでEngine起動→自動検知のUXを実現
- cancelled flagでunmount後のsetState警告を防止

### 次にやること
- 後続タスク

担当：Claude

---

## 2026-04-13 / Claude（Appオンボーディング画面）

### やったこと
- `/onboarding` ページを新規実装（Hero・System Check・Operator Console・All Good State）
- 5項目のセットアップ確認（Engine / DB / Scheduler / Discord / Vercel）
- Engine offline時はコマンド一覧を表示、ready時はDashboardへのCTAを表示
- StatusBadgeに loading / optional / degraded / missing / ready を追加
- NavにONBOARDINGリンクを追加
- Dashboard offline状態にOpen Onboardingリンクを追加
- `pnpm verify` 全通過（typecheck + test 36件 + app build）

### 判断したこと
- L3品質対象なのでDESIGN.mdのtoken（bg-accent・text-text-primary等）を使用（hex直書き回避）
- ◈シンボルを大きく配置してretrofuturist感を強調
- 必須2項目（Engine/DB）が揃えばEnter Dashboardを開放、optional3項目は案内のみ
- client componentでdiagnostics fetch（engine offline判定のため）

### 次にやること
- 後続タスク

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- bionic initを実装した（対話形式・.env.local生成）
- Supabase・Engine token自動生成・Scheduler・Discord・Vercel対話形式セットアップ
- Discord空入力時のskip扱いを実装した
- Codexレビュー完了・P2 finding修正済み

### 判断したこと
- DiscordはWebhookをデフォルト推奨
- Vercelはデフォルトskip
- secret値はsummaryで[set]表示のみ
- 既存.env.localは上書き確認のみ（mergeしない）

### 次にやること
- Phase 2.1: Appオンボーディング画面

担当：Claude

---

## 2026-04-13 / Claude（bionic init P2 finding修正）

### やったこと
- `packages/cli/src/commands/init.ts` のDiscord設定で必須項目が空入力の場合にskip扱いへフォールバックするよう修正
- webhook: URL空なら `discordMode = 'skip'` にしてSummary・.env出力に反映
- bot: token/channelIdどちらか空ならskip扱い、両方揃ったときのみapproverIds（optional）を追加入力
- `discordMode` を `let` に変更して再代入可能にした
- `pnpm typecheck` 全通過を確認

### 判断したこと
- 必須項目が空でもinitを止めない（skipに倒す方がUX的に親切）
- summaryは既存のまま `discordMode` 変数を参照するので修正不要（自動反映）

### 次にやること
- 後続タスク

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- config.tsを実装してEngine内のenv一元管理を実現した
- 全10ファイルのprocess.env直読みをgetConfig()経由に置換した
- validateConfigForStartup・redactConfigを実装した
- config.test.ts 36件全通過を確認した
- Codexレビュー完了・P1/P2 finding全修正済み

### 判断したこと
- BOT_TOKEN+CHANNEL_IDなし時はwebhook/disabledにフォールバック（起動拒否しない）
- VERCEL_WEBHOOK_SECRET未設定時はrouteだけ401（起動拒否しない）
- singletonで起動時固定・テスト用はloadConfig(env)を使う
- zodは使わない（独自バリデーションで十分）

### 次にやること
- pnpm verify追加

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- pnpm verifyをroot package.jsonに追加した
- typecheck + engine test + app buildを一発実行できるようにした
- CIのci.ymlと整合していることをCodexで確認した

### 次にやること
- README起動手順の整備

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- README.mdを作成した（最小起動・Discord Botあり・Vercel webhook・MCPあり・Troubleshooting）
- BIONIC_ENGINE_TOKENの扱いを明記した（開発中は空・設定時は全クライアントで同じtoken）
- CLIのtoken設定手順を追加した（Linux/Mac・Windows PowerShell）
- Codexレビュー完了・P1/P2 finding全修正済み

### 次にやること
- TECHNICAL_DESIGN.mdの実装追従

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- TECHNICAL_DESIGN.mdを現在の実装に追従させた
- BionicEngineServiceをshared型と一致させた
- projects/servicesを将来のmulti-tenant対応として分離した
- client_event_idを正確に「検索用index」として説明した
- Alert/Action/Deploymentの状態値を現在の型に合わせた
- Codexレビュー完了・P2 finding全修正済み

### 次にやること
- secrets scan CI追加（gitleaks）

担当：Claude

---

## 2026-04-13 / Claude（bionic init最小実装）

### やったこと
- `packages/cli/src/lib/prompts.ts` を新規作成（readline/promisesベースのask/askYesNo/askChoice/closeReadline）
- `packages/cli/src/lib/envFile.ts` を新規作成（findRepoRoot/generateToken/generateWebhookSecret/buildEnvContent/writeEnvFile/envFileExists）
- `packages/cli/src/commands/init.ts` を新規作成（Supabase→Engine→Scheduler→Discord→Vercelの対話フロー、Summary表示でsecretは `[set]` に伏せる）
- `packages/cli/src/index.ts` に `init --force` を追加
- `pnpm typecheck` 全通過。`npx tsx packages/cli/src/index.ts init --help` が期待どおり表示されることを確認

### 判断したこと
- 既存.env.localはmergeせず上書き確認のみ（設定の混在を避ける・`--force` で抑止可能）
- BIONIC_ENGINE_TOKEN・VERCEL_WEBHOOK_SECRETはnode:cryptoで自動生成（ユーザーに入力させない）
- Discord未設定（skip）はコメントアウト行で出力し、あとから手で有効化しやすくする
- secretはSummaryで `[set]` / `[auto-generated]` 表示、画面とログに実値を出さない

### 次にやること
- Phase 2.1: Appオンボーディング画面

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- Engine diagnostics画面を実装した（/api/diagnostics + /diagnostics page）
- runtime/diagnostics.tsでrunner stateをin-memoryで記録するようにした
- Tailwind v4の@themeにDESIGN.mdのsemantic tokenを追加した
- StatusBadgeを共通コンポーネントとして切り出した
- Codexレビュー完了・P2/P3 finding全修正済み

### 判断したこと
- Scheduler last runはin-memoryで十分（テーブル追加不要）
- StatusBadgeはcomponents/に切り出して全画面で再利用できるようにした
- Tailwind v4では@themeブロックを使用（tailwind.config.tsなし）

### 次にやること
- Phase 2.1: bionic init最小実装

担当：Claude

---

## 2026-04-13 / Claude（Tailwindカスタムトークン追加 + StatusBadge切り出し）

### やったこと
- Tailwind v4 の `@theme` ブロックに DESIGN.md の全トークンを反映（`bg-hover` / `border-strong` / `accent-muted` / `text-inverse` / `status-critical` / `status-neutral` / `font-body`）。legacy callerのために `status-danger` は `status-critical` の alias として残した
- `:root` に生のCSS変数も追加（`var(--accent)` 等で直接参照したい場面に備えて）
- `apps/app/src/components/StatusBadge.tsx` を新規作成し、semantic token経由 (`bg-status-critical/10` など) に変更
- `apps/app/src/app/diagnostics/page.tsx` からローカル `StatusBadge` を削除して import に置き換え
- `pnpm verify` 全通過（typecheck 6/6・test 36/36・app build 成功）

### 判断したこと
- このappはTailwind v4 (`@tailwindcss/postcss`) で `tailwind.config.ts` を持たず `@theme` ブロックを正とする構成なので、v4の方式で追加し、作業内容はspecの意図どおり（semantic token経由でbadgeが色を引く）を満たす
- `StatusBadge` は将来 Alerts / Actions 画面でも使う想定で `@/components/` に置いた

### 次にやること
- Phase 2.1: `bionic init` 最小実装 / Appオンボーディング画面

担当：Claude

---

## 2026-04-13 / Claude（diagnostics P2/P3 finding修正）

### やったこと
- `routes/diagnostics.ts`: recentDeployments の select と mapping を `project_id` → `service_id` に修正
- `diagnostics/page.tsx`: Recent Actions / Deployments の status 表示を DESIGN.md 準拠の `StatusBadge` component に統一（失敗=red / 進行中=amber / 成功=green / その他=neutral）
- 旧 `statusToColor` / `watchStatusToColor` を削除（badge側に吸収）
- `pnpm verify` 全通過（typecheck 6/6・test 36/36・app build 成功）

### 判断したこと
- DESIGN.md の Badge / Status Chip 定義に沿い、色 + border + 背景 を揃えた1関数に集約
- Section 8 の「rounded-full を使わない・box-shadow を使わない」に合わせて `rounded` + flat border

### 次にやること
- Phase 2.1: `bionic init` 最小実装 / Appオンボーディング画面

担当：Claude

---

## 2026-04-13 / Claude（Phase 2.1 - Engine diagnostics）

### やったこと
- CURRENT.mdに DESIGN.md 関連の完了項目を追加、次の1手を Phase 2.1 に更新
- AGENTS.md の「作業開始前に必ず読むこと」に `docs/DESIGN.md` 参照ルールを追加
- `packages/engine/src/runtime/diagnostics.ts` 新規（runner state をin-memoryで保持、engine再起動でリセット）
- `packages/engine/src/scheduler/index.ts` の5つのcronに `recordRunnerStart/Success/Error` を結線
- `packages/engine/src/routes/diagnostics.ts` 新規（engine/db/scheduler/runners/queue/actions/integrations/alerts/recent を集計）
- `packages/engine/src/index.ts` に `/api/diagnostics` をマウント
- `apps/app/src/lib/engine.ts` に `getDiagnostics` と `Diagnostics` 型を追加
- `apps/app/src/app/layout.tsx` のNavに `DIAGNOSTICS` を追加
- `apps/app/src/app/diagnostics/page.tsx` 新規（DESIGN.md準拠：6ブロック構成・card/badge utility・JetBrains Monoラベル・Space Grotesk値）
- `pnpm verify` 全通過（typecheck 6/6・test 36/36・app build 成功）

### 判断したこと
- runner state は DB に出さず in-memory に留めて読み取りコストを抑える（Engine再起動で消えても診断には十分）
- `redactConfig` を経由してsecretが leak しないようにした
- App側は既存の `card` / `badge-*` utility クラスを再利用し DESIGN.md の色トークンに整合
- `status-danger` は既存globals.css の命名（DESIGN.mdの `status-critical` は同色のalias扱い）

### 次にやること
- Phase 2.1: `bionic init` 最小実装 / Appオンボーディング画面

担当：Claude

---

## 2026-04-13 / Claude（docs/DESIGN.md作成）

### やったこと
- docs/DESIGN.mdを作成した（Bionicデザインシステムの正本）
- awesome-design-md / L1/L2/L3品質層 / DESIGN.md標準フォーマットを調査した
- Retro-Futurism × Anthropic Orangeデザイン言語を9セクション構成で文書化した

### 判断したこと
- DESIGN.mdはdocs/に配置する（プロジェクトルートではなくdocs/配下）
- Claude Codeは全UI実装の前にdocs/DESIGN.mdを参照する
- L1/L2/L3品質層を定義して品質軸を統一した

### 次にやること
- Phase 2.1: Engine diagnostics画面（DESIGN.md準拠で実装）

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- Phase 2.0: Runner / Policy / Approvalの完成
- jobs/state.ts・actions/state.tsで状態遷移を一元化した
- runners/ディレクトリを作成してapprovals・alertReminders・approvedActionsを実装した
- createApprovalActionを実装してsendApprovalNotificationを結線した
- DB job runner（claimPendingJob・runPendingJobs）を実装した
- SchedulerをenqueueのみにしてrunPendingJobsに実行を委ねた
- Webhook fallbackをapproval・alert reminderの両方に実装した
- Bot通知関数をPromise<boolean>に変更して通知成功時のみDB更新するようにした
- Codexレビュー完了・P1/P2 finding全修正済み

### 判断したこと
- retryは新jobを作る方針（元jobは再利用しない）
- 通知成功時のみlast_notified_atを更新する
- Bot通知失敗でaction作成は失敗させない

### 次にやること
- Phase 2.1: Engine diagnostics画面

担当：Claude

---

## 2026-04-13 / Claude（Bot通知関数をPromise<boolean>化）

### やったこと
- `discord/notifications.ts`: `sendAlertNotification` / `sendApprovalNotification` の戻り値を `Promise<boolean>` に変更（成功時 true / channel未設定・channel不適合・例外時 false）
- `runners/approvals.ts`: Bot経路で返り値をそのまま `notified` に代入（try/catchによるラップを撤去）
- `runners/alertReminders.ts`: 同上
- `decisions/alerts.ts` / `actions/logAction.ts` の `void sendXxxNotification(...)` は fire-and-forget なので既存のまま維持（戻り値は無視）
- `pnpm verify` 全通過（typecheck 6/6・test 36/36・app build 成功）

### 判断したこと
- Bot内部でcatchして false を返す方が呼び出し側の条件分岐が単純になり、`notified=true` の誤報も減る
- fire-and-forget 箇所は `Promise<boolean>` でも void 呼び出しで問題なし（TypeScriptのvoid contextは戻り値型を強制しない）

### 次にやること
- Codexレビュー

担当：Claude

---

## 2026-04-13 / Claude（Phase 2.0 finding修正）

### やったこと
- Migration `20260413000001_jobs_updated_at.sql` 追加（`transitionJobStatus` が書く `updated_at` をDBに存在させる）
- `scheduler/index.ts`: `triggerWeeklyDigest` / `catchUpMissedSchedules` を enqueue のみに変更。`runPendingJobs` が拾う前提にして二重実行と scheduler内での同期実行を排除（`runJob` import削除）
- `runners/approvedActions.ts`: 承認済み retry_job 実行前に元job検証を追加（`jobId` 必須 / 存在 / status ∈ [failed, needs_review] / type一致）。失敗時は理由付きで action を failed に遷移
- `discord/notifications.ts`: `sendApprovalNotificationViaWebhook` / `sendAlertNotificationViaWebhook` を追加（Bot未起動時のfallback用、booleanで送信成否を返す）
- `runners/approvals.ts`: Bot → Webhook の順で fallback、`notified=true` のときのみ `last_notified_at` / `notification_count` を更新
- `runners/alertReminders.ts`: 同じく fallback と conditional update。`discordClient` / `config` はループ外で1度だけ取得
- `pnpm verify` 全通過（typecheck 6/6・test 36/36・app build 成功）

### 判断したこと
- cron からの同期実行をやめると retryやbackoffの責務が `runPendingJobs` に集約され、状態遷移の正が1箇所に集まる
- approvedActions は claim 前に検証することで「invalid retry → running → failed」という余分な遷移を回避（validation-then-claim の順）
- notified boolean は Bot の内部catchで false を返さない既存の `sendApprovalNotification` の制約があるため、Botパスは `try/catch` でwrap。Webhookパスは `res.ok` ベースの明確な真偽を返す
- `sendAlertNotification` は内部でDB書き込み（last_notified_at）を既に行うが、今回のreminder pathでも外側から明示的に更新して冪等性を担保（Botが内部更新した場合は同じ値を上書きするだけで害はない）

### Supabase適用用SQL

```sql
alter table public.engine_jobs
  add column if not exists updated_at timestamptz not null default now();
```

### 次にやること
- Codexレビュー

担当：Claude

---

## 2026-04-13 / Claude（Phase 2.0 - Runner / Policy / Approval）

### やったこと
- Migration `20260413000000_actions_notification_columns.sql` 追加（engine_actions に `last_notified_at` / `notification_count`）。migrations/README.md も更新
- shared `EngineAction` に `lastNotifiedAt` / `notificationCount` を追加
- `jobs/state.ts` を新規作成（`transitionJobStatus` を `from`条件付きupdateで実装、不正遷移を防止）
- `actions/state.ts` を新規作成（`transitionActionStatus` 同上、approved/denied時のactor記録含む）
- `jobs/runner.ts` に `claimPendingJob` / `runPendingJobs` を追加（pending→running をatomic claim）
- `actions/logAction.ts` に `createApprovalAction` を追加（作成成功後にDiscordへEmbed+Button送信、失敗してもaction作成は成功扱い）
- `runners/approvals.ts`（24h再通知 + 48h auto-cancel）
- `runners/alertReminders.ts`（open×critical alertの30分再通知、shouldNotify判定を使用）
- `runners/approvedActions.ts`（approved retry_job を拾って research_digest を再enqueue、元jobに `retried as ...` を記録）
- `scheduler/index.ts` に4つのcron: pending jobs（5min）/ approved actions（5min）/ stale approval（15min）/ alert reminder（10min）
- `routes/actions.ts` の approve/deny を `actions/service.ts` 経由に統合、レスポンス先でlastNotifiedAt / notificationCount をmap
- `pnpm verify` 全通過（typecheck 6/6・test 36/36・app build 成功）

### 判断したこと
- from条件付きupdateで遷移の整合を担保し、別runnerとの競合でも重複実行が起きない設計に統一
- `createApprovalAction` はDB insert成功を真の成功とし、Discord通知は best effort（`void sendApprovalNotification`）。通知失敗でactionを失敗にしない
- `runApprovedActions` は今はretry_jobのみ扱い、将来他のactionTypeが追加されたときに分岐を増やす
- `transitionActionStatus` の approved/denied は `actorId` を必須にしてaudit trailの空欄を防ぐ
- `routes/actions.ts` は既存UI契約を保ったまま service.ts に委譲（二重実装を解消）

### Supabase適用用SQL

```sql
alter table public.engine_actions
  add column if not exists last_notified_at timestamptz,
  add column if not exists notification_count integer not null default 0;
```

### 次にやること
- critical alert reminder の `last_notified_at` 更新結線（今は shouldNotify が true でも engine_alerts 側は `sendAlertNotification` 内で更新される想定を利用、挙動を次回Codexレビューで確認）
- `sendApprovalNotification` のembed内に承認コマンド例を追加する

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- migration fresh apply確認をCodexの論理確認で実施した
- 全10migrationの適用順・依存関係・実装整合性に問題がないことを確認した
- Phase 1.8: Stabilize Bionic Core 全タスク完了

### 判断したこと
- fresh DB確認は本番DBと同じSupabaseプロジェクトを使えないため論理確認で実施
- 将来GitHub公開前に改めてfresh DBで確認する

### Phase 1.8完了サマリー
- config.ts導入（env一元管理）
- pnpm verify追加
- README起動手順整備
- TECHNICAL_DESIGN.md実装追従
- secrets scan CI追加（gitleaks）
- migration fresh apply確認

### 次にやること
- Phase 2.0: DB job runnerの明確化

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- GitHub Actions CIにgitleaksによるsecrets scanを追加した
- .gitleaks.tomlを作成してallowlist pathsで.env.exampleを除外した
- Codexレビュー完了・P2 finding修正済み

### 次にやること
- migration fresh apply確認

担当：Claude

---

## 2026-04-13 / Claude（gitleaks設定修正）

### やったこと
- `.gitleaksignore` を削除し `.gitleaks.toml` に置き換え
- `.env.example` を allowlist.paths で除外する構成に統一

### 判断したこと
- `.gitleaksignore` はcommit hash指定のfinding除外用で、パス除外はtomlのallowlist.pathsが正しい使い方
- 今後追加するplaceholderファイルはtoml側で一元管理する

### 次にやること
- migration fresh apply確認

担当：Claude

---

## 2026-04-13 / Claude（secrets scan CI追加）

### やったこと
- `.github/workflows/ci.yml` に `secrets-scan` ジョブを追加（gitleaks/gitleaks-action@v2、fetch-depth: 0）
- `.gitleaksignore` を新規作成（`.env.example` はプレースホルダのみなので除外）
- `docs/ROADMAP.md` の secrets scan チェックボックスを完了にマーク

### 判断したこと
- fetch-depth: 0 でfull historyをscan（過去コミットの漏洩も検出できるように）
- `.env.example` は placeholder 値のみでリアル secret は書かない運用なので除外
- 既存の typecheck / test / build 3ジョブは変更せず並列に追加

### 次にやること
- migration fresh apply確認（Phase 1.8の残件）

担当：Claude

---

## 2026-04-13 / Claude（TECHNICAL_DESIGN.md P2 finding修正）

### やったこと
- BionicEngineService の例を現状のshared型（captureEvent / getStatus / listAlerts / runJob）に合わせて4メソッドに訂正。approveAction / retryAction は内部実装として補足
- projects / services テーブルを「将来のmulti-tenant対応として予定」セクションに分離（現在は `project_bionic` 固定 + `service_id` 文字列運用）
- client_event_id を「再送の検知・検索用index」と正確に記述し、UNIQUE化 + 409/upsert方針を将来タスクとして明記
- engine_alerts.type を `service_health / service_error / research_digest / job_failure / deployment_regression` に訂正
- engine_actions.type / status / mode を shared 型の値に揃えた（status: pending / running / succeeded / failed / skipped / pending_approval / approved / denied / cancelled）
- deployments.watch_status を `pending / watching / alerted / completed / failed` に訂正、`error_increase_percent` を追加

### 判断したこと
- 実装は変更せずドキュメントのみを正に合わせる
- projects / services は「予定あり」であることは残し、実装済みテーブル一覧と混ぜない

### 次にやること
- secrets scan CI追加 / migration fresh apply確認

担当：Claude

---

## 2026-04-13 / Claude（TECHNICAL_DESIGN.mdの実装追従）

### やったこと
- `docs/TECHNICAL_DESIGN.md` を現在の実装に追従
  - アーキテクチャ図: App/CLI/SDK/MCP/Supabase/Discord/Vercel Webhookを明示
  - 技術スタック: GitHub Actions Cron/Vercel Cron → node-cron に修正、TailwindCSS v4 / discord.js / Vitest / GitHub Actions CIを追加
  - エンジン5層 → 実装ファイルへの逆引きマップを追加（sources/routes/decisions/policies/actions/discord/jobs）
  - モジュール構成: config.ts / jobs/types.ts・repository.ts・runner.ts / policies/ / discord/ / decisions/deploymentWatch.ts / sources/vercel.ts / routes/webhooks/ / actions/service.ts / mcp を反映
  - データモデル: engine_actions（approved_by 等）/ engine_alerts（fingerprint / last_notified_at / notification_count 等）/ engine_jobs（dedupe_key）/ research_items（source default='manual' / category）/ deployments を追加
  - 設計原則: Centralized config / Centralized notification policy / Fail-closed / Phase 1.8以降のROADMAP整合 を追加
  - 実装済み主要機能リストを末尾に追加
  - 最終更新日: 2026-04-13

### 判断したこと
- Phase定義は TECHNICAL_DESIGN.md では概略だけ書き、詳細は ROADMAP.md に委ねる（単一の正にする）
- engine_actions は Phase 1.5 として実装済みなので「Phase 2で追加」の旧記述は削除
- コスト設計セクションの「競合との差別化」は BIONIC_PRODUCT.md と重複するが、技術的コスト試算の文脈として簡潔に残した

### 次にやること
- secrets scan CI追加 / migration fresh apply確認 のどちらかを次に選択

担当：Claude

---

## 2026-04-13 / Claude（README P1/P2 finding修正）

### やったこと
- Minimum Setupに `BIONIC_ENGINE_TOKEN=` を空で記載する手順と、設定時は全クライアント（App/CLI/MCP）で同じtokenを使う注記を追加
- CLI UsageにtokenをCLI側に渡すLinux/Mac・Windows PowerShellの手順を追加

### 判断したこと
- 「Engineだけtokenを設定してCLIで叩けない」ハマりが起きやすいので、初期設定側で明示的に空にしてもらう方針
- token有りのCLI手順はWindows PowerShellでも動くよう2例並記

### 次にやること
- TECHNICAL_DESIGN.md の実装追従 / secrets scan CI / migration fresh apply確認 の中から次を選択

担当：Claude

---

## 2026-04-13 / Claude（README起動手順の整備）

### やったこと
- `README.md` を新規作成（What Bionic does / Prerequisites / Minimum Setup / Full Setup (Discord Bot) / Vercel Webhook / MCP / Verification / Troubleshooting / CLI / Project Structure / Development / License）
- `docs/ROADMAP.md` の README チェックボックスを完了にマーク

### 判断したこと
- 最小起動→Discord Bot→Vercel webhook→MCPの順で段階的に有効化できるように章を分けた
- トラブルシュートはこれまでに実際にハマった項目（Engine起動・Bot不達・MCP未検出・ngrok URL変動）を中心に
- License は AGPL-3.0 (planned) と明記し、Phase 2.4 で正式化する想定

### 次にやること
- TECHNICAL_DESIGN.md の実装追従 / secrets scan CI / migration fresh apply確認 の中から次を選択

担当：Claude

---

## 2026-04-13 / Claude（pnpm verify追加）

### やったこと
- `package.json` に `verify` スクリプトを追加（typecheck && engine test && app build）
- `pnpm verify` の実行を確認: typecheck 6/6 通過 / engine test 36/36 通過 / Next.js app build 成功
- `docs/ROADMAP.md` の `pnpm verify` チェックボックスを完了にマーク

### 判断したこと
- `&&` で直列実行し、いずれかが失敗したら以降をスキップ（失敗を見逃さない）
- engine testとapp buildのみ対象（他のパッケージはtypecheckで十分）

### 次にやること
- README起動手順の整備

担当：Claude

---

## 2026-04-13 / Claude（config.ts P1/P2 finding修正）

### やったこと
- Discord mode判定を修正: `botToken && !channelId` の場合は Webhook にフォールバックし、webhookUrl もなければ `disabled` に落とす（以前は `mode='bot'` のままだった）
- `validateConfigForStartup` のテストを3件追加（process.exit を spy、production missing / production all set / development）
- `redactConfig` のテストを追加（secret値がJSON化後に出現しないことを検証）
- BOT_TOKENのみのテストケースを修正（期待値を 'disabled' / 'webhook' に更新）
- `pnpm typecheck` 全6パッケージ通過
- `pnpm --filter @bionic/engine test` 全36件通過（config.test は12→16件）

### 判断したこと
- channel_id がない状態で `mode='bot'` のままだと `sendAlertNotification` / `sendDigestNotification` が実質動作しないので、早期にWebhookへフォールバックする方が現場で壊れにくい
- redactConfig はJSON.stringify後の文字列検査でreject。secret名が増えてもテストが検知できる

### 次にやること
- `pnpm verify` 追加（typecheck + engine test + app build）
- README起動手順の整備

担当：Claude

---

## 2026-04-13 / Claude（Phase 1.8 - config.ts導入）

### やったこと
- `packages/engine/src/config.ts` を新規作成（env読み取り・validation・default値・singletonを一元化）
- `packages/engine/src/config.test.ts` を追加（12ケース、デフォルト/Discord mode判定/フォールバック/CSV・Vercel projectMapパース/production判定）
- Engine全体で `process.env` 直読みを撲滅し `getConfig()` 経由に統一
  - `index.ts`（`validateEnvironment` を `validateConfigForStartup` に置換）
  - `lib/supabase.ts` / `middleware/auth.ts` / `actions/notify.ts`
  - `discord/index.ts` / `discord/interactions.ts` / `discord/notifications.ts`
  - `policies/notification.ts`（`getQuietHoursConfig` のvalidationは config.ts に一元化）
  - `scheduler/index.ts`（ローカル `getConfig` と `ALLOWED_TIMEZONES` を削除）
  - `routes/webhooks/vercel.ts` / `sources/vercel.ts`
- `redactConfig` を用意（secretを出さないdiagnostics用）
- `pnpm typecheck` 全6パッケージ通過
- `pnpm --filter @bionic/engine test` 全32件通過（config.test.ts含む）

### 判断したこと
- envのvalidationはload時に行い、invalidな値は warning を出してデフォルトにフォールバックする（cron式・timezone・projectId・int range）
- production必須チェックは起動時のみ（`validateConfigForStartup` で `process.exit(1)`）。middlewareは毎回のrequestで起動拒否しない
- Discord mode判定は load時に一回だけ（bot > webhook > disabled）。bot_tokenがあればchannel_id不足でも `mode='bot'` とし起動時に警告を出す方針
- singletonは `getConfig()`、テストは `loadConfig(env)` で引数注入
- `policies/notification.ts` のローカル `parseHour` は config.ts に吸収して重複を排除

### 次にやること
- `pnpm verify` 追加（typecheck + engine test + app build を一発実行）
- README起動手順の整備

担当：Claude

---

## 2026-04-13 / Claude（ロードマップ確定）

### やったこと
- `docs/ROADMAP.md` を新規作成（Phase 1.8 / 2.0 / 2.1 / 2.2 / 2.3 / 2.4 / 3 を整理）
- CURRENT.md を更新（次の1手を Phase 1.8: config.ts導入 に）

### 判断したこと
- 機能追加より「壊れにくい運用エンジン」を先に固める方針を明文化
- 設計思想・判断基準をROADMAP.mdに書いて、迷ったときの優先順位を明確化

### 次にやること
- Phase 1.8: config.ts導入（env一元管理・validation）

担当：Claude

---

## 2026-04-13 / Claude

### やったこと
- 第一指示「いいものを作る」をAGENTS.mdに追記した
- Quality StandardをBIONIC_PRODUCT.mdに追記した

### 判断したこと
- 実装コストを理由にした妥協は今後認めない
- 技術的負債・セキュリティ・保守性・拡張性は常に検討対象とする

担当：Claude

---

## 2026-04-12 / Claude

### やったこと
- SECURITY_RELEASE_CHECKLIST.mdを作成した
- .github/workflows/ci.ymlを作成した（typecheck/test/build 3ジョブ）
- Codexレビュー完了・問題なし

### 判断したこと
- CI上でfresh checkoutでpnpm typecheck・test・buildが全て通ることを確認した

担当：Claude

---

## 2026-04-12 / Claude（SECURITY_RELEASE_CHECKLIST.md + GitHub Actions CI）

### やったこと
- `SECURITY_RELEASE_CHECKLIST.md` を作成（環境変数 / RLS / Engine API / Discord Bot / MCP / リリース前チェック / Supabase key漏洩対応手順）
- `.github/workflows/ci.yml` を作成（typecheck / test / build の3ジョブ、push & PR to main トリガー）
- ルート `package.json` の typecheck スクリプトは既に存在することを確認
- `pnpm typecheck` が全6パッケージで通ることを確認

### 判断したこと
- CIは typecheck / test / build を独立ジョブにして並列実行、いずれかが落ちればmergeを止める方針
- App buildは `NEXT_PUBLIC_ENGINE_URL` のダミー値で実行（CI環境でEngineを起動しないため）
- Webhook secret等のCI実行時に不要な秘密はジョブに渡さない
- セルフレビュー：CIファイルのpnpm/setup-node action versionは現行（v4）、ジョブが3つに分かれているため install が3回走る点はキャッシュで許容範囲

### 次にやること
- needs_review job 再実行導線
- json-rules-engine導入検討（Phase 2後半）

担当：Claude

---

## 2026-04-12 / Claude

### やったこと
- Discord Botの動作確認を完了した
- [CRITICAL] medini-api error reportedのEmbed通知がDiscordに届くことを確認した
- プライベートチャンネルへのBot追加が必要だったことを確認した

### 判断したこと
- チャンネルIDとBot権限の設定が正しければ通知が届く
- プライベートチャンネルの場合はBotをメンバーに追加する必要がある

### 次にやること
- SECURITY_RELEASE_CHECKLIST.md作成
- GitHub Actions CI設定

担当：Claude

---

## 2026-04-12 / Claude

### やったこと
- Discord Botをpackages/engine/src/discord/に実装した
- alert新規作成時にshouldNotify判定を経由してDiscord通知を結線した
- digest通知をDiscord.js経由に移行した（Bot未起動時はWebhook継続）
- allowlist未設定時はfail-closedにした
- Bot通知失敗時はdigest job自体をfailedにしない設計にした
- actions/service.tsを作成してapproveAction/denyActionを切り出した
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- Discord承認ボタンは補助手段（正式承認導線はCLI/App）
- BIONIC_DISCORD_APPROVER_IDS未設定時はfail-closed（全員拒否）
- Bot通知失敗はnotify_discord actionをfailedにしてjobはneeds_reviewにする
- sendApprovalNotificationの結線はpending_approval action実装時に追加する

### 未解決・既知リスク
- sendApprovalNotificationはpending_approval action生成時に結線が必要

### 次にやること
- Discord Botの動作確認

---

## 2026-04-12 / Claude Code（Digest Bot通知失敗時の状態分離）

### やったこと
- `jobs/researchDigest.ts`: Bot通知失敗を `misconfigured` に押し込まず `'failed'` のまま保持
- transport（`discord_bot` / `webhook`）を action の result/error に記録
- Bot通知失敗時: `notify_discord` action を `failAction`、`markJobNeedsReview(jobId)`、`run_research_digest` action は `result='bot_notify_failed'` で `completeAction` → 早期 return
- Webhook `misconfigured` の既存パス（job failed）は維持
- typecheck 全通過 / engine test 20/20 通過

### 判断したこと
- Bot通知失敗は一過性のネットワーク/Discord API 障害の可能性が高いため job 全体を failed にせず needs_review にして人間の確認を促す
- Webhook 未設定は構成ミスなので失敗状態を維持

### 未解決・既知リスク
- needs_review 状態の job を再実行する UI/CLI は未実装

### 次にやること
- needs_review job 再実行導線
- pending_approval を生成する action 設計

---

## 2026-04-12 / Claude Code（Discord Bot P1 finding修正）

### やったこと
- `discord/interactions.ts`: allowlist 未設定時は全員拒否（fail-closed）。メッセージで `BIONIC_DISCORD_APPROVER_IDS` 設定を促す
- `decisions/alerts.ts`: 新規alert作成成功時のみ `shouldNotify({kind:'alert_created'})` で判定し `sendAlertNotification` を非同期発火（update時は通知しない）
- `discord/notifications.ts` に `sendDigestNotification` を追加
- `jobs/researchDigest.ts`: Bot起動中は `sendDigestNotification` を使用、未起動時は既存 Webhook `notifyDigest` を使用
- typecheck 全通過 / engine test 20/20 通過

### 判断したこと
- pending_approval はまだ Engine 側で生成箇所がないため、`sendApprovalNotification` の結線は今回スキップ（Claude 確認事項として CURRENT.md に残す）
- alert_reminder は Scheduler 経由で将来実装（今回は `alert_created` のみ）
- Discord Bot 送信失敗は `misconfigured` にマッピングして既存の状態機械を壊さない
- 通知は `void` で発火してメイン処理を止めない

### 未解決・既知リスク
- `sendApprovalNotification` を呼び出す pending_approval 生成箇所の設計が未着手
- alert_reminder Scheduler 未実装

### 次にやること
- pending_approval を生成する action の設計（Level 2 承認導線）
- alert_reminder 用 Scheduler を追加

---

## 2026-04-12 / Claude Code（Discord Bot実装）

### やったこと
- `discord.js` を engine パッケージに追加
- `actions/service.ts` に `approveAction` / `denyAction` を実装（`status='pending_approval'` guard 付き atomic update）
- `discord/` 以下に client / embeds / notifications / interactions / index を実装
- `discord/notifications.ts`: alert/approval 送信と `last_notified_at` / `notification_count` 更新
- `discord/interactions.ts`: ボタン押下時の承認/却下、`BIONIC_DISCORD_APPROVER_IDS` allowlist
- `index.ts`: `BIONIC_DISCORD_BOT_TOKEN` 設定時のみ `startDiscordBot()` を起動（未設定時は Webhook モード継続のログ）
- `.env.example` に `BIONIC_DISCORD_BOT_TOKEN` / `BIONIC_DISCORD_CHANNEL_ID` / `BIONIC_DISCORD_APPROVER_IDS` を追記
- typecheck 全通過 / engine test 20/20 通過

### 判断したこと
- 承認導線の正本は CLI/App（Discord ボタンは補助手段）
- approve/deny は `.eq('status', 'pending_approval')` で atomic guard し、二重承認・race を防止
- Bot は Engine プロセス内で共存（MCP と違い別プロセス化しない）
- `ALLOWED_USER_IDS` 空の場合は全員許可（個人開発中の利便性優先・本番は allowlist 必須）

### 未解決・既知リスク
- sendAlertNotification / sendApprovalNotification の呼び出し結線（Decision 側）は次タスク
- Bot プロセス停止シグナル（SIGTERM）ハンドラは未実装

### 次にやること
- Alert/Approval 発火地点から Discord 通知を呼ぶ結線
- policies/notification を結線する

---

## 2026-04-12 / Claude

### やったこと
- Engineの実行責務分離を実施した
- jobs/runner.ts・jobs/repository.ts・jobs/types.tsを新規作成した
- runResearchDigestをroutes/jobs.tsからjobs/researchDigest.tsに移動した
- routes/jobs.tsをHTTP受付・validation・enqueue・runner起動のみに縮小した
- policies/notification.tsを実装した（quiet hours・alert_created・alert_reminder 30min・approval_stale 24h）
- policies/approval.tsを実装した（48h auto-cancel）
- engine_alertsにlast_notified_at・notification_countを追加した
- Codexレビュー完了・P1/P2 finding全修正済み

### 判断したこと
- Engineの責務分離はDiscord Bot実装前に必須と判断して先に実施した
- dedupeKeyは明示された場合のみ使用する（手動/MCP実行が週次dedupeでskipされるバグを修正）
- needs_reviewはcompleted_atを設定しない（中間状態のため）
- quiet hours環境変数は完全一致バリデーション付き
- 48h auto-cancelは通知ポリシーと分離してpolicies/approval.tsに置いた
- Discord BotはEngine内部からjobs/runner.tsを直接呼ぶ方針

### 未解決・既知リスク
- Discord Bot実装がまだ

### 次にやること
- Discord Bot実装

---

## 2026-04-12 / Claude Code（quiet hoursバリデーション強化）

### やったこと
- `policies/notification.ts#parseHour` に `^\d+$` 完全一致チェックを追加
- `'9abc'` のような `parseInt` で部分的にパースできてしまう値もデフォルトにフォールバック
- 範囲外・パース失敗でログメッセージを分離（`invalid hour value` / `hour out of range`）
- typecheck 全通過 / engine test 20/20 通過

### 判断したこと
- `parseInt('9abc', 10)` は `9` を返すため `isNaN` だけでは不足。正規表現で厳格化

### 未解決・既知リスク
- なし

### 次にやること
- Discord Bot 実装

---

## 2026-04-12 / Claude Code（Engine責務分離 finding修正）

### やったこと
- `routes/jobs.ts`: `dedupeKey` 未指定時は補完せず `undefined` のまま渡す
- `jobs/researchDigest.ts#enqueueResearchDigestJob`: `dedupeKey` を optional 化し、未指定時は insert payload から `dedupe_key` を除外
- `jobs/repository.ts#markJobNeedsReview`: `completed_at` を削除（中間状態）
- `policies/notification.ts#getQuietHoursConfig`: `parseHour` で 0-23 範囲バリデーションを追加し、不正値はデフォルトにフォールバック
- typecheck 全通過 / engine test 20/20 通過

### 判断したこと
- dedupe は caller（scheduler）側の責務。HTTP API は明示指定がなければ dedupe を強制しない
- needs_review は人間の確認待ち状態なので completed_at を打刻しない

### 未解決・既知リスク
- なし

### 次にやること
- Discord Bot 実装で policies/notification を結線

---

## 2026-04-12 / Claude Code（Engine責務分離 + 通知ポリシー）

### やったこと
- IDEAS.md確認: Discord Bot実装前の整理 / quiet hours / 承認stale / 通知優先度のアイデアを反映
- `packages/engine/src/jobs/` にrunner・repository・researchDigest・typesを集約
  - `jobs/types.ts`（EnqueueJobParams・JobExecutionResult）
  - `jobs/repository.ts`（markJobRunning/Completed/Failed/NeedsReview）
  - `jobs/researchDigest.ts` に `runResearchDigest` を移動し repository helper を利用
  - `jobs/runner.ts` で type dispatch
- `routes/jobs.ts` を HTTP受付・validation・enqueue・runner起動 のみに縮小
  - `RunJobResult` を `{ jobId, status, message }` に再設計
- scheduler の import を `runJob('research_digest', ...)` に変更
- `supabase/migrations/20260412000001_alert_notification.sql`（engine_alerts に last_notified_at / notification_count 追加）
- shared Alert 型に `lastNotifiedAt` / `notificationCount` 追加、routes/alerts.ts のマッピング更新
- `packages/engine/src/policies/notification.ts`（quiet hours・digest・alert_created・alert_reminder・approval_stale）
- `packages/engine/src/policies/approval.ts`（48h auto-cancel）
- typecheck 全通過 / engine test 20/20 通過

### 判断したこと
- `RunJobResult` を Job ラッパーから軽量な start/skipped 応答に変更（非同期起動に合わせる）
- Discord Bot から共通で使えるよう通知判断を純関数に分離
- quiet hours は `BIONIC_QUIET_HOURS_START/END/TIMEZONE` で設定、critical は例外で通す
- stale approval 閾値は 48h（IDEAS.md 24/48/72h のうち中央値を採用）

### 未解決・既知リスク
- Supabase への `20260412000001_alert_notification.sql` 手動適用が必要
- policies のユニットテストは未追加（Discord Bot 実装時に組み込み予定）

### 次にやること
- Discord Bot 実装で policies/notification を呼び出す結線
- policies のテスト追加

---

## 2026-04-12 / Claude

### やったこと
- bionic-ops MCPサーバーをpackages/mcpとして実装した
- Claude Desktop登録・動作確認を完了した
- 「Bionicのステータスを見せて」でEngine状態・アラート一覧を取得できることを確認した
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- approve_action/deny_actionはPhase 1.5では含めない（承認はCLI/Appで行う思想を維持）
- tool出力は英語（英語市場メイン）
- Claude Desktop設定はdocs/MCP.mdに記載
- WindowsのMSIXインストーラーでは設定ファイルのパスが異なる
  （%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\）

### 次にやること
- Discord Bot実装（Phase 2後半）

---

## 2026-04-12 / Claude Code（MCP P1 finding修正）

### やったこと
- `run_research_digest` のbodyに `requestedBy: 'mcp'` を追加
- `EventSource` 型に `'mcp'` を追加
- Engine `routes/jobs.ts` の `VALID_SOURCES` に `'mcp'` を追加
- `packages/mcp/tsconfig.json` に `"types": ["node"]` を追加
- typecheck/build 全成功、engine test 20/20 通過

### 判断したこと
- `EventSource` を共通型として拡張し、SDK/CLI/MCP/Engine 全てで一貫性を保つ

### 未解決・既知リスク
- なし

### 次にやること
- Codex 再レビュー
- Claude Desktop 設定で接続テスト

---

## 2026-04-12 / Claude Code

### やったこと
- bionic-ops MCPサーバーを `packages/mcp` として実装した
- 6ツール登録: `get_status` / `get_alerts` / `get_actions` / `get_events` / `get_research_items` / `run_research_digest`
- Engine HTTP API クライアント（`lib/engineClient.ts`）と format helper を実装
- StdioServerTransport で Claude Desktop から接続可能
- `docs/MCP.md` を作成（セットアップ手順・claude_desktop_config 例）
- pnpm install / typecheck / build 全成功

### 判断したこと
- MCPはSupabaseに直接接続せず、必ず Engine HTTP API を経由する（権限分離）
- 401時はBIONIC_ENGINE_TOKEN設定を促すメッセージ
- fetch失敗時はEngineオフライン判定し起動コマンドを案内
- pnpm-workspace.yaml は既に `packages/*` を含むため変更不要

### 未解決・既知リスク
- Codexレビュー未実施
- Claude Desktopでの接続実機テストは未実施

### 次にやること
- Claude Desktop 設定で接続テスト
- Codex レビュー

---

## 2026-04-12 / Claude

### やったこと
- Deploy→Watch→Alertの動作確認を完了した
- ngrok + curlでWebhook受信・署名検証・deployment保存を確認した
- Engineログで「deployment saved: dpl_test123 watching until ...」を確認した

### 判断したこと
- ngrok無料プランで動作確認は十分できた
- Vercel ProプランなしでもcurlでWebhookをシミュレートできる

### 次にやること
- bionic-ops MCPサーバー（packages/mcp として独立）

---

## 2026-04-12 / Claude

### やったこと
- Deploy→Watch→Alertを実装した
- deploymentsテーブルを作成した（RLS有効化済み）
- Vercel Webhook受信（HMAC-SHA1署名検証・raw body処理）を実装した
- 5分ごとのdeployment watch schedulerを追加した
- deployment_regression alertの生成を実装した
- Codexレビュー完了・P1/P2 finding全修正済み

### 判断したこと
- VERCEL_WEBHOOK_SECRET未設定時は常時401（開発中も例外なし）
- baselineは直前30分のerror件数
- alert判定は監視終了チェックより前に実行する
- alert作成済みの場合はcompleted更新をスキップする
- ngrokで動作確認する（無料プラン・URLは毎回変わる）

### 未解決・既知リスク
- ngrok動作確認はまだ未実施
- BIONIC_VERCEL_PROJECT_MAPの設定が必要

### 次にやること
- ngrokでトンネルを開いてVercel Webhookを設定して動作確認する

---

## 2026-04-12 / Claude Code（finding修正 #2）

### やったこと
- `createDeploymentRegressionAlert` の戻り値を boolean 化（alert作成有無を返す）
- `evaluateSingleDeployment` で alert作成時は completed 更新をスキップ（alerted→completed上書き競合の解消）
- vercel webhook: baseline count取得時の error を捕捉し失敗時は 500 を返す
- pnpm typecheck 全通過 / pnpm --filter @bionic/engine test 全20通過

### 判断したこと
- alerted は最終状態として保持する。次回ループでは `alreadyAlerted` で重複を防ぐため completed への遷移は不要

### 未解決・既知リスク
- なし

### 次にやること
- bionic-ops MCPサーバー（packages/mcp）

---

## 2026-04-12 / Claude Code（finding修正）

### やったこと
- Deploy→Watch→Alert P1/P2 finding 4件修正
  - vercel webhook: `VERCEL_WEBHOOK_SECRET` 未設定時は常時401（開発例外を撤去）
  - migration: `deployments` テーブルRLSを `enable` に変更
  - deploymentWatch: alert判定を監視終了チェックの前に移動（境界時点でも発火するように）
  - deploymentWatch: error count取得・update・alert後update のDBエラーを捕捉して `watch_status='failed'` に遷移
  - alert発火処理を `createDeploymentRegressionAlert` に切り出し
- 不要だった `evaluateAlertForEvent` / `EngineEvent` import削除
- pnpm typecheck 全通過 / pnpm --filter @bionic/engine test 全20通過

### 判断したこと
- secret未設定時に通すと本番混入リスクが大きすぎるため開発でも拒否する方針に統一
- alert後のdeployments update失敗時は alert は残したまま `failed` に遷移させ、次回ループで重複alertを生まないようにする

### 未解決・既知リスク
- 既存DBに対しては手動で `alter table public.deployments enable row level security;` を実行する必要がある

### 次にやること
- bionic-ops MCPサーバー（packages/mcp）

---

## 2026-04-12 / Claude Code

### やったこと
- Deploy→Watch→Alert実装
  - shared型: AlertType / ActionType拡張・DeploymentWatchStatus・Deployment追加
  - supabase/migrations/20260412000000_deployments.sql 作成
  - packages/engine/src/sources/vercel.ts 新規（payload正規化・project mapping）
  - packages/engine/src/routes/webhooks/vercel.ts 新規（HMAC SHA1検証・baseline集計・upsert）
  - packages/engine/src/decisions/deploymentWatch.ts 新規（5min cron評価・deployment_regression alert発火）
  - scheduler/index.ts に */5 cronを追加
  - index.tsで `/api/webhooks/vercel` をengineAuthMiddlewareより前にraw bodyでmount
  - .env.exampleにVERCEL_WEBHOOK_SECRET / BIONIC_VERCEL_PROJECT_MAP追加
- pnpm typecheck 全通過
- pnpm --filter @bionic/engine test 全20テスト通過

### 判断したこと
- IDEAS.md確認：Deploy→Watch→Alertのアイデアはタスク仕様に既に反映済み。追加変更なし
- syntheticEvent / evaluateAlertForEvent はspecどおり残しつつ未使用警告を出さないよう `void` で吸収
- baselineは直前30分のerror件数を採用、watch期間は30分

### 未解決・既知リスク
- Supabase本番への migration適用は手動SQL Editorで実施が必要
- ngrokでのローカル受信動作確認は別途実施
- VERCEL_WEBHOOK_SECRET未設定時は署名検証スキップ（開発時のみ許可）

### 次にやること
- Supabaseに 20260412000000_deployments.sql を適用する
- Vercelプロジェクト側でWebhook設定 + ngrok起動
- bionic-ops MCPサーバー（packages/mcp）

---

## 書き方

```markdown
## YYYY-MM-DD / [担当]

### やったこと
- 

### 判断したこと
- 

### 未解決・既知リスク
- 

### 次にやること
- 
```

---

## 2026-04-08 / Claude

### やったこと
- Bionicプロジェクトの全体設計を決定した
- 以下のmdを作成した
  - AGENTS.md
  - CLAUDE.md
  - SKILLS.md
  - docs/AUTOMATION.md
  - CURRENT.md
  - WORK_LOG.md
  - docs/BIONIC_PRODUCT.md（v2）
  - docs/TECHNICAL_DESIGN.md
  - HANDOFF.md

### 判断したこと
- 製品名：Bionic（仮称）、本体ランナー：Bionic Engine
- 思想としての「OS」は内部メモに留める
- repoフォルダ名：bionic（スペースなし）
- 構成：apps / packages / docs / scripts / infra / research の6フォルダ
- 技術スタック：TypeScript / Node.js / Next.js / Supabase / GitHub Actions / Vercel Cron
- 通信方式：local HTTP（transport-agnostic service interface）
- job状態：6つ（pending / running / completed / failed / needs_review / cancelled）
- resolution_reason：別カラムで持つ
- event命名：suffixで統一
- Electronは「予定・候補」として未確定
- マルチテナント：single-tenant first, multi-tenant ready。将来の製品化に備えて今は project_id / service_id を持つ
- Phase 0（手動）から始めてPhase 1（通知自動化）へ進む
- 完全自動化はしない。人間が止められる中間点を必ず置く
- AIは補助。ルールベースが主体

### 未解決・既知リスク
- リサーチエンジンとコピペ自動化、どちらを先に実装するか未確定
- Mediniとの接続タイミング未確定
- Phase 0では手動コピペが残る

### 次にやること
- Ubuntu作業環境にも bionic フォルダを作成する
- pnpm workspaceを初期化する
- GitHubにpushする
- shared型定義を作成する

---

## 2026-04-09 / Codex

### やったこと
- Windows側の `bionic` ルートフォルダを作成した
- 6フォルダ構成を作成した
- 初期の運用文書・製品文書・技術文書の雛形を配置した
- AGENTS.md / SKILLS.md / docs/AUTOMATION.md / CURRENT.md を、合意した内容に沿って更新した
- WORK_LOG.md / docs/TECHNICAL_DESIGN.md / HANDOFF.md を、実態に合わせて更新した

### 判断したこと
- repo名・フォルダ名は `Bionic OS` ではなく `bionic` に統一する
- 自動化フローは AGENTS.md では概要のみ持ち、詳細は docs/AUTOMATION.md に分離する
- `CURRENT.md` は人間向け正本、`engine_jobs` は機械向け実行キューとして役割分離する

### 未解決・既知リスク
- Ubuntu作業環境側の repo 初期化はまだ未着手
- GitHub への push はまだ未着手
- `CLAUDE.md` はまだ最終文面への更新余地がある

### 次にやること
- Ubuntu作業環境に同じ構成を作成する
- pnpm workspace を初期化する
- `shared` 型の最小定義を切る

---

## 2026-04-09 / Claude Code

### やったこと
- Ubuntu作業環境（~/bionic）にフォルダ構成を作成した（apps/app, packages/shared/engine/sdk/cli, docs, scripts, infra, research）
- Windows側の既存md 10ファイルをUbuntu側に配置した
- pnpm workspace を初期化した（pnpm-workspace.yaml + ルートpackage.json）
- TypeScript 6.0.2 をインストールした
- ルート tsconfig.json + packages/shared/tsconfig.json を作成した
- packages/shared/src/types.ts に TECHNICAL_DESIGN.md に基づく型定義を作成した
  - EngineEvent, JobStatus, ResolutionReason, EngineJob, DecisionResult, EngineAction, ServiceStatus, Alert, BionicEngineService
- packages/shared/src/index.ts でre-exportした
- `pnpm typecheck` がエラーなく通ることを確認した
- git init → commit → push 完了

### 判断したこと
- 型定義は依頼仕様書の通りに作成。TECHNICAL_DESIGN.md の設計と一致していることを確認
- docs/BIONIC_PRODUCT.md と docs/TECHNICAL_DESIGN.md は内容を変更せずにコピーした

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1 手順3: service interface と local HTTP API の最小仕様

---

## 2026-04-09 / Claude Code（2回目）

### やったこと
- CURRENT.md を最新の状態に更新した
  - 完了済みセクションにrepo初期化・shared型定義を追加
  - 進行中セクションにservice interface /refine待ちを追加
  - 実装優先順序・Medini接続タイミングの確定事項を追加
  - Open Questionsを整理（要Claude確認→なし、要Codex確認→API仕様2件）

### 判断したこと
- CURRENT.md の内容はClaude（チャット側）からの指示通りに上書きした

### 未解決・既知リスク
- なし

### 次にやること
- Codex /refine の結果を待つ

---

## 2026-04-09 / Claude Code（3回目）

### やったこと
- packages/shared/src/types.ts を新しい型定義で上書きした（BionicEngineService, EngineEvent, ServiceStatus, Alert, Job 等）
- packages/engine パッケージを新規作成した
  - Express HTTPサーバー（ポート3001）
  - 4エンドポイント実装: POST /api/events, GET /api/status, GET /api/alerts, POST /api/jobs
- `pnpm typecheck` がshared・engine両方でエラーなく通ることを確認した
- 4エンドポイント全てでcurlレスポンスを確認した
  - POST /api/events → 202 {accepted: true, eventId}
  - GET /api/status → 200 {engine, queue, alerts, lastEventAt}
  - GET /api/alerts → 200 {alerts: []}
  - POST /api/jobs → 202 {job: {id, type, status, ...}}

### 判断したこと
- データはインメモリのみ（指示通り、DB保存は次ステップ）
- import パスに .js 拡張子を付与（NodeNext moduleResolution の要件）
- express のバージョンは pnpm resolve に任せた（^4.18.2 指定）

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1 手順5: SDK最小実装（health/error/usage）
- Phase 1 手順6: engine_eventsをDBに保存

---

## 2026-04-09 / Claude Code（4回目）

### やったこと
- Codex P1 finding 2件を修正した
  - events.ts: EngineEventの全必須フィールド（id, projectId, serviceId, type, occurredAt, source, payload）を検証するよう拡張
  - jobs.ts: requestedByの存在チェックとEventSource値のバリデーションを追加
- `pnpm typecheck` がエラーなく通ることを確認した
- curlで5パターンのテストを実施し全て期待通りの結果を確認した

### 判断したこと
- P2 finding（status.ts / alerts.ts）は指示通り今回触らない
- VALID_SOURCESはルートハンドラ内にローカル定義（共通化は将来必要時に）

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1 手順5: SDK最小実装（health/error/usage）
- Phase 1 手順6: engine_eventsをDBに保存

---

## 2026-04-09 / Claude Code（5回目）

### やったこと
- Codex P1 finding 2件を修正した（events.ts バリデーション強化）
  - EventType許可リスト検証を追加（不明なtypeは400）
  - EventSource許可リスト検証を追加（不明なsourceは400）
  - payload型検証を追加（null・配列・非オブジェクトは400）
- `pnpm typecheck` エラーなし確認
- curl 5パターンで全て期待通りの結果を確認

### 判断したこと
- VALID_EVENT_TYPES / VALID_SOURCESはモジュールスコープに定義（リクエストごとの再生成を回避）

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1 手順5: SDK最小実装（health/error/usage）
- Phase 1 手順6: engine_eventsをDBに保存

---

## 2026-04-09 / Claude

### やったこと
- service interface・local HTTP API仕様をCodexと確定した
- Phase 1 API 4エンドポイントをClaude Codeで実装した
- Codexレビューで出たP1 finding 3件を全修正した
- Windows側でgit cloneしてCodexのレビュー環境を整備した

### 判断したこと
- approveAction / retryAction はPhase 2まで実装しない
- runJobはresearch_digestのみ。alert_evaluationは同期処理
- payload は当面 Record<string, unknown>
- P2 finding（status.ts / alerts.ts）はDB導入時に対応する

### 未解決・既知リスク
- status.tsのstartedAtはDB導入時に修正する
- alerts.tsのフィルターはDB導入時に実装する

### 次にやること
- engine_eventsをSupabaseに保存する

---

## 2026-04-09 / Claude Code（6回目）

### やったこと
- Supabase接続を実装した（TECHNICAL_DESIGN.md 実装順序⑥）
  - .env.local にSupabase接続情報を配置（.gitignore済み）
  - @supabase/supabase-js をengineパッケージに追加
  - packages/engine/src/lib/supabase.ts にクライアントを作成
  - packages/engine/src/routes/events.ts にSupabase insert処理を追加
  - engine_events テーブル作成SQL を出力（手動実行待ち）
- `pnpm typecheck` エラーなし確認

### 判断したこと
- EngineEventのcamelCaseフィールドをDB側のsnake_caseカラムにマッピングした
- insert失敗時は500を返し、console.errorでログ出力する
- テーブル作成SQLはClaude Codeから直接実行できないため出力のみ

### 未解決・既知リスク
- engine_eventsテーブルがSupabase上にまだ作成されていない（SQL手動実行待ち）
- RLSポリシー未設定（anon keyではinsertがRLSでブロックされる可能性あり）

### 次にやること
- Supabase SQL Editorでテーブル作成SQLを実行する
- RLSポリシーを設定する
- curlで実際のDB保存を確認する
- Phase 1 手順5: SDK最小実装（health/error/usage）

---

## 2026-04-09 / Claude Code（7回目）

### やったこと
- dotenvを導入し、.env.local自動読み込みを実装した
  - devスクリプトを `DOTENV_CONFIG_PATH=../../.env.local tsx watch --require dotenv/config src/index.ts` に変更
  - `--require dotenv/config` でESM import解決前に環境変数をロード
  - index.tsへのdotenv importは不要（preload方式のため）
- `pnpm typecheck` エラーなし確認
- `pnpm --filter @bionic/engine dev` だけで起動→Supabase保存成功を確認

### 判断したこと
- コード内でdotenv.config()を呼ぶ方式はESMのimport hoistingにより失敗するため、`--require`によるpreload方式を採用
- DOTENV_CONFIG_PATHでモノレポルートの.env.localを相対パス指定（`../../.env.local`）

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1 手順5: SDK最小実装（health/error/usage）

---

## 2026-04-09 / Claude Code（8回目）

### やったこと
- Codex P1 finding 2件を修正した
  - supabase.ts: anon key → service_role key に切り替え、auth設定を追加
  - events.ts: insert時のidフィールドをclient_event_idに変更（DB側でuuid自動生成）
  - .env.local にSUPABASE_SERVICE_ROLE_KEYを追加
  - engine_eventsテーブル変更SQLを出力（手動実行待ち）
- `pnpm typecheck` エラーなし確認

### 判断したこと
- service_role keyはRLSをバイパスするため、サーバーサイド専用の設定（autoRefreshToken: false, persistSession: false）を付与
- idカラムはtext型のまま、gen_random_uuid()::textでデフォルト値を設定する方針

### 未解決・既知リスク
- engine_eventsテーブルのスキーマ変更SQL未実行（手動実行待ち）

### 次にやること
- Supabase SQL Editorでスキーマ変更SQLを実行する
- Phase 1 手順5: SDK最小実装（health/error/usage）

---

## 2026-04-10 / Claude

### やったこと
- engine_eventsのSupabase保存処理を実装した
- dotenvをpreload方式で導入した
- service_role keyに切り替えた
- client_event_idを導入しDB側でuuidを自動生成する設計にした
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- anon keyではなくservice_role keyをEngine側で使う
- 呼び出し元のIDはclient_event_idとして保存、DBのidはgen_random_uuid()で自動生成
- RLSは開発中は無効。本番前に有効化する

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- engine_jobs / engine_alerts / research_items はまだ未実装

### 次にやること
- engine_jobs / engine_alerts / research_items テーブルの作成と保存処理

---

## 2026-04-10 / Claude Code（9回目）

### やったこと
- jobs.ts: POST /api/jobsでengine_jobsテーブルにinsert、.select().single()でDB生成値を返却
- alerts.ts: GET /api/alertsでengine_alertsテーブルからselect、status/severity/limitフィルター対応
- status.ts: GET /api/statusでengine_jobs/engine_alerts/engine_eventsから集計（Promise.all並列）、ENGINE_START_TIMEをモジュールスコープで保持
- `pnpm typecheck` エラーなし確認

### 判断したこと
- jobs.tsのproject_idはinput.projectId ?? 'default'でフォールバック（型定義でoptionalのため）
- status.tsのstartedAtはモジュールスコープの定数で保持（プロセス起動時刻を正しく返す）
- alerts.tsのsnake_case→camelCase変換をmap内で実施

### 未解決・既知リスク
- なし

### 次にやること
- 動作確認（curl テスト）
- Phase 1 手順5: SDK最小実装（health/error/usage）

---

## 2026-04-10 / Claude Code（10回目）

### やったこと
- status.tsにDB障害検知を追加（Codex P1 finding修正）
  - Promise.allの3クエリのいずれかがエラーを返した場合に503を返す
  - console.errorで各クエリのエラー詳細をログ出力
- `pnpm typecheck` エラーなし確認
- 動作確認: 正常時200、不正URL時503を確認済み

### 判断したこと
- エラーチェックはデータ集計の前に配置（早期リターン）
- 503 Service Unavailableが適切（DBが利用不可）

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1 手順5: SDK最小実装（health/error/usage）

---

## 2026-04-10 / Claude（2回目）

### やったこと
- engine_jobs / engine_alerts / research_items テーブルをSupabaseに作成した
- POST /api/jobs でDBにjobを保存する処理を実装した
- GET /api/alerts でDBからalertを取得する処理を実装した
- GET /api/status でDB集計・lastEventAtを実装した
- GET /api/status のDB障害時503対応を実装した
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- status.tsはDB障害を503で正直に報告する。ゼロ値で誤魔化さない

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- research_itemsの保存処理はSDK実装後に追加する

### 次にやること
- SDK最小実装（@bionic/sdk: health / error / usage の3メソッド）

---

## 2026-04-10 / Claude Code（11回目）

### やったこと
- @bionic/sdk パッケージを新規作成した
  - packages/sdk/package.json, tsconfig.json
  - packages/sdk/src/client.ts — BionicClientクラス（health/error/usage 3メソッド）
  - packages/sdk/src/index.ts — re-export
- `pnpm typecheck` が shared + engine + sdk 全3パッケージでエラーなし確認

### 判断したこと
- fetchはNode.js 18以上の標準APIを使用（外部依存追加なし）
- イベントIDは `evt_{timestamp}_{random}` 形式で生成（DB側でuuidも自動生成される）
- health()はstatusが'ok'なら'service.health.reported'、それ以外は'service.health.degraded'を送信
- sourceはデフォルト'sdk'、コンストラクタで変更可能

### 未解決・既知リスク
- なし

### 次にやること
- SDKの動作確認（Engine起動→SDK経由でイベント送信→Supabase確認）
- Medini接続準備

---

## 2026-04-10 / Claude Code（12回目）

### やったこと
- Codex P1 finding修正: SDK package.jsonのmain/typesをdist/配下に変更
- tsconfig.jsonにdeclaration: trueを追加（.d.ts生成に必要）
- `pnpm typecheck` エラーなし、`pnpm --filter @bionic/sdk build` 成功確認
- dist/index.js, dist/index.d.ts の生成を確認

### 判断したこと
- declaration: trueがないと.d.tsが生成されないため追加した

### 未解決・既知リスク
- なし

### 次にやること
- SDKの動作確認（Engine起動→SDK経由でイベント送信→Supabase確認）

---

## 2026-04-10 / Claude（3回目）

### やったこと
- @bionic/sdk を実装した（health / error / usage の3メソッド）
- SDK package entrypointをdist/配下に修正した
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- SDKはfetchのみ使用。外部依存なし
- entrypointはdist/index.js・dist/index.d.tsを正本とする

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要

### 次にやること
- App 3画面実装（Dashboard / Alerts / Research）

---

## 2026-04-10 / Claude Code（13回目）

### やったこと
- apps/app を Next.js 14 App Routerで新規作成した
  - Dashboard画面（/）: GET /api/status の内容を表示
  - Alerts画面（/alerts）: GET /api/alerts の内容を表示
  - Research画面（/research）: 準備中プレースホルダー
  - src/lib/engine.ts: Engine APIクライアント（getStatus, getAlerts）
  - layout.tsx: ナビゲーション付きレイアウト
- `pnpm --filter @bionic/app build` 成功、`pnpm --filter @bionic/app typecheck` エラーなし
- .gitignoreに.next/を追加

### 判断したこと
- Next.js 14はnext.config.tsをサポートしないため、next.config.mjsを使用
- Server ComponentからEngine APIをfetchで直接呼び出し（cache: 'no-store'）
- Engine未起動時はnullを返してフォールバックUIを表示

### 未解決・既知リスク
- なし

### 次にやること
- 動作確認（Engine起動→App起動→画面表示確認）
- Medini接続準備

---

## 2026-04-10 / Claude（4回目）

### やったこと
- apps/app を Next.js App Router で作成した
- Dashboard / Alerts / Research の3画面を実装した
- EngineURLをNEXT_PUBLIC_ENGINE_URLで環境変数管理する設計にした
- Codexレビュー完了・問題なし

### 判断したこと
- Engine未起動時は画面内に「Engineが起動していません」と表示する
- ResearchページはPhase 1ではstub
- Vercel配備は将来の選択肢として残す。Phase 1はローカル運用

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- GET /api/research はPhase 2で追加する

### 次にやること
- MediniへのSDK組み込み

---

## 2026-04-10 / Claude Code（14回目）

### やったこと
- MediniにBionic SDKを組み込んだ
  - @bionic/sdk と @bionic/shared を file:参照でインストール
  - src/lib/bionic.ts を新規作成（sendHealth/sendError/sendUsage）
  - with-auth.ts に sendHealth('ok') / sendError() を追加（fireforget）
  - plan.ts の incrementUsage() に sendUsage() を追加（fireforget）
  - .env.local にBIONIC_ENGINE_URL/PROJECT_ID/SERVICE_IDを追加
- pnpm build がMediniで成功（既存動作を壊さない）

### 判断したこと
- workspace:*参照はMonorepo外では解決できないため、pnpm overridesで@bionic/sharedをfile:参照にオーバーライドした
- sendHealth/sendError/sendUsageはvoidでfireforget呼び出し（Mediniのレスポンスをブロックしない）
- 環境変数がない場合はbionicクライアントがnullになり何も送らない設計

### 未解決・既知リスク
- Mediniのgit commitは未実施（指示通り）

### 次にやること
- 動作確認（Engine + Medini起動→health event送信→Supabase確認）

---

## 2026-04-10 / Claude Code（15回目）

### やったこと
- with-auth.ts のsendError送信条件を修正した（Codex P1 finding）
  - 認証エラー（Unauthorized/Forbidden/認証）はsendErrorをスキップ
  - 予期しない例外（DB接続失敗等）のみsendErrorを送信
- pnpm build がMediniで成功確認

### 判断したこと
- catch節に到達するのは基本的に予期しない例外のみだが、Supabase auth.getUser()がthrowする可能性を考慮してフィルタを追加

### 未解決・既知リスク
- Mediniのgit commitは未実施（指示通り）

### 次にやること
- CURRENT.md / WORK_LOG.md の更新

---

## 2026-04-10 / Claude Code（16回目）

### やったこと
- with-auth.ts のisAuthError判定を削除した（Codex P1 finding）
  - catch節で無条件にsendErrorを呼ぶよう簡素化
- pnpm build がMediniで成功確認

### 判断したこと
- with-auth.tsの構造上、認証失敗はtry内でreturnされるためcatch節に到達しない。isAuthError判定は不要

### 未解決・既知リスク
- Mediniのgit commitは未実施（指示通り）

### 次にやること
- CURRENT.md / WORK_LOG.md の更新

---

## 2026-04-10 / Claude（5回目）

### やったこと
- MediniにBionic SDKをfile:参照で組み込んだ
- with-auth.ts にhealth / error を組み込んだ
- plan.ts にusage を組み込んだ
- sendError送信条件を修正した（isAuthError削除・catch節で無条件送信）
- Codexレビュー完了・P1 finding全修正済み
- Phase 1成功条件「MediniがSDK経由でhealth eventを送れる」を達成した

### 判断したこと
- with-auth.tsのcatch節に到達する時点で全て予期しない例外なのでisAuthError判定は不要
- sendHealth('ok')の位置はhandler実行前で概念的に正しい（認証レイヤーが生きているという意味）

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- sendHealth('ok')の位置についてはPhase 2で再検討余地あり

### 次にやること
- Phase 1の成功条件を全て確認する（/ship判断）

---

## 2026-04-10 / Claude Code（17回目）

### やったこと
- research digest Discord通知処理を実装した
  - packages/engine/src/actions/notify.ts — Discord webhook通知（将来差し替え可能な構造）
  - packages/engine/src/routes/jobs.ts — research_digest job起動時にdigest処理を非同期実行
  - job状態遷移: pending → running → completed/failed
  - research_itemsのis_digest_sentフラグを更新
  - .env.local にDISCORD_WEBHOOK_URLを追加
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- digest処理はvoidで非同期実行（APIレスポンスをブロックしない）
- 通知先はDiscord webhook。notify.tsに閉じ込めて将来Slack等に差し替え可能
- 未送信アイテムをimportance_score降順で最大10件取得

### 未解決・既知リスク
- research_itemsにテストデータがまだない（SQL手動実行待ち）

### 次にやること
- テストデータ挿入→digest動作確認
- Phase 1成功条件の全体確認

---

## 2026-04-10 / Claude Code（18回目）

### やったこと
- Codex finding 2件を修正した
  - notify.ts: notifyDigest()がbooleanを返すよう変更、3件上限、2000文字切り詰め
  - jobs.ts: sent===trueの時だけis_digest_sentを更新、limit 10→3
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- DISCORD_WEBHOOK_URL未設定時はfalseを返し、呼び出し元でis_digest_sent更新をスキップ
- digest件数は3件に絞り、省略数を「他X件は省略」で表示

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1成功条件の全体確認

---

## 2026-04-10 / Claude Code（19回目）

### やったこと
- digest job完了条件を修正した（Codex P1 finding）
  - notifyDigest()の戻り値を boolean → 'sent' | 'skipped' | 'misconfigured' に変更
  - misconfigured時はjob status = failed、sent/skipped時はcompleted
  - is_digest_sent更新はresult === 'sent'の時だけ
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- アイテムゼロ（skipped）は正常完了。Webhook未設定（misconfigured）は設定不備なのでfailed

### 未解決・既知リスク
- なし

### 次にやること
- Phase 1成功条件の全体確認

---

## 2026-04-10 / Claude（6回目）

### やったこと
- research digest Discord通知を実装した
- digest件数を3件に絞った
- 2000文字超過時の切り詰め処理を実装した
- NotifyResult型（sent/skipped/misconfigured）を導入した
- Webhook未設定時はjob failedとして扱う実装にした
- Codexレビュー完了・P1 finding全修正済み
- Phase 1成功条件全て達成を確認した

### 判断したこと
- digest件数は上位3件（importance_score降順）
- アイテムゼロはcompleted・Webhook未設定はfailed
- is_digest_sentの更新はresult === 'sent'の時だけ

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- リサーチ収集処理（どこから情報を取ってくるか）は未実装

### 次にやること
- リサーチ収集処理の設計

---

## 2026-04-10 / Claude Code（20回目）

### やったこと
- GET /api/research と POST /api/research を実装した
  - packages/shared/src/types.ts にResearchItem関連型を追加
  - packages/engine/src/routes/research.ts を新規作成
  - packages/engine/src/index.ts にresearchRouterを追加
- research_itemsテーブルにcategoryカラム追加SQLを出力
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- GET: importance_score降順、category/is_digest_sent/limitフィルター対応
- POST: title/summary/importanceScore必須、importanceScore 0-100バリデーション
- snake_case↔camelCase変換はrouter内で実施

### 未解決・既知リスク
- research_itemsテーブルにcategoryカラムが未追加（SQL手動実行待ち）

### 次にやること
- categoryカラム追加SQLをSupabaseで実行
- Research画面をAPIに接続する

---

## 2026-04-10 / Claude（7回目）

### やったこと
- Research API（GET/POST /api/research）を実装した
- shared型にResearchItem関連の型を追加した
- research_itemsにcategoryカラムを追加した

### 判断したこと
- summaryのみ（contentなし）
- 手動保存もdigest対象に含める（is_digest_sent: false）
- categoryフィールドを持つ
- リサーチ収集は自動収集ではなく手動保存＋閲覧に方針転換した
- チャット内蔵・Electron化は将来のタスクとしてIDEAS.mdに記録する

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- チャット内蔵・Electron化は将来検討

### 次にやること
- Codex /review（Research API）
- Bionic App Research画面実装（保存フォーム + 一覧表示）

---

## 2026-04-11 / Claude Code（21回目）

### やったこと
- Codex Research APIレビューのfinding 2件を修正した
  - P1: GET /api/research にproject_idフィルタを追加（projectIdクエリパラメータ、省略時は'default'）
  - P2: CreateResearchItemInputのprojectIdをオプショナル化（省略時はEngine側で'default'を使用）
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- GET側のprojectIdフォールバックをPOST側（既存の`input.projectId ?? 'default'`）と同じ'default'に統一
- projectIdがクエリパラメータに含まれない場合でも必ずproject_idフィルタが適用される設計

### 未解決・既知リスク
- なし

### 次にやること
- Bionic App Research画面実装（保存フォーム + 一覧表示）

---

## 2026-04-11 / Claude Code（22回目）

### やったこと
- Bionic App Research画面を実装した
  - apps/app/src/lib/engine.ts にgetResearchItems/createResearchItemを追加
  - apps/app/src/app/research/actions.ts を新規作成（Server Action）
  - apps/app/src/app/research/page.tsx を保存フォーム+一覧表示に実装
- `pnpm typecheck` 全4パッケージでエラーなし確認
- `pnpm --filter @bionic/app build` 成功確認

### 判断したこと
- Server Actionの戻り値をvoidにした（Next.js 14のform action型制約: `(formData: FormData) => void | Promise<void>`）
- revalidatePath('/research')で保存後の一覧自動更新を実現
- projectIdは'project_bionic'をハードコード（現時点でマルチプロジェクト切替UIは不要）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（Research画面）

---

## 2026-04-11 / Claude Code（23回目）

### やったこと
- P1 finding修正: Engine未起動時にフォームを非表示にした
  - resultがnullの場合は早期リターンで「Engineが起動していません」メッセージのみ表示
  - Engine起動時のみフォームと一覧を表示する構造に変更
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- early returnパターンを採用（nullチェック後にフォーム+一覧を表示）
- 一覧部分の`!result`分岐も不要になったため削除（early returnでnullが除外済み）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（Research画面・再レビュー）

---

## 2026-04-11 / Claude

### やったこと
- Research画面を実装した（保存フォーム + 一覧表示）
- Engine未起動時にフォームを非表示にした
- Codexレビュー完了・P1 finding全修正済み
- IDEAS.mdにDiscord Bot統合アイデアを追加した

### 判断したこと
- Engine未起動時はフォームを非表示にする（データ消失防止）
- Server ActionはNext.js 14の型制約によりvoid返却に変更

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- Server Actionのエラーハンドリングは将来Client Component化で対応

### 次にやること
- Bionic App のUI改善（TailwindCSS導入）

---

## 2026-04-11 / Claude

### やったこと
- 外部リサーチを2回実施した（個人開発者向けopsエンジン・AI市場・競合・セキュリティ・技術アーキテクチャ）
- CodexによるBionic Engine現状整理・候補評価を実施した
- リサーチとCodex分析を統合してPhase 2方針を確定した

### 判断したこと
- Bionicの存在意義：競合はセッションベース＋LLM推論コストあり。BionicはローカルルールベースでコストO
- Discord Botは早すぎる。現状Webhook通知で十分。Phase 2後半に移動
- RLSを後回しにしすぎていた。本番前ゲートとして設計を早めに固める
- json-rules-engineは段階的に導入。最初は最小Decisionから始める
- MCPサーバーはpackages/mcpとして独立させる（Engine内に混在させない）
- project_bionic / default 混在はScheduler前に整理が必要
- node-cronはGitHub Actions Cronより信頼性が高い（GH Actionsは15〜60分遅延あり）
- better-sqlite3は将来のローカルファースト対応として温存。今はSupabaseのみ
- ターゲットは英語市場（一次）/ 日本（二次）
- 将来は個人＋小チーム（2〜5人）対応を見越した設計

### 未解決・既知リスク
- engine_alertsの重複防止fingerprint設計が未確定
- project_bionic / default 混在の整理タイミング
- RLS設計の具体化

### 次にやること
- Event → Alert 最小Decisionの実装（Codexに/refineを依頼）

---

## 2026-04-11 / Claude Code（24回目）

### やったこと
- Event → Alert 最小Decisionを実装した（Decision Layer初実装）
  - packages/shared/src/types.ts: Alert型にservice_error / fingerprint / count / lastSeenAtを追加
  - packages/engine/src/decisions/alerts.ts を新規作成（evaluateAlertForEvent）
  - packages/engine/src/routes/events.ts にvoid evaluateAlertForEvent(e)を追加
  - packages/engine/src/routes/alerts.ts のレスポンスマッピングを更新
- engine_alertsテーブルのスキーマ変更SQLを出力した（手動実行待ち）
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- evaluateAlertForEventはvoidで呼ぶ（event captureのレスポンスタイムをブロックしない）
- fingerprint設計: `{projectId}:{serviceId}:{alertType}:{normalizedKey}` の4要素
- 重複alertはcountをインクリメント、last_seen_atを更新
- CRITICAL_CODES（DB_ERROR, PAYMENT_FAILED等）は'critical'、それ以外は'warning'
- Decision失敗はconsole.errorで記録するがevent captureは202を返す

### 未解決・既知リスク
- engine_alertsテーブルのスキーマ変更SQL未実行（手動実行待ち）

### 次にやること
- Supabase SQL Editorでスキーマ変更SQLを実行する
- curlで動作確認（service.health.degraded → alert生成）

---

## 2026-04-11 / Claude Code（25回目）

### やったこと
- Codex P1 finding 2件を修正した（decisions/alerts.ts）
  - select / update / insert の全てで{ error }を確認してconsole.errorでログ出力
  - insertでconflict error（23505）が返った場合はconsole.warnでスキップ（race condition対応）
  - selectエラー時は早期returnで後続処理を実行しない
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- upsertではなくselect→update/insertの2ステップを維持（partial unique indexとの相性問題を回避）
- 23505はwarnレベル（データ不整合ではなく正常な競合回避）
- selectエラー時はreturn（後続のinsertで不整合が起きるのを防止）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（decisions/alerts.ts）

---

## 2026-04-11 / Claude Code（26回目）

### やったこと
- supabase/migrations/フォルダを作成し、これまでの全DB変更をmigrationファイルとして記録した
  - 20260408000000_initial_schema.sql: engine_events / engine_jobs / engine_alerts / research_items の初期スキーマ
  - 20260409000000_add_columns.sql: categoryカラム追加 / client_event_idデフォルト値
  - 20260411000000_alert_dedup.sql: fingerprint / count / last_seen_at / partial unique index
- supabase/migrations/README.md にmigration管理方針と適用済み一覧を記録した

### 判断したこと
- Supabase CLIは今は使わず手動SQL Editor適用（migration管理はファイルベース）
- 既存DBには適用済みのためSQLは実行不要（リポジトリへの記録が目的）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（migrations）

---

## 2026-04-11 / Claude Code（27回目）

### やったこと
- research_items.sourceカラムにDEFAULT 'manual'を追加した（migration修正）
- Supabase適用用SQLを出力した（手動実行待ち）
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- sourceカラムがnot nullだがAPIでinsertしていないため、DEFAULT 'manual'で手動保存を表現

### 未解決・既知リスク
- Supabaseへの`alter column source set default 'manual'`が未実行（手動実行待ち）

### 次にやること
- Supabase SQL EditorでDEFAULT変更SQLを実行する

---

## 2026-04-11 / Claude Code（28回目）

### やったこと
- research_items.source DEFAULT 'manual'のmigration記録を追加した
  - supabase/migrations/20260411000001_research_source_default.sql を作成
  - supabase/migrations/README.md の適用済みテーブルを更新

### 判断したこと
- Supabaseに適用済みのためSQLは再実行不要（リポジトリへの記録が目的）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review

---

## 2026-04-11 / Claude

### やったこと
- Event → Alert 最小Decision Layerを実装した（decisions/alerts.ts）
- Alert.typeにservice_errorを追加した
- fingerprintによる重複防止を実装した
- race condition対応（23505エラーハンドリング）を実装した
- supabase/migrationsを整備してDB変更の再現性を確保した
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- evaluateAlertForEventはvoid呼び出し（event captureをDecision失敗でブロックしない）
- service.error.reportedのseverityはcode有無で判定（全criticalより精度が高い）
- research_items.sourceはDEFAULT 'manual'（手動保存のデフォルト値）
- migration管理はsupabase/migrations/に記録する運用を確立した

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- GitHub ActionsでCI（typecheck/build）を必須化していない
- SECURITY_RELEASE_CHECKLIST.mdがまだない
- project_bionic / default 混在はScheduler前に整理が必要

### 次にやること
- Scheduler実装（node-cronでweekly digest自動実行）

---

## 2026-04-11 / Claude（設計思想更新）

### やったこと
- Bionicの設計思想を3フェーズに更新した
- BIONIC_PRODUCT.mdを全面更新した
- TECHNICAL_DESIGN.mdの設計原則を更新した
- 自動実行OK・承認必須・永遠に自動化しないの3段階を定義した
- engine_actionsをPhase 1.5として前倒しすることを決定した
- 承認フローのUX原則を確定した（Discord=気づき / CLI/App=承認）
- criticalアラートの2回通知仕様を確定した
- stale approval（24h再通知・48h自動キャンセル）を確定した

### 判断したこと
- タイムアウト承認は採用しない
- 信頼スコアは最初は表示・提案のみ。権限変更は人間が明示的に設定
- セキュリティ関連（認証・課金・ユーザーデータ）は永遠に自動化しない
- リサーチ思想（知性ある秘書）はフェーズ1の実装指針として有効
- 颯紀さんの思想（自律運用AI）はフェーズ3の到達点として正しい
- 両者は矛盾しない。フェーズ1を丁寧に作ることがフェーズ3への最短経路

### 未解決・既知リスク
- engine_actionsの詳細スキーマはCodexに/refineを依頼する
- project_bionic / default 混在はScheduler前に整理が必要
- RLSは開発中無効

### 次にやること
- Scheduler実装（node-cronでweekly digest自動実行）
- その後engine_actions設計

---

## 2026-04-11 / Claude Code（29回目）

### やったこと
- project_idを'default'から'project_bionic'に全箇所統一した
  - packages/engine/src/routes/research.ts（GET/POST）
  - packages/engine/src/routes/jobs.ts（insert/runResearchDigest呼び出し）
- engine_jobs.dedupe_keyのmigration SQLを作成した
- Schedulerモジュールを実装した
  - packages/engine/src/jobs/researchDigest.ts（dedupeKey生成・job登録）
  - packages/engine/src/scheduler/index.ts（node-cron・catch-up・config）
  - packages/engine/src/routes/jobs.ts のrunResearchDigestをexport化
  - packages/engine/src/index.ts にstartScheduler()を追加
- node-cron / @types/node-cron をインストールした
- .env.localにScheduler設定を追加した
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- project_id統一をScheduler実装前に完了（混在状態の解消）
- dedupeKeyはISO週番号ベース（`research_digest:2026-W15`形式）で週1回の重複防止
- catch-up機能: Engine起動時に今週分が未実行なら即時実行する
- BIONIC_SCHEDULER_ENABLED=falseでSchedulerを無効化可能（開発時の制御）
- runResearchDigestのexportは既存ロジックを変更しない（関数シグネチャ維持）

### 未解決・既知リスク
- engine_jobs.dedupe_keyのmigration SQLがSupabaseに未適用（手動実行待ち）

### 次にやること
- Supabase SQL Editorでdedupe_key migration SQLを実行する
- Scheduler動作確認（Engine起動→catch-up実行確認）
- Codex /review（Scheduler）

---

## 2026-04-11 / Claude Code（30回目）

### やったこと
- Scheduler catch-upに予定時刻チェックを追加した（P1 finding修正）
  - getScheduledTimeThisWeek()で今週の予定実行時刻を計算
  - now < scheduledTimeの場合はcatch-upをスキップ
- 環境変数のセキュリティ検証を追加した
  - cron式: 「分 時 * * 曜日」形式のみ許可、範囲チェック
  - timezone: 9つのホワイトリストのみ許可
  - projectId: `[a-zA-Z0-9_-]+` のみ許可
  - 無効値はデフォルトにフォールバック＋console.errorでログ
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- catch-upは予定時刻を過ぎた場合のみ実行（月曜09:00前に起動しても実行しない）
- timezoneはホワイトリスト方式（任意文字列を受け入れない）
- 無効値はエラーログ+デフォルトフォールバック（Engineの起動を止めない）

### 未解決・既知リスク
- engine_jobs.dedupe_keyのmigration SQLがSupabaseに未適用（手動実行待ち）

### 次にやること
- Supabase SQL Editorでdedupe_key migration SQLを実行する
- Scheduler動作確認
- Codex /review（Scheduler）

---

## 2026-04-11 / Claude Code（31回目）

### やったこと
- luxonを導入してtimezone計算を正確化した（Intl.DateTimeFormatハック廃止）
- cron式バリデーションを`^\d+$`完全一致に強化した（'0 9-17 * * 1'等を拒否）
- 許可timezoneリストを9→17に拡大した（主要タイムゾーンをカバー）
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- luxonのweekdayは1=月〜7=日、cronは0=日〜6=土。変換ロジックを実装
- getScheduledTimeThisWeekはluxon DateTimeを返すよう変更（Date→DateTime）
- catch-upの時刻比較もluxon DateTime同士で実施（timezone-aware）

### 未解決・既知リスク
- engine_jobs.dedupe_keyのmigration SQLがSupabaseに未適用（手動実行待ち）

### 次にやること
- Supabase SQL Editorでdedupe_key migration SQLを実行する
- Scheduler動作確認
- Codex /review（Scheduler）

---

## 2026-04-11 / Claude Code（32回目）

### やったこと
- catch-up処理のdedupeKeyを起動日基準→予定日基準に変更した（P2 finding修正）
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- 年跨ぎ等でnowInTzとscheduledTimeの週番号がずれるケースを防止

### 未解決・既知リスク
- engine_jobs.dedupe_keyのmigration SQLがSupabaseに未適用（手動実行待ち）

### 次にやること
- Supabase SQL Editorでdedupe_key migration SQLを実行する
- Scheduler動作確認

---

## 2026-04-11 / Claude Code（33回目）

### やったこと
- triggerWeeklyDigestにoverrideDedupeKey引数を追加した（P2 finding修正）
- catch-upからscheduledTime基準のdedupeKeyを渡すよう変更した
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- catch-up: scheduledTime基準のdedupeKeyを一貫して使用（確認→insert間の不整合を防止）
- cron起動時: new Date()基準のまま（overrideDedupeKey未指定時のフォールバック）

### 未解決・既知リスク
- engine_jobs.dedupe_keyのmigration SQLがSupabaseに未適用（手動実行待ち）

### 次にやること
- Supabase SQL Editorでdedupe_key migration SQLを実行する
- Scheduler動作確認

---

## 2026-04-11 / Claude

### やったこと
- Schedulerをnode-cron + luxonで実装した
- project_idをproject_bionicに統一した
- engine_jobs.dedupe_keyを追加してmigration管理に記録した
- catch-up処理を実装した（予定時刻チェック・timezone正確化・dedupe_key一貫性）
- セキュリティ検証を追加した（cron式・timezone・projectIdのバリデーション）
- Codexレビュー完了・P1/P2 finding全修正済み

### 判断したこと
- luxonを導入してtimezone計算を正確にした（将来の海外対応を見越す）
- 許可timezoneを17タイムゾーンに拡大した
- cron式は「分 時 * * 曜日」の形式のみ許可（^\d+$による完全一致）
- デフォルトは毎週月曜09:00 JST（BIONIC_DIGEST_CRONで変更可能）
- catch-upはscheduledTime基準のdedupeKeyを一貫して使う

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- project_bionic / default 混在の最終確認が必要
- engine_actionsはPhase 1.5として次に実装する

### 次にやること
- project混在の最終確認
- engine_actions最小設計・実装

---

## 2026-04-11 / Claude Code（34回目）

### やったこと
- engine_actionsテーブルとAudit Log基盤を実装した（Phase 1.5）
  - shared型: ActionType / ActionMode / ActionStatus / EngineAction / ListActionsResult追加
  - ServiceStatusにpendingActions追加
  - migration: 20260411000003_engine_actions.sql作成
  - logAction.ts: createAction / completeAction / failAction / skipAction
  - routes/actions.ts: GET /api/actions エンドポイント
  - routes/jobs.ts: runResearchDigestにlogAction組み込み
  - decisions/alerts.ts: evaluateAlertForEventにlogAction組み込み
  - routes/status.ts: pending_approval件数をカウント
  - index.ts: actionsRouterを追加
  - Dashboard: pendingActions表示追加
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- logAction失敗はメイン処理を止めない（actionId nullチェックでガード）
- alerts.tsのinsertに.select('id').maybeSingle()を追加（actionログにalertIdを含めるため）
- pendingActionsはcount: 'exact', head: trueで効率的にカウント
- GET /api/actionsのlimitは最大100、デフォルト50

### 未解決・既知リスク
- engine_actionsテーブルのmigration SQLがSupabaseに未適用（手動実行待ち）

### 次にやること
- Supabase SQL Editorでengine_actions migration SQLを実行する
- 動作確認
- Codex /review（engine_actions）

---

## 2026-04-11 / Claude Code（35回目）

### やったこと
- engine_actionsのP1/P2 finding 3件を修正した
  - logAction全helper関数にtry/catchを追加（例外がメイン処理に伝播しない）
  - mark_digest_sentのDB更新結果を確認、失敗時にfailActionを呼ぶ
  - notifyDigest前後でnotify_discordアクションを記録する
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- notify_discordとrun_research_digestは別のアクションとして記録（関心の分離）
- mark_digest_sentはcreateAction→DB更新→結果に応じてcomplete/failの順序で実行
- logActionの各関数は全てベストエフォート（try/catchで例外を握る）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（engine_actions finding修正）

---

## 2026-04-11 / Claude Code（36回目）

### やったこと
- engine_actionsのP1/P2 finding 2件を修正した
  - notifyActionIdをtry外で宣言、catch節で例外時にfailAction呼び出し（P1）
  - mark_digest_sent失敗時にjobをneeds_reviewに更新（P2）
- `pnpm typecheck` 全4パッケージでエラーなし確認

### 判断したこと
- notifyDigest例外時: notify_discordとrun_research_digest両方をfailする
- mark失敗時: Discord送信は成功しているためrun_research_digestはsucceeded（markDigestSent: 'failed'付き）
- mark失敗時: jobはneeds_reviewにして人間の確認を待つ（completedにしない）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（engine_actions finding修正）

---

## 2026-04-11 / Claude

### やったこと
- engine_actionsテーブルを作成した（Phase 1.5 Audit Log）
- logActionヘルパーを作成した（ベストエフォート・例外はcatchしてvoid返却）
- run_research_digest / notify_discord / create_alert / mark_digest_sentを記録対象にした
- GET /api/actionsエンドポイントを追加した
- GET /api/statusにpendingActionsを追加した
- notifyDigest例外時にnotify_discord actionをfailoverする実装をした
- mark_digest_sent失敗時にjobをneeds_reviewにする実装をした
- Codexレビュー完了・P1/P2 finding全修正済み

### 判断したこと
- logActionはベストエフォート（例外をcatchしてメイン処理を止めない）
- mark_digest_sent失敗時はjobをneeds_reviewにする（Discord送信成功・mark失敗の状態を人間が確認できるようにする）
- notify_discord actionはrun_research_digestと独立して記録する

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- テストコードがまだない（最小テスト追加はUI改善後に実施）
- App UIはまだ素のHTMLのみ

### 次にやること
- App UI改善（TailwindCSS導入）

---

## 2026-04-11 / Claude Code（37回目）

### やったこと
- TailwindCSS v4を導入した（@tailwindcss/postcss + CSS-first設定）
- 全4画面をRetro-Futurism × Anthropic Orangeデザインに刷新した
  - Dashboard: ステータスカード4枚（pendingJobs/pendingApprovals/openAlerts/lastEvent）+ Engine情報
  - Alerts: severity別バッジ・fingerprint表示・count表示
  - Actions: Audit Log一覧（status/type/title/timestamp）
  - Research: 保存フォーム + 一覧をTailwind対応
- Actions画面を新規追加した（/actions）
- engine.tsにgetActions関数を追加した
- globals.cssでカスタムユーティリティ（card/badge/accent-bar）を定義した
- `pnpm typecheck` + `pnpm --filter @bionic/app build` 成功確認

### 判断したこと
- TailwindCSS v4はCSS-first設定（tailwind.config.ts不要・@theme + @utilityで定義）
- PostCSS pluginは@tailwindcss/postcssに変更（v4の破壊的変更に対応）
- フォント: Space Grotesk（見出し）/ Inter（本文）/ JetBrains Mono（コード・ID）
- カラー: #0A0A0A背景 + #E8611Aアクセント（TVA×Anthropicの琥珀色）
- Engine Offline時は共通の◆アイコン + 起動コマンド表示

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（UI改善）

---

## 2026-04-11 / Claude

### やったこと
- TailwindCSS v4を導入した
- 黒×オレンジ（Retro-Futurism × Anthropic Orange）のデザインシステムを構築した
- Dashboard / Alerts / Actions / Research 全画面をスタイル適用した
- Actions画面を新規追加した（Audit Log表示）
- getActions()をengine.tsに追加した
- Codexレビュー完了・問題なし

### 判断したこと
- カラーパレット：#0A0A0A背景・#E8611Aアクセント（TVA×Anthropicの琥珀色）
- フォント：Space Grotesk（見出し）/ Inter（本文）/ JetBrains Mono（コード・ID）
- カードはシャドウなし・薄いボーダーのみ（官僚的な整然さ）

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- テストコードがまだない

### 次にやること
- Recent Events表示

---

## 2026-04-11 / Claude Code（38回目）

### やったこと
- GET /api/events エンドポイントを追加した（project_id/type/limitフィルター対応）
- shared型にEventSummary / ListEventsResultを追加した
- engine.tsにgetEvents関数を追加した
- DashboardにRecent Eventsセクションを追加した（直近10件を表示）
- `pnpm typecheck` + `pnpm --filter @bionic/app build` 成功確認

### 判断したこと
- GETエンドポイントはpayloadを返さない（一覧ではサマリーのみ・詳細表示は将来追加）
- DashboardではgetStatusとgetEventsをPromise.allで並列取得
- limit最大100・デフォルト20

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（Recent Events）

---

## 2026-04-11 / Claude

### やったこと
- GET /api/events エンドポイントを追加した
- DashboardにRecent Eventsセクションを追加した
- shared型にEventSummary / ListEventsResultを追加した
- Codexレビュー完了・問題なし

### 判断したこと
- GETレスポンスはpayloadを含まない（サマリーのみ・一覧表示に最適化）
- DashboardではgetStatusとgetEventsをPromise.allで並列取得（レスポンス高速化）

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- テストコードがまだない

### 次にやること
- 承認待ちAPI / CLI最小実装

---

## 2026-04-11 / Claude Code（39回目）

### やったこと
- packages/cliを新規作成した（@bionic/cli）
  - bionic status: Engine状態を表示
  - bionic approvals: 承認待ちアクション一覧
  - bionic approve <id>: アクションを承認
  - bionic deny <id>: アクションを却下
- Engine側にPOST /api/actions/:id/approve と /api/actions/:id/deny を追加した
- `pnpm typecheck` 全5パッケージでエラーなし確認（cli追加）
- CLIの動作確認済み（status / approvals コマンド）

### 判断したこと
- CLIはcommander + chalk構成（軽量・カラー表示）
- Engine APIクライアントはfetch直接利用（SDK依存なし）
- approve/denyはstatus='pending_approval'のレコードのみ更新（状態チェック付き）
- デザイン: Anthropicオレンジ(#E8611A)をCLI表示にも統一

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（CLI）

---

## 2026-04-11 / Claude Code（40回目）

### やったこと
- approve/denyに対象確認ロジックを追加した（P1 finding修正）
  - 存在しないIDは404を返す
  - pending_approval以外のstatusは409を返す
- package.jsonのbinフィールドを削除した（tsx経由起動に統一）
- scriptsにstatus/approvalsショートカットを追加した
- IDEAS.mdにCLI配布時のbin構成移行メモを追加した
- `pnpm typecheck` 全5パッケージでエラーなし確認

### 判断したこと
- select→statusチェック→updateの3ステップで安全に状態遷移する
- bin構成は公開タイミングで対応する（今はtsx経由で十分）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（CLI P1 finding修正）

---

## 2026-04-11 / Claude Code（41回目）

### やったこと
- approve/denyのupdateに.eq('status', 'pending_approval')を追加した（P1 finding修正）
- update結果が0件の場合に409を返すようにした
- `pnpm typecheck` 全5パッケージでエラーなし確認

### 判断したこと
- select→updateの間にstatusが変わるrace conditionを防止するため、updateにもstatus条件を追加
- .select('id')で更新行数を確認し、0件なら409（concurrent修正で先に状態が変わった場合）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（approve/deny atomic保証）

---

## 2026-04-11 / Claude

### やったこと
- GET /api/eventsエンドポイントを追加した
- DashboardにRecent Eventsセクションを追加した
- packages/cliを作成してbionic status / approvals / approve / denyを実装した
- approve/denyに404/409・atomic updateを実装した
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- CLIはPhase 1.5ではtsx経由起動のみ（binなし）
- 将来の配布時にdist/配下に移行する（IDEAS.mdに記録済み）
- approve/denyはselect後のupdateにもstatus条件を追加してatomicな保証にした

### 未解決・既知リスク
- RLSは開発中無効。本番前に有効化が必要
- テストコードがまだない

### 次にやること
- RLS / Security設計

---

## 2026-04-11 / Claude Code（42回目）

### やったこと
- 全5テーブルのRLSを有効化するmigrationを作成した
- engine_actionsにapproved_by/approved_at/denied_by/denied_atカラムを追加した
- BIONIC_ENGINE_TOKEN認証middlewareを作成した
- CORS設定を追加した（localhost:3000のみ許可）
- JSON body size limitを1MBに設定した
- Engineのlisten hostをBIONIC_ENGINE_HOSTで環境変数化した
- approve/denyにX-Actor-Idヘッダーからactorを記録するようにした
- App/CLI/SDKの全fetchにAuthorizationヘッダーを追加した
- .env.exampleを作成した
- shared型のEngineActionにapprovedBy/deniedBy関連フィールドを追加した
- `pnpm typecheck` 全5パッケージでエラーなし確認

### 判断したこと
- TOKEN未設定時は開発モードのみ許可（production時は起動拒否）
- RLSは有効化するがpolicyは作らない（service_role keyのみがアクセス可能）
- actorIdはX-Actor-Idヘッダーから取得、未設定時は'cli'をデフォルト値に
- CORSはlocalhost:3000/127.0.0.1:3000のみ（将来カスタムドメイン追加時に拡張）

### 未解決・既知リスク
- RLS有効化・team columns追加のmigration SQLがSupabaseに未適用（手動実行待ち）

### 次にやること
- Supabase SQL Editorでmigration SQLを実行する
- Codex /review（RLS/Security）

---

## 2026-04-11 / Claude Code（43回目）

### やったこと
- 本番起動前のvalidateEnvironment()を追加した（P1 finding修正）
  - NODE_ENV=production時にBIONIC_ENGINE_TOKEN / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEYを検証
  - 未設定時はprocess.exit(1)で即時停止
- `pnpm typecheck` 全5パッケージでエラーなし確認

### 判断したこと
- validateEnvironment()はapp.listen()の直前に配置（ルーティング設定後・起動前の最終チェック）
- 開発モード（NODE_ENV未設定）ではスキップ（既存のmiddleware warningで十分）

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（validateEnvironment）

---

## 2026-04-11 / Claude

### やったこと
- RLS有効化migration追加（全テーブル・policyなし）
- BIONIC_ENGINE_TOKEN認証middlewareを実装した
- Engineのlisten hostをBIONIC_ENGINE_HOSTで環境変数化した
- チーム利用設計を追加した（approved_by / denied_byカラム）
- 本番環境でのTOKEN未設定時の起動拒否を実装した（validateEnvironment）
- App / CLIのfetchにAuthorizationヘッダーを追加した
- .env.exampleを作成した
- CORS・JSON body size limitを設定した
- IDEAS.mdの全21アイデアに参照タイミングを追加した
- AGENTS.mdに「タスク開始前の確認」ルールを追加した
- Codexレビュー完了・P1 finding全修正済み

### 判断したこと
- RLSはpolicyなし・service_roleのEngineのみ操作する設計にした
- Supabase直接readはPhase 2でAuth・RLS・project_membersとセットで実装する
- チーム利用設計（listen host・TOKEN・approved_by）は今から入れた
- TOKEN未設定は開発中のみ許可・本番は起動拒否にした
- IDEAS.mdの参照タイミングをAGENTS.mdのルールと組み合わせて機能させる

### 未解決・既知リスク
- テストコードがまだない（次のタスク）

### 次にやること
- 最小テスト追加

---

## 2026-04-11 / Claude Code（44回目）

### やったこと
- Vitestをインストールしてテスト基盤を構築した
- validateCronExpressionをcron.tsに切り出した（テスタビリティ向上）
- 3つのテストファイルを作成した（合計19テスト）
  - cron.test.ts: 9テスト（有効/無効のcron式バリデーション）
  - researchDigest.test.ts: 3テスト（正常insert / 23505 dedupe / DBエラー）
  - alerts.test.ts: 7テスト（対象外スキップ / insert / update / severity判定 / エラー耐性）
- `pnpm --filter @bionic/engine test`: 全19テスト通過
- `pnpm typecheck`: 全5パッケージ通過

### 判断したこと
- Supabaseはvi.mockでモック（テストからDB接続しない）
- logActionもvi.mockでモック（Audit Log記録のテストは統合テストで行う）
- validateCronExpressionは純粋関数なのでモック不要

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（テスト）

---

## 2026-04-11 / Claude Code（45回目）

### やったこと
- テストP2 finding 2件を修正した
  - researchDigest.test.ts: insert payloadにdedupe_keyが含まれることを検証追加
  - alerts.test.ts: 23505 race conditionでskipActionが呼ばれることを検証追加
- `pnpm --filter @bionic/engine test`: 全20テスト通過（+1新規、+1強化）

### 判断したこと
- insert payloadの検証はexpect.objectContainingで主要フィールドのみ検証（timestampは除外）
- 23505テストはmockのmaybeSingle呼び出し順序で制御

### 未解決・既知リスク
- なし

### 次にやること
- Codex /review（テストP2 finding修正）

---

## 2026-04-11 / Claude

### やったこと
- Vitestを導入して最小テストを追加した（全20テスト通過）
- validateCronExpressionをscheduler/cron.tsに切り出した
- cron.test.ts（11件）/ researchDigest.test.ts（3件）/ alerts.test.ts（6件）を追加した
- Codexレビュー完了・P2 finding全修正済み

### 判断したこと
- テストフレームワークはVitest（TypeScript/ESM/monorepoとの相性が良い）
- テストはco-located（対象ファイルの横に配置）
- Supabaseはvi.mockでモック（Supabase local統合テストはPhase 2）
- Audit Log呼び出しはテストで固定しない（壊れやすくなるデメリットが大きい）
- validateCronExpressionはpure functionなのでcron.tsに切り出した

### 未解決・既知リスク
- apps/appのglobals.css側のtypecheck警告（認証実装とは別系統）
- Codex環境でVitestの依存解決に問題あり（@rolldown/binding-win32-x64-msvc欠落）

### 次にやること
- Deploy→Watch→Alert（Vercel Webhook連携）
