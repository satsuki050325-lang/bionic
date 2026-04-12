# Bionic MCP Server (bionic-ops)

Claude DesktopからBionic Engineを操作するMCPサーバーです。

## 利用可能なツール

| ツール | 説明 |
|--------|------|
| `get_status` | Engine状態・Queue・Alertの集計を取得 |
| `get_alerts` | アラート一覧を取得（status/severity でフィルター可） |
| `get_actions` | Audit Log・承認待ち一覧を取得 |
| `get_events` | 最近のイベント一覧を取得 |
| `get_research_items` | 保存済みリサーチ一覧を取得 |
| `run_research_digest` | リサーチダイジェストをDiscordに送信 |

## セットアップ

### 1. ビルドする

```bash
pnpm --filter @bionic/mcp build
```

### 2. Claude Desktopの設定を更新する

`%APPDATA%\Claude\claude_desktop_config.json`（Windows）または
`~/Library/Application Support/Claude/claude_desktop_config.json`（Mac）に以下を追加する：

```json
{
  "mcpServers": {
    "bionic-ops": {
      "command": "node",
      "args": [
        "C:\\Users\\owner\\Desktop\\bionic\\packages\\mcp\\dist\\index.js"
      ],
      "env": {
        "BIONIC_ENGINE_URL": "http://localhost:3001",
        "BIONIC_ENGINE_TOKEN": "your-engine-token",
        "BIONIC_PROJECT_ID": "project_bionic"
      }
    }
  }
}
```

### 3. Claude Desktopを再起動する

設定変更後はClaude Desktopを再起動してください。

## 使用例

- 「Bionicのステータスを見せて」
- 「今開いているcritical alertは？」
- 「今日のエラーイベントを見せて」
- 「承認待ちのアクションはある？」
- 「リサーチダイジェストを今すぐ送って」
