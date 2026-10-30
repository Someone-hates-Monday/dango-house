import fs from 'node:fs';
const edit=(p,fn)=>fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));
edit('src/Sprite.tsx',s=>s.replace('perch=0,stoppedAt}', 'perch=0,stoppedAt,forceRig=false}').replace('stoppedAt?:number})','stoppedAt?:number;forceRig?:boolean})').replace("&&perch<.01",'&&!forceRig&&perch<.01'));
edit('src/DesktopPet.tsx',s=>s.replace("import {useNow}","import {DockCast} from './DockCast';\nimport {useActualPose} from './useActualPose';\nimport {useNow}").replace('export function DesktopCast(', 'function FreeCast(').replace("const pose=dragging?'wait':movement&&now<movement.arrivesAt?(movement.to.x>movement.from.x?'walk-right':'walk-left'):body.pose;", "const resolvedPose=useActualPose(body.pose,p.x*(size.w-160),p.y*(size.h-210),now);const pose=dragging?'wait':resolvedPose;")+`\nexport function DesktopCast(props:{state:AppState;displayId:number;primary:boolean}){return props.state.presentation.desktopMode==='dock'?<DockCast {...props}/>:<FreeCast {...props}/>;}\n`);
edit('src/Room.tsx',s=>{
 s=s.replace("import {SocialBar}","import {useActualPose} from './useActualPose';\nimport {SocialBar}");
 const start=s.indexOf('      {characters.map(c=>{const r=state.room.residents');
 const end=s.indexOf('\n      <span className="room-mode">',start);
 if(start<0||end<0)throw Error('Room seam missing');
 s=s.slice(0,start)+`      {characters.map(c=><RoomActor key={c.id} id={c.id} state={state} now={now} x={castPositions[c.id].x} y={castPositions[c.id].y}/>)}\n`+s.slice(end);
 s=s.replace('<div className="scene-buttons">','<div className="scene-buttons"><button onClick={()=>send({type:\'presentation\',patch:{desktopMode:state.presentation.desktopMode===\'dock\'?\'free\':\'dock\'}})}>{state.presentation.desktopMode===\'dock\'?\'↗ 自由桌宠\':\'▁ 趴在任务栏\'}</button>');
 s=s.replace('<div className="action-palette">','<div className="action-palette">{selected.id===\'xia\'&&<button onClick={()=>send({type:\'trip\',id:selected.id})}>跌倒与爬起</button>}');
 return s+`\nfunction RoomActor({id,state,now,x,y}:{id:CharacterId;state:AppState;now:number;x:number;y:number}){\n const c=byId[id],body=state.bodies[id],active=body.until>now;const pose=useActualPose(body.pose,x,y,now);\n return <button className={\x60room-character \${id===state.selected?'selected':''}\x60} data-character={id} aria-label={\x60选择\${c.name}\x60} style={{left:x,top:y,zIndex:Math.floor(y)+1}} onClick={e=>{e.stopPropagation();send({type:'select',id});}} onDoubleClick={()=>window.garden.openPrivate(id)}><span className="room-char-shadow"/>{active&&body.bubble&&<span className="room-speech">{body.bubble}</span>}<span className={\x60character-motion motion-\${pose}\x60}><Sprite character={c} skin={state.skins[id]} pose={pose} cue={body.until} activity={body.bubble} interaction={body.interaction} stoppedAt={body.stoppedAt}/><EmotionFx emotion={active?body.emotion:'neutral'}/></span><span className="room-name">{c.name}{active&&<small>{body.label}</small>}</span></button>;\n}\n`;
});
const controls=`<div className="settings-section"><h2>桌面上的陪伴方式</h2><div className="relationship-options">{([{id:'free',name:'自由桌宠 · 可以拖动'},{id:'dock',name:'任务栏停靠 · 悬停站起'}] as const).map(item=><button key={item.id} className={state.presentation.desktopMode===item.id?'selected':''} onClick={()=>void send({type:'presentation',patch:{desktopMode:item.id}})}>{item.name}</button>)}</div><p className="helper">停靠在 Windows 任务栏上缘，小范围横移；离开后慢慢趴回去。自由桌宠的位置会保留。</p><label>聊天形象<select aria-label="聊天形象" value={state.presentation.chatForm} onChange={e=>void send({type:'presentation',patch:{chatForm:e.target.value as 'portrait'|'chibi'}})}><option value="portrait">正常比例立绘 · 轻动效</option><option value="chibi">Q 版动态形象</option></select></label></div>`;
edit('src/Connections.tsx',s=>s.replace('    <div className="settings-section"><h2><Plug',`    ${controls}\n    <div className="settings-section"><h2><Plug`));
edit('src/main.tsx',s=>{
 s="import {PortraitSprite} from './PortraitSprite';\n"+s;
 const start=s.indexOf('<Sprite character={selected} mood={state.mood[selected.id]}');
 const end=s.indexOf('/>',start)+2;const sprite=s.slice(start,end);
 s=s.slice(0,start)+`{state.presentation.chatForm==='portrait'?<PortraitSprite character={selected} body={state.bodies[selected.id]}/>:${sprite}}`+s.slice(end);
 s=s.replace('<div className="skin-picker"><label>',`<div className="skin-picker"><label>聊天形象<select aria-label="聊天形象" value={state.presentation.chatForm} onChange={e=>dispatch({type:'presentation',patch:{chatForm:e.target.value as 'portrait'|'chibi'}})}><option value="portrait">正常比例 · 轻动效</option><option value="chibi">Q 版动态</option></select></label><label>`);
 return s;
});
edit('src/PrivateChat.tsx',s=>{
 s="import {PortraitSprite} from './PortraitSprite';\n"+s;
 const start=s.indexOf('<Sprite character={character}');const end=s.indexOf('/>',start)+2;const sprite=s.slice(start,end);
 s=s.slice(0,start)+`{state.presentation.chatForm==='portrait'?<PortraitSprite character={character} body={body}/>:${sprite}}`+s.slice(end);
 s=s.replace('<div className="private-touch">',`<div className="private-touch"><button onClick={()=>void window.garden.dispatch({type:'presentation',patch:{chatForm:state.presentation.chatForm==='portrait'?'chibi':'portrait'}})}>{state.presentation.chatForm==='portrait'?'切换 Q 版':'切换立绘'}</button>`);
 return s;
});
