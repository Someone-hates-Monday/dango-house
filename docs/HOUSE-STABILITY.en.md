# Window flicker and animation recovery · 0.5.0-alpha.6

The one-second UI clock briefly treated newly created speech as future-dated, hiding the bubble and shrinking/expanding the transparent host. A normal dialogue reproduced three native `setBounds` calls (heights 448 → 300 → 448). Unchanged layout queries also issued native bounds updates without allowing for Windows DPI rounding.

The house now reserves stable transparent headroom. Message changes/expiry and CG collapse do not resize the native host; explicit chat expansion, resizing and dragging still work. Empty space remains pointer-through. New speech renders immediately. The controller skips unchanged bounds and tolerates one DIP of native rounding.

Native mouse-through state changes only when entering/leaving an interactive region. Thirty consecutive moves within the same region no longer repeat `setIgnoreMouseEvents`; the stability check verifies this deduplication.

Claude's stop/DND state could leave media permanently paused: two baseline samples remained at 3.186 seconds. Frozen state is now explicit, idle resumes correctly, and walking is identified by its loaded travel state rather than the latest requested pose. Direct pat/feed/manual clips take priority. DeepSeek transitions directly from ordinary physical travel to its arrival gesture; explicit trip choreography is unchanged.

The 10.04-second DeepSeek rice clip receives enough owned time. Demo sharing waits for feeding to complete rather than interrupting it after 2.8 seconds.

Validation: 134 unit tests and production build passed. The isolated native/media check verifies continuous bubbles, zero native resizes during dialogue/unchanged layout queries, recovery after DND, multiple direct clips, full feeding clips returning to idle, and post-travel gestures. After recovery, sampled Claude time advanced from approximately 0.512 to 1.238 seconds.

Packaged checks passed: thirty in-region mouse moves changed native hit state once; walking, shared destinations, dragging and single CG ownership remain functional. GPT decoded all 225 timestamps across two loops. The desktop shortcut now starts this version.

These checks address reproduced software faults rather than claiming universal GPU/driver coverage. Media files are unchanged; no real API requests or media generation were used. Source/local app version is `0.5.0-alpha.6`; a public GitHub Release remains a separate publishing action.
