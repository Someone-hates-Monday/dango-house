# Dialogue-driven CG: private, public and companion conversation

Version: 0.5.0-alpha.13.

Enable scene clips and keep participants present. User-facing intimacy requires romance mode; intimate peer scenes require girl–girl affection. Private CG also requires API avatar tools.

Private chat now exposes `request_cg({asset})` for the speaker's installed solo user-facing clip. It returns queued or blocked; queued does not mean playing. Private text is never forwarded into public peer planning. Claude's current user-facing clip reaches toward the viewer; it is not a full embrace video.

If the model omits the tool, a bounded semantic pass over the current input and actual reply can select from compatible candidates or return null. It uses the same provider, with a 6.5-second timeout, not keyword playback. Public and autonomous companion plans may select `cgAsset` and declare `cgRequested`; omitted selections receive a bounded repair or semantic choice based on the actual dialogue. Public candidates respect audience, preferences and speaking participants.

Playback follows completed dialogue/actions through the existing scene queue, using one shared player. Private requests include a short gesture lead-in. Cancellation or failed generation never starts pending footage. Settings, presence, focus, DND, visibility, an occupied player and the two-minute global cooldown are checked again before playback. Blocked requests report reasons; private reasons remain private. Missing footage is not invented.

Optional semantic checks may add a model call, latency and cost. There is no polling or unbounded retry. Disabled private tools are respected. Optional selection failures preserve the generated reply.

Verification: 169 tests cover cancellation, deferred execution, blocking, actor restrictions, both API tool protocols, and omitted private/autonomous selections. `scripts/verify-private-cg.mjs --packaged` exercises the real main-process callback and renderer with an isolated profile and fixture API, including decoded video playback, one player, privacy and visible blocking reasons. Existing companion and speech integration checks are retained. These checks do not establish live model quality or guarantee footage for every invitation.
