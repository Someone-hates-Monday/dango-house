# Conversation-driven scenes, independent play and natural voices · 0.5.0-alpha.10

## Usage

Ask Claude publicly or privately why she is not playing with DeepSeek, encourage her to visit, or say you would like to see them get closer. Say you are busy and they can play together; tell them when you return.

If a resident accepts, the scene can execute movement, partner replies, chibi gestures and an appropriate shared CG. Clips are not mandatory: participants, intimacy preferences, autoplay and cooldown still apply. Private invitations require enabled avatar tools. Ongoing independent play respects autonomous-interaction settings, presence, DND and existing call limits.

## Execution

For public messages the model chooses user or companion focus semantically, including indirect invitations. Touch/feeding events remain user-focused and cannot promote themselves into an unsolicited pair scene.

A plan can acknowledge the user, approach an exact partner ID or gather at a shared destination, exchange dialogue and express emotions. Existing safe paths, arrival-aware speech and settlement govern execution. Already-near or blocked residents do not run in place. One shared CG layer appears above the house after scene completion.

Private replies gain an `invite_companion` tool. It queues a public invitation topic and a present partner ID. The private reply completes before the shared visit starts; a queued receipt does not claim arrival. Private transcripts are not automatically forwarded to the planner. Only the model-submitted public invitation topic is shared, so the model still must follow the public-topic instruction; this is not a perfect content-privacy classifier.

Cancellation invalidates unfinished invitations. Absent or muted targets are rejected. At most one invitation is queued per turn. Both OpenAI-compatible and Anthropic tool streams are supported.

## Independent play

Explicit user intent can set persisted `housePlayMode:self-play` or restore `together`. The footer shows “Their time.” Autonomous plans can read this preference but cannot rewrite it. The residents may enjoy one another's company rather than treating a busy user as rejection or insisting on staying exclusively with them.

Direct user interaction remains welcome. Disabling autonomous interactions still prevents ongoing background calls; an explicit invitation can run one scene without silently changing that setting.

## Removing repeated props

Live tests showed that revised instructions alone still copied old book-heavy dialogue and event quotations. Model-facing conversational cards now emphasize voice, care and nicknames, while full visual definitions and animation assets remain intact. Seven voices receive short examples without obligatory books, rice, tails, pricing jokes or moonlight metaphors. Relevant interests and physical actions remain valid; words are not censored.

New model messages carry `voiceRevision:2`. Generation context starts with the revised voice rather than replaying obsolete character prose; before any revised reply it starts with the current user turn. Shared event context contains participants/triggers instead of old quotations. Visible history, explicit memories, relationships and configuration remain saved. Old verbatim dialogue is no longer default generation context, so important lasting facts should be kept as explicit memories.

Private text should contain spoken dialogue, leaving gestures to tools. Current input is emphasized so a completed invitation is not repeatedly extended into unrelated conversation. Grok's humor should celebrate with the user rather than grade whether their small achievement deserves joy.

## Verification

156 unit tests and a production build cover semantic focus, touch boundaries, actual movement, delayed CG, private invitations, cancellation/privacy, persisted play modes, both tool protocols and voice-context migration.

`scripts/verify-companion-handoff.mjs` exercises renderer/IPC/local SSE paths for both public and private invitations: actual approach, model partner reply, independent-play state, one shared CG and private isolation. Hover responses were also regression-tested.

Live DeepSeek checks covered ordinary chat, private invitation, movement/partner exchange/appropriate CG, independent play and the user's return. After voice-context migration Claude's sampled replies stopped inserting books. All seven residents were sampled, followed by targeted Claude/Grok rechecks. A GLM sample still mentioned her tail naturally; this reduces habitual motifs rather than guaranteeing their complete absence. Keys and actual conversations were not committed.

Early integration attempts hit overlapping clickable regions and an already-near pair. The test now uses a real visible hit point and checks participant motion rather than forcing clicks or demanding redundant travel.

Main entry points: `house-events.ts`, `companion-voice.ts`, `dialogue/voice-examples.ts`, `avatar-tool.ts`, `provider.ts` and `engine.ts`. Extend executable capabilities and suitable contexts instead of adding canned corrective dialogue.

Source/local desktop version: 0.5.0-alpha.10. Public Releases are separate. Media and native window sizing are unchanged.
