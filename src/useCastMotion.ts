import {useRef} from 'react';
import {separateCast,coveredFraction,type CastBox,type CastBounds} from './shared/spacing';
// Collision-safe destinations are approached at bounded speed. A crowded target
// cannot teleport a neighbour to the other side of the room on every tick.
export function useCastMotion(desired:CastBox[],bounds:CastBounds,now:number,dragging=false){
  const ref=useRef<{at:number;signature:string;positions:Record<string,CastBox>}|null>(null);
  const signature=`${Object.values(bounds).join(',')}:${desired.map(p=>p.id).join(',')}`;
  const goals=separateCast(desired,bounds),old=ref.current;
  if(!old||old.signature!==signature||dragging){ref.current={at:now,signature,positions:goals};return goals;}
  const positions={...old.positions};const step=Math.min(100,Math.max(0,now-old.at))*.075;
  for(const target of Object.values(goals)){
    const from=positions[target.id];if(!from)continue;
    const dx=target.x-from.x,dy=target.y-from.y,d=Math.hypot(dx,dy);if(d<.05)continue;
    const limit=Math.min(step,d),angle=Math.atan2(dy,dx);
    for(const offset of [0,.5,-.5,1,-1,1.5,-1.5]){
      const candidate={...target,x:Math.max(bounds.left,Math.min(bounds.right,from.x+Math.cos(angle+offset)*limit)),y:Math.max(bounds.top,Math.min(bounds.bottom,from.y+Math.sin(angle+offset)*limit))};
      if(Math.hypot(target.x-candidate.x,target.y-candidate.y)>d+.01)continue;
      const all=Object.values(positions).map(p=>p.id===target.id?candidate:p);
      if(all.every(p=>coveredFraction(p,all.filter(q=>q.id!==p.id))<=.5+1e-9)){positions[target.id]=candidate;break;}
    }
  }
  ref.current={at:now,signature,positions};return positions;
}
