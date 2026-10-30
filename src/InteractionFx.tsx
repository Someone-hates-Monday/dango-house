import type {Interaction} from './shared/motion';
import {profiles} from './shared/motion';
export function InteractionFx({file,interaction}:{file:string;interaction?:Interaction}){
  if(!interaction||Date.now()-interaction.startedAt>4200)return null;
  const profile=profiles[file]??profiles.kimi;
  return <span key={interaction.startedAt} className={`direct-interaction interaction-${interaction.kind}`} data-interaction={interaction.kind} style={{'--head-y':`${profile.headY*100}%`,'--reaction-accent':profile.accent} as React.CSSProperties}>
    {interaction.kind==='pat'?<><svg className="pat-hand" viewBox="0 0 84 62" aria-label="正在轻抚头顶"><path d="M12 41c-5-4-8-10-5-13 3-3 8 1 13 4V15c0-5 7-5 8 0V7c1-5 8-5 9 0v5c1-5 8-5 9 0v4c2-4 8-3 8 2v9c9-2 13 1 13 5 0 5-7 6-13 10-9 7-24 11-35 4Z" fill="#fff4e7" stroke="#bc9c9f" strokeWidth="2.5" strokeLinejoin="round"/><path d="M20 32v7m8-24v14m9-17v17m9-13v14" fill="none" stroke="#dcc0b8" strokeWidth="2" strokeLinecap="round"/></svg><span className="pat-touch-lines">﹏</span><span className="pat-heart">♥</span></>:interaction.kind==='feed'?<><span className="feed-dish">{({rice:'🍚',cake:'🍰',fish:'🐟',tea:'🍵'} as Record<string,string>)[interaction.food??'rice']}</span><span className="feed-utensil">{interaction.food==='tea'?'♨':'🥄'}</span><span className="feed-spark">✦</span></>:null}
  </span>;
}
