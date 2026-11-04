# Plugin install snippets

These are **examples**. Prefer copying the live snippet from **Settings → Agent plugin bridge** inside the running app (paths and token match your machine).

| File | Client |
| --- | --- |
| `cursor.mcp.json.example` | Cursor MCP |
| `claude-desktop.json.example` | Claude Desktop |
| `codex.mcp.toml.example` | Codex MCP |
| `deepseek-rest.json.example` | DeepSeek harness / generic REST |

Requirements:

1. Build or install Dango House so `dist-electron/bridge-mcp.cjs` exists.
2. Enable Agent Bridge in the app.
3. Keep the app running while the external agent uses the tools.
