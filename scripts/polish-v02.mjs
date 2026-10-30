import fs from 'node:fs';
const edit=(file,fn)=>fs.writeFileSync(file,fn(fs.readFileSync(file,'utf8')));
edit('src/Room.tsx',s=>s.replace("key.split(':').map(id=>byId[id as CharacterId]?.name).join(' × ')","key.split(/[:>]/).map(id=>byId[id as CharacterId]?.name).join(key.includes('>')?' → ':' × ')").replace("value<8?'刚刚熟悉':value<20?'聊得来':'好朋友'","value<20?'刚刚熟悉':value<60?'聊得来':'很亲近'"));
edit('src/Connections.tsx',s=>s.replace('await save(false);if(saved.includes(provider)', 'if(!await save(false))return;if(saved.includes(provider)'));
