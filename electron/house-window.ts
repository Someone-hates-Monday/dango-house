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
 constructor(preload:string,private file:string,private count:()=>number){
  const work=screen.getPrimaryDisplay().workArea;let saved:Partial<Rect>={};
  try{saved=JSON.parse(fs.readFileSync(file,'utf8'));}catch{}
  const finite=(v:unknown,fallback:number)=>typeof v==='number'&&Number.isFinite(v)?v:fallback;
  this.bounds={x:finite(saved.x,work.x+work.width-420),y:finite(saved.y,work.y+Math.max(180,work.height-560)),width:finite(saved.width,360),height:finite(saved.height,300)};
  this.request={width:this.bounds.width,height:this.bounds.height,chatOpen:false,cgHeight:0};
  const first=composeHouse(this.bounds,work,this.request,this.count());this.bounds=first.house;
  this.window=new BrowserWindow({...first.host,frame:false,transparent:true,backgroundColor:'#00000000',hasShadow:false,resizable:false,alwaysOnTop:true,show:false,title:'团子小屋 · 迷你小屋',webPreferences:{preload,contextIsolation:true,nodeIntegration:false,sandbox:true}});
  this.window.on('move',()=>{
   const b=this.window.getBounds();if(this.applied&&b.x===this.applied.x&&b.y===this.applied.y)return;
   this.bounds={...this.bounds,x:b.x,y:b.y+this.top};this.layout(this.request);
  });
 }
 layout(request:HouseSize):HouseLayout{
  this.request={width:request.width,height:request.height,chatOpen:!!request.chatOpen,cgHeight:request.cgHeight,panelHeight:request.panelHeight};
  const work=screen.getDisplayMatching(this.bounds).workArea;
  const result=composeHouse(this.bounds,work,this.request,this.count());this.bounds=result.house;this.top=result.layout.cgHeight;this.applied=result.host;
  this.window.setBounds(result.host);this.window.webContents.send('garden:house-layout',result.layout);
  clearTimeout(this.timer);this.timer=setTimeout(()=>{try{fs.mkdirSync(path.dirname(this.file),{recursive:true});fs.writeFileSync(this.file,JSON.stringify(this.bounds));}catch{}},250);
  return result.layout;
 }
 current(){return this.layout(this.request);}
 flush(){clearTimeout(this.timer);try{fs.writeFileSync(this.file,JSON.stringify(this.bounds));}catch{}}
 show(){this.layout(this.request);if(this.window.isMinimized())this.window.restore();this.window.show();this.window.focus();}
}
