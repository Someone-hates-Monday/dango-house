import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {once} from 'node:events';
fs.mkdirSync('.animation-lab',{recursive:true});
const infoFile='.animation-lab/wan-original-info.json';
if(!fs.existsSync(infoFile)){const r=await fetch('https://modelscope.cn/api/v1/models/Wan-AI/Wan2.2-TI2V-5B/repo/files?Recursive=true&Revision=master');if(!r.ok)throw Error(`Model metadata ${r.status}`);fs.writeFileSync(infoFile,await r.text());}
const info=JSON.parse(fs.readFileSync(infoFile,'utf8'));
const files=info.Data.Files.filter(f=>f.Type==='blob'&&!/^(assets|examples)\//.test(f.Path)&&!f.Path.startsWith('.'));
const root=path.resolve('.animation-lab/models/Wan2.2-TI2V-5B');fs.mkdirSync(root,{recursive:true});
const stats={total:files.reduce((n,f)=>n+f.Size,0),downloaded:0,start:Date.now()};
const progress=setInterval(()=>console.log(`Wan ${(stats.downloaded/1e9).toFixed(2)}/${(stats.total/1e9).toFixed(2)} GB`),30000);
async function hash(p){const h=crypto.createHash('sha256');for await(const c of fs.createReadStream(p))h.update(c);return h.digest('hex');}
async function download(file){
 const target=path.join(root,file.Path),partial=target+'.partial';fs.mkdirSync(path.dirname(target),{recursive:true});
 if(fs.existsSync(target)&&fs.statSync(target).size===file.Size){stats.downloaded+=file.Size;return;}
 for(let attempt=0;attempt<5;attempt++){
  const offset=fs.existsSync(partial)?fs.statSync(partial).size:0;
  try{
   const u=`https://modelscope.cn/api/v1/models/Wan-AI/Wan2.2-TI2V-5B/repo?Revision=${file.Revision||'master'}&FilePath=${encodeURIComponent(file.Path)}`;
   const r=await fetch(u,{headers:offset?{Range:`bytes=${offset}-`}:{},signal:AbortSignal.timeout(3600000)});
   if(!r.ok)throw Error(`HTTP ${r.status}`);const append=r.status===206&&offset>0;
   let size=append?offset:0;const w=fs.createWriteStream(partial,{flags:append?'a':'w'});
   try{for await(const c of r.body){if(!w.write(c))await once(w,'drain');size+=c.length;stats.downloaded+=c.length;}}finally{w.end();await once(w,'close');}
   if(size!==file.Size)throw Error(`size ${size}/${file.Size}`);
   if(file.Sha256&&await hash(partial)!==file.Sha256)throw Error('SHA256 mismatch');
   fs.renameSync(partial,target);console.log('Verified',file.Path);return;
  }catch(e){console.log('Retry',file.Path,attempt+1,e.message);if(attempt===4)throw e;await new Promise(r=>setTimeout(r,2000));}
 }
}
try{let next=0;await Promise.all(Array.from({length:3},async()=>{while(next<files.length)await download(files[next++]);}));fs.writeFileSync(path.join(root,'download-manifest.json'),JSON.stringify({source:'Wan-AI/Wan2.2-TI2V-5B on ModelScope',files},null,2));console.log('Wan download complete and SHA256 verified.');}finally{clearInterval(progress);}
