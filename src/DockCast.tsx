import {CompanionInteractions} from './CompanionInteractions';
import {useRef,useState,useEffect} from 'react';
import {Hand,MessageCircle,Heart} from 'lucide-react';
import type {AppState,Character} from './shared/types';
import {characters} from './shared/characters';
import {dockPosition} from './shared/motion';
import {Sprite,EmotionFx} from './Sprite';
import {useNow} from './Room';

export function DockCast({state,displayId,primary}:{state:AppState;displayId:number;primary:boolean}){
  const now=useNow();const[size,setSize]=useState({w:innerWidth,h:innerHeight});
  useEffect(()=>{const resize=()=>setSize({w:innerWidth,h:innerHeight});addEventListener('resize',resize);return()=>removeEventListener('resize',resize);},[]);
  const cast=characters.filter(c=>state.pets[c.id]?state.pets[c.id]!.displayId===displayId:primary);
  return <div className="dock-cast" data-mode="dock">{cast.map((c,index)=><DockPet key={c.id} character={c} state={state} now={now} index={index} count={cast.length} size={size}/>)}</div>;
}
function DockPet({character:c,state,now,index,count,size}:{character:Character;state:AppState;now:number;index:number;count:number;size:{w:number;h:number}}){
  const[awake,setAwake]=useState(false);const[reactionPlaying,setReactionPlaying]=useState(false);const leave=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const playback=useRef({cue:0,until:0});
  useEffect(()=>()=>clearTimeout(leave.current),[]);
  const p=dockPosition(index,count,size.w,size.h);
  const body=state.bodies[c.id],active=body.until>now;
  const touched=body.interaction&&now-body.interaction.startedAt<4300;
  const pose=body.pose.startsWith('walk')?state.room.residents[c.id].after:body.pose;
  const stationaryPose=pose.startsWith('walk')?'idle':pose;
  if(active&&body.until!==playback.current.cue){playback.current={cue:body.until,until:stationaryPose==='idle'?0:Math.max(body.until,now+(c.file==='deepseek'&&state.skins[c.id]==='animated'?10500:0))};}
  if(body.stoppedAt)playback.current.until=0;
  const up=awake||reactionPlaying||!!touched||now<playback.current.until;
  const x=p.x;const width=Math.min(108,p.cell-8);
  return <div className={`desktop-pet dock-pet ${up?'awake':'resting'}`} data-character={c.id} data-awake={up} style={{left:x-width/2,top:size.h-145,width,height:145}} onPointerEnter={()=>{clearTimeout(leave.current);setAwake(true);void window.garden.dispatch({type:'hover',id:c.id});}} onPointerLeave={()=>{leave.current=setTimeout(()=>setAwake(false),1500);}}>
    {active&&body.bubble&&!state.settings.dnd&&<div className="pet-bubble">{body.bubble.slice(0,62)}</div>}
    <div className="pet-tools"><CompanionInteractions id={c.id} state={state} compact/><button title={`和${c.name}私聊`} onClick={()=>window.garden.openPrivate(c.id)}><MessageCircle size={14}/></button><button title="摸摸头" onClick={()=>void window.garden.dispatch({type:'pat',id:c.id})}><Hand size={14}/></button><button title="投喂大米饭" onClick={()=>void window.garden.dispatch({type:'feed',id:c.id,food:'rice'})}>🍚</button><button title="打招呼" onClick={()=>void window.garden.dispatch({type:'perform',id:c.id,intent:{action:'wave',emotion:'happy'}})}><Heart size={14}/></button><button title="切回自由桌宠" onClick={()=>void window.garden.dispatch({type:'presentation',patch:{desktopMode:'free'}})}>↗</button></div>
    <div className="pet-body" title={`${c.name} · 点头摸摸，点身体私聊`} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();if((e.clientY-r.top)/r.height<.42)void window.garden.dispatch({type:'pat',id:c.id});else window.garden.openPrivate(c.id);}}><Sprite character={c} skin={state.skins[c.id]} pose={stationaryPose} cue={body.until} activity={body.bubble} interaction={body.interaction} stoppedAt={body.stoppedAt} frozen={state.settings.dnd} perch={up?0:1} onReactionPlaying={setReactionPlaying}/><EmotionFx emotion={active?body.emotion:'neutral'}/></div>
    <span className="dock-name">{c.name}</span>
  </div>;
}
