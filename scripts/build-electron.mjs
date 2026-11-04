import { build } from 'esbuild';

/** Playwright (and its chromium-bidi tree) must stay external — esbuild cannot resolve its nested CJS paths. */
const nodeExternals = ['electron', 'playwright', 'playwright-core', 'chromium-bidi'];

await build({
  entryPoints: ['electron/main.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist-electron/main.cjs',
  external: nodeExternals,
  target: 'node22',
});
await build({
  entryPoints: ['electron/preload.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist-electron/preload.cjs',
  external: ['electron'],
  target: 'node22',
});
await build({
  entryPoints: ['electron/bridge/mcp-stdio.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist-electron/bridge-mcp.cjs',
  target: 'node22',
});
