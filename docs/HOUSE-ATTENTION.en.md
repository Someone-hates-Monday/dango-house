# Interaction audience and real model replies · 0.5.0-alpha.7

## Why API replies felt scripted

The latest 35 inspected character messages were marked as DeepSeek output, without exact duplicates. The old prompt nevertheless required two or three residents to respond even to headpats, feeding and praise. A valid solo answer could trigger an extra request to add a partner. Repeated pairing cues, demo memories and a literal canned reply in private prompts encouraged recurring seat-saving and food-sharing scenes.

An additional avatar-tool path could inject a fixed partner response when approaching another resident. It is now disabled in API mode. Offline demos, user-configured reminders and hidden recording controls still support local text.

## Audience boundaries

- Touch, feeding, praise and private entry prioritize the user. The selected resident speaks first. A solo reply is valid; another resident may make one relevant remark or a silent gesture, without taking over the exchange.
- Ordinary messages address the user. Explicit requests for companion exchanges, autonomous life, visits and companion stories use social staging. Peer replies and shared destinations remain available; a second speaker alone no longer makes a user interaction walk toward another girl.
- Girl–girl affection is permission for suitable situations, not a mandatory goal. User-focused events do not offer pair-directed CG. An otherwise valid proposal for the wrong audience is discarded while preserving dialogue. User-facing POV clips still require the correct cast and relationship settings.
- Local and unverified historical character lines are excluded from model context, while visible history and user messages remain intact. Shared memories use completed model interactions. Private prompts no longer include canned partner replies.
- Mini-house and private transcripts show `AI`, `Demo` or `History`. AI tooltips display the actual backend after completion. Unlabeled old replies are not retroactively claimed as API output.

Audience selection currently uses event types and a small set of explicit phrases, not a complete semantic classifier. Ambiguous requests may still be misclassified, and generated wording remains probabilistic. Future structured scene intents should represent who is addressing whom instead of adding dialogue templates.

## Validation

139 unit tests cover solo replies, audience selection, selected-speaker order, CG audience/cast, script-context isolation, private prompts and removal of implicit scripted tool responses. The isolated SSE integration exercises renderer, IPC, credential storage and provider calls, including failed connection handling, solo headpats, feeding, private isolation and visible AI provenance.

Four live checks through the saved DeepSeek connection covered headpat, feeding, Claude private entry and an explicit DeepSeek/Claude exchange. The first three addressed the user; the last produced a multi-resident conversation. No API errors occurred. Credentials were accessed only through the application's normal path; neither keys nor actual conversations were committed.

This change leaves video assets, animation controllers and native window sizing intact. Source/local desktop version: 0.5.0-alpha.7. Public GitHub Releases are published separately.
