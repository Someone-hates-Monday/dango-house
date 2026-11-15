export interface HouseSize {width:number;height:number;chatOpen:boolean;cgHeight:number;panelHeight?:number}
export interface HouseLayout {width:number;height:number;chatHeight:number;cgHeight:number}
export interface Rect {x:number;y:number;width:number;height:number}
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function composeHouse(bounds:Rect,work:Rect,request:HouseSize,count:number){
 const width=clamp(Number.isFinite(request.width)?request.width:380,Math.min(count>4?420:320,work.width),Math.min(760,work.width));
 const height=clamp(Number.isFinite(request.height)?request.height:260,Math.min(count>4?370:280,work.height),Math.min(520,work.height));
 const chatHeight=request.chatOpen?Math.min(clamp(Number.isFinite(request.panelHeight)?request.panelHeight!:280,180,440),Math.max(100,work.height-height)):0;
 const x=clamp(bounds.x,work.x,work.x+work.width-width);
 const y=clamp(bounds.y,work.y,work.y+work.height-height-chatHeight);
 const desired=clamp(Number.isFinite(request.cgHeight)?request.cgHeight:0,0,320);
 const available=Math.max(0,y-work.y),cgHeight=desired&&available>=140?Math.min(desired,available):0;
 return{house:{x:Math.round(x),y:Math.round(y),width:Math.round(width),height:Math.round(height)},host:{x:Math.round(x),y:Math.round(y-cgHeight),width:Math.round(width),height:Math.round(height+chatHeight+cgHeight)},layout:{width:Math.round(width),height:Math.round(height),chatHeight:Math.round(chatHeight),cgHeight:Math.round(cgHeight)}};
}
/** Stable clusters; resizing changes view mapping, never world movement or AI events. */
export function compactPositions(ids:string[],width:number,height:number){
 const rows=ids.length>4?2:1,cols=Math.ceil(ids.length/rows),step=Math.min(66,(width-100)/Math.max(1,cols-1));
 return ids.map((id,i)=>{const row=Math.floor(i/cols),rowCount=Math.min(cols,ids.length-row*cols),col=i%cols;return{id,x:width/2+(col-(rowCount-1)/2)*step,y:height-22-(rows-1-row)*84,z:row*10+col};});
}
