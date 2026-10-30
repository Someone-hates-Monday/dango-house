import fs from 'node:fs';
let p='src/Room.tsx';let s=fs.readFileSync(p,'utf8').replace('setDraft({});}} onClick','setDraft({});}}} onClick');fs.writeFileSync(p,s);
p='src/Connections.tsx';s=fs.readFileSync(p,'utf8').replace("patch:{mode:'demo'})","patch:{mode:'demo'}})");fs.writeFileSync(p,s);
