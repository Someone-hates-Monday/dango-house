import type {Pose} from './types';
export type Interaction={kind:'pat'|'feed'|'trip'|'affection'|'chat'|'bookmark';startedAt:number;food?:'rice'|'cake'|'fish'|'tea'};
export const profiles:Record<string,{period:number;breath:number;lean:number;headY:number;bow:number;accent:string}>={
  deepseek:{period:4.2,breath:.012,lean:1.2,headY:.17,bow:2.2,accent:'#8fa9dd'},claude:{period:5.8,breath:.008,lean:-.7,headY:.20,bow:1.4,accent:'#e4b17d'},gpt:{period:6.3,breath:.007,lean:.5,headY:.15,bow:.8,accent:'#c8b5e4'},gemini:{period:4.5,breath:.011,lean:1.6,headY:.14,bow:1.7,accent:'#b5a1e7'},glm:{period:5.1,breath:.009,lean:-1.3,headY:.12,bow:1.1,accent:'#9faed0'},kimi:{period:6.1,breath:.007,lean:.6,headY:.17,bow:1.5,accent:'#a5c9dd'},grok:{period:4.8,breath:.01,lean:-1.6,headY:.12,bow:1.2,accent:'#d5b36d'},
};
export const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
export function interactionEnvelope(i:Interaction|undefined,now:number){if(!i)return 0;const t=(now-i.startedAt)/1000;return smooth(t/.35)*(1-smooth((t-2.7)/.65));}
export function actualPose(requested:Pose,dx:number,dy:number,elapsedMs:number):Pose{
  if(Math.hypot(dx,dy)/Math.max(1,elapsedMs)*1000>2)return dx>=0?'walk-right':'walk-left';
  return requested.startsWith('walk')?'idle':requested;
}
export function dockPosition(index:number,count:number,width:number,height:number){const cell=Math.min(128,(width-36)/Math.max(1,count));return{x:(width-cell*count)/2+cell*(index+.5),y:height-4,cell};}
export const walkClip={enterEnd:2.25,loopStart:2.3,loopEnd:4.35,exitStart:6.05,exitEnd:8.55};
export function tripSample(elapsed:number){
  if(elapsed<.9)return{phase:'fall',time:4.45+Math.max(0,elapsed)};
  if(elapsed<3.4)return{phase:'down',time:5.35};
  if(elapsed<6.55)return{phase:'recover',time:5.4+(elapsed-3.4)};
  return{phase:'settle',time:8.6};
}
