import {useDwellGreeting} from './useDwellGreeting';
import {useEffect,useState} from 'react';
import type {Character,Embodiment,RoomResident} from './shared/types';
import {houseScale,projectHouse,type HouseGeometry} from './shared/house-navigation';
import {residentPosition} from './shared/world';
import {Sprite,EmotionFx} from './Sprite';

export function HouseResident({character,body,resident,geometry,skin,selected,frozen,onSelect,onHover}:{character:Character;body:Embodiment;resident:RoomResident;geometry:HouseGeometry;skin:'animated'|'chibi';selected:boolean;frozen:boolean;onSelect:()=>void;onHover:()=>void}){
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{let frame=0;const tick=()=>{const t=Date.now();setNow(t);if(!frozen&&t<resident.arrivesAt)frame=requestAnimationFrame(tick);};tick();return()=>cancelAnimationFrame(frame);},[resident.startedAt,resident.arrivesAt,resident.x,resident.y,frozen]);
 const p=projectHouse(residentPosition(resident,now),geometry),next=projectHouse(residentPosition(resident,now+30),geometry);
 const moving=!frozen&&resident.arrivesAt>now&&resident.startedAt<=now;
 const attention=useDwellGreeting(!frozen&&!moving,onHover);
 const nativeWalk=character.file==='deepseek'||character.file==='claude';
 const pose=moving?(nativeWalk?(next.x>=p.x?'walk-right':'walk-left'):'idle'):(body.pose.startsWith('walk')?'idle':body.pose);
 return <button className={`house-resident ${selected?'selected':''}`} data-character={character.id} data-moving={moving} data-attention={attention.noticed?'noticed':undefined} style={{left:p.x,top:p.y,zIndex:Math.round(p.y),transform:`translate(-50%,-100%) scale(${houseScale(geometry)})`}} onClick={onSelect} onPointerEnter={attention.enter} onPointerLeave={attention.leave} onPointerDown={attention.cancel} title={character.name} aria-label={character.name}>
  <span className={`house-resident-art ${moving&&!nativeWalk?'house-walk-soft':''}`}><Sprite character={character} skin={skin} pose={pose} cue={body.until} activity={moving?'':body.bubble} interaction={moving?undefined:body.interaction} stoppedAt={body.stoppedAt} frozen={frozen}/><EmotionFx emotion={body.emotion}/></span><span className="house-resident-name">{character.name}</span>
 </button>;
}
