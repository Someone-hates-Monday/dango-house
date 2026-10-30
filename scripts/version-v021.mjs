import fs from 'node:fs';
for(const file of ['package.json','package-lock.json']){const p=JSON.parse(fs.readFileSync(file,'utf8'));p.version='0.2.1';if(p.packages)p.packages[''].version='0.2.1';fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');}
for(const file of ['src/main.tsx','README.md','scripts/smoke-packaged.mjs'])fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll('v0.2.0','v0.2.1').replaceAll('DangoHouse-0.2.0','DangoHouse-0.2.1'));
