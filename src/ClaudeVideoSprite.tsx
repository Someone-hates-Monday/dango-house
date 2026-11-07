import {useEffect,useRef,useState} from 'react';
import type {Interaction} from './shared/motion';
import {claudeReactionClip,walkClipWindow,type ClaudeClip} from './shared/claude-animation';
import {claudeVideoTransform} from './shared/claude-display';
import type {Pose} from './shared/types';
import {InteractionFx} from './InteractionFx';

type ClipSource={src:string;bakedHand?:boolean;bakedFood?:boolean};
export type ClaudeAnimationPack=Partial<Record<ClaudeClip,ClipSource>>&{idle:ClipSource};

const isWalkClip=(c:ClaudeClip)=>c==='walk'||c==='walkOpposite';
/** walk.webm faces screen-left; walk-opposite faces screen-right. */
const walkFacesLeft=(c:ClaudeClip)=>c==='walk';

// Reactions play once then idle. Walk uses facing-matched clips; mirror only as fallback.
export function ClaudeVideoSprite({pack,pose='idle',cue=0,interaction,stoppedAt,className=''}:{pack:ClaudeAnimationPack;pose?:Pose;cue?:number;interaction?:Interaction;stoppedAt?:number;className?:string}){
  const video=useRef<HTMLVideoElement>(null),snapshot=useRef<HTMLCanvasElement>(null),surface=useRef<HTMLSpanElement>(null);
  const latest=useRef({interaction,stoppedAt,pose,cue});latest.current={interaction,stoppedAt,pose,cue};
  const [clip,setClip]=useState<ClaudeClip>('idle'),[failed,setFailed]=useState(false);
  useEffect(()=>{
    const v=video.current!,still=snapshot.current!,el=surface.current!;
    let current:ClaudeClip='idle',seen=0,pending:{clip:ClaudeClip;event:number}|undefined,activeEvent=0,lastStop=stoppedAt,paused=false,alive=true,raf=0,phase='idle',loading=false;
    const walkFor=(p:Pose):ClaudeClip=>{
      if(p==='walk-right')return pack.walkOpposite?'walkOpposite':pack.walk?'walk':'idle';
      if(p==='walk-left')return pack.walk?'walk':pack.walkOpposite?'walkOpposite':'idle';
      return 'idle';
    };
    const mirrorFor=(next:ClaudeClip,p:Pose)=>{
      if(!isWalkClip(next)||(p!=='walk-left'&&p!=='walk-right'))return false;
      return (p==='walk-left')!==walkFacesLeft(next);
    };
    const applyTransform=(next:ClaudeClip,p:Pose)=>{
      v.style.transform=claudeVideoTransform(next,mirrorFor(next,p))??'';
    };
    /** Travel loop vs one-shot library preview (play-clip keeps think pose). */
    const isTravelWalk=(next:ClaudeClip)=>{
      const p=latest.current.pose;
      return isWalkClip(next)&&(p==='walk-left'||p==='walk-right');
    };
    const load=(next:ClaudeClip,event=0,time=0)=>{
      if(next!=='idle'&&!pack[next]){next='idle';event=0;}
      const travel=isTravelWalk(next);
      const win=travel?walkClipWindow(next):undefined;
      if(win&&time===0)time=Math.max(0,win.loopStart-.15);
      if(v.readyState>=2){still.width=v.videoWidth;still.height=v.videoHeight;still.getContext('2d')?.drawImage(v,0,0);still.style.opacity='1';still.style.transform=v.style.transform;}
      current=next;activeEvent=event;loading=true;phase=travel?'walk-enter':next==='idle'?'idle':'gesture';
      v.loop=next==='idle';el.dataset.clip=next;el.dataset.event=String(event);setClip(next);
      applyTransform(next,latest.current.pose);
      v.src=pack[next]!.src;
      v.onloadeddata=()=>{if(!alive)return;v.currentTime=time;void v.play().catch(()=>{});};
      v.onseeked=()=>{loading=false;still.style.opacity='0';};
      v.onplaying=()=>{if(time===0){loading=false;still.style.opacity='0';}};
      v.load();
    };
    load('idle');
    const finish=()=>{if(!alive||paused)return;const next=pending;pending=undefined;load(next?.clip??'idle',next?.event);};
    v.addEventListener('ended',finish);
    const allowWalkGesture=()=>latest.current.interaction?.kind==='clip';
    const queueGesture=()=>{
      const p=latest.current;const event=p.interaction?.startedAt??p.cue;
      if(!event||event===seen)return;
      const next=claudeReactionClip(p.pose,p.interaction);
      if(next==='idle'||!pack[next])return;
      if(isWalkClip(next)&&!allowWalkGesture())return;
      seen=event;pending={clip:next,event};
    };
    const tick=()=>{
      if(!alive)return;raf=requestAnimationFrame(tick);const p=latest.current;
      if(p.stoppedAt&&p.stoppedAt!==lastStop){lastStop=p.stoppedAt;paused=true;pending=undefined;v.pause();el.dataset.motionPhase='paused';}
      const wantWalk=p.pose==='walk-left'||p.pose==='walk-right';
      const targetWalk=wantWalk?walkFor(p.pose):'idle';
      if(wantWalk&&targetWalk!=='idle'){
        paused=false;
        if(current!==targetWalk)load(targetWalk);
        else{
          applyTransform(current,p.pose);
          if(!loading){
            const win=walkClipWindow(current),time=v.currentTime;
            if(phase==='walk-enter'&&time>=win.enterEnd)phase='walk-loop';
            if(phase==='walk-loop'&&time>=win.loopEnd&&!v.seeking)v.currentTime=win.loopStart;
          }
        }
        el.dataset.motionPhase=phase;
        return;
      }
      if(isTravelWalk(current)){
        queueGesture();
        if(!loading){
          const win=walkClipWindow(current),time=v.currentTime;
          if(phase!=='walk-exit'){
            if(time>=win.exitStart||phase==='walk-enter'||time<win.loopStart+.2){
              const next=pending;pending=undefined;load(next?.clip??'idle',next?.event??0);el.dataset.motionPhase=phase;return;
            }
            phase='walk-exit';v.currentTime=win.exitStart;
          }else if(time>=win.exitEnd||v.ended){
            const next=pending;pending=undefined;load(next?.clip??'idle',next?.event??0);
          }
        }
        el.dataset.motionPhase=phase;
        return;
      }
      const event=p.interaction?.startedAt??p.cue;
      if(event&&event!==seen){
        seen=event;const next=claudeReactionClip(p.pose,p.interaction);
        if(next!=='idle'&&pack[next]&&(!isWalkClip(next)||allowWalkGesture())){
          paused=false;el.dataset.motionPhase='gesture';
          if(current==='idle'||v.ended||v.paused)load(next,event);
          else if(event!==activeEvent)pending={clip:next,event};
        }
      }
      if(!paused)el.dataset.motionPhase=current==='idle'?'idle':'gesture';
    };
    raf=requestAnimationFrame(tick);
    return()=>{alive=false;cancelAnimationFrame(raf);v.removeEventListener('ended',finish);v.onplaying=null;v.onloadeddata=null;v.onseeked=null;v.pause();v.removeAttribute('src');v.load();};
  },[pack]);
  if(failed)return <img className={`sprite ${className}`} src="./community/claude/idle.webp" alt="Claude"/>;
  const baked=(interaction?.kind==='pat'&&clip==='pat'&&pack.pat?.bakedHand)||(interaction?.kind==='feed'&&clip==='rice'&&pack.rice?.bakedFood);
  return <span ref={surface} role="img" aria-label={`Claude · ${pose}`} className={`sprite atlas video-sprite claude-video-sprite ${className}`} data-cue={cue} data-clip={clip}>
    <video ref={video} muted playsInline preload="auto" onError={()=>setFailed(true)}/><canvas ref={snapshot} className="video-snapshot"/>
    {!baked&&<InteractionFx file="claude" interaction={interaction}/>}
  </span>;
}
