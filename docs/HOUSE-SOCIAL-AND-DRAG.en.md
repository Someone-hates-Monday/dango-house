# Shared conversations and roof dragging · 0.5.0-alpha.3

The old prompt allowed very short solitary replies. Worse, hover greetings could cancel a queued scene after generation cleared `busy`, and opening private chat hid public speech bubbles.

The house model now plans connected 2–5-turn exchanges among relevant residents, with up to six steps including silent gestures. Personas, social affinities, girl–girl preference and optional `replyTo` guide peer responses. Not everyone must speak. Silent steps never create fabricated chat lines.

For an explicit shared interaction with only one speaker and another eligible resident, one optional model expansion is allowed. It has a 6.5-second sub-deadline, skips already-slow requests, respects cancellation, and preserves the first valid model reply if expansion fails. There is no per-resident fan-out or recursive conversation loop. Autonomous rounds never trigger expansion and retain existing budgets/visibility/DND gates.

Hover/autonomous greetings yield to queued dialogue and CG rather than cancelling them. Explicit user actions may still interrupt. Turns receive 3.4–8.5 seconds of reading time. Public speech and the current private channel compete for the latest visible bubble; private transcripts remain isolated. Clicking public speech opens group history.

An explicit **Drag house** roof grip and blank roof area now move the actual Electron window via sender-checked IPC and screen coordinates. Movement is constrained to display work areas and persisted in `house-window.json`. Position, pin and size restore independently of model requests.

Validation: 128 unit tests and production build passed. Packaged native checks verify a real mouse drag changes window bounds, persisted position/pin/size, settings and shared CG. SSE-fixture checks verify visible public replies during private chat without transcript leakage. One real `deepseek-flash` pat interaction produced a five-step plan involving DeepSeek → Claude → DeepSeek → GPT → Claude, with at least the first two speakers observed and the full scene completed successfully. No expansion was needed in that run; credentials were never read or printed.

This is bounded model-directed roleplay, not seven independent agents. Animation assets are unchanged. Local builds are `0.5.0-alpha.3`; publishing a public GitHub Release remains a separate action.
