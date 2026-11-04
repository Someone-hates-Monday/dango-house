**Language:** [简体中文](HANDOFF-COMPANION-BRIDGE.zh-CN.md) · [English](HANDOFF-COMPANION-BRIDGE.en.md) · [日本語](HANDOFF-COMPANION-BRIDGE.ja.md) · [Index](HANDOFF-COMPANION-BRIDGE.md)

# Handoff: Companionship · Yuri · Capable agent · Plugin bridge

Date: 2026-11-04  
Based on: [COMPANIONSHIP-YURI-PLAN.md](COMPANIONSHIP-YURI-PLAN.md), [AGENT-BRIDGE.md](AGENT-BRIDGE.md), [AGENT-WATCH-PARTY-PLAN.md](AGENT-WATCH-PARTY-PLAN.md)  
Prior: [HANDOFF-AGENT-P0P1.md](HANDOFF-AGENT-P0P1.md) (P0/P1 watch scaffold still stands; this covers later increments)

## Product stance

- **Primary form remains the desktop app** (Dango House).
- Agent work is **vertical** (browse / watch / honest evidence), not a general coding harness.
- Plugins are **optional**: localhost Bridge + MCP/REST so external agents use the house as a **stage**. The app must be **running**. Do not convert the product into plugin-only.

## Implemented in code (≠ human-accepted)

**Companionship / yuri:** `favor` streak, `pairTone`, bond tiers, rivalry escalation, `social-yuri` scenes, SocialBar, idle pair scenes, FavorStrip. Unit tests cover streak notice, bond unlock, yuri dispatch — **not** soft-vs-vivid feel or DND suppression by hand.

**Agent increment:** Playwright browse with verified URLs only; optional FFmpeg frame sampling → `sampled_av` without a vision model; URL resolve still fails honestly.

**Plugin bridge:** HTTP on `127.0.0.1` + bearer (`bridge.json`); `bridge-mcp.cjs`; Settings copy snippets for Cursor / Claude Desktop / Codex / REST. HTTP auth tested; **no** live Cursor/Claude/Codex install verification. Portable builds likely **lack** Playwright (devDependency).

## Not done

Vision-model understanding, URL watch-through, P3 outings, P4 live co-watch, multi-framework orchestration, store-style one-click plugin install, Live2D / voice / NSFW / general coding agent.

## Run

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

Enable bridge under Settings → Agent plugin bridge; keep the app open. Cancel agent tasks from the **task tray**, not chat Stop.

## Manual acceptance (priority)

1. Praise one resident 3× → another inserts jealousy/attention.  
2. Raise a pair’s bond → idle/SocialBar intimate beat; soft ≠ vivid; non-adult.  
3. DND/focus suppresses autonomous beats.  
4. Browse (if Playwright available): real openable URLs; tray cancel; chat Stop does not cancel.  
5. Vision honesty with/without ffmpeg.  
6. Bridge: bearer required; bad token 401; fails when app closed.  
7. At least one external client (Cursor or Claude) can call `garden_get_snapshot` / `garden_praise`.  
8. P0/P1 watch regression still holds.

## Key paths

`src/shared/{favor,bonds,social-yuri,bridge}.ts` · `electron/engine.ts` · `electron/agent/browse.ts` · `electron/media/vision.ts` · `electron/bridge/*` · `src/{SocialBar,FavorStrip,Connections,WatchParty}.tsx` · `plugins/*.example` · `tests/{companionship,bridge}.test.ts`

## House brain / cast (2026-11-04)

Full handoff: [HANDOFF-HOUSE-BRAIN.en.md](HANDOFF-HOUSE-BRAIN.en.md) — one-key brain, via badges, cast presets, per-character overrides.

## Next for the successor

Finish manual items 1–3 and 6–7 first; then browse/vision smoke; only then consider shipping Playwright in portable builds. Prefer deepening the stage contract over building another Cursor.

## 2026-11-04 bridge verification update

The official MCP SDK now passes end-to-end checks against both development and packaged 0.3.9 Electron builds: initialization, all 10 tools, snapshots, pat/feed/praise, avatar state, authentication and bridge disable. Fixed stdio framing and the external Node entry path inside app.asar. Individual host-client UI installation remains separate. See [scope and comparison](PRODUCT-REVIEW.en.md) and `scripts/verify-agent-bridge.mjs`.
