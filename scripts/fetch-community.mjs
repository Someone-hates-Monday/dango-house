import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const repo = 'lokicorvus/crosspet';
async function get(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try { const response = await fetch(url, { signal: AbortSignal.timeout(10000) }); if (response.ok) return response; throw new Error(`HTTP ${response.status}`); }
    catch (error) { if (attempt === 2) throw error; }
  }
  throw new Error('Download failed');
}
const metadata = await (await get(`https://api.github.com/repos/${repo}/commits/main`)).json();
if (!metadata.sha) throw new Error('Could not resolve upstream commit');
const commit = metadata.sha;
const raw = `https://raw.githubusercontent.com/${repo}/${commit}/`;
const folder = 'public/community';
await fs.mkdir(folder, { recursive: true });
const manifest = { repository: `https://github.com/${repo}`, commit, license: 'CC-BY-NC-SA-4.0', files: [] };
async function download(file, output) {
  const result = await get(`https://api.github.com/repos/${repo}/contents/${file}?ref=${commit}`);
  const content = await result.json();
  if (!content.content) throw new Error(`No file content: ${file}`);
  const bytes = Buffer.from(content.content, 'base64');
  const blob = crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  if (blob !== content.sha) throw new Error(`Git blob hash mismatch: ${file}`);
  await fs.writeFile(`${folder}/${output}`, bytes);
  manifest.files.push({ path: output, source: `${raw}${file}`, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
}
await download('characters/LICENSE.md', 'UPSTREAM-LICENSE.md');
await Promise.all(['deepseek','claude','gpt','gemini','glm'].map(async name => {
  await fs.mkdir(`${folder}/${name}`, { recursive: true });
  await download(`characters/${name}/character.json`, `${name}/character.json`);
  for (const pose of ['idle','thinking','proud']) await download(`characters/${name}/${pose}.webp`, `${name}/${pose}.webp`);
  console.log(`Imported ${name}`);
}));
await fs.writeFile(`${folder}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`Imported ${manifest.files.length} unchanged upstream files from ${commit}`);
