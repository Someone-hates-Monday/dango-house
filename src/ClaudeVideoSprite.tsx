import {useEffect,useRef,useState} from 'react';
import type {Interaction} from './shared/motion';
import {claudeInteractionClip,claudePoseClip,type ClaudeClip} from './shared/claude-animation';
import type {Pose} from './shared/types';
import {InteractionFx} from './InteractionFx';
type ClipSource={src:string;bakedHand?:boolean;bakedFood?:boolean};
export type ClaudeAnimationPack=Partial<Record<ClaudeClip,ClipSource>>&{idle:ClipSource};
// A reaction completes once before returning to idle; a fresh click is queued,
// never used to restart the current video on every engine publish.
export function ClaudeVideoSprite({pack,pose='idle',cue=0,interaction,stoppedAt,className=''}:{pack:ClaudeAnimationPack;pose?:Pose;cue?:number;interaction?:Interaction;stoppedAt?:number;className?:string}){
  const video=useRef<HTMLVideoElement>(null),snapshot=useRef<HTMLCanvasElement>(null),surface=useRef<HTMLSpanElement>(null);
  const latest=useRef({interaction,stoppedAt,pose,cue});latest.current={interaction,stoppedAt,pose,cue};
  const [clip,setClip]=useState<ClaudeClip>('idle'),[failed,setFailed]=useState(false);
  useEffect(()=>{
    const v=video.current!,still=snapshot.current!,el=surface.current!;
    let current:ClaudeClip='idle',seen=0,pending:{clip:ClaudeClip;event:number}|undefined,activeEvent=0,lastStop=stoppedAt,paused=false,alive=true,raf=0;
    const load=(next:ClaudeClip,event=0)=>{
      if(v.readyState>=2){still.width=v.videoWidth;still.height=v.videoHeight;still.getContext('2d')?.drawImage(v,0,0);still.style.opacity='1';}
      current=next;activeEvent=event;v.loop=next==='idle';el.dataset.clip=next;el.dataset.event=String(event);setClip(next);
      v.src=pack[next]!.src;v.onplaying=()=>{still.style.opacity='0';};v.load();void v.play().catch(()=>{});
    };
    load('idle');
    const finish=()=>{if(!alive||paused)return;const next=pending;pending=undefined;load(next?.clip??'idle',next?.event);};
    v.addEventListener('ended',finish);
    const tick=()=>{
      if(!alive)return;raf=requestAnimationFrame(tick);const p=latest.current;
      if(p.stoppedAt&&p.stoppedAt!==lastStop){lastStop=p.stoppedAt;paused=true;pending=undefined;v.pause();el.dataset.motionPhase='paused';}
      const event=p.interaction?.startedAt??p.cue;
      if(event&&event!==seen){
        seen=event;const next=p.interaction?claudeInteractionClip(p.interaction):claudePoseClip(p.pose);
        if(next!=='idle'&&pack[next]){
          paused=false;el.dataset.motionPhase='gesture';
          if(current==='idle'||v.ended||v.paused)load(next,event);
          else if(event!==activeEvent)pending={clip:next,event};
        }
      }
      if(!paused)el.dataset.motionPhase=current==='idle'?'idle':'gesture';
    };
    raf=requestAnimationFrame(tick);
    return()=>{alive=false;cancelAnimationFrame(raf);v.removeEventListener('ended',finish);v.onplaying=null;v.pause();v.removeAttribute('src');v.load();};
  },[pack]);
  if(failed)return <img className={`sprite ${className}`} src="./community/claude/idle.webp" alt="Claude"/>;
  const baked=(interaction?.kind==='pat'&&clip==='pat'&&pack.pat?.bakedHand)||(interaction?.kind==='feed'&&clip==='rice'&&pack.rice?.bakedFood);
  return <span ref={surface} role="img" aria-label={`Claude · ${pose}`} className={`sprite atlas video-sprite claude-video-sprite ${className}`} data-cue={cue}>
    <video ref={video} muted playsInline preload="auto" onError={()=>setFailed(true)}/><canvas ref={snapshot} className="video-snapshot"/>
    {!baked&&<InteractionFx file="claude" interaction={interaction}/>}
  </span>;
}
