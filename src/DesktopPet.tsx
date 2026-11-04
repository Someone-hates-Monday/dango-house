import {CompanionInteractions} from './CompanionInteractions';
import {useEffect,useRef,useState,useMemo} from 'react';
import {MessageCircle,Heart,Hand} from 'lucide-react';
import type {AppState,Character,CharacterId,RoomPoint} from './shared/types';
import {characters} from './shared/characters';
import {useCastMotion} from './useCastMotion';
import {Sprite,EmotionFx} from './Sprite';
import {DockCast} from './DockCast';
import {useActualPose} from './useActualPose';
import {useNow} from './Room';

function FreeCast({state,displayId,primary}:{state:AppState;displayId:number;primary:boolean}){
  const now=useNow();const[size,setSize]=useState({w:innerWidth,h:innerHeight});
  const[draft,setDraft]=useState<{id:CharacterId;point:RoomPoint}|null>(null);
  useEffect(()=>{const resize=()=>setSize({w:innerWidth,h:innerHeight});addEventListener('resize',resize);return()=>removeEventListener('resize',resize);},[]);
  const cast=characters.filter(c=>state.pets[c.id]?state.pets[c.id]!.displayId===displayId:primary);
  const availableW=Math.max(1,size.w-160),availableH=Math.max(1,size.h-210);
  const boxes=cast.map((c,i)=>{
    const base=state.pets[c.id]??{x:.08+i*.13,y:.96};const movement=state.desktopMoves[c.id];
    const t=movement?Math.max(0,Math.min(1,(now-movement.startedAt)/(movement.arrivesAt-movement.startedAt))):1;
    const p=draft?.id===c.id?draft.point:movement?{x:movement.from.x+(movement.to.x-movement.from.x)*t,y:movement.from.y+(movement.to.y-movement.from.y)*t}:base;
    return{id:c.id,x:p.x*availableW+80,y:p.y*availableH+180,width:140,height:166};
  });
  const ordered=draft?[...boxes.filter(b=>b.id!==draft.id),...boxes.filter(b=>b.id===draft.id)]:boxes;
  const positions=useCastMotion(ordered,{left:80,right:size.w-80,top:180,bottom:size.h-30},now,!!draft);
  return <>{cast.map(c=>{const p=positions[c.id];return <DesktopPet key={c.id} character={c} state={state} displayId={displayId} now={now} size={size} position={{x:(p.x-80)/availableW,y:(p.y-180)/availableH}} onDrag={point=>setDraft(point?{id:c.id,point}:null)}/>;})}</>;
}

function DesktopPet({character,state,displayId,now,size,position:p,onDrag}:{character:Character;state:AppState;displayId:number;now:number;size:{w:number;h:number};position:RoomPoint;onDrag:(point:RoomPoint|null)=>void}){
  const[dragging,setDragging]=useState(false);
  const drag=useRef<{x:number;y:number;from:RoomPoint;moved:boolean}|null>(null);
  const hover=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>()=>clearTimeout(hover.current),[]);
  const movement=state.desktopMoves[character.id];const body=state.bodies[character.id];const active=body.until>now;
  const resolvedPose=useActualPose(body.pose,p.x*(size.w-160),p.y*(size.h-210),now);const pose=dragging?'wait':resolvedPose;
  const latest=[...state.messages].reverse().find(m=>m.speaker===character.id&&m.text);
  const bubble=active&&body.bubble?body.bubble:latest&&now-latest.at<7000?latest.text:'';
  return <div className={`desktop-pet ${dragging?'dragging':''}`} data-character={character.id} style={{left:p.x*Math.max(1,size.w-160),top:p.y*Math.max(1,size.h-210)}} onPointerEnter={()=>{clearTimeout(hover.current);hover.current=setTimeout(()=>void window.garden.dispatch({type:'hover',id:character.id}),450);}} onPointerLeave={()=>clearTimeout(hover.current)}>
    {bubble&&!state.settings.dnd&&<div className="pet-bubble">{bubble.slice(0,66)}{bubble.length>66?'…':''}</div>}
    <div className="pet-tools"><CompanionInteractions id={character.id} state={state} compact/><button title={`和${character.name}私聊`} onClick={()=>window.garden.openPrivate(character.id)}><MessageCircle size={14}/></button><button title="摸摸头" onClick={()=>void window.garden.dispatch({type:'pat',id:character.id})}><Hand size={14}/></button><button title="投喂大米饭" onClick={()=>void window.garden.dispatch({type:'feed',id:character.id,food:'rice'})}>🍚</button><button title="打招呼" onClick={()=>void window.garden.dispatch({type:'perform',id:character.id,intent:{action:'wave',emotion:'happy'}})}><Heart size={14}/></button></div>
    <div className="pet-body" title="点头部摸摸 · 点身体私聊 · 按住拖动" onPointerDown={e=>{
      if(e.button!==0)return;clearTimeout(hover.current);e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,from:p,moved:false};setDragging(true);
    }} onPointerMove={e=>{
      if(!drag.current)return;const d=drag.current;if(Math.abs(e.clientX-d.x)+Math.abs(e.clientY-d.y)>6)d.moved=true;
      onDrag({x:Math.max(0,Math.min(1,d.from.x+(e.clientX-d.x)/Math.max(1,size.w-160))),y:Math.max(0,Math.min(1,d.from.y+(e.clientY-d.y)/Math.max(1,size.h-210)))});
    }} onPointerUp={e=>{
      const d=drag.current;if(!d)return;const rect=e.currentTarget.getBoundingClientRect();const head=(e.clientY-rect.y)/rect.height<.37;
      drag.current=null;setDragging(false);e.currentTarget.releasePointerCapture(e.pointerId);
      if(d.moved)void window.garden.dispatch({type:'move',id:character.id,...p,displayId}).finally(()=>onDrag(null));
      else{onDrag(null);if(head)void window.garden.dispatch({type:'pat',id:character.id});else window.garden.openPrivate(character.id);}
    }} onPointerCancel={()=>{drag.current=null;setDragging(false);onDrag(null);}}><Sprite character={character} skin={state.skins[character.id]} pose={pose} cue={body.until} activity={body.bubble} interaction={body.interaction} stoppedAt={body.stoppedAt} frozen={state.settings.dnd}/><EmotionFx emotion={active?body.emotion:'neutral'}/></div>
    <div className="pet-name">{character.name}<span>{active?body.label:'点头摸摸 · 点身体私聊'}</span></div>
  </div>;
}

export function DesktopCast(props:{state:AppState;displayId:number;primary:boolean}){return props.state.presentation.desktopMode==='dock'?<DockCast {...props}/>:<FreeCast {...props}/>;}
