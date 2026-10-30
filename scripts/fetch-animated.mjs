import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const repo = 'fywdy/chatgpt-chibi-pets';
let tree;
try {
  const saved = JSON.parse(await fs.readFile('public/animated/manifest.json','utf8'));
  tree = await (await fetch(`https://api.github.com/repos/${repo}/git/trees/${saved.tree}?recursive=1`)).json();
} catch { tree = await (await fetch(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`)).json(); }
if (!tree.tree) throw new Error('Could not resolve upstream tree');
const folder = 'public/animated'; await fs.mkdir(folder,{recursive:true});
const records = [];
async function copy(upstream, output) {
  const entry = tree.tree.find(x=>x.path===upstream); if(!entry) throw new Error(`Missing ${upstream}`);
  let data;
  try { const cached = await fs.readFile(`${folder}/${output}`); if (crypto.createHash('sha1').update(`blob ${cached.length}\0`).update(cached).digest('hex') === entry.sha) data = cached; } catch {}
  for(let attempt=0;!data && attempt<3;attempt++) {
    try { const r=await fetch(`https://api.github.com/repos/${repo}/git/blobs/${entry.sha}`,{signal:AbortSignal.timeout(20000)}); if(!r.ok) throw new Error(`HTTP ${r.status}`); const blob=await r.json(); data=Buffer.from(blob.content,'base64'); break; }
    catch(error){if(attempt===2) throw error;}
  }
  const hash=crypto.createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex'); if(hash!==entry.sha) throw new Error('Git blob checksum failed');
  await fs.writeFile(`${folder}/${output}`,data); records.push({path:output,upstream,gitBlob:entry.sha,sha256:crypto.createHash('sha256').update(data).digest('hex')}); console.log(`Imported ${output}`);
}
await copy('NOTICE.md','NOTICE.md'); await copy('LICENSE','LICENSE');
await Promise.all([
  copy('deepseek-whale-maid-chibi-v4/spritesheet.webp','deepseek.webp'),
  copy('claude-orange-scholar-chibi-v3/spritesheet.webp','claude.webp'),
  copy('chatgpt-white-dragon-chibi-v5/spritesheet.webp','gpt.webp'),
  copy('gemini-star-cat-chibi-v1/spritesheet.webp','gemini.webp'),
  copy('kimi-moon-maid-chibi-v2/spritesheet.webp','kimi.webp'),
  copy('grok-gothic-chibi-v1/spritesheet.webp','grok.webp'),
]);
await fs.writeFile(`${folder}/manifest.json`,JSON.stringify({repository:`https://github.com/${repo}`,tree:tree.sha,license:'CC-BY-NC-4.0',records},null,2));
