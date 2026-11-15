import {MessageOrigin} from './MessageOrigin';
import {HouseSkin,inHouseSilhouette} from './HouseSkin';
import {useEffect,useRef,useState} from 'react';
import {Settings2,MessageCircle,Hand,Heart,Utensils,ArrowUp,Minus,X,Pin,Users} from 'lucide-react';
import type {AppState,CharacterId,Food} from './shared/types';
import type {HouseLayout} from './shared/mini-house';
import {projectHouse} from './shared/house-navigation';
import {residentPosition} from './shared/world';
import {HouseResident} from './HouseResident';
import {characters,byId} from './shared/characters';
import {presentCast} from './shared/cast';
import {FurnitureArt} from './Room';
import {cgClip} from './shared/cg-catalog';
import './mini-house.css';

const copy={
 'zh-CN':{home:'团子小屋',chat:'聊聊',group:'小屋群聊',private:'悄悄聊',pat:'摸摸',feed:'投喂',praise:'喜欢你',settings:'设置与连接',hide:'收起小屋',pin:'切换置顶',stop:'停止回应',send:'发送',placeholder:'和她们说点什么…',privatePh:'只对她说…',demo:'离线演示 · 连接大脑',live:'AI 陪伴',selfPlay:'她们自己玩',selfPlayHint:'你忙你的，她们会自己相处；说“我忙完了”可一起聊。',thinking:'她们正在想怎么回应…',resize:'拖动调整小屋大小',newMessages:'有新消息',cg:'查看关系瞬间',roomAbove:'向下移动小屋，为短片留出空间',food:['米饭','茶','蛋糕','鱼'],you:'你',closeChat:'关闭聊天',pinned:'已置顶',unpinned:'未置顶',close:'收起',speech:'查看对白'},
 en:{home:'Dango House',chat:'Chat',group:'House chat',private:'Private',pat:'Pet',feed:'Feed',praise:'Affection',settings:'Settings & connection',hide:'Hide house',pin:'Toggle pin',stop:'Stop response',send:'Send',placeholder:'Say something to them…',privatePh:'Just between you two…',demo:'Offline · Connect AI',live:'Live AI',selfPlay:'Their time',selfPlayHint:'They can spend time together. Tell them when you return.',thinking:'They are thinking…',resize:'Drag to resize the house',newMessages:'New messages',cg:'View moment',roomAbove:'Move the house down to make room above',food:['Rice','Tea','Cake','Fish'],you:'You',closeChat:'Close chat',pinned:'Pinned',unpinned:'Unpinned',close:'Hide',speech:'View dialogue'},
 ja:{home:'団子ハウス',chat:'話す',group:'みんなと',private:'内緒話',pat:'なでる',feed:'あげる',praise:'大好き',settings:'設定・接続',hide:'小屋を隠す',pin:'最前面の切替',stop:'応答を停止',send:'送信',placeholder:'みんなに話しかけて…',privatePh:'二人だけの話…',demo:'デモ · AIを接続',live:'AIと一緒',selfPlay:'みんなの時間',selfPlayHint:'みんなで過ごしているよ。戻ったら声をかけてね。',thinking:'みんなが考えています…',resize:'ドラッグで小屋のサイズを変更',newMessages:'新着メッセージ',cg:'シーンを見る',roomAbove:'小屋を下に動かして上に空間を作ってください',food:['ご飯','お茶','ケーキ','魚'],you:'あなた',closeChat:'会話を閉じる',pinned:'固定中',unpinned:'固定なし',close:'隠す',speech:'会話を見る'},
};
export function MiniHouse({state}:{state:AppState}){
 const t=copy[state.settings.locale],send=window.garden.dispatch;
 const [layout,setLayout]=useState<HouseLayout>({width:380,height:260,chatHeight:0,cgHeight:0});
 const [size,setSize]=useState({width:380,height:260}),[initialized,setInitialized]=useState(false),[chatOpen,setChatOpen]=useState(false),[channel,setChannel]=useState<CharacterId|undefined>();
 const [text,setText]=useState(''),[foodOpen,setFoodOpen]=useState(false),[collapsed,setCollapsed]=useState(false),[unread,setUnread]=useState(false);
 const dragging=useRef(false);
 useEffect(()=>{const end=()=>{if(dragging.current){dragging.current=false;window.garden.houseDrag('end',{x:0,y:0});}};window.addEventListener('blur',end);return()=>window.removeEventListener('blur',end);},[]);
 const list=useRef<HTMLDivElement>(null),nearBottom=useRef(true),resize=useRef<{x:number;y:number;width:number;height:number}|null>(null),video=useRef<HTMLVideoElement>(null),playedAt=useRef(0),lastCg=useRef<string|undefined>(undefined);
 const session=state.presentation.surface==='house'&&state.cgSession?.host==='room'?state.cgSession:undefined;
 const clip=session?cgClip(session.asset):undefined;
 const residents=characters.filter(c=>presentCast(state).includes(c.id));
 const messages=channel?state.privateMessages[channel]:state.messages;
 const last=messages.at(-1);
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const publicSpeech=state.messages.slice().reverse().find(m=>m.speaker!=='system'&&m.speaker!=='user'&&m.text&&state.presentIds.includes(m.speaker));
 const privateSpeech=channel?state.privateMessages[channel].slice().reverse().find(m=>m.speaker===channel&&m.text):undefined;
 const spoken=privateSpeech&&(!publicSpeech||privateSpeech.at>=publicSpeech.at)?privateSpeech:publicSpeech;
 const speechPrivate=spoken===privateSpeech&&!!privateSpeech;
 const speech=spoken&&Math.max(0,now-spoken.at)<20000?spoken:undefined;
 // Reserve transparent, pointer-through headroom once. New lines and bubble
 // expiry must never resize a Windows transparent window during playback.
 const desiredCg=Math.round(Math.min(360,size.width*.82)*9/16+46);
 useEffect(()=>{
  document.documentElement.classList.add('house-document');
  const off=window.garden.onHouseLayout(value=>{setLayout(value);setSize(old=>old.width===value.width&&old.height===value.height?old:{width:value.width,height:value.height});});
  void window.garden.houseLayout().then(value=>{setLayout(value);setSize({width:value.width,height:value.height});setInitialized(true);});
  const move=(e:PointerEvent)=>{if(dragging.current){window.garden.hitTest(true);return;}const target=e.target as Element;const frame=document.querySelector('.mini-frame');const r=frame?.getBoundingClientRect();const painted=!!r&&inHouseSilhouette(e.clientX-r.left,e.clientY-r.top,r.width,r.height);window.garden.hitTest(!!target.closest('.house-chat,.house-cg,.house-speech,.house-header button,.house-resize,.house-roof-chip,.house-canopy')||painted);};
  const leave=()=>{if(!dragging.current)window.garden.hitTest(false);};
  document.addEventListener('pointermove',move);document.addEventListener('pointerleave',leave);
  return()=>{off();document.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',leave);};
 },[]);
 useEffect(()=>{if(initialized)void window.garden.houseLayout({...size,chatOpen,panelHeight:280,cgHeight:desiredCg}).then(setLayout);},[initialized,size.width,size.height,chatOpen,desiredCg,residents.length]);
 useEffect(()=>{if(session?.id&&lastCg.current!==session.id){lastCg.current=session.id;setCollapsed(false);playedAt.current=0;}},[session?.id]);
 useEffect(()=>{const visibility=()=>{if(document.hidden)video.current?.pause();else if(!collapsed)void video.current?.play().catch(()=>{});};document.addEventListener('visibilitychange',visibility);return()=>document.removeEventListener('visibilitychange',visibility);},[collapsed,session?.id]);
 useEffect(()=>{nearBottom.current=true;setUnread(false);if(list.current)list.current.scrollTop=list.current.scrollHeight;},[channel,chatOpen]);
 useEffect(()=>{if(nearBottom.current){if(list.current)list.current.scrollTop=list.current.scrollHeight;}else setUnread(true);},[last?.id,last?.text,messages.length]);
 useEffect(()=>{if(channel&&!state.presentIds.includes(channel)){setChannel(undefined);}},[state.presentIds,channel]);
 const openSettings=()=>{window.garden.window('show-settings');};
 const choose=(id?:CharacterId)=>{
  if(channel!==id){if(channel)void send({type:'private-return',id:channel});if(id){void send({type:'select',id});void send({type:'private-open',id});}setChannel(id);}
  nearBottom.current=true;setChatOpen(true);
 };
 const submit=()=>{if(!text.trim())return;void send(channel?{type:'private-send',id:channel,text}:{type:'send',text});setText('');nearBottom.current=true;};
 const geometry={width:layout.width,height:layout.height,count:residents.length};
 const positions=residents.map(c=>({id:c.id,...projectHouse(residentPosition(state.room.residents[c.id],now),geometry)}));
 const selected=state.presentIds.includes(state.selected)?state.selected:state.presentIds[0];
 const dragHandlers={
  onPointerDown:(e:React.PointerEvent<HTMLElement>)=>{if(e.button!==0)return;dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);window.garden.hitTest(true);window.garden.houseDrag('start',{x:e.screenX,y:e.screenY});},
  onPointerMove:(e:React.PointerEvent<HTMLElement>)=>{if(dragging.current)window.garden.houseDrag('move',{x:e.screenX,y:e.screenY});},
  onPointerUp:(e:React.PointerEvent<HTMLElement>)=>{dragging.current=false;window.garden.houseDrag('end',{x:e.screenX,y:e.screenY});},
  onPointerCancel:(e:React.PointerEvent<HTMLElement>)=>{dragging.current=false;window.garden.houseDrag('end',{x:e.screenX,y:e.screenY});},
 };
 const collapseCg=()=>{playedAt.current=video.current?.currentTime??playedAt.current;setCollapsed(true);};
 return <div className="house-root" data-house-room-width={layout.width} data-house-room-height={layout.height}>
  {session&&clip&&layout.cgHeight>0&&!collapsed&&<section className="house-cg" data-house-cg={session.id} style={{height:layout.cgHeight-6,width:Math.min(360,layout.width*.82)}}>
   <video key={session.id} ref={video} src={clip.video} poster={clip.poster} muted autoPlay playsInline onLoadedMetadata={e=>{e.currentTarget.currentTime=playedAt.current;}} onTimeUpdate={e=>{playedAt.current=e.currentTarget.currentTime;}} onEnded={()=>void send({type:'cg-complete',sessionId:session.id,outcome:'ended'})} onError={()=>void send({type:'cg-complete',sessionId:session.id,outcome:'failed'})}/>
   <div className="house-cg-caption"><span>{clip.copy[state.settings.locale].title}</span><button onClick={collapseCg} aria-label={state.settings.locale==='zh-CN'?'收起短片':state.settings.locale==='ja'?'シーンをたたむ':'Collapse moment'}><Minus size={14}/></button><button onClick={()=>void send({type:'cg-dismiss',sessionId:session.id})} aria-label="Close CG"><X size={14}/></button></div>
  </section>}
  <section className="mini-frame" style={{top:layout.cgHeight,height:layout.height}} data-mini-house="true">
   <HouseSkin width={layout.width} height={layout.height}/><div className="house-canopy" {...dragHandlers}/>
   <header className="house-header"><strong>{t.home}</strong>{[
     {ratio:.65,title:t.pin,label:layout.pinned!==false?t.pinned:t.unpinned,pin:true,icon:<Pin size={16}/>,action:()=>window.garden.window('house-pin')},
     {ratio:.77,title:t.settings,label:state.settings.locale==='zh-CN'?'设置':state.settings.locale==='ja'?'設定':'Setup',pin:false,icon:<Settings2 size={16}/>,action:openSettings},
     {ratio:.89,title:t.hide,label:t.close,pin:false,icon:<X size={17}/>,action:()=>window.garden.window('close')},
    ].map(item=><button key={item.title} className={item.pin?`house-pin ${layout.pinned!==false?'is-pinned':''}`:undefined} title={item.title} aria-label={item.title} aria-pressed={item.pin?layout.pinned!==false:undefined} onClick={item.action} style={{left:layout.width*item.ratio-18,top:20+(item.ratio-.5)*layout.width*50/(layout.width/2-11)}}>{item.icon}<small>{item.label}</small></button>)}</header>
   {!session&&speech&&layout.cgHeight>0&&<button className="house-speech" aria-label={t.speech} onClick={()=>{if(speechPrivate)setChatOpen(true);else choose();}} style={{top:-Math.min(138,layout.cgHeight-2),left:16,right:16}}><small>{byId[speech.speaker as CharacterId].name}{speechPrivate?' · '+t.private:''}</small><span>{speech.text}</span><i style={{left:Math.max(16,Math.min(layout.width-64,(positions.find(p=>p.id===speech.speaker)?.x??layout.width/2)+6))}}/></button>}
   {session&&(collapsed||layout.cgHeight===0)&&<button className="house-roof-chip" title={!collapsed&&layout.cgHeight===0?t.roomAbove:t.cg} onClick={()=>setCollapsed(false)}>♡ {!collapsed&&layout.cgHeight===0?t.roomAbove:t.cg}</button>}
   <div className="house-scene" style={{height:layout.height-148}}>
    <div className="house-window-art"/><div className="house-floor"/><div className="house-rug"/><div className="house-sofa"><FurnitureArt kind="sofa"/></div>
    {residents.map(c=><HouseResident key={c.id} character={c} body={state.bodies[c.id]} resident={state.room.residents[c.id]} geometry={geometry} skin={state.skins[c.id]} selected={selected===c.id} frozen={state.settings.dnd} onSelect={()=>choose(c.id)} onHover={()=>void send({type:'hover',id:c.id})}/>)}

   </div>
   <footer className="house-footer"><button className="house-caption" onClick={()=>setChatOpen(true)} title={last?.text??t.placeholder}><span>{last&&last.speaker!=='system'?(last.speaker==='user'?t.you:byId[last.speaker].name)+' · ':''}{last?.speaker==='system'?t.placeholder:last?.text||t.placeholder}</span></button><div className="house-tools"><button className="house-chat-open" onClick={()=>choose()}><MessageCircle size={15}/>{t.chat}</button>{selected&&<><button title={t.pat} aria-label={t.pat} onClick={()=>void send({type:'pat',id:selected})}><Hand size={17}/></button><button title={t.praise} aria-label={t.praise} onClick={()=>void send({type:'praise',id:selected})}><Heart size={17}/></button><button title={t.feed} aria-label={t.feed} onClick={()=>setFoodOpen(!foodOpen)}><Utensils size={17}/></button></>}<button className="house-brain-status" title={state.settings.housePlayMode==='self-play'?t.selfPlayHint:undefined} onClick={openSettings}>{state.settings.mode==='api'?(state.settings.housePlayMode==='self-play'?t.selfPlay:t.live):t.demo}</button></div></footer>
   {foodOpen&&selected&&<div className="house-food-menu">{(['rice','tea','cake','fish'] as Food[]).map((food,i)=><button key={food} onClick={()=>{setFoodOpen(false);void send({type:'feed',id:selected,food});}}>{t.food[i]}</button>)}</div>}
   <button className="house-resize" aria-label={t.resize} title={t.resize} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);resize.current={x:e.screenX,y:e.screenY,width:layout.width,height:layout.height};}} onPointerMove={e=>{if(resize.current)setSize({width:resize.current.width+e.screenX-resize.current.x,height:resize.current.height+e.screenY-resize.current.y});}} onPointerUp={()=>{resize.current=null;}} onPointerCancel={()=>{resize.current=null;}}/>
  </section>
  {chatOpen&&<section className="house-chat" style={{top:layout.cgHeight+layout.height-10,height:layout.chatHeight+10}}>
   <header><button className={!channel?'active':''} onClick={()=>choose()}><Users size={14}/>{t.group}</button>{channel&&<strong>{byId[channel].name} · {t.private}</strong>}<button className="house-chat-close" aria-label={t.closeChat} onClick={()=>setChatOpen(false)}><X size={16}/><span>{t.closeChat}</span></button></header>
   <div className="house-chat-messages" ref={list} onScroll={e=>{const el=e.currentTarget;nearBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<45;if(nearBottom.current)setUnread(false);}}>{messages.map(m=><div className={`house-message ${m.speaker==='user'?'mine':''} ${m.speaker==='system'?'notice':''} ${m.kind==='error'?'error':''}`} key={m.id} data-message-origin={m.origin?.backend}><small>{m.speaker==='user'?t.you:m.speaker==='system'?'':byId[m.speaker].name}{m.speaker!=='user'&&m.speaker!=='system'&&<MessageOrigin origin={m.origin} locale={state.settings.locale}/>}</small><p>{m.text}</p></div>)}</div>
   {unread&&<button className="house-unread" onClick={()=>{nearBottom.current=true;setUnread(false);if(list.current)list.current.scrollTop=list.current.scrollHeight;}}>{t.newMessages} ↓</button>}
   {state.busy&&<div className="house-thinking">{t.thinking}<button onClick={()=>void send({type:'stop'})} aria-label={t.stop}><X size={13}/></button></div>}
   <form onSubmit={e=>{e.preventDefault();submit();}}><textarea aria-label={channel?t.privatePh:t.placeholder} placeholder={channel?t.privatePh:t.placeholder} value={text} maxLength={4000} rows={2} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();submit();}}}/><button aria-label={t.send} disabled={!text.trim()}><ArrowUp size={19}/></button></form>
  </section>}
 </div>;
}
