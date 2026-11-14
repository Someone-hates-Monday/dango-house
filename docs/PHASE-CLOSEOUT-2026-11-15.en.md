# Phase closeout: 0.4.0-alpha.5

The user has confirmed the GPT idle repair. This phase is complete. Start future handoffs here and in the [root-cause record](GPT-IDENTITY-INVESTIGATION-2026-11-15.md); do not repeat the earlier fallback/cache diagnosis.

## Delivered

- Source, Windows x64 portable build and desktop shortcut use `0.4.0-alpha.5`. UI and MCP versions come from package.json.
- GPT idle is `public/video/gpt/idle-subject-s1-clean-v3.webm`: 225 frames, 24 fps, 9.375 seconds; SHA-256 `f2315c3aee7ddfc5975e3862eb37cd4f2a3eb6aede49b941ce9e1f2955314218`.
- The contaminated export contained 241 frames, including 16 stale PNGs from a different character. Stream-copy repair preserves every normal decoded RGBA frame. P1 pat remains unchanged.
- Standing GPT uses approved videos without alternate character art. Dock resting art and small avatars are separate surfaces.
- Ordinary interactions and automatic relationship events trigger CG. Recording controls stay in the [isolated local harness](DEMO-RECORDING.md).
- Each solo/pair/group CG event has one shared player anchored to its participants. User intimacy, pair affection and autoplay preferences retain their separate conditions.

## Validation

114 unit tests and the TypeScript/Vite/Electron production build pass. The exporter regression fixture proves that eight new frames plus a stale ninth PNG produce only eight encoded frames. Full-loop verification checks the actual container duration and every decoded timestamp rather than trusting manifest counts. Packaged playback, recovery, pat and shared/natural CG have dedicated scripts. Run frame-sensitive Electron checks sequentially to avoid background-window throttling.

## Handoff boundaries

- Never restore the contaminated S1 export (`98190d86…5d3604`) or replace the whole accepted idle with an older one. Rejected artifacts stay in ignored local evidence folders.
- Add only reviewed same-identity action videos; do not fill gaps with unrelated art.
- Further animation/CG generation, promotion and Agent browsing belong to a later phase and are not started by this closeout.
- Existing attribution and noncommercial art terms remain in the NOTICE files. This is a preview build, not a claim of exhaustive mixed-DPI or live-provider validation.

Public download: [v0.4.0-alpha.5](https://github.com/Someone-hates-Monday/dango-house/releases/tag/v0.4.0-alpha.5). Local binaries and SHA256SUMS are under `release/v0.4.0-alpha.5/` and excluded from Git.
