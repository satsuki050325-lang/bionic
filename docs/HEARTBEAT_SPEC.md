# Bionic — Cron Heartbeat Monitoring Specification (Phase 2.5b)

> 担当: Claude（仕様）・Claude Code（実装）・Codex（レビュー）
> 最終更新: 2026-04-15

---

## 1. 概要

Uptime 監視（Phase 2.5a・pull 型：Engine が URL を叩く）と補完関係にある
**push 型の死活監視**。監視対象（cron job / scheduled task / worker）が、
実行のたびに Bionic Engine に HTTP ping を送る。一定時間 ping が届かなければ
Engine は「missing」と判定してアラートを起こす。

### なぜ push 型が必要か

- pull 型では検知できないケースがある: 自宅 NAS 上の cron / 社内ネットワーク
  内の worker / インバウンド接続不能なコンテナなど
- 監視対象が「実行した事実」そのものを通知するため、URL が 200 を返していても
  中身のジョブが走っていないケースを検知できる
- 業界標準（Healthchecks.io, Cronitor, Dead Man's Snitch）に倣う

---

## 2. データモデル

### 2.1 テーブル: `heartbeat_targets`

Uptime の `uptime_targets` とは **別テーブル**。スキーマ・責務が違うため
共有しない。

| column                      | type          | note                                                |
| --------------------------- | ------------- | --------------------------------------------------- |
| `id`                        | text PK       | UUID                                                |
| `project_id`                | text NOT NULL |                                                     |
| `service_id`                | text NOT NULL | 既存の service 名前空間に紐付く                     |
| `slug`                      | text NOT NULL | ping URL の一部 (`/api/heartbeats/:slug`)           |
| `name`                      | text          | 表示名 (任意)                                       |
| `description`               | text          | 任意                                                |
| `secret_hash`               | text NOT NULL | HMAC-SHA256 hash の hex                             |
| `secret_algo`               | text NOT NULL | `'hmac-sha256'` 固定（将来 bcrypt 拡張可）          |
| `expected_interval_seconds` | int NOT NULL  | `60 ≤ n ≤ 86400`（1分〜1日）                        |
| `grace_seconds`             | int NOT NULL  | `0 ≤ n ≤ 3600`（デフォルト 60）                     |
| `severity`                  | text NOT NULL | `'info' \| 'warning' \| 'critical'`（default `warning`） |
| `enabled`                   | bool NOT NULL | default true                                        |
| `last_ping_at`              | timestamptz   | nullable                                            |
| `last_ping_from_ip`         | text          | 監査用・任意                                        |
| `missed_event_emitted`      | bool NOT NULL | default false                                       |
| `created_at`                | timestamptz   | default now()                                       |
| `updated_at`                | timestamptz   | default now()                                       |

### 2.2 制約

- Unique index: `(project_id, slug)` — 同一 project 内で slug は一意
- Check: `expected_interval_seconds BETWEEN 60 AND 86400`
- Check: `grace_seconds BETWEEN 0 AND 3600`
- Check: `severity IN ('info', 'warning', 'critical')`
- Check: `secret_algo IN ('hmac-sha256')`
- RLS: 有効（service_role のみ UPDATE/SELECT、Uptime と同様 policy なし）

### 2.3 Secret storage

- **生成時に 1 度だけ平文を返す**（DB には hash のみ保存）
- 生成: `crypto.randomBytes(32).toString('base64url')` (43 chars, 256-bit entropy)
- Hash: **HMAC-SHA256**（サーバー側 pepper 鍵 `BIONIC_HEARTBEAT_HMAC_KEY` を使う）
  - pepper 未設定時はフォールバック固定鍵 `"bionic.heartbeat.v1"` を使い起動時に
    warn ログを出す（MVP の割り切り・本番では要設定）
- 比較: `crypto.timingSafeEqual` でタイミング攻撃を回避
- 平文 secret は Engine の **レスポンスに 1 度だけ含む**（その後は DB にも
  ログにも残さない）。紛失したら delete して作り直す

---

## 3. 認証

### 3.1 Ping endpoint

`POST /api/heartbeats/:slug`

- `Authorization: Bearer <secret>` ヘッダ **のみ** を受け付ける
- query token (`?token=...`) は採用しない（アクセスログ・referrer 経由での
  漏洩リスクを避ける）
- 失敗時:
  - ヘッダ欠落 → 401
  - slug 未登録 → 404（secret を試行できる形で 401 を返さない方針）
  - hash 不一致 → 401 + `timingSafeEqual` 経由で一定時間を消費
  - `enabled = false` → 403

### 3.2 CRUD endpoints

`GET/POST/PATCH/DELETE /api/heartbeat-targets` は既存の **Engine-wide auth**
(`BIONIC_ENGINE_TOKEN` / `engineAuthMiddleware`) で保護する。

---

## 4. 判定ロジック

### 4.1 Missing 判定

```
deadline = (last_ping_at ?? created_at) + expected_interval_seconds + grace_seconds
if now() > deadline AND NOT missed_event_emitted:
  atomic claim (claim_heartbeat_missing RPC)
  emit heartbeat.missing.detected event
  create cron_missing alert
```

### 4.2 初回 missing の特別扱い

