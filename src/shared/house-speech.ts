import type {AppState,CharacterId,MessageAddress} from './types';

export interface HouseSpeech extends MessageAddress {id:string;speaker:CharacterId;text:string;at:number;private:boolean}
export interface SpeechPlacement extends HouseSpeech {left:number;top:number;width:number;height:number;tail:number;active:boolean}

export function speechDuration(text:string){return text?Math.min(8500,Math.max(3400,1500+Array.from(text).length*95)):1100;}

/** One latest utterance per resident; private content belongs only to the open channel. */
export function houseSpeeches(state:AppState,channel:CharacterId|undefined,now:number):HouseSpeech[]{
 if(state.settings.dnd)return [];
 const latest=new Map<CharacterId,HouseSpeech>();
 const take=(m:{id:string;speaker:string;text:string;at:number}&MessageAddress,privateLine=false)=>{
  if(!state.presentIds.includes(m.speaker as CharacterId)||!m.text||Math.max(0,now-m.at)>=14000)return;
  const id=m.speaker as CharacterId,old=latest.get(id);
  if(!old||m.at>=old.at)latest.set(id,{id:m.id,speaker:id,text:m.text,at:m.at,private:privateLine,replyTo:privateLine?undefined:m.replyTo,audience:privateLine?'user':m.audience??'group',sceneId:m.sceneId});
 };
 state.messages.forEach(m=>take(m));
 if(channel)state.privateMessages[channel].filter(m=>m.speaker===channel).forEach(m=>take(m,true));
 // Offline physical reactions are not necessarily chat-log entries.
 if(state.settings.mode==='demo')for(const id of state.presentIds){
  const body=state.bodies[id];
  if(body.bubble&&body.until>now&&body.interaction?.kind!=='clip')take({id:`body-${id}-${body.until}`,speaker:id,text:body.bubble,at:body.interaction?.startedAt??body.until-7000,audience:'user'});
 }
 return [...latest.values()].sort((a,b)=>b.at-a.at);
}

/** Fixed headroom, bounded slots: new speech never changes the native window size. */
export function placeHouseSpeeches(speeches:HouseSpeech[],anchors:{id:CharacterId;x:number}[],width:number,headroom:number):SpeechPlacement[]{
 const height=84,gap=8,bottom=14,margin=8,minimum=140;
 const columns=Math.max(1,Math.min(4,Math.floor((width-margin*2+gap)/(minimum+gap))));
 const rows=Math.max(0,Math.min(2,Math.floor((headroom-bottom+gap)/(height+gap))));
 if(!rows)return [];
 const bubbleWidth=Math.min(190,(width-margin*2-gap*(columns-1))/columns);
 const available=Array.from({length:rows*columns},(_,i)=>{const row=Math.floor(i/columns),col=i%columns;
  return {left:columns===1?(width-bubbleWidth)/2:margin+col*(width-margin*2-bubbleWidth)/(columns-1),top:-bottom-height-row*(height+gap),row};
 });
 return [...speeches].sort((a,b)=>b.at-a.at).slice(0,available.length).map((speech,index)=>{
  const anchor=anchors.find(a=>a.id===speech.speaker)?.x??width/2;
  available.sort((a,b)=>Math.abs(a.left+bubbleWidth/2-anchor)+a.row*40-(Math.abs(b.left+bubbleWidth/2-anchor)+b.row*40));
  const slot=available.shift()!;
  return {...speech,left:slot.left,top:slot.top,width:bubbleWidth,height,tail:Math.max(14,Math.min(bubbleWidth-24,anchor-slot.left-5)),active:index===0};
 });
}
