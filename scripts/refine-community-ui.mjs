import fs from 'node:fs';
const file = 'src/main.tsx'; let source = fs.readFileSync(file, 'utf8');
source = source.replace('<Sprite character={selected} mood={state.mood[selected.id]} />', '<Sprite character={selected} mood={state.mood[selected.id]} skin={state.skins[selected.id]} />');
source = source.replace('<Sprite character={c} mood={state.mood[c.id]} />', '<Sprite character={c} mood={state.mood[c.id]} skin={state.skins[c.id]} />');
source = source.replace('<Sprite character={character} mood={dragging ? \'happy\' : state.mood[character.id]}/>', '<Sprite character={character} mood={dragging ? \'happy\' : state.mood[character.id]} skin={state.skins[character.id]}/>');
if (!source.includes('className="skin-picker"')) source = source.replace('<div className="affection">', `<div className="skin-picker"><label>外观样式<select aria-label="外观样式" value={state.skins[selected.id]} onChange={e => dispatch({ type: 'skin', id: selected.id, skin: e.target.value as 'chibi' | 'animated' })}><option value="chibi">Q 版 · 表情套装</option><option value="animated">Q 版 · 逐帧动画</option></select></label><small>切换外观，保留记忆和关系</small></div><div className="affection">`);
source = source.replace('className="version">v0.1<','className="version">v0.1.1<');
const start = source.indexOf("{page === 'characters' && <section");
const end = source.indexOf("{page === 'memories'", start);
if (start >= 0 && end > start) source = source.slice(0,start) + "{page === 'characters' && <CharacterLibrary onSelect={id => { dispatch({ type: 'select', id }); setPage('chat'); }} />}\n      " + source.slice(end);
for (const [before, after] of [
  ['庭院群聊','公馆群聊'], ['庭院主人','公馆主人'], ['庭院','公馆'], ['GARDEN ROOM','AI GIRLS LOUNGE'],
  ['我们的小世界','AI 娘的日常'], ['A LITTLE PLACE TO BELONG','FAMILIAR FACES, A NEW STORY'],
  ['今天，也有人在等你。','她们的故事，从这里继续。'],
  ['先打个招呼，认识一下你的桌面伙伴。','鲸鱼、白龙与抱书的少女，今天都到齐了。'],
  ['把每一天都过成晴天','熟悉的 AI 娘，住进你的桌面'],
  ['此刻的陪伴','今日值班'], ['CHARACTER','COMMUNITY CAST'],
  ['有事一起做，','熟悉的她们，'], ['没事一起待着。','新的共同日常。'],
]) source = source.split(before).join(after);
fs.writeFileSync(file, source);
for (const file of ['tests/engine.test.ts','scripts/smoke.mjs']) {
  let text = fs.readFileSync(file,'utf8'); text = text.split('@凛').join('@Claude').split('@小夏').join('@DeepSeek').split('夸夸小夏').join('夸夸DeepSeek'); fs.writeFileSync(file,text);
}
