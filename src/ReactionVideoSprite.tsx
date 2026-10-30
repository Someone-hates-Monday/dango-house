import {useEffect,useRef,useState,type ReactNode} from 'react';
import type {Interaction} from './shared/motion';
import type {Pose} from './shared/types';
import {InteractionFx} from './InteractionFx';
// Idle loops and complete one-shot reactions share a surface. Unavailable actions use the rig.
export function ReactionVideoSprite({src,idleSrc,file,pose='idle',cue=0,interaction,stoppedAt,frozen=false,onPlayingChange,children}:{src?:string;idleSrc?:string;file:string;pose?:Pose;cue?:number;interaction?:Interaction;stoppedAt?:number;frozen?:boolean;onPlayingChange?:(playing:boolean)=>void;children:ReactNode}){
  const video=useRef<HTMLVideoElement>(null),idleVideo=useRef<HTMLVideoElement>(null),surface=useRef<HTMLSpanElement>(null);
  const latest=useRef({interaction,stoppedAt,onPlayingChange,pose,cue,frozen});latest.current={interaction,stoppedAt,onPlayingChange,pose,cue,frozen};
  const [active,setActive]=useState<Interaction>();
  useEffect(()=>{
    const v=video.current!,idle=idleVideo.current!,el=surface.current!;
    let seen=0,lastStop=stoppedAt,lastCue=cue,pending:Interaction|undefined,playing=false,alive=true,raf=0,paused=frozen,lastFrozen=frozen;
    let mode='',completedCue:number|undefined,idleFailed=false,reactionFailed=false;
    const show=(next:string)=>{
      const changed=mode!==next;el.dataset.clip=next;el.dataset.motionPhase=paused?'paused':next==='pat'?'gesture':next;
      if(!changed)return;mode=next;
      if(next==='idle'){v.pause();if(!paused)void idle.play().catch(()=>{});}
      else if(next==='fallback'){idle.pause();v.pause();}
      else if(next==='pat')idle.pause();
    };
    const start=(event:Interaction)=>{
      playing=true;paused=false;latest.current.onPlayingChange?.(true);el.dataset.motionPhase='loading';
      setActive({...event,startedAt:Date.now()});v.currentTime=0;void v.play().catch(fail);
    };
    const fail=()=>{if(!alive)return;reactionFailed=true;playing=false;pending=undefined;latest.current.onPlayingChange?.(false);setActive(undefined);el.dataset.error='reaction-playback';show('fallback');};
    const idleFail=()=>{idleFailed=true;el.dataset.error='idle-playback';if(mode==='idle')show('fallback');};
    const reveal=()=>{if(alive&&playing)show('pat');};
    const finish=()=>{if(!alive)return;const next=pending;pending=undefined;if(next)start(next);else{playing=false;completedCue=latest.current.cue;latest.current.onPlayingChange?.(false);setActive(undefined);}};
    v.addEventListener('playing',reveal);v.addEventListener('ended',finish);v.addEventListener('error',fail);idle.addEventListener('error',idleFail);
    const tick=()=>{
      if(!alive)return;raf=requestAnimationFrame(tick);const p=latest.current;
      if(p.frozen!==lastFrozen){lastFrozen=p.frozen;paused=p.frozen;if(paused){pending=undefined;v.pause();idle.pause();el.dataset.motionPhase='paused';}else if(playing)void v.play().catch(fail);else if(mode==='idle')void idle.play().catch(()=>{});}
      if(p.stoppedAt&&p.stoppedAt!==lastStop){lastStop=p.stoppedAt;pending=undefined;if(playing){paused=true;v.pause();el.dataset.motionPhase='paused';}else if(p.frozen){paused=true;idle.pause();}}
      if(p.cue!==lastCue){lastCue=p.cue;if(!p.stoppedAt){paused=false;if(mode==='idle')void idle.play().catch(()=>{});}}
      const event=p.interaction,age=event?Date.now()-event.startedAt:Infinity;
      if(event&&event.startedAt!==seen){seen=event.startedAt;if(event.kind==='pat'&&src&&!reactionFailed&&age>=0&&age<=4200){if(!playing||v.paused||v.ended)start(event);else pending=event;}}
      if(playing)return;
      const fresh=event&&age>=0&&age<=4200,idleWanted=(p.pose==='idle'&&!fresh)||(p.cue===completedCue&&(!fresh||event.kind==='pat'));
      show(idleSrc&&!idleFailed&&idle.readyState>=2&&idleWanted?'idle':'fallback');
    };
    raf=requestAnimationFrame(tick);
    return()=>{alive=false;cancelAnimationFrame(raf);v.removeEventListener('playing',reveal);v.removeEventListener('ended',finish);v.removeEventListener('error',fail);idle.removeEventListener('error',idleFail);v.pause();idle.pause();latest.current.onPlayingChange?.(false);};
  },[src,idleSrc]);
  return <span ref={surface} className="reaction-video-sprite" data-clip="fallback" data-motion-phase="fallback">
    <span className="reaction-fallback">{children}</span>
    <video ref={video} className="reaction-video" src={src} muted playsInline preload="auto"/>
    <video ref={idleVideo} className="cast-idle-video" src={idleSrc} muted playsInline preload="auto" loop/>
    <InteractionFx file={file} interaction={active??interaction}/>
  </span>;
}