- `last_ping_at IS NULL` の target も、`created_at + interval + grace` を過ぎるまでは
  **missing と判定しない**（target 作成直後の猶予期間）
- この扱いにより「登録したその瞬間に missing 通知が飛ぶ」ことを防ぐ

### 4.3 Atomic claim

Uptime 実装に倣い、Postgres の `SECURITY DEFINER` 関数で **単一 UPDATE** を実行:

```sql
update public.heartbeat_targets
set missed_event_emitted = true, updated_at = now()
where id = p_target_id
  and missed_event_emitted = false
  and enabled = true
  and (last_ping_at + ...) or (created_at + ...) < now();
get diagnostics v_rows = row_count;
return v_rows > 0;
```

並行 runner が走っても event 発火は必ず 1 回。

### 4.4 Severity

`heartbeat_targets.severity` は **target ごとに設定**。`cron_missing` alert
生成時にその severity をそのまま使う。
- default: `warning`
- 「本番決済の日次 reconcile が止まったら critical」のようなユースケースを
  カバー

---

## 5. イベント

### 5.1 新規 EventType

- `heartbeat.ping.received` — ping を受信した時
- `heartbeat.missing.detected` — missing 判定で claim に成功した時
- `heartbeat.recovered` — missing 状態から ping が再開した時

### 5.2 新規 AlertType

- `cron_missing`

### 5.3 Fingerprint

`buildFingerprint()` に cron_missing のケースを追加。
`targetId` 単位で dedupe する（Uptime と同じく probe-scoped）。

```
v2:<projectId>:<serviceId>:cron_missing:target:<targetId>
```

### 5.4 Recovery フロー

Ping が到着したとき:

1. `last_ping_at = now()` に更新
2. `missed_event_emitted = true` だった場合:
   - `claim_heartbeat_recovery` RPC で atomic に flag を false に戻す
   - `heartbeat.recovered` event を emit（payload に `targetId`）
   - `evaluateAlertForEvent` 経由で `cron_missing` alert を同じ fingerprint で
     auto-resolve

---

## 6. API

### 6.1 Ping

```http
POST /api/heartbeats/:slug
Authorization: Bearer <secret>

(body は空でも、JSON payload でもよい — 現状は空許可)
```

Response: `204 No Content`（成功）/ `401` / `404` / `403`

### 6.2 CRUD

```http
GET    /api/heartbeat-targets?projectId=...&serviceId=...
POST   /api/heartbeat-targets       # secret は 1 度だけ平文で返す
PATCH  /api/heartbeat-targets/:id   # url 変更不可・secret 再生成は別 endpoint
DELETE /api/heartbeat-targets/:id

POST   /api/heartbeat-targets/:id/regenerate-secret
```

POST レスポンス例:

```json
{
  "target": { ...HeartbeatTarget (secret_hash は含めない)... },
  "secret": "ABC123...xyz"   // 1 度だけ返す平文
}
```

---

## 7. Scheduler

- 新規 runner: `heartbeat_missing_runner`
  - 毎分 (`* * * * *`) 走らせる
  - `heartbeat_targets` から `enabled=true` を全件取得し deadline を評価
  - 並列 `processHeartbeat()` で `claim_heartbeat_missing` を呼ぶ
- diagnostics の runner state に `heartbeat_missing_runner` を追加

---

## 8. UI

### 8.1 Services ページ

- Uptime バッジの横に **Heartbeat バッジ** を追加
- 状態: `HEARTBEAT UP` / `HEARTBEAT MISSING` / `HEARTBEAT PENDING`
- 1 サービスに複数 target を紐付け可・集約表示

### 8.2 Add Service ページ

- 既存の curl / URL Monitoring タブに並べて **「Monitor scheduled job」** タブを追加
- 入力: slug（自動生成案表示）、name、interval（dropdown: 1min/5min/15min/1h/daily）、grace（default 60s）、severity
- 送信: POST `/api/heartbeat-targets` → 返ってきた平文 secret を画面に 1 度だけ表示
- 生成直後に curl snippet を表示:

```
curl -fsS -X POST {ENGINE_URL}/api/heartbeats/{slug} \
  -H "Authorization: Bearer {secret}"
```

### 8.3 ServiceSource

`'heartbeat'` を `ServiceSource` union に追加（Engine / App 両方）。
`/api/services` は `heartbeat_targets` も fold して service card に反映する。

---

## 9. 非スコープ（Phase 2.5b で作らないもの）

- Web UI での secret 再生成フロー（API は実装・UI は後続）
- ping payload のバリデーション / 保存（payload は無視する方針）
- 統計ダッシュボード（「過去 7 日の ping 成功率」等）
- 通知 throttling（MVP は alert 側の `shouldNotify` に任せる）

---

## 10. セキュリティ

- secret の brute force: slug ごとのレート制限は MVP 時点で入れない。256-bit
  random なので brute force は非現実的。レート制限は Phase 3 で検討
- DB leak: `secret_hash` は HMAC-SHA256 + pepper なので DB だけ漏れても
  pepper がなければ secret は復元不能
- log leak: `Authorization` ヘッダは Engine のログには出さない（Express の
  request logging 設定を確認）
- Ping サイズ: request body の上限は既存の `express.json({limit: '1mb'})` を共有
