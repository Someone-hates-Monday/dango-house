# Floating UI collision handling

2026-11-05. Source changes only; no packaged release or publication.

A shared layout solver coordinates compact interaction menus, CG cards and speech in Dock/free desktop and room renderers. Menus stay within the viewport and scroll; only one compact menu remains open. Toolbars appear for actual hover/focus/open-menu usage rather than every awake animation. Placement avoids occupied controls and character regions.

If space is exhausted, CG collapses for an explicit menu; speech temporarily falls back to the character's hover title and returns when space permits. No conversation state is deleted. Future CG using the existing class participates; unrelated native windows are outside this renderer's layout scope.

Build and two new geometry tests pass. Isolated Electron Dock/free layout and existing CG regression pass. The new UI harness opens details programmatically to test placement/toggle behavior; native transparent-window mouse click-through still needs manual acceptance. Full unit run is 82/89 with seven engine/animation failures amid concurrent work; no all-green claim. Existing assertions were preserved; one state-read type assertion fixes a TypeScript narrowing error.

See the Chinese record for files, evidence and boundaries. Restart a source build to use this work; the existing portable package is unchanged.
