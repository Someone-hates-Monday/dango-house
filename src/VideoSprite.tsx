import {useEffect,useRef,useState} from 'react';
import type {Pose} from './shared/types';
import {walkClip,tripSample,type Interaction} from './shared/motion';
import {InteractionFx} from './InteractionFx';
import {chooseDeepseekClip,clipByTitle} from './shared/deepseek-animation';
const sleepStart=clipByTitle('睡觉-开始')!.id,sleepLoop=clipByTitle('睡觉-循环')!.id,sleepEnd=clipByTitle('睡觉-起来')!.id;
export function VideoSprite({pose,cue,activity='',className='',frame=0,row=0,interaction,stoppedAt,frozen=false,onReactionPlaying}:{pose:Pose;cue:number;activity?:string;className?:string;frame?:number;row?:number;interaction?:Interaction;stoppedAt?:number;frozen?:boolean;onReactionPlaying?:(playing:boolean)=>void}){
  const ref=useRef<HTMLVideoElement>(null),snapshot=useRef<HTMLCanvasElement>(null),surface=useRef<HTMLSpanElement>(null);const[failed,setFailed]=useState(false);
  const freeze=useRef(frozen);freeze.current=frozen;const playing=useRef(onReactionPlaying);playing.current=onReactionPlaying;
  const desired=useRef({pose,cue,activity,interaction,stoppedAt});desired.current={pose,cue,activity,interaction,stoppedAt};
  useEffect(()=>{
    const video=ref.current!,element=surface.current!,still=snapshot.current!;let alive=true,raf=0,current='idle',phase='idle',lastCue=cue,lastStop=stoppedAt,pending:string|null=null,tripId=0,completedCue=-1,loading=false,activeCue=0,sleepUntil=0;
    let pendingCue=0;
    const clipFor=()=>{const p=desired.current;if(p.cue===completedCue)return 'idle';return chooseDeepseekClip(p.pose,p.cue,p.interaction);};
    const load=(clip:string,time=clip==='walk'?1.75:0)=>{
      if(video.readyState>=2){still.width=640;still.height=360;still.getContext('2d')!.drawImage(video,0,0,640,360);still.style.height=current==='walk'?'83%':'100%';still.style.top=current==='walk'?'8.5%':'0';still.style.transform=video.style.transform;still.style.transition='none';still.style.opacity='1';}
      activeCue=pendingCue||desired.current.cue;pendingCue=0;playing.current?.(clip!=='idle');if(clip===sleepLoop)sleepUntil=Date.now()+12000;
      current=clip;loading=true;phase=clip==='walk'?'walk-enter':clip==='idle'?'idle':'gesture';video.src=`./video/deepseek/${clip}.webm`;video.loop=clip==='idle'||clip===sleepLoop;video.onloadeddata=()=>{if(!alive)return;video.currentTime=time;void video.play().catch(()=>{});};video.onseeked=()=>{loading=false;still.style.transition='opacity .28s ease';still.style.opacity='0';};video.onplaying=()=>{if(time===0){loading=false;still.style.transition='opacity .28s ease';still.style.opacity='0';}};video.load();element.dataset.clip=clip;
    };
    load('idle');
    const tick=()=>{
      if(!alive)return;raf=requestAnimationFrame(tick);const p=desired.current;const target=clipFor();
      if(freeze.current){video.pause();element.dataset.motionPhase='frozen';return;}
      if(video.paused&&phase!=='paused'&&!video.ended&&loading===false)void video.play().catch(()=>{});
      if(p.stoppedAt&&p.stoppedAt!==lastStop){lastStop=p.stoppedAt;pending=null;load('idle');}
      if(p.cue!==lastCue&&p.cue!==0){lastCue=p.cue;if(phase==='paused')load(target);else if(target!=='idle'){pending=target;pendingCue=p.cue;}}
      const trip=p.interaction?.kind==='trip'&&Date.now()-p.interaction.startedAt<7300?p.interaction:undefined;
      if(trip){if(tripId!==trip.startedAt){tripId=trip.startedAt;load('walk',4.45);}const sample=tripSample((Date.now()-trip.startedAt)/1000);phase=`trip-${sample.phase}`;video.pause();if(video.readyState>=2&&!video.seeking&&Math.abs(video.currentTime-sample.time)>.035)video.currentTime=sample.time;element.dataset.motionPhase=phase;return;}
      if(tripId){tripId=0;pending=target;load('idle');}
      if(phase==='paused'||loading){element.dataset.motionPhase=phase;return;}
      const time=video.currentTime;
      if(current===sleepLoop){if(pending||Date.now()>=sleepUntil){load(sleepEnd);}return;}
      if(current==='walk'){
        if(phase==='walk-enter'&&time>=walkClip.enterEnd)phase='walk-loop';
        if(phase==='walk-loop'){
          if(target!=='walk'&&time>=walkClip.loopStart+.5){phase='walk-exit';video.currentTime=walkClip.exitStart;}
          else if(time>=walkClip.loopEnd&&!video.seeking)video.currentTime=walkClip.loopStart;
        }
        if(phase==='walk-exit'&&time>=walkClip.exitEnd){const next=pending&&pending!=='walk'?pending:target;pending=null;load(next==='walk'?'idle':next);}
      }else if(current==='idle'){
        const next=pending??target;if(next!=='idle'){pending=null;load(next);}
      }else if(video.ended||video.duration&&time>=video.duration-.08){if(current===sleepStart){sleepUntil=Date.now()+12000;load(sleepLoop);}else{completedCue=activeCue;const next=pending??'idle';pending=null;load(next);}}
      element.dataset.motionPhase=phase;
    };
    raf=requestAnimationFrame(tick);return()=>{alive=false;cancelAnimationFrame(raf);playing.current?.(false);video.pause();video.removeAttribute('src');video.load();};
  },[]);
  if(failed)return <img className={`sprite ${className}`} src="./community/deepseek/idle.webp" alt="DeepSeek"/>;
  return <span ref={surface} role="img" aria-label={`DeepSeek · ${pose}`} className={`sprite atlas video-sprite ${className}`} data-frame={frame} data-row={row}><video ref={ref} muted playsInline preload="auto" onError={()=>setFailed(true)} style={{transform:pose==='walk-right'?'scaleX(-1)':undefined}}/><canvas ref={snapshot} className="video-snapshot"/><InteractionFx file="deepseek" interaction={interaction}/></span>;
}
