**Language:** [简体中文](HANDOFF-HOUSE-BRAIN.zh-CN.md) · [English](HANDOFF-HOUSE-BRAIN.en.md) · [日本語](HANDOFF-HOUSE-BRAIN.ja.md) · [Index](HANDOFF-HOUSE-BRAIN.md)

# Handoff: House brain · Impersonation · Today’s cast

Date: 2026-11-04  
Related: [HANDOFF-COMPANION-BRIDGE.md](HANDOFF-COMPANION-BRIDGE.md)

## Stance

- **Not** seven vendor keys for seven girls.
- **Yes**: one **house brain** (provider + key + model) + seven **persona masks**.
- Claude/GPT looks are fan characters; backend may be GLM/DeepSeek/etc. UI must show **via {provider}** when impersonating.
- Shrink the cast with **Today’s cast** presets that write `muted` (no parallel attendance state).

## Shipped

| Piece | Where |
| --- | --- |
| House-brain settings copy + active brain line | `Connections.tsx`, i18n |
| Via badge in API mode | `main.tsx` |
| Honest system prompt | `electron/provider.ts` |
| Cast presets `all` / `core` / `custom` | `cast.ts`, `cast-preset` |
| Mute → `castPreset: custom` | `engine` |
| Per-character `characterProviders` + key fallback notice | `generateReply`, `character-provider` |
| Persist/restore | `director.ts` |
| Tests | `tests/cast.test.ts` |

## Manual checks

1. One GLM/DeepSeek key → enable API → Claude/GPT can reply; via badge shows.  
2. Core three → others muted, no mic grab.  
3. Override without key → fallback notice + house brain still answers.  
4. Demo mode still works offline.

## Key files

`src/shared/cast.ts` · `electron/provider.ts` · `electron/engine.ts` · `src/Connections.tsx` · `tests/cast.test.ts`

Full tables and mermaid: see [Chinese page](HANDOFF-HOUSE-BRAIN.zh-CN.md).
