# Dango House: positioning and bridge verification (2026-11-04)

[简体中文](PRODUCT-REVIEW.zh-CN.md)

## Product direction

A shared desktop home for seven companions: group and private chat, affection, playful rivalry, feeding, petting and a Dock resting mode. External agents can use the residents as an expressive stage through MCP/REST.

The differentiation is shared life and relationships. Character identity is separate from the model backend. DeepSeek's 109 source animations come from upstream; our contribution is integration, interaction mapping and playback sequencing, not ownership of those animations.

## Related projects

- [DSH Pet](https://github.com/PC2005-cloud/dsh-pet) emphasizes transparent animated pets and a DIY asset pipeline. We invest more in shared social scenes, with the larger footprint of Electron.
- [CrossPet](https://github.com/lokicorvus/crosspet) follows AI providers and their work status. We emphasize companionship; our bridge still needs installation testing in more real host clients.
- [AIRI](https://github.com/moeru-ai/airi) provides real-time voice and game interaction. Our current voice, game and perception features are less complete.
- [Open-LLM-VTuber](https://github.com/Open-LLM-VTuber/Open-LLM-VTuber) focuses on hands-free voice, interruption and Live2D. Our video/frame animation approach does not provide equivalent continuous lip-sync and expression control.

These are product-direction judgments based on local code and public project descriptions, not controlled benchmarks or a survey of every commercial companion app.

## Gaps and priorities

Animation coverage is uneven. Other residents need their common reactions completed. Relationship state is real, but many social scenes and watch-party discussions are local scripts rather than autonomous agents. Caption/metadata evidence and frame sampling placeholders do not constitute visual understanding. A successfully opened URL does not establish recommendation quality.

Bridge setup requires a running app, Node and host-client configuration. Code licensing does not override individual art licenses. Prioritize shared companionship, animation coverage and durable memory before expanding browser and vision features.

## Bridge verification

Build the app, install `@modelcontextprotocol/sdk@1.32.2` under `test-results/mcp-client`, then run `node scripts/verify-agent-bridge.mjs`. Add `--packaged` to test `release/vCURRENT_VERSION/win-unpacked`.

The official MCP SDK connects to a real Electron instance with an isolated profile. No personal API credentials or paid model requests are used. Checks cover initialization, all 10 tools, seven residents, affection changes from pat/feed/praise, avatar action state, rejected unauthenticated/invalid requests, credential-free snapshots and revocation when disabled.

Fixed incorrect `Content-Length` framing to follow [newline-delimited MCP stdio](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports). Packaged bridge scripts are unpacked from `app.asar` so external Node can execute the exported path.

This verifies standard-client connectivity, not installation through Cursor, Claude Desktop or Codex UI. Browsing, video understanding and real model response quality are outside this test. Local reports/screenshots are under ignored `test-results/agent-bridge`.

## Icon

Three original mochi companions rest on a shared Dock beneath a heart-shaped roof. Masters and a multi-resolution Windows ICO live in `build/brand`; `scripts/brand.mjs` copies the current assets reproducibly. The previous icon is preserved for comparison.
