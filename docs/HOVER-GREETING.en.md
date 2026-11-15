# Pointer dwell responses · 0.5.0-alpha.9

The previous hover path consumed its cooldown before checking whether the API or scene was busy. A dropped greeting could therefore suppress the resident for 90 seconds. Disabling autonomous chatter also disabled pointer greetings.

GPT has approved idle and headpat videos, not a separate wave clip. Its identity protection correctly keeps the approved video instead of revealing an old atlas for unsupported actions. This fix retains that protection.

After roughly 800 ms in the mini house, or 600 ms over a free desktop pet, a deliberate pointer visit produces one subtle nod and a highlighted name. This is a small transform of the existing surface, not a new wave or gaze-tracking video. It does not wait for the provider. It never loops, and reduced-motion preferences disable the nod.

Pointer attention now works independently of autonomous chatter. DND cancels pending dwell and visual feedback. Passing across a resident, clicking/dragging, leaving or blurring cancels pending dwell; moving residents do not start a new nod. Dock retains its existing stand-up feedback and shares the corrected speech admission rules.

Busy scenes and CG are not interrupted and do not consume speech cooldown. Leave and return once the scene is idle to request a greeting. API failures also leave the cooldown available. Successful spoken greetings remain limited to once per resident per 90 seconds, with a 15-second global interval. Cooldown visits still acknowledge visually. Muted, absent and focused residents do not initiate speech.

148 unit tests and the production build pass. `scripts/verify-hover-greeting.mjs` exercises actual pointer dwell, IPC and a delayed isolated SSE provider: quick-pass and DND cancellation, visual feedback before the API reply, silent acknowledgements during cooldown, a single animation, and preservation of GPT's approved video without an atlas fallback.

A live check through the saved DeepSeek connection also produced a GPT greeting after actual pointer dwell. One repeated test launch encountered cache contention with an already-open app; it passed after closing the verified old executable. Credentials and actual conversations were not committed.

Media and native window sizing are unchanged. Source/local desktop version: 0.5.0-alpha.9. Public Releases remain a separate step.
