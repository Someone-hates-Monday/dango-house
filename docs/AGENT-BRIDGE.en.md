**Language:** [简体中文](AGENT-BRIDGE.zh-CN.md) · [English](AGENT-BRIDGE.en.md) · [日本語](AGENT-BRIDGE.ja.md) · [Index](AGENT-BRIDGE.md)

# Agent plugin bridge: keep the app, add optional plugins

Dango House remains a **standalone desktop app**. Optionally enable a local Agent Bridge so Cursor / Claude Desktop / Codex / other harnesses can treat the house as a companion **stage**, without turning the product into a plugin-only binary.

## Shapes

| Shape | Who | Notes |
| --- | --- | --- |
| **App (default)** | User opens Dango House | Full companionship, rivalry, watch party, pets |
| **Plugin (optional)** | External agents via MCP/REST | Requires the **app running** with bridge enabled |

## Setup

1. Open Dango House → **Settings** → **Agent plugin bridge** → enable.
2. Copy Cursor / Claude / Codex / DeepSeek snippets.
3. Paste into the client MCP / harness config.
4. **Keep the app running**; the MCP process only proxies.

Security: binds to `127.0.0.1` only; bearer token in the userData `bridge.json`; never exposes provider API keys.

## Adapters

- **Cursor** — merge JSON into MCP settings; see `plugins/cursor.mcp.json.example`
- **Claude Desktop** — `claude_desktop_config.json` `mcpServers`; see `plugins/claude-desktop.json.example`
- **Codex** — `[mcp_servers.*]` TOML; see `plugins/codex.mcp.toml.example`
- **DeepSeek / REST** — `GET /v1/snapshot`, `POST /v1/call`; see `plugins/deepseek-rest.json.example`

## Tools

Snapshot, list characters, say as user, perform, praise, pat, feed, play scene, browse videos, agent control. No raw filesystem or shell.

## Handoff

Status, tested vs untested, and the manual checklist: [HANDOFF-COMPANION-BRIDGE.en.md](HANDOFF-COMPANION-BRIDGE.en.md).
