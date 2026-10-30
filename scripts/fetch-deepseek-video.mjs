import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const {repo,commit,files}=JSON.parse(await fs.readFile('test-results/video-resource-tree.json','utf8'));
const folder='public/video/deepseek';await fs.mkdir(folder,{recursive:true});const records=[];
async function bytesFor(file){for(let attempt=0;attempt<3;attempt++){try{const r=await fetch(`https://api.github.com/repos/${repo}/git/blobs/${file.sha}`,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw new Error(`HTTP ${r.status}`);const b=await r.json();return Buffer.from(b.content,'base64');}catch(e){if(attempt===2)throw e;}}}
const clips={idle:'待机呼吸休闲',wave:'点击回应-元气挥手',happy:'点击回应-开心跃动',shy:'点击回应-害羞惊讶',pat:'点击回应-挠痒咯咯笑',rice:'吃白饭',think:'工作状态-思考冒泡',read:'工作状态-清点归档',sad:'点击回应-傲娇生气',walk:'原地左转奔跑',water:'浇花'};
for(const[name,title]of Object.entries(clips)){
  const file=files.find(f=>f.path===`dsh-pet/assets/webm/${title}.webm`);if(!file){console.log('Not available',title);continue;}
  const url=`https://raw.githubusercontent.com/${repo}/${commit}/${file.path}`;
  let bytes;try{const b=await fs.readFile(`${folder}/${name}.webm`);if(crypto.createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex')===file.sha)bytes=b;}catch{}
  bytes??=await bytesFor(file);if(crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')!==file.sha)throw new Error('Git hash mismatch');await fs.writeFile(`${folder}/${name}.webm`,bytes);records.push({name,title,path:`${name}.webm`,source:url,gitBlob:file.sha,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});console.log(`Imported ${name}: ${title}`);
}
for(const name of ['README.md','LICENSE']){const file=files.find(f=>f.path===name);if(file)await fs.writeFile(`${folder}/UPSTREAM-${name}`,await bytesFor(file));}
await fs.writeFile(`${folder}/manifest.json`,JSON.stringify({repository:`https://github.com/${repo}`,commit,terms:'Noncommercial open-source use; retain original project attribution; character CC-BY-NC-SA-4.0. See UPSTREAM-README.md license section.',records},null,2));
