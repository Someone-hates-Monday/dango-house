import {useRef,useState} from 'react';
import type {AppState,CharacterId} from './shared/types';
import {deepseekClips} from './shared/deepseek-clips';
import {characters} from './shared/characters';
import {translate} from './shared/i18n';
const groups=[['all','全部 / All / 全て'],['emotion','情绪 / Reactions'],['food','吃吃喝喝 / Food'],['play','娱乐 / Play'],['work','工作 / Work'],['rest','休息 / Rest'],['seasonal','节日 / Seasonal']];
export function CompanionInteractions({id,state,compact=false}:{id:CharacterId;state:AppState;compact?:boolean}){
 const [group,setGroup]=useState('all');const [pos,setPos]=useState({left:8,top:8});const details=useRef<HTMLDetailsElement>(null);
 const t=(key:string)=>translate(state.settings.locale,key);
 const send=(action:Parameters<typeof window.garden.dispatch>[0])=>void window.garden.dispatch(action);
 return <details ref={details} className={`companion-interactions ${compact?'compact':''}`} onToggle={()=>{if(details.current?.open&&compact){const r=details.current.getBoundingClientRect();setPos({left:Math.max(8,Math.min(innerWidth-308,r.left-110)),top:Math.max(8,r.top-322)});}}}>
  <summary title="更多互动 / More interactions" aria-label="更多互动 / More interactions">{compact?'⋯':'更多互动 / More interactions'}</summary>
  <div className="companion-panel" style={compact?{position:'fixed',...pos}:undefined} onPointerDown={e=>e.stopPropagation()}>
   <button className="interaction-close" onClick={()=>{if(details.current)details.current.open=false;}}>关闭 / Close ×</button>
   <div className="companion-common">
    <button onClick={()=>send({type:'praise',id})}>♥ {t('room.affection')}</button>
    <button onClick={()=>send({type:'pat',id})}>{t('room.pat')}</button>
    {(['rice','cake','fish','tea'] as const).map(food=><button key={food} onClick={()=>send({type:'feed',id,food})}>{t('food.'+food)}</button>)}
    {['wave','jump','shy','sad','walk','read','sit','water'].map(action=><button key={action} onClick={()=>send({type:'perform',id,intent:{action}})}>{t('action.'+action)}</button>)}
    <button onClick={()=>send({type:'perform',id,intent:{action:'sleep'}})}>休息 / Rest</button>
    {id==='xia'&&<button onClick={()=>send({type:'trip',id})}>{t('action.trip')}</button>}
   </div>
   <details><summary>邀请伙伴 / Invite companion</summary><div className="companion-common">{characters.filter(c=>c.id!==id).map(c=><button key={c.id} onClick={()=>send({type:'companion-visit',id,target:c.id})}>{c.name}</button>)}</div></details>
   {id==='xia'&&<><button onClick={()=>send({type:'play-clip',id,group:group==='all'?undefined:group})}>随机表演 / Random</button><div className="clip-groups">{groups.map(([value,label])=><button key={value} aria-pressed={value===group} onClick={()=>setGroup(value)}>{label}</button>)}</div>
   <div className="clip-library">{deepseekClips.filter(c=>group==='all'||c.group===group).map(c=><button key={c.id} data-clip-choice={c.id} title={`${c.title} · ${c.seconds}s`} onClick={()=>send({type:'play-clip',id,clipId:c.id})}>{c.title}<small>{c.seconds.toFixed(1)}s</small></button>)}</div></>}
  </div>
 </details>;
}
