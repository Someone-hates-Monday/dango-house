# Relationship moments: normal-proportion CG presentation

[简体中文 — detailed contract](CG-MOMENTS.zh-CN.md)

**Latest status (2026-11-04):** generation is paused at the user's request. V2's end frame failed arm-anatomy review and its video job was cancelled without replacing V1. See [acting/POV research](CG-ACTING-AND-POV-RESEARCH.en.md) for the new head-anchored film-bubble direction. Await the user's instruction before resuming generation; the corner-card implementation below describes V1.

2026-11-04. This separately authorized CG experiment follows the marketing handoff; it does not replace or expand Cursor's completed companionship A/B/C implementation.

Daily life stays chibi. A short CG highlights a meaningful relationship event: Claude gently fixes DeepSeek's hair ornament, DeepSeek responds with a small affectionate tilt and smile. Keep the existing normal-proportion character designs, modest clothing and gentle tone.

## Prototype versus shipped behavior

The interactive prototype runs at `http://127.0.0.1:4320/` through `node scripts/animation-lab/cg-preview-server.mjs`. It has room and desktop compositions, collapse/replay/skip/Escape, a reference still and eventual trial-video playback. The room is a real-app screenshot used as context; the desktop is illustrative. This is not production integration.

The starting illustration was generated with built-in imagegen from the existing portraits. Video inference uses local Wan2.2 I2V A14B high/low-noise FP8 experts in ComfyUI v0.3.75 with PyTorch 2.8 CUDA12.8. Do not describe the reference-image stage as local generation. Generation and visual approval are separate; local manifests under `test-results/cg-lab` record actual status.

The local clip is now generated (5.0625s; 927.66s inference). A manual trial is integrated into the real room and desktop renderers through the room toolbar, without another native window. Runtime checks cover video playback, bounded layout, one host, collapse/continue, close and DND. Physical Windows click-through remains a separate native acceptance task. The current public portable release does not include these local source changes. See [the review](REVIEW-CURSOR-COMPANIONSHIP.en.md) for remaining companionship blockers; automatic event-triggered CG is not enabled.

## Presentation contract

- Room: an embedded scene-side area, roughly 420–520px wide and capped near 40% of the stage. Preserve navigation, primary controls and chat input. Small windows use a collapsed inline card.
- Desktop: use the existing transparent pet renderer, above the selected Dock/display, around a 480×270 picture plus a short caption. No additional native window, full-screen dimming or focus stealing. Only actual controls intercept mouse input; the rest remains click-through.
- Shared styling: gentle border/shadow, relationship label, short dialogue and visible close/collapse controls. Use `object-fit: contain`; do not crop heads, hair ornaments or hands to fill the card.
- Silent, once only, then a short closing-caption hold and a memory chip. Manual replay does not modify bonds.
- Only completed, semantically matching events with the required present participants can unlock approved CG. Do not use happy affection footage for every jealous or angry reaction.
- The director/main process selects one host and display per event. A transient session carries event ID, asset ID, host, display and expiry; renderers acknowledge playback/skip/end. Never let both room and desktop independently autoplay the same event.
- Suggested automatic cooldown: ten minutes globally and thirty per pair. DND, focus, disabled autoplay, participant removal and cancellation suppress playback without catch-up bursts. Do not resurrect a session after restart.
- Do not register a global Escape shortcut or steal focus. Visible controls always work. Pause on backgrounding; dismiss stale sessions. Respect reduced motion.

## Production integration and QA

Review Cursor's scene director and shared events first, then attach a CG session to actual completion. Do not create another social director or trigger via text keywords. Private transcripts never become shared captions or marketing material.

Each asset needs participant/event mappings, local media/poster paths, duration/fps, hashes, generation settings, reference provenance, attribution and approval. Unapproved assets are preview-only.

Trial settings: 832×480, 81 frames at 16fps, 24 steps split 12/12, CFG 3.5, seed 2026110401, official FP8 scaled experts. Check continuous playback and sampled frames for stable faces/costumes, correct hands, readable motion and a natural ending. A playable file or a moving still is not proof of acceptable generated animation.

Keep weights and raw experiments outside publication. Preserve underlying character rights and noncommercial terms. Validate host uniqueness, clipping, click-through, cancellation, DND, focus, restart, loading failure and small-screen layout before enabling automatic CG.

## Marketing

Lead with shared life and relationships, not ownership of upstream DeepSeek animations. A 15–20 second teaser can show Dock resting, private selection, rivalry, one CG and a return to chibi life. Label actual gameplay, story CG and design prototypes distinctly. No external posting is authorized by this design task. Historical claims about upstream virality in the marketing handoff were not independently verified here.
