import type {Interaction} from '../src/shared/motion';
import { byId, providers } from '../src/shared/characters';
import { socialScenes, socialProfiles, relationshipKey } from '../src/shared/social';
import { chooseSpeakers, demoReply, initialState, praiseLines, ids } from '../src/shared/director';
import type { Action, AppState, CharacterId, Message, AvatarIntent, Emotion } from '../src/shared/types';
import { boundedPoint, defaultFurniture, inferredIntent, poseForAction, restingBody, residentPosition, targetDescription, validatedIntent } from '../src/shared/world';
type Generate = (state: AppState, id: CharacterId, text: string, signal: AbortSignal, update: (text: string) => void, act: (intent:AvatarIntent)=>string) => Promise<string>;
export class GardenEngine {
  state: AppState;
  private abort?: AbortController;
  private epoch = 0;
  private lastInteraction = Date.now();
  private nextAutonomous = Date.now() + 10 * 60_000;
  private nextRoomLife = Date.now()+60000;
  private lifeIndex = 0;
  private nextSocial = Date.now()+180000;
  private socialIndex = 0;
  private scene: {at:number;actor:CharacterId;intent:AvatarIntent;speech?:string}[] = [];
  private privateOpened: {id:CharacterId;at:number}|null=null;
  private hovered: Partial<Record<CharacterId,number>>={};
  private lastGreeting=0;
  private nextBookmark=Date.now()+95000;
  constructor(state: AppState = initialState(), private notify: (state: AppState) => void = () => {}, private generate?: Generate, private delay = 650) { this.state = state; }
  publish() { this.state.revision++; this.notify(this.state); }
  add(speaker: Message['speaker'], text: string, kind?: Message['kind']) {
    const message = { id: crypto.randomUUID(), speaker, text, at: Date.now(), kind };
    this.state.messages.push(message); this.state.messages = this.state.messages.slice(-500); this.publish(); return message;
  }
  private addPrivate(id:CharacterId,speaker:Message['speaker'],text:string){const message={id:crypto.randomUUID(),speaker,text,at:Date.now()};this.state.privateMessages[id].push(message);this.state.privateMessages[id]=this.state.privateMessages[id].slice(-200);this.publish();return message;}
  perform(id:CharacterId,value:unknown,source:'local'|'model'='local',now=Date.now(),interaction?:Interaction) {
    if(!ids.includes(id))throw new Error('未知角色');
    const intent=validatedIntent(value);const resident=this.state.room.residents[id];
    const current=residentPosition(resident,now);let point: {x:number;y:number}|undefined;
    let target=intent.target;
    if(!target&&['read','sit','water','eat','sleep'].includes(intent.action)) target=this.state.room.furniture.find(f=>f.kind===({read:'bookshelf',sit:'sofa',water:'plant',eat:'table',sleep:'cushion'} as Record<string,string>)[intent.action])?.id;
    if(target){const obj=this.state.room.furniture.find(f=>f.id===target);const other=ids.find(other=>other===target||byId[other].name.toLowerCase()===target!.toLowerCase());if(obj)point=boundedPoint(obj.x+6,obj.y+9);else if(other&&other!==id){const p=residentPosition(this.state.room.residents[other],now);point=boundedPoint(p.x+9,p.y+2);}else throw new Error('目标不存在，请使用小屋中列出的家具 ID 或另一位角色 ID');}
    if(intent.action==='walk'&&!point)point=boundedPoint(intent.x??current.x+(this.lifeIndex%2?10:-10),intent.y??current.y);
    if(!this.state.room.wandering)point=undefined;
    const targetId=ids.find(other=>other===target||byId[other].name.toLowerCase()===target?.toLowerCase());
    if(targetId&&targetId!==id){const key=relationshipKey(id,targetId);this.state.bonds[key]=Math.min(100,(this.state.bonds[key]??0)+2);if(source==='model')this.scene.push({at:now+3500,actor:targetId,intent:{action:'wave',emotion:'happy',bubble:socialProfiles[targetId].response,duration:7}});}
    const after=poseForAction(intent.action); const duration=intent.duration!*1000;
    const moving=point&&Math.hypot(point.x-current.x,point.y-current.y)>1;
    const travel=moving?Math.max(800,Math.min(5500,Math.hypot(point!.x-current.x,point!.y-current.y)*85)):0;
    if(moving)this.state.room.residents[id]={...point!,from:current,startedAt:now,arrivesAt:now+travel,after,destination:target?targetDescription(target,this.state.room.furniture):'附近'};
    else if(intent.action!=='approach')this.state.room.residents[id]={...resident,...current,from:current,startedAt:0,arrivesAt:0,after,destination:''};
    const labels:Record<string,string>={wave:'挥手打招呼',jump:'开心跳一跳',celebrate:'开心庆祝',think:'认真思考',read:'坐下来读书',shy:'有点害羞',sad:'有点委屈',sit:'坐一会儿',water:'照顾小绿植',eat:'一起吃点心',sleep:'安静休息',walk:'小步走动',approach:'靠近伙伴',idle:'安静待机'};
    this.state.bodies[id]={pose:moving?(point!.x>current.x?'walk-right':'walk-left'):after,emotion:intent.emotion??({shy:'shy',sad:'sad',celebrate:'happy',jump:'happy',think:'curious'} as Record<string,Emotion>)[intent.action]??'neutral',until:now+travel+duration,label:labels[intent.action],bubble:intent.bubble??'',interaction};
    const pet=this.state.pets[id];const other=target?ids.find(other=>other===target||byId[other].name.toLowerCase()===target!.toLowerCase()):undefined;
    if(pet&&moving&&this.state.room.wandering&&this.state.presentation.desktopMode==='free'){const progress=this.state.desktopMoves[id];const t=progress?Math.max(0,Math.min(1,(now-progress.startedAt)/(progress.arrivesAt-progress.startedAt))):1;const from=progress?{x:progress.from.x+(progress.to.x-progress.from.x)*t,y:progress.from.y+(progress.to.y-progress.from.y)*t}:{x:pet.x,y:pet.y};const destination=other?this.state.pets[other]:undefined;let x=from.x+(this.lifeIndex%2?0.07:-0.07),y=from.y;if(destination&&destination.displayId===pet.displayId){x=from.x+Math.max(-.22,Math.min(.22,destination.x+(from.x<destination.x?-.08:.08)-from.x));y=destination.y;}const to={x:Math.max(.02,Math.min(.95,x)),y:Math.max(.05,Math.min(.98,y))};const duration=Math.max(1000,Math.abs(to.x-from.x)*22000);this.state.desktopMoves[id]={from,to,startedAt:now,arrivesAt:now+duration,displayId:pet.displayId};this.state.bodies[id].until=Math.max(this.state.bodies[id].until,now+duration+2000);}
    this.state.room.log.unshift({id:crypto.randomUUID(),actor:id,text:`${labels[intent.action]}${target?` · ${targetDescription(target,this.state.room.furniture)}`:''}`,at:now,source});this.state.room.log=this.state.room.log.slice(0,35);this.publish();
    return `已让${byId[id].name}${labels[intent.action]}${moving?'，正在走向目标':''}`;
  }
  private freezeRoom(now=Date.now()) { this.scene=[];for(const id of ids){const p=residentPosition(this.state.room.residents[id],now);this.state.room.residents[id]={...this.state.room.residents[id],...p,from:p,startedAt:0,arrivesAt:0};const d=this.state.desktopMoves[id];if(d&&this.state.pets[id]){const t=Math.max(0,Math.min(1,(now-d.startedAt)/(d.arrivesAt-d.startedAt)));this.state.pets[id]={...this.state.pets[id]!,x:d.from.x+(d.to.x-d.from.x)*t,y:d.from.y+(d.to.y-d.from.y)*t};}delete this.state.desktopMoves[id];this.state.bodies[id]={...restingBody(),stoppedAt:now};}this.publish(); }
  private playSocial(id:string,now=Date.now()) {const story=socialScenes.find(s=>s.id===id);if(!story)return;const steps=story.steps.filter(s=>!this.state.muted.includes(s.actor)&&(!s.intent.target||!this.state.muted.includes(s.intent.target as CharacterId)));this.scene=steps.map((step,i)=>({at:now+i*4200,actor:step.actor,intent:{...step.intent,duration:9},speech:step.intent.bubble}));this.nextRoomLife=now+steps.length*4200+60000;this.nextSocial=now+steps.length*4200+180000;}
  stop() {
    this.epoch++; this.abort?.abort(); this.abort = undefined; this.state.busy = false;
    for (const id of ids) this.state.mood[id] = this.state.focus ? 'focus' : 'idle';
    this.state.activity = this.state.focus ? '大家在安静陪你专注' : '大家都在庭院里'; this.publish();
  }
  private async wait(signal: AbortSignal) {
    if (signal.aborted) return;
    await new Promise<void>(resolve => { const done = () => { clearTimeout(timer); signal.removeEventListener('abort', done); resolve(); }; const timer = setTimeout(done, this.delay); signal.addEventListener('abort', done, { once: true }); });
  }
  private async sequence(lines: { speaker: CharacterId; text: string }[], useApi = false, input = '',channel?:CharacterId) {
    this.stop(); const round = this.epoch; const controller = new AbortController(); this.abort = controller;
    this.state.busy = true; this.publish();
    try {
      for (const line of lines) {
        if (round !== this.epoch || controller.signal.aborted) break;
        if (this.state.muted.includes(line.speaker)) continue;
        this.state.mood[line.speaker] = 'talk'; this.state.activity = `${byId[line.speaker].name}正在想怎么回应你`; this.publish();
        await this.wait(controller.signal);
        if (round !== this.epoch) break;
        if (useApi && this.generate) {
          const message = channel?this.addPrivate(channel,line.speaker,''):this.add(line.speaker, '');
          try {
            let acted=false;
            const context=channel?{...this.state,messages:this.state.privateMessages[channel]}:this.state;
            const result = await this.generate(context, line.speaker, input, controller.signal, text => { if (round === this.epoch) { message.text = text; this.publish(); } },intent=>{if(round!==this.epoch||controller.signal.aborted)throw new Error('回合已取消');acted=true;return this.perform(line.speaker,intent,'model');});
            if (round === this.epoch) { message.text = result; if (!result.trim()) throw new Error('模型没有返回文字，请检查模型是否支持文本聊天。'); }
            if(round===this.epoch&&!acted)this.perform(line.speaker,inferredIntent(result));
          } catch (error) {
            if (round !== this.epoch) { if (!message.text) {if(channel)this.state.privateMessages[channel]=this.state.privateMessages[channel].filter(m=>m.id!==message.id);else this.state.messages = this.state.messages.filter(m => m.id !== message.id);} break; }
            if (!message.text){if(channel)this.state.privateMessages[channel]=this.state.privateMessages[channel].filter(m=>m.id!==message.id);else this.state.messages = this.state.messages.filter(m => m.id !== message.id);}
            const errorText=error instanceof Error ? error.message : '连接失败，请稍后重试。';if(channel)this.addPrivate(channel,'system',errorText);else this.add('system',errorText,'error');break;
          }
        } else {this.perform(line.speaker,{...inferredIntent(line.text),bubble:line.text.slice(0,45)});if(channel)this.addPrivate(channel,line.speaker,line.text);else this.add(line.speaker, line.text);}
        this.state.mood[line.speaker] = this.state.focus ? 'focus' : 'idle';this.state.affection[line.speaker]=Math.min(100,this.state.affection[line.speaker]+1); this.publish();
      }
    } finally { if (round === this.epoch) this.stop(); }
  }
  async dispatch(action: Action) {
    if (!action || typeof action !== 'object') throw new Error('无效操作');
    this.lastInteraction = Date.now();
    switch (action.type) {
      case 'send': {
        if (typeof action.text !== 'string' || !action.text.trim()) return;
        const text = action.text.trim().slice(0, 4000); this.scene=[];this.stop(); this.add('user', text);
        const selected = chooseSpeakers(this.state, text, action.target);
        if (!selected.length) { this.add('system', '成员已静音，可以在右侧让她重新加入。'); return; }
        if(/挥手|跳一|跳舞|走一|走走|看书|读书|害羞|坐下|浇水/.test(text)&&this.state.settings.mode==='demo') {const matched=/挥手/.test(text)?'wave':/跳/.test(text)?'jump':/走/.test(text)?'walk':/书/.test(text)?'read':/害羞/.test(text)?'shy':/浇水/.test(text)?'water':'sit';this.perform(selected[0],{action:matched,bubble:'收到！看我的～'});this.add(selected[0],'收到！我现在就做给你看。');return;}
        if (/^(?:请)?(?:陪我|和我一起|一起|开始|开启)(?:一个|一段)?(?:专注|番茄钟)|^(?:专注|番茄钟)(?:\s*\d+\s*分钟)?[吧。！!？?]?$/.test(text)) {
          const match = text.match(/(\d+)\s*分钟/); await this.dispatch({ type: 'focus', minutes: match ? Number(match[1]) : 25 }); return;
        }
        if (/记住[：:，, ]/.test(text)) { const memory = text.split(/记住[：:，, ]/).slice(1).join('').trim(); if (memory) await this.dispatch({ type: 'remember', text: memory }); }
        if (this.state.settings.mode === 'api' && (!this.generate || !this.state.settings.model)) { this.add('system', '请先在连接设置填写模型 ID 和 API Key，或切回离线演示。', 'error'); return; }
        await this.sequence(selected.map((speaker, i) => ({ speaker, text: demoReply(speaker, text, this.state.settings.intimacy, i) })), this.state.settings.mode === 'api', text); return;
      }
      case 'presentation': {const p=action.patch;if(p.desktopMode==='dock'||p.desktopMode==='free'){this.freezeRoom();this.state.presentation.desktopMode=p.desktopMode;}if(p.chatForm==='portrait'||p.chatForm==='chibi')this.state.presentation.chatForm=p.chatForm;break;}
      case 'select': if (ids.includes(action.id)) this.state.selected = action.id; break;
      case 'trip': {if(!ids.includes(action.id))return;this.perform(action.id,{action:'sad',emotion:'sad',bubble:'哎呀……让我趴一会儿，再慢慢站起来。',duration:9},'local',Date.now(),{kind:'trip',startedAt:Date.now()});return;}
      case 'pat': {if(!ids.includes(action.id))return;this.state.affection[action.id]=Math.min(100,this.state.affection[action.id]+2);const lines:Record<CharacterId,string>={xia:'嘿嘿……尾巴停不下来了，再摸一下嘛～',rin:'嗯……书可以先放一会儿。谢谢你。',shiori:'……只许摸一下。不是说停下。',gemini:'呼噜呼噜～喵，摸到猫猫的开心开关了！',glm:'再摸要收费哦～……好吧，这次也免费。',kimi:'像月光落在头顶一样，暖暖的。',grok:'好吧，这一招对我有效。再来一下？'};this.perform(action.id,{action:'shy',emotion:'happy',bubble:lines[action.id],duration:7},'local',Date.now(),{kind:'pat',startedAt:Date.now()});return;}
      case 'feed': {if(!ids.includes(action.id)||!['rice','cake','fish','tea'].includes(action.food))return;const name={rice:'大米饭',cake:'小蛋糕',fish:'小鱼干',tea:'热茶'}[action.food];const favorite=action.id==='xia'&&action.food==='rice'||action.id==='gemini'&&action.food==='fish'||action.id==='rin'&&action.food==='tea'||action.id==='kimi'&&action.food==='cake';this.state.affection[action.id]=Math.min(100,this.state.affection[action.id]+(favorite?4:2));this.perform(action.id,{action:'eat',emotion:'happy',bubble:action.id==='xia'&&action.food==='rice'?'大米饭！是白米饭！再来一碗好不好～':`${name}收到了！谢谢${this.state.relationship.address}，一起吃一点吧。`,duration:8},'local',Date.now(),{kind:'feed',startedAt:Date.now(),food:action.food});return;}
      case 'hover': {if(!ids.includes(action.id)||this.state.settings.dnd||!this.state.settings.autonomous)return;const now=Date.now();if(now-(this.hovered[action.id]??0)<90000||now-this.lastGreeting<15000)return;this.hovered[action.id]=now;this.lastGreeting=now;this.perform(action.id,{action:'wave',emotion:'happy',bubble:`${this.state.relationship.address}，来找${byId[action.id].name}玩吗？点头部摸摸，点身体可以悄悄聊天。`,duration:6});return;}
      case 'reminder': {if(action.operation==='remove')this.state.reminders=this.state.reminders.filter(r=>r.id!==action.id);else if(action.operation==='toggle'){const r=this.state.reminders.find(r=>r.id===action.id);if(r){r.enabled=!r.enabled;r.nextAt=Date.now()+r.intervalMinutes*60000;}}else if(typeof action.text==='string'&&action.text.trim()&&Number.isFinite(action.intervalMinutes)&&action.intervalMinutes!>=1&&action.intervalMinutes!<=1440&&this.state.reminders.length<12)this.state.reminders.push({id:crypto.randomUUID(),text:action.text.trim().slice(0,120),intervalMinutes:action.intervalMinutes!,nextAt:Date.now()+action.intervalMinutes!*60000,enabled:true});break;}
      case 'relationship': {if(!['friend','pet','romance'].includes(action.mode))return;this.state.relationship={mode:action.mode,userName:String(action.userName).slice(0,30),address:String(action.address).slice(0,30)};break;}
      case 'private-open': {
        this.stop();
        if(!ids.includes(action.id))return;this.state.selected=action.id;const now=Date.now();if(this.privateOpened?.id===action.id&&now-this.privateOpened.at<20000){this.publish();return;}this.privateOpened={id:action.id,at:now};this.state.affection[action.id]=Math.min(100,this.state.affection[action.id]+2);
        const address=this.state.relationship.address||'你';const greetings:Record<CharacterId,string>={xia:`${address}这次选我啦！嘿嘿，饭碗先放一边，现在只想听你说话～`,rin:`是想和我单独说话吗？我把书合上了。现在的时间，留给${address}。`,shiori:`……选我？嗯，过来坐。龙尾在动？你看错了。`,gemini:`选中猫猫啦！喵～今天的灵感和小秘密，都想先讲给${address}听。`,glm:`哎呀，今天轮到我了～这段专属陪伴，可要好好珍惜哦。`,kimi:`${address}来找我啦。书签夹好了，接下来只听你的故事。`,grok:`我就知道你眼光不错！好了，今天的专属频道开播，想聊什么？`};
        this.perform(action.id,{action:'celebrate',emotion:'happy',bubble:greetings[action.id].slice(0,52),duration:9},'local',now,{kind:'chat',startedAt:now});this.addPrivate(action.id,action.id,greetings[action.id]);
        const jealous:Record<CharacterId,string>={xia:'诶，这次不选大鱼吗？我连饭都留了半碗……下次记得找我呀！',rin:'嗯，你们慢慢聊。我把书签留着，等你想听另一个故事时再来。',shiori:'……我才没有在等。下次想聊天，也可以找我。',gemini:'喵？猫猫也有很多新点子呢……下次会轮到我吧？',glm:'这次先让给她。不过下次的专属时间，我先预约啦～',kimi:'那我先看一会儿书。你回来时，我还在这一页等你。',grok:'哎呀，被抢先了。下次给我留个位置？我这儿还有个特别好笑的梗。'};
        this.scene=ids.filter(id=>id!==action.id&&!this.state.muted.includes(id)).map((actor,i)=>({at:now+900+i*1100,actor,intent:{action:i===0?'approach':'shy',target:i===0?action.id:undefined,emotion:'shy',bubble:jealous[actor],duration:8}}));this.publish();return;
      }
      case 'private-send': {
        if(!ids.includes(action.id)||typeof action.text!=='string'||!action.text.trim())return;this.stop();this.addPrivate(action.id,'user',action.text.trim().slice(0,4000));
        await this.sequence([{speaker:action.id,text:demoReply(action.id,action.text,this.state.settings.intimacy)}],this.state.settings.mode==='api',action.text,action.id);return;
      }
      case 'perform': this.perform(action.id,action.intent);return;
      case 'social-scene': this.stop();this.freezeRoom();this.playSocial(action.id);this.tick();return;
      case 'connection': { if(!providers.some(p=>p.id===action.provider)||!action.profile||typeof action.profile.model!=='string'||typeof action.profile.endpoint!=='string')throw new Error('配置无效');this.state.connections[action.provider]={model:action.profile.model.trim().slice(0,120),endpoint:action.profile.endpoint.trim().slice(0,400),tools:action.profile.tools!==false};if(this.state.settings.provider===action.provider)this.state.settings.model=action.profile.model.trim();break; }
      case 'room-settings': {const p=action.patch;if(typeof p.autonomous==='boolean')this.state.room.autonomous=p.autonomous;if(typeof p.wandering==='boolean')this.state.room.wandering=p.wandering;if(p.theme==='peach'||p.theme==='night')this.state.room.theme=p.theme;if(p.wandering===false)this.freezeRoom();break;}
      case 'furniture': {
        if(action.operation==='reset'){this.state.room.furniture=defaultFurniture();break;}
        if(action.operation==='remove'){this.state.room.furniture=this.state.room.furniture.filter(f=>f.id!==action.id);break;}
        if(!['sofa','table','bookshelf','plant','lamp','cushion'].includes(action.kind??'')&&action.operation==='add')throw new Error('未知家具');
        if(!Number.isFinite(action.x)||!Number.isFinite(action.y))throw new Error('位置无效');const p=boundedPoint(action.x!,action.y!);
        if(action.operation==='add'&&this.state.room.furniture.length<16)this.state.room.furniture.push({id:`${action.kind}-${crypto.randomUUID().slice(0,6)}`,kind:action.kind!,...p});
        if(action.operation==='move'){const item=this.state.room.furniture.find(f=>f.id===action.id);if(item)Object.assign(item,p);}
        break;
      }
      case 'showcase': {
        this.stop();this.freezeRoom();const now=Date.now();this.nextRoomLife=now+60000;
        const cast=ids.filter(id=>!this.state.muted.includes(id));
        const a=cast.includes('xia')?'xia':cast[0],b=cast.includes('glm')?'glm':cast[1]??a,c=cast.includes('kimi')?'kimi':cast[2]??a;if(!a)return;
        if(action.scene==='welcome')this.scene=cast.map((actor,i)=>({at:now+i*750,actor,intent:{action:'wave',emotion:'happy',bubble:`${byId[actor].name}来报到啦！`},speech:`${byId[actor].name}来报到啦！`}));
        if(action.scene==='tea')this.scene=[{at:now,actor:a,intent:{action:'eat',target:this.state.room.furniture.find(f=>f.kind==='table')?.id,emotion:'happy',bubble:'开饭啦！我先去占位置～'},speech:'开饭啦！我先去占位置～'},{at:now+2500,actor:b,intent:{action:'approach',target:a,bubble:'点心我也要一份哦～'},speech:'点心我也要一份哦～'},{at:now+5500,actor:c,intent:{action:'read',target:this.state.room.furniture.find(f=>f.kind==='bookshelf')?.id,bubble:'那我带一本故事书过来。'},speech:'那我带一本故事书过来。'},{at:now+10500,actor:a,intent:{action:'jump',emotion:'happy',bubble:'大家一起吃！'},speech:'大家一起吃！'}];
        if(action.scene==='rivalry')this.scene=[{at:now,actor:a,intent:{action:'jump',emotion:'happy',bubble:'今天我被夸了！'},speech:'今天我被夸了，可以多分一点关注吗？'},{at:now+2200,actor:b,intent:{action:'approach',target:a,emotion:'curious',bubble:'我也很努力哦～'},speech:'我也很努力哦～这次的点心分我一半？'},{at:now+5000,actor:a,intent:{action:'shy',emotion:'shy',bubble:'那……分你半碗饭好了。'},speech:'那……分你半碗饭好了。'},{at:now+8000,actor:c,intent:{action:'wave',emotion:'happy',bubble:'一起坐下吧，书里还有新故事。'},speech:'一起坐下吧，书里还有新故事。'}];
        this.tick(now);return;
      }
      case 'skin': if (ids.includes(action.id) && (action.skin === 'chibi' || action.skin === 'animated')) this.state.skins[action.id] = byId[action.id].atlas===false?'chibi':action.skin; break;
      case 'praise': {
        if (!ids.includes(action.id)) return;
        this.stop(); this.state.selected = action.id; this.state.affection[action.id] = Math.min(100, this.state.affection[action.id] + 3);
        this.add('user', `${byId[action.id].name}，今天也很贴心。`);
        {const round=this.epoch;await this.sequence(praiseLines(action.id, this.state.settings.intimacy));
        // sequence starts and finishes one round; a newer request cancels this reaction.
        if(this.epoch===round+2){const now=Date.now();this.perform(action.id,{action:'shy',emotion:'happy',duration:7},'local',now,{kind:'affection',startedAt:now});}}return;
      }
      case 'mute': if (ids.includes(action.id)) { this.stop(); this.state.muted = this.state.muted.includes(action.id) ? this.state.muted.filter(id => id !== action.id) : [...this.state.muted, action.id]; } break;
      case 'settings': {
        const p = action.patch;
        if (!p || typeof p !== 'object') return;
        for (const key of ['dnd', 'autonomous', 'petsVisible'] as const) if (typeof p[key] === 'boolean') this.state.settings[key] = p[key];
        if (Number.isFinite(p.intimacy)) this.state.settings.intimacy = Math.max(0, Math.min(100, p.intimacy!));
        if (typeof p.model === 'string') this.state.settings.model = p.model.trim().slice(0, 120);
        if (providers.some(v => v.id === p.provider)) this.state.settings.provider = p.provider!;
        if (p.mode === 'demo' || p.mode === 'api') this.state.settings.mode = p.mode;
        if (p.mode || p.model !== undefined || p.provider || p.dnd === true || p.autonomous === false) this.stop();
        if(p.dnd===true)this.freezeRoom();
        break;
      }
      case 'focus': {
        if (!Number.isFinite(action.minutes) || action.minutes < 1 || action.minutes > 180) { this.add('system', '专注时长可以设为 1 到 180 分钟。'); return; }
        if (this.state.focus) { this.add('system', '已经有一段专注计时在进行，结束或取消后再开始吧。'); return; }
        const active = ids.filter(id => !this.state.muted.includes(id));
        const owner = active.includes('rin') ? 'rin' : active[0];
        if (!owner) { this.add('system', '让至少一位伙伴解除静音，再一起开始吧。'); return; }
        this.stop(); this.state.focus = { id: crypto.randomUUID(), endAt: Date.now() + action.minutes * 60_000, minutes: action.minutes, owner };
        this.add('system', `专注开始 · ${action.minutes} 分钟 · ${byId[owner].name}负责计时`);
        await this.sequence([
          { speaker: owner, text: `计时交给我。这 ${action.minutes} 分钟我们会安静陪你，结束再叫你。` },
          ...active.filter(id => id !== owner).slice(0, 1).map(speaker => ({ speaker, text: speaker === 'xia' ? '我也报名！那我就负责给你加油，现在先不打扰啦。' : '那我就在这里坐一会儿。你慢慢来。' })),
        ]); return;
      }
      case 'cancel-focus': this.stop(); this.state.focus = null; this.add('system', '这段专注已结束计时，按自己的节奏来就好。'); this.stop(); return;
      case 'banter':
        if (this.state.focus) { this.add('system', '专注期间先安静陪伴，结束后再聊天。'); return; }
        this.stop();this.playSocial(socialScenes[this.socialIndex++%socialScenes.length].id);this.tick();return;
      case 'stop': this.stop();this.freezeRoom(); return;
      case 'remember': {
        if (typeof action.text !== 'string') return; const text = action.text.trim().slice(0, 500); if (!text) return;
        if (!this.state.memories.some(m => m.text === text)) this.state.memories.push({ id: crypto.randomUUID(), text, at: Date.now() });
        this.state.memories = this.state.memories.slice(-100); this.add('system', '已经记下了。你随时可以在「共同记忆」里删除。'); return;
      }
      case 'forget': this.state.memories = this.state.memories.filter(m => m.id !== action.id); break;
      case 'clear-chat': this.stop(); this.state.messages = []; this.add('system', '从这里开始一段新对话。共同记忆仍保留，可单独管理。'); return;
      case 'move': if (ids.includes(action.id) && [action.x, action.y, action.displayId].every(Number.isFinite)) {delete this.state.desktopMoves[action.id];this.state.pets[action.id] = { x: Math.max(0, Math.min(1, action.x)), y: Math.max(0, Math.min(1, action.y)), displayId: action.displayId };} break;
      default: throw new Error('不支持的操作');
    }
    this.publish();
  }
  tick(now = Date.now()) {
    if(!this.state.settings.dnd)for(const r of this.state.reminders)if(r.enabled&&now>=r.nextAt){r.nextAt=now+r.intervalMinutes*60000;const actor=ids.find(id=>!this.state.muted.includes(id));if(actor){this.perform(actor,{action:'wave',emotion:'happy',bubble:r.text,duration:10},'local',now);this.add(actor,`${this.state.relationship.address}，${r.text}`);}}
    let changed=false;
    const due=this.scene.filter(item=>item.at<=now);this.scene=this.scene.filter(item=>item.at>now);
    for(const item of due){if(this.state.muted.includes(item.actor))continue;try{this.perform(item.actor,item.intent,'local',now);if(item.speech)this.add(item.actor,item.speech);}catch{}}
    for(const id of ids){const r=this.state.room.residents[id];if(r.arrivesAt&&now>=r.arrivesAt){r.arrivesAt=0;r.startedAt=0;r.from={x:r.x,y:r.y};this.state.bodies[id].pose=r.after;changed=true;}if(this.state.bodies[id].until&&now>this.state.bodies[id].until){this.state.bodies[id]=restingBody();changed=true;}}
    for(const id of ids){const d=this.state.desktopMoves[id];if(d&&now>=d.arrivesAt){this.state.pets[id]={...d.to,displayId:d.displayId};delete this.state.desktopMoves[id];changed=true;}}
    if(changed)this.publish();
    if(now>=this.nextBookmark){
      this.nextBookmark=now+95000;
      if(this.state.settings.autonomous&&this.state.room.autonomous&&!this.state.settings.dnd&&!this.state.focus&&!this.state.busy&&!this.scene.length&&!this.state.muted.includes('rin')&&!this.state.bodies.rin.until&&!this.state.desktopMoves.rin&&!this.state.room.residents.rin.arrivesAt){
        this.perform('rin',{action:'think',emotion:'neutral',duration:6},'local',now,{kind:'bookmark',startedAt:now});
        this.state.bodies.rin.label='整理书签';this.publish();
      }
    }
    if(!this.state.settings.dnd&&!this.state.focus&&!this.state.busy&&this.state.room.autonomous&&!this.scene.length&&now>=this.nextSocial){this.playSocial(socialScenes[this.socialIndex++%socialScenes.length].id,now);}
    if(!this.state.settings.dnd&&!this.state.focus&&!this.state.busy&&this.state.room.autonomous&&this.state.room.wandering&&!this.scene.length&&now>=this.nextRoomLife){
      this.nextRoomLife=now+60000;
      const active=ids.filter(id=>!this.state.muted.includes(id));
      const id=active[this.lifeIndex++%Math.max(1,active.length)];
      if(id){const action=id==='rin'||id==='kimi'?'read':id==='glm'?'water':this.lifeIndex%4===0?'walk':'sit';try{this.perform(id,{action,emotion:'neutral'},'local',now);}catch{}}
    }
    if (this.state.focus && now >= this.state.focus.endAt) {
      const task = this.state.focus; this.state.focus = null;
      for (const id of ids) { this.state.mood[id] = 'idle'; this.state.affection[id] = Math.min(100, this.state.affection[id] + 1); }
      this.state.activity = '专注结束，休息一下吧';
      this.add('system', `${task.minutes} 分钟专注已结束。辛苦了，给自己一点休息时间。`);
      if (!this.state.settings.dnd && !this.state.muted.includes(task.owner)) this.add(task.owner, '时间到了。现在可以伸个懒腰，我会继续在这里。');
      return;
    }
    if (this.state.settings.dnd || !this.state.settings.autonomous || this.state.focus || this.state.busy || now < this.nextAutonomous || now - this.lastInteraction < 120_000) return;
    this.nextAutonomous = now + 10 * 60_000;
    const speaker = ids.find(id => !this.state.muted.includes(id));
    if (speaker) this.add(speaker, '我们还在这里。忙完之后，要不要一起休息一会儿？');
  }
}
