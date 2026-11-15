# Companion dialogue and model control · 0.5.0-alpha.8

## Design

Routine headpats should not earn invented warnings about damaged books. Praise need not produce denial, and feeding need not introduce conditions. The old personality text made irritation, defensive affection and pricing jokes sound habitual. Removing one sentence would leave that generation pattern intact.

The new approach lets the model respond to the current input and generate matching actions. Character traits guide expression; they do not prescribe a plot or a mandatory corrective ending. Kindness can be enjoyed directly. Genuine discomfort still permits a clear, gentle boundary.

[Kindroid's personality guide](https://kindroid.ai/v2/docs/customizing-personality/) separates personality, concise response directives, memories and examples. Its public advice favors precise, positive instructions and distinguishes conditional behavior from instructions that run every turn. [SillyTavern's character guide](https://docs.sillytavern.app/usage/core-concepts/characterdesign/) separates character facts, scenarios, examples and history, with attention to context cost. These public designs inform our implementation choices; they do not guarantee particular model behavior.

## Implementation

- Character facts retain appearance and interests, while removing habitual irritation from Claude and softening obligatory defensiveness or pricing jokes for GPT and GLM.
- `src/shared/companion-voice.ts` supplies shared guidance plus seven distinct voices to both public and private providers. Event guidance describes headpat, feeding, praise, private entry/return, hover and reminders without prewriting the answer.
- Selected legacy lines become explicitly fictional style examples. At most two are provided per character, excluding the matching headpat/private-entry category for that event. Chinese, English and Japanese examples were also softened.
- Public plans remain model-generated dialogue/actions/reply targets/optional CG. Private replies remain model-generated text with avatar tools. Output is displayed unchanged, without scripted suffixes, sentence deletion or canned lookup. Current private input is explicitly carried forward.
- Missing generators and API failures report errors rather than silently replaying demo dialogue. Action/cast/CG validation remains in place, and immediate touch animation still responds locally while speech waits for the model.
- Scheduled user reminders first appear as timely system notifications. An idle household may generate a character response; busy conversations and scenes are not interrupted. Offline demos and hidden recording controls retain clearly labeled local dialogue.

## Validation and limits

144 unit tests cover all seven voices across three languages, bounded references, actual input, unchanged model output, no matching headpat example, missing-generator errors and noninterrupting reminders. The isolated SSE integration checks renderer, IPC, providers, connection handling, headpat/feeding, private isolation and origin labels.

Six live DeepSeek checks covered two consecutive Claude headpats, GPT and DeepSeek headpats, Claude private entry and ordinary private conversation. All returned model output without API errors or canned substitution. No corrective book-warning ending appeared in this sample, while personalities remained distinguishable. Actual dialogue and credentials were not committed.

Claude still tends to mention books, influenced by history and model behavior. This is not a claim that all repetition or awkward phrasing is solved. An earlier trial selected an absent GLM and timed out; the completed rerun used present residents rather than misclassifying that test error as an API failure.

Next evaluate actual user experience: responsiveness, voice distinction, repetition, unsolicited correction and action/text consistency. Editable preferences, regeneration and feedback are possible next steps, rather than adding more canned lines.

Media and window layout are unchanged. Source/local desktop version: 0.5.0-alpha.8. Public Releases are handled separately.
