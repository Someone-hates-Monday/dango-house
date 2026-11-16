# Affection requests and action-first dialogue

0.5.0-alpha.12

In public house chat, clear invitations to hug, hold hands or come closer now encourage the model to prefer a compatible available CG when accepted. Relationship mode, presence, autoplay settings, the two-minute playback interval and scene completion still apply. Missing footage is not invented: Claude's current user-facing clip shows reaching closer, not a full embrace. Private chat retains its own action tools; this change does not add a private CG tool.

Live replies are guided to use one short parenthesized action first, followed by spoken dialogue. Plain speech is allowed when no action is needed. Do not insert actions later or invent the user's reactions. Actual animation still requires an intent or tool call.

Claude should not repeatedly start by putting away, closing or protecting a book unless the user raises that topic or shared reading is actually underway. The same rule applies to other recurring character props. Voice revision 3 isolates earlier model wording from style context while preserving visible history and explicit memories.

This changes semantic model guidance, not keyword-based playback or cooldown. Unit tests and builds check compatibility; live output quality still needs user observation.
