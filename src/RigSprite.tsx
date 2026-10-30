import {useEffect,useRef} from 'react';
import type {Pose} from './shared/types';
import {animationFrames,type AtlasFrame} from './shared/animation';
import {profiles,interactionEnvelope,smooth,type Interaction} from './shared/motion';
const textures=new Map<string,Promise<HTMLCanvasElement>>();
// Preserve the 216×240 foot/pose coordinates while giving transforms paint room.
const paintPadding=48;
const resting:Record<string,AtlasFrame>={deepseek:{row:5,column:2},gpt:{row:5,column:6},gemini:{row:5,column:3},kimi:{row:5,column:4}};
// Measured contact lines in the source cells, including the 16px texture inset.
// Atlas cells have different transparent bottom padding; their cell edge is not ground.
const restContact:Record<string,number>={deepseek:202,gpt:177,gemini:174,kimi:181};
const generatedRest:Record<string,{bottom:number;bodyHeight:number}>={claude:{bottom:895,bodyHeight:769},glm:{bottom:956,bodyHeight:940},grok:{bottom:882,bodyHeight:707}};
function restTexture(file:string){return new Promise<HTMLCanvasElement>((resolve,reject)=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=216;c.height=240;const m=generatedRest[file],scale=Math.min(192/img.width,108/m.bodyHeight);c.getContext('2d')!.drawImage(img,(216-img.width*scale)/2,220-m.bottom*scale,img.width*scale,img.height*scale);resolve(c);};img.onerror=reject;img.src=`./repaired/dock-${file}-v1.png`;});}
function texture(file:string,pose:Pose,index:number,staticArt:boolean,override?:AtlasFrame){
  const frames=animationFrames(file,pose);const frame=override??frames[index%frames.length];
  const src=staticArt?`./community/${file}/idle.webp`:frame.asset?`./${frame.asset}`:`./animated/${file}.webp`;
  const key=`${src}:${staticArt?'all':`${frame.row}:${frame.column}:${!!frame.mirror}`}`;
  if(!textures.has(key))textures.set(key,new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{
    const c=document.createElement('canvas');c.width=216;c.height=240;const ctx=c.getContext('2d')!;
    const sw=staticArt?image.width:frame.cellWidth??192,sh=staticArt?image.height:frame.cellHeight??208;
    const scale=Math.min(192/sw,208/sh),w=sw*scale,h=sh*scale;
    if(frame.mirror){ctx.translate(216,0);ctx.scale(-1,1);}
    ctx.drawImage(image,staticArt?0:frame.column*sw,staticArt?0:frame.row*sh,sw,sh,12+(192-w)/2,16+(208-h)/2,w,h);resolve(c);
  };image.onerror=reject;image.src=src;}));
  return textures.get(key)!;
}
export function RigSprite({file,pose,cue,interaction,perch=0,staticArt=false}:{file:string;pose:Pose;cue:number;interaction?:Interaction;perch?:number;staticArt?:boolean}){
  const ref=useRef<HTMLCanvasElement>(null);const current=useRef({file,pose,cue,interaction,perch,staticArt});current.current={file,pose,cue,interaction,perch,staticArt};
  useEffect(()=>{
    let alive=true,raf=0,lastPaint=0,start=performance.now(),lastCue=cue,lastPose=pose,key='',frames:HTMLCanvasElement[]=[],previous:HTMLCanvasElement|null=null,shown:HTMLCanvasElement|null=null,rest:HTMLCanvasElement|null=null,changedAt=0,perched=perch;
    if(generatedRest[file])void restTexture(file).then(image=>{if(alive)rest=image;}).catch(()=>{canvas.dataset.error='rest-texture';});
    else if(resting[file])void texture(file,'sad',0,false,resting[file]).then(image=>{if(alive){const aligned=document.createElement('canvas');aligned.width=216;aligned.height=240;aligned.getContext('2d')!.drawImage(image,0,220-restContact[file]);rest=aligned;}}).catch(()=>{canvas.dataset.error='rest-texture';});
    const canvas=ref.current!,ctx=canvas.getContext('2d')!;const dpr=Math.min(2,devicePixelRatio||1);canvas.width=(216+paintPadding*2)*dpr;canvas.height=(240+paintPadding*2)*dpr;
    const draw=(now:number)=>{
      if(!alive)return;raf=requestAnimationFrame(draw);if(now-lastPaint<24)return;lastPaint=now;
      const p=current.current,profile=profiles[p.file]??profiles.kimi;
      if(p.cue!==lastCue||p.pose!==lastPose){start=now;lastCue=p.cue;lastPose=p.pose;}
      const recent=p.interaction&&Date.now()-p.interaction.startedAt<4200;
      const selected=recent&&(p.interaction?.kind==='pat'||p.interaction?.kind==='feed')?'idle':p.pose;
      const requested=`${p.file}:${selected}:${p.staticArt}`;
      if(requested!==key){key=requested;const requestKey=key;const count=p.staticArt?1:animationFrames(p.file,selected).length;
        Promise.all(Array.from({length:count},(_,i)=>texture(p.file,selected,i,p.staticArt))).then(images=>{if(alive&&key===requestKey){previous=shown;frames=images;changedAt=performance.now();}}).catch(()=>{canvas.dataset.error='texture';});
      }
      if(!frames.length)return;
      const seconds=(now-start)/1000,absolute=now/1000,phase=absolute/profile.period*Math.PI*2;
      const env=interactionEnvelope(p.interaction,Date.now());perched+=(p.perch-perched)*.12;
      let lift=Math.sin(phase)*.6,lean=Math.sin(phase*.67)*.35,breath=Math.sin(phase)*profile.breath;
      if(p.pose.startsWith('walk')){lift-=Math.abs(Math.sin(seconds*10))*1.3;lean+=Math.sin(seconds*10)*.35;}
      if(p.pose==='jump'&&seconds<1.4)lift-=Math.sin(seconds/1.4*Math.PI)*10;
      if(p.pose==='sad')lean-=1;
      if(p.interaction?.kind==='pat'){lean+=profile.lean*env;lift+=profile.bow*env;}
      // A resting pet stays planted on the dock, even during its breathing cycle.
      lift*=1-perched;lean*=1-perched;
      let index=0,blend=0;
      if(p.pose.startsWith('walk')){const t=seconds/.18;index=Math.floor(t)%frames.length;blend=t-Math.floor(t);}
      else if(selected==='idle'){const blink=(absolute%7.8);if(blink>7.5)index=Math.min(frames.length-1,p.file==='claude'?3:p.file==='grok'?3:p.file==='gpt'?1:2);}
      else {const t=seconds/.42;if(t<frames.length){index=Math.floor(t);blend=t-index;}}
      const a=frames[index],b=frames[(index+1)%frames.length];ctx.setTransform(dpr,0,0,dpr,paintPadding*dpr,paintPadding*dpr);ctx.clearRect(-paintPadding,-paintPadding,216+paintPadding*2,240+paintPadding*2);
      ctx.translate(108,220+lift);ctx.rotate((lean+(!rest?perched*7:0))*Math.PI/180);ctx.scale(1+perched*.03,1-perched*(rest?0:.16));ctx.translate(-108,-220);
      const render=(image:HTMLCanvasElement,alpha:number)=>{
        // One continuous sample avoids the coloured seams produced when separately
        // filtered 8px strips move to fractional device pixels at Windows scaling.
        // Keep the foot anchor, breathing, lean and interaction motion without cuts.
        ctx.save();ctx.globalAlpha=alpha;
        ctx.translate(108,220);
        ctx.transform(1,0,Math.sin(phase*.6)*.003+env*profile.lean*.002,1+breath,0,0);
        ctx.translate(-108,-220);
        ctx.drawImage(image,0,0);
        ctx.restore();
      };
      const fade=smooth((now-changedAt)/260),standing=rest?1-perched:1;
      if(previous&&fade<1)render(previous,(1-fade)*standing);render(a,(previous&&fade<1?fade:1)*(1-blend)*standing);if(blend>0)render(b,blend*(previous&&fade<1?fade:1)*standing);if(rest&&perched>0)render(rest,perched);ctx.globalAlpha=1;shown=a;
      canvas.dataset.motionTime=String(Math.round(now));canvas.dataset.rigFrame=String(index);canvas.dataset.perch=perched.toFixed(2);
    };
    raf=requestAnimationFrame(draw);return()=>{alive=false;cancelAnimationFrame(raf);};
  },[]);
  return <canvas ref={ref} className="rig-canvas" aria-hidden="true"/>;
}
