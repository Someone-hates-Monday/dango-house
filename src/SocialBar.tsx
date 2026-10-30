import {useState} from 'react';
import {byId} from './shared/characters';
import {socialProfiles,socialScenes,relationshipKey} from './shared/social';
import type {AppState} from './shared/types';
export function SocialBar({state}:{state:AppState}){
  const[scene,setScene]=useState('bookmark');const p=socialProfiles[state.selected];const story=socialScenes.find(s=>s.id===scene)!;
  return <section className="social-bar"><div><strong>{byId[state.selected].name} → {byId[p.target].name} <span>熟悉度 {state.bonds[relationshipKey(state.selected,p.target)]??0}</span></strong><p>{p.feeling}</p><small>{p.origin}</small></div><div><label htmlFor="social-scene">她们自己的小日常</label><select id="social-scene" value={scene} onChange={e=>setScene(e.target.value)}>{socialScenes.map(s=><option value={s.id} key={s.id}>{s.title} · {s.cast.map(id=>byId[id].name).join(' / ')}</option>)}</select><button onClick={()=>void window.garden.dispatch({type:'social-scene',id:scene})}>▶ 看这段互动</button><small>{story.origin} · 应用与桌面同步</small></div></section>;
}
