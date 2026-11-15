import type {CharacterId,RoomPoint,RoomResident} from './types';
import {residentPosition} from './world';

export const houseSpots:Record<string,RoomPoint>=Object.assign(Object.create(null),{window:{x:26,y:54},rug:{x:54,y:90}});
export interface HouseGeometry {width:number;height:number;count:number}
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export function houseScale(g:HouseGeometry){return clamp(Math.min(1.12,(g.width-44)/316*.95,(g.height-148-22-(g.count>4?74:0)-18)/128),.65,1.12);}
export function projectHouse(p:RoomPoint,g:HouseGeometry){
 const w=g.width-44,h=g.height-148,minY=128*houseScale(g),maxY=Math.max(minY,h-22);
 return{x:w*(.12+.76*(clamp(p.x,8,92)-8)/84),y:minY+(maxY-minY)*(clamp(p.y,48,94)-48)/46};
}
export function unprojectHouse(p:RoomPoint,g:HouseGeometry):RoomPoint{
 const w=g.width-44,h=g.height-148,minY=128*houseScale(g),span=Math.max(0,h-22-minY);
 return{x:clamp(8+(p.x/w-.12)/.76*84,8,92),y:span?clamp(48+(p.y-minY)/span*46,48,94):94};
}
export function houseFormation(ids:CharacterId[]):Record<string,RoomPoint>{
 const cols=ids.length>4?Math.ceil(ids.length/2):ids.length;
 return Object.fromEntries(ids.map((id,i)=>{const row=Math.floor(i/cols),n=Math.min(cols,ids.length-row*cols);return[id,{x:50+(i%cols-(n-1)/2)*22,y:ids.length>4?(row?92:54):88}];}));
}
export function houseOverlap(a:RoomPoint,b:RoomPoint,g:HouseGeometry){
 const s=houseScale(g);return Math.max(0,1-Math.abs(a.x-b.x)/(90*s))*Math.max(0,1-Math.abs(a.y-b.y)/(128*s));
}
/** Bounded grid search. Reserve other residents' current and destination footprints.
 * Prefer the requested destination, stop at the nearest reachable point when crowded.
 * No per-frame pushing, teleports, or walking in place. */
export function planHousePath(id:CharacterId,residents:Record<CharacterId,RoomResident>,present:CharacterId[],goal:RoomPoint,g:HouseGeometry,now:number,peer?:CharacterId){
 const start=projectHouse(residentPosition(residents[id],now),g);
 const obstacles=present.filter(other=>other!==id).flatMap(other=>{
  const r=residents[other],sweep:RoomPoint[]=[];
  if(r.arrivesAt>now){const points=(r.path??[r.from,r]).map(p=>projectHouse(p,g));for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/10));for(let j=0;j<=n;j++)sweep.push({x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n});}}
  return[projectHouse(residentPosition(r,now),g),...sweep];
 });
 let target=projectHouse(goal,g);
 if(peer){
  const clearance=90*houseScale(g)*.59+2;
  const side=start.x<target.x?-1:1;
  if(Math.hypot(start.x-target.x,start.y-target.y)<=clearance+5)return{path:[] as RoomPoint[],duration:0};
  target={x:target.x+side*clearance,y:target.y};
 }
 target=projectHouse(unprojectHouse(target,g),g);
 const free=(p:RoomPoint)=>obstacles.every(o=>houseOverlap(p,o,g)<=.44);
 const distance=(a:RoomPoint,b:RoomPoint)=>Math.hypot(a.x-b.x,a.y-b.y);
 const clear=(a:RoomPoint,b:RoomPoint)=>{
  const n=Math.max(1,Math.ceil(distance(a,b)/4));
  for(let i=1;i<=n;i++)if(!free({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n}))return false;
  return true;
 };
 let pixels:RoomPoint[]=[];
 if(free(target)&&clear(start,target))pixels=[start,target];
 else{
  const min=projectHouse({x:8,y:48},g),max=projectHouse({x:92,y:94},g);
  const cols=Math.max(2,Math.ceil((max.x-min.x)/14)+1),rows=Math.max(2,Math.ceil((max.y-min.y)/14)+1);
  const nodes=Array.from({length:cols*rows},(_,i)=>({x:min.x+(max.x-min.x)*(i%cols)/(cols-1),y:min.y+(max.y-min.y)*Math.floor(i/cols)/(rows-1)}));
  const valid=nodes.map(free),cost=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),open:number[]=[];
  nodes.forEach((p,i)=>{const d=distance(start,p);if(valid[i]&&d<=24&&clear(start,p)){cost[i]=d;open.push(i);}});
  let best=-1,bestScore=distance(start,target)-3;
  while(open.length){
   open.sort((a,b)=>cost[b]-cost[a]);const i=open.pop()!,p=nodes[i],score=distance(p,target)+cost[i]*.05;
   if(score<bestScore){best=i;bestScore=score;}
   for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]){
    const x=i%cols+dx,y=Math.floor(i/cols)+dy;if(x<0||x>=cols||y<0||y>=rows)continue;
    const j=y*cols+x,next=cost[i]+distance(p,nodes[j]);
    if(valid[j]&&next<cost[j]&&clear(p,nodes[j])){cost[j]=next;prev[j]=i;if(!open.includes(j))open.push(j);}
   }
  }
  if(best>=0){const reverse:RoomPoint[]=[];for(let i=best;i>=0;i=prev[i])reverse.push(nodes[i]);pixels=[start,...reverse.reverse()];}
 }
 if(pixels.length<2)return{path:[] as RoomPoint[],duration:0};
 // Remove redundant grid bends without crossing reserved footprints.
 const smooth=[pixels[0]];for(let i=0;i<pixels.length-1;){let j=pixels.length-1;while(j>i+1&&!clear(pixels[i],pixels[j]))j--;smooth.push(pixels[j]);i=j;}
 const length=smooth.slice(1).reduce((sum,p,i)=>sum+distance(p,smooth[i]),0);
 if(length<3)return{path:[] as RoomPoint[],duration:0};
 return{path:smooth.map(p=>unprojectHouse(p,g)),duration:clamp(length/65*1000,650,5000)};
}
