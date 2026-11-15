import {BrowserWindow,screen} from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import {composeHouse,type HouseSize,type HouseLayout,type Rect} from '../src/shared/mini-house';

export class HouseWindowController {
 readonly window:BrowserWindow;
 private bounds:Rect;
 private request:HouseSize;
 private top=0;
 private applied:Rect|null=null;
 private timer:ReturnType<typeof setTimeout>|undefined;
 private dragStart:{point:{x:number;y:number};bounds:Rect}|undefined;
 constructor(preload:string,private file:string,private count:()=>number){
  const work=screen.getPrimaryDisplay().workArea;let saved:Partial<Rect>&{pinned?:boolean}={};
  try{saved=JSON.parse(fs.readFileSync(file,'utf8'));}catch{}
  const finite=(v:unknown,fallback:number)=>typeof v==='number'&&Number.isFinite(v)?v:fallback;
  this.bounds={x:finite(saved.x,work.x+work.width-420),y:finite(saved.y,work.y+Math.max(180,work.height-560)),width:finite(saved.width,360),height:finite(saved.height,300)};
  this.request={width:this.bounds.width,height:this.bounds.height,chatOpen:false,cgHeight:0};
  const first=composeHouse(this.bounds,work,this.request,this.count());this.bounds=first.house;
  this.window=new BrowserWindow({...first.host,frame:false,transparent:true,backgroundColor:'#00000000',hasShadow:false,resizable:false,alwaysOnTop:saved.pinned!==false,show:false,title:'团子小屋 · 迷你小屋',webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true}});
  this.window.on('move',()=>{
   const b=this.window.getBounds();if(this.applied&&Math.abs(b.x-this.applied.x)<=1&&Math.abs(b.y-this.applied.y)<=1)return;
   this.bounds={...this.bounds,x:b.x,y:b.y+this.top};this.layout(this.request);
  });
 }
 layout(request:HouseSize,workArea?:Rect):HouseLayout{
  this.request={width:request.width,height:request.height,chatOpen:!!request.chatOpen,cgHeight:request.cgHeight,panelHeight:request.panelHeight};
  const work=workArea??screen.getDisplayMatching(this.bounds).workArea;
  const result=composeHouse(this.bounds,work,this.request,this.count());this.bounds=result.house;this.top=result.layout.cgHeight;this.applied=result.host;
  const layout={...result.layout,pinned:this.window.isAlwaysOnTop()};
  const actual=this.window.getBounds();
  if((['x','y','width','height'] as const).some(k=>Math.abs(actual[k]-result.host[k])>1))this.window.setBounds(result.host);
  this.applied=this.window.getBounds();
  this.window.webContents.send('garden:house-layout',layout);
  clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush(),250);
  return layout;
 }
 current(){return this.layout(this.request);}
 drag(phase:'start'|'move'|'end',point:{x:number;y:number}){
  if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)||Math.abs(point.x)>100000||Math.abs(point.y)>100000)return;
  if(phase==='start')this.dragStart={point,bounds:{...this.bounds}};
  else if(phase==='move'&&this.dragStart){
   this.bounds={...this.bounds,x:this.dragStart.bounds.x+point.x-this.dragStart.point.x,y:this.dragStart.bounds.y+point.y-this.dragStart.point.y};
   this.layout(this.request,screen.getDisplayNearestPoint({x:Math.round(point.x),y:Math.round(point.y)}).workArea);
  }else if(phase==='end'){this.dragStart=undefined;this.flush();}
 }
 togglePin(){this.window.setAlwaysOnTop(!this.window.isAlwaysOnTop());this.current();}
 flush(){clearTimeout(this.timer);try{fs.mkdirSync(path.dirname(this.file),{recursive:true});fs.writeFileSync(this.file,JSON.stringify({...this.bounds,pinned:this.window.isAlwaysOnTop()}));}catch{}}
 show(){this.layout(this.request);if(this.window.isMinimized())this.window.restore();this.window.show();this.window.focus();}
}
