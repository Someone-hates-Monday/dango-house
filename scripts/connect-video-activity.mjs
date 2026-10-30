import fs from 'node:fs';
for(const file of ['src/Room.tsx','src/DesktopPet.tsx','src/PrivateChat.tsx'])fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('cue={body.until}/>', 'cue={body.until} activity={body.bubble}/>'));
const file='src/main.tsx';fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace('cue={state.bodies[selected.id].until} />','cue={state.bodies[selected.id].until} activity={state.bodies[selected.id].bubble} />').replace('Q 版 · 逐帧动画','Q 版 · 动态增强'));
