import fs from 'node:fs';
// Three original companions resting together on a shared Dock.
// Checked-in masters keep npm run assets from replacing the current brand.
fs.mkdirSync('build', { recursive: true });
fs.mkdirSync('public', { recursive: true });
fs.copyFileSync('build/brand/dango-house-v2.png', 'public/icon.png');
fs.copyFileSync('build/brand/dango-house-v2.ico', 'build/icon.ico');
