import fs from 'node:fs/promises';
const result=[];
for(const repo of ['Hjh-12138/DSH-Pixel-Toons','shuaizenge/ai-girls','JAdpp/dsh-whale-galgame']){
  const commit=await(await fetch(`https://api.github.com/repos/${repo}/commits/HEAD`)).json();
  const tree=await(await fetch(`https://api.github.com/repos/${repo}/git/trees/${commit.sha}?recursive=1`)).json();
  const files=(tree.tree??[]).filter(f=>f.type==='blob');const entry={repo,commit:commit.sha,files};result.push(entry);
  console.log(repo,commit.sha,files.filter(f=>/\.(webm|gif|moc3|model3.json|png|webp)$/i.test(f.path)).slice(0,65).map(f=>({path:f.path,size:f.size})));
  for(const p of ['catalog.json','NOTICE.md','README.md']){const file=files.find(f=>f.path===p);if(!file)continue;const data=await(await fetch(`https://api.github.com/repos/${repo}/git/blobs/${file.sha}`)).json();if(data.content)await fs.writeFile(`test-results/${repo.split('/')[0]}-${p}`,Buffer.from(data.content,'base64'));}
}
await fs.writeFile('test-results/v03-resource-trees.json',JSON.stringify(result));
