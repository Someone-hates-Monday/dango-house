import {useRef} from 'react';
import type {Pose} from './shared/types';
import {actualPose} from './shared/motion';
// Read the resolved screen position, after collision avoidance, rather than the requested destination.
export function useActualPose(requested:Pose,x:number,y:number,now:number){
  const last=useRef({x,y,at:now,walkingUntil:0,direction:'walk-right' as Pose});
  const p=last.current;
  if(now!==p.at){const resolved=actualPose(requested,x-p.x,y-p.y,now-p.at);
    if(resolved.startsWith('walk')){p.walkingUntil=now+130;p.direction=resolved;}
    p.x=x;p.y=y;p.at=now;
  }
  return p.walkingUntil>now?p.direction:requested.startsWith('walk')?'idle':requested;
}
