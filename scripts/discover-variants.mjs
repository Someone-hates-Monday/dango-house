import fs from 'node:fs/promises';
await fs.mkdir('test-results/materials', { recursive: true });
for (const repo of ['fywdy/chatgpt-chibi-pets','xkk6663/dsh-live2d-mao']) {
  const response = await fetch(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`); const data = await response.json();
  await fs.writeFile(`test-results/materials/${repo.split('/')[1]}-tree.json`, JSON.stringify(data));
  console.log(repo, JSON.stringify(data.tree?.filter(x => x.path.endsWith('spritesheet.webp') || x.path.endsWith('pet.json') || x.path.endsWith('model3.json') || x.path.endsWith('.moc3') || x.path.endsWith('.motion3.json') || x.path.includes('LICENSE') || x.path.endsWith('NOTICE.md')).map(x => ({ path: x.path, size: x.size, sha: x.sha })).slice(0,70)));
}
