import type {Pose} from './types';
export const atlasGeometry={width:1536,height:2288,cellWidth:192,cellHeight:208,columns:8,rows:11} as const;
export type AtlasFrame={row:number;column:number;mirror?:boolean;asset?:string;cellWidth?:number;cellHeight?:number;sheetWidth?:number;sheetHeight?:number};
const rows:Record<Pose,[number,number]>={idle:[0,6],'walk-right':[1,8],'walk-left':[2,8],wave:[3,4],jump:[4,5],sad:[5,8],wait:[6,6],think:[7,6],read:[8,6]};
const cells=(row:number,columns:number[]):AtlasFrame[]=>columns.map(column=>({row,column}));
const repairedClaude:AtlasFrame[]=Array.from({length:6},(_,i)=>({row:Math.floor(i/3),column:i%3,asset:'repaired/claude-wait-v1.png',cellWidth:512,cellHeight:512,sheetWidth:1536,sheetHeight:1024}));
// Reviewed against immutable upstream sheets. Bad pixels already exist inside these source cells;
// enlarging the crop cannot repair them. Keep originals unchanged and choose intact cells instead.
const reviewed:Record<string,Partial<Record<Pose,AtlasFrame[]>>>={
  claude:{idle:repairedClaude,wait:repairedClaude,think:cells(7,[0,1,2,3]),read:cells(7,[0,1,2,3])},
  grok:{wait:cells(8,[0,4,0,5]),think:cells(7,[0,1,2,4,5])},
  deepseek:{'walk-left':cells(1,[0,1,2,3,4,5,6,7]).map(f=>({...f,mirror:true}))},
  gpt:{'walk-left':cells(2,[0,1,2,3,4])},
  gemini:{idle:cells(8,[0,1,2,3,4,5]),think:cells(7,[0,3,4,5])},
  kimi:{idle:cells(0,[2,3,4,5]),wait:cells(0,[2,3,4,5]),think:cells(8,[3,5]),read:cells(8,[3,5]),'walk-left':cells(2,[1,2,3,4,5,6,7])},
};
export function animationFrames(file:string,pose:Pose):readonly AtlasFrame[]{
  const override=reviewed[file]?.[pose];if(override)return override;
  const[row,count]=rows[pose];return Array.from({length:count},(_,column)=>({row,column}));
}
export function frameViewBox(frame:AtlasFrame){const w=frame.cellWidth??atlasGeometry.cellWidth,h=frame.cellHeight??atlasGeometry.cellHeight;return `${frame.column*w} ${frame.row*h} ${w} ${h}`;}
// Waiting is a held pose with a brief, infrequent blink. Gestures run once per cue;
// only locomotion repeats while the actor is travelling.
export function playbackIndex(file:string,pose:Pose,elapsed:number,count:number){
  if(pose==='idle'){
    const phase=elapsed%12000;
    if(phase<10500||phase>=10680)return 0;
    return Math.min(count-1,({claude:3,deepseek:4,grok:3,gpt:1,gemini:2,kimi:2} as Record<string,number>)[file]??0);
  }
  const step=pose.startsWith('walk')?180:pose==='think'||pose==='read'?650:320;
  const index=Math.floor(Math.max(0,elapsed)/step);
  return pose.startsWith('walk')?index%count:index>=count?0:index;
}
