# House resizing and input recovery

0.5.0-alpha.14

Two risks were found: native layout notifications fed normalized dimensions back into outgoing requests, and resize capture lacked complete focus/capture-loss cleanup. No dump from the reported system freeze is available, so these are verified risks rather than a proven explanation of every symptom.

Notifications now update displayed geometry only. Outgoing requests are coalesced on a 40ms timer with at most one IPC in flight. Resizing retains pointer hit testing and ends on release, cancellation, blur or lost capture. Movement without a pressed button stops resizing. House dragging also cleans up lost capture.

`scripts/verify-house-resize.mjs --packaged` uses an isolated profile to exercise 480 extreme resize moves, release/cancel/blur/capture loss, settled native bounds, clickable controls and advancing GPT idle video. The source run coalesced the burst to one native bounds change. Existing house and window-stability checks are retained; user data stays untouched.
