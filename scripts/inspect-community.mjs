import fs from 'node:fs/promises';
const repo = 'lokicorvus/crosspet';
const tree = await (await fetch(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`)).json();
console.log('Character definitions:', tree.tree.filter(x => x.path.startsWith('characters/') && x.path.endsWith('/character.json')).map(x => x.path));
await fs.mkdir('test-results/materials', { recursive: true });
for (const file of ['characters/LICENSE.md', 'characters/claude/character.json', 'characters/deepseek/character.json', 'characters/gpt/character.json', 'characters/gemini/character.json', 'characters/glm/character.json']) {
  const result = await fetch(`https://raw.githubusercontent.com/${repo}/main/${file}`);
  console.log(file, await result.text());
}
for (const name of ['deepseek','claude','gpt','gemini','glm']) {
  const result = await fetch(`https://raw.githubusercontent.com/${repo}/main/characters/${name}/idle.webp`);
  if (result.ok) await fs.writeFile(`test-results/materials/${name}.webp`, Buffer.from(await result.arrayBuffer()));
}
for (const name of ['NOTICE.md', 'catalog.json']) {
  const result = await fetch(`https://raw.githubusercontent.com/shuaizenge/ai-girls/main/${name}`);
  await fs.writeFile(`test-results/materials/${name}`, await result.text());
}
