import {useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import type {AppState,CharacterId} from './shared/types';
import {fallbackStageAnchor,groupOverheadAnchor} from './shared/cg-anchor';
import {cgClip} from './shared/cg-catalog';
import {isPresent} from './shared/cast';
import {byId} from './shared/characters';
import './cg-moment.css';

const copy={
 'zh-CN':{label:'关系瞬间',room:'小屋',desktop:'桌面',skip:'跳过',close:'关闭CG',collapse:'收起CG',replay:'继续看',note:'想安静看一会儿也好 · Esc 结束',fallback:'静帧预览 · 视频未加载',hint:'按片段参与者在场，且未开启免打扰或专注',tight:'头顶空间不足，已折叠'},
 en:{label:'Relationship moment',room:'Room',desktop:'Desktop',skip:'Skip',close:'Close CG',collapse:'Collapse CG',replay:'Continue',note:'Stay for a moment · Esc to close',fallback:'Still preview · video unavailable',hint:'Required cast must be present; DND and focus must be off',tight:'Not enough headroom — collapsed'},
 ja:{label:'関係のひととき',room:'小屋',desktop:'デスクトップ',skip:'スキップ',close:'CGを閉じる',collapse:'CGをたたむ',replay:'続きを見る',note:'もう少し一緒に · Escで終了',fallback:'静止画プレビュー · 動画未読込',hint:'出演者が在場し、集中・おやすみモードがオフの時に利用できます',tight:'頭上スペース不足のため折りたたみ'},
};
const text=(state:AppState)=>copy[state.settings.locale]??copy['zh-CN'];

// One visible owner per session in this renderer, even if multiple views mount the component.
const sessionOwners=new Map<string,Set<(owns:boolean)=>void>>();
function useSessionOwner(id:string|undefined,eligible:boolean){
 const [owns,setOwns]=useState(false);
 useLayoutEffect(()=>{
  if(!id||!eligible){setOwns(false);return;}
  const owners=sessionOwners.get(id)??new Set<(owns:boolean)=>void>();sessionOwners.set(id,owners);
  owners.add(setOwns);const elect=()=>{const first=owners.values().next().value;for(const update of owners)update(update===first);};elect();
  return()=>{owners.delete(setOwns);if(!owners.size)sessionOwners.delete(id);else elect();};
 },[id,eligible]);
 return owns;
}

function characterBox(host:'room'|'desktop',id:CharacterId){
  const sel=host==='room'
    ?`.dollhouse .room-character[data-character="${id}"]`
    :`.desktop-pet[data-character="${id}"],.dock-pet[data-character="${id}"]`;
  const el=document.querySelector<HTMLElement>(sel);
  if(!el)return null;
  const r=el.getBoundingClientRect();
  return {left:r.left,top:r.top,width:r.width,height:r.height};
}

/** Full viewport — CG may leave the dollhouse clip and sit above other UI. */
function overlayBounds(){
  return{left:8,top:8,width:Math.max(1,innerWidth-16),height:Math.max(1,innerHeight-16)};
}

export function CGMoment({state,host,primary=true}:{state:AppState;host:'room'|'desktop';primary?:boolean}){
 const session=state.cgSession,t=text(state),clip=session?cgClip(session.asset):undefined,spoken=clip?.copy[state.settings.locale],video=useRef<HTMLVideoElement>(null);
 const[collapsed,setCollapsed]=useState(false),[failed,setFailed]=useState(false),[forced,setForced]=useState(false);
 const[anchor,setAnchor]=useState<CSSProperties|{display:'none'}>({display:'none'});
 const[space,setSpace]=useState<'pending'|'ok'|'tight'>('pending');
 const eligible=!!session&&session.host===host&&(host!=='desktop'||primary);
 const owns=useSessionOwner(session?.id,eligible);
 const visible=eligible&&owns;
 const dismiss=()=>{if(session)void window.garden.dispatch({type:'cg-dismiss',sessionId:session.id});};
 const complete=(outcome:'ended'|'failed')=>{if(session)void window.garden.dispatch({type:'cg-complete',sessionId:session.id,outcome});};
 useEffect(()=>{setCollapsed(false);setFailed(false);setForced(false);setSpace('pending');setAnchor({display:'none'});},[session?.id]);
 useEffect(()=>{if(!visible)return;const key=(event:KeyboardEvent)=>{if(event.key==='Escape')dismiss();};const hide=()=>{if(document.hidden)dismiss();};document.addEventListener('keydown',key);document.addEventListener('visibilitychange',hide);return()=>{document.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',hide);};},[visible,session?.id]);
 useEffect(()=>{if(collapsed)video.current?.pause();else if(visible&&space==='ok')void video.current?.play().catch(()=>{});},[collapsed,visible,space]);
 useLayoutEffect(()=>{
  if(!visible||collapsed||!clip)return;
  let raf=0;
  const tick=()=>{
   raf=requestAnimationFrame(tick);
   const bounds=overlayBounds();
   const participants=[...new Set(clip.participants)];
   const boxes=participants.map(id=>characterBox(host,id)).filter((b):b is NonNullable<typeof b>=>!!b);
   const placed=boxes.length===participants.length?groupOverheadAnchor(boxes,bounds,host):null;
   if(!placed){
    if(forced){const fb=fallbackStageAnchor(bounds,host);setSpace('ok');setAnchor({position:'fixed',left:fb.left,top:fb.top,width:fb.width,maxWidth:fb.width,zIndex:12000});}
    else{setSpace('tight');setAnchor({display:'none'});}
    return;
   }
   setSpace('ok');
   setAnchor({position:'fixed',left:placed.left,top:placed.top,width:placed.width,maxWidth:placed.width,zIndex:12000});
  };
  tick();
  return()=>cancelAnimationFrame(raf);
 },[visible,host,collapsed,forced,session?.id,clip]);
 if(!visible||typeof document==='undefined')return null;
 if(space==='pending')return createPortal(null,document.body);
 if(collapsed||space==='tight'){
  return createPortal(<button className={`cg-memory-chip cg-memory-chip--${host} cg-memory-chip--overlay`} title={t.tight} onClick={()=>{setCollapsed(false);setForced(true);setSpace('pending');}}>♡ {spoken?.title} · {t.replay}</button>,document.body);
 }
 return createPortal(<section className={`cg-moment cg-moment--${host} cg-moment--overhead cg-moment--overlay`} aria-label={t.label} style={anchor} onClick={e=>e.stopPropagation()} data-cg-job={session.jobId} data-cg-segment={session.segmentId} data-cg-asset={session.asset} data-cg-outcome={session.outcome}>
  <div className="cg-moment-picture"><img src={clip?.poster} alt=""/>{!failed&&clip&&<video key={session.id} ref={video} src={clip.video} poster={clip.poster} muted autoPlay playsInline onError={()=>{setFailed(true);complete('failed');}} onEnded={()=>complete('ended')}/>}<span className="cg-moment-label">{t.label}</span><div className="cg-moment-controls"><button aria-label={t.collapse} onClick={()=>setCollapsed(true)}>−</button><button aria-label={t.close} onClick={dismiss}>×</button></div></div>
  <div className="cg-moment-caption"><small>{clip?.participants.map(id=>byId[id].name).join(' × ')}</small><strong>{spoken?.title}</strong><p>{spoken?.line}</p><footer><span>{failed?t.fallback:t.note}</span><button onClick={dismiss}>{t.skip} ›</button></footer></div>
 </section>,document.body);
}
