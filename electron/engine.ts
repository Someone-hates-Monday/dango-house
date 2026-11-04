import {clipById,clipByTitle,socialDeepseekClip} from '../src/shared/deepseek-animation';
import {deepseekClips} from '../src/shared/deepseek-clips';
import type {Interaction} from '../src/shared/motion';
import { byId, providers } from '../src/shared/characters';
import { socialScenes, relationshipKey } from '../src/shared/social';
import { chooseSpeakers, demoReply, initialState, praiseLines, ids } from '../src/shared/director';
import type { Action, AppState, CharacterId, Message, AvatarIntent, Emotion } from '../src/shared/types';
import { boundedPoint, defaultFurniture, inferredIntent, poseForAction, restingBody, residentPosition, targetDescription, validatedIntent } from '../src/shared/world';
import { emptyAgentUi } from '../src/shared/agent';
import { isAppLocale, translate } from '../src/shared/i18n';
import {
  feedLine, focusDialogue, hoverLine, jealousLine, localizedProfile, localizedScene,
  patLine, privateGreeting, praiseUserLine, showcaseCopy, tripLine,
} from '../src/shared/dialogue/pack';
import { AgentRuntime, defaultBrowseGrants, defaultWatchGrants } from './agent/runtime';
import { applyFavor, rivalryEscalationBubbles, rivalryEscalationCast, shouldEscalateRivalry } from '../src/shared/favor';
import { pickYuriScene, shareSnackBubble, yuriScenes } from '../src/shared/social-yuri';
import { bondOf, cpPartner } from '../src/shared/bonds';
import { inferCastPreset, mutedForPreset } from '../src/shared/cast';
type Generate = (state: AppState, id: CharacterId, text: string, signal: AbortSignal, update: (text: string) => void, act: (intent:AvatarIntent)=>string) => Promise<string>;
export class GardenEngine {
  state: AppState;
  agent?: AgentRuntime;
  private abort?: AbortController;
  private epoch = 0;
  private lastInteraction = Date.now();
  private nextAutonomous = Date.now() + 10 * 60_000;
  private nextRoomLife = Date.now()+60000;
  private lifeIndex = 0;
  private nextSocial = Date.now()+180000;
  private socialIndex = 0;
  private yuriIndex = 0;
  private scene: {at:number;actor:CharacterId;intent:AvatarIntent;speech?:string}[] = [];
  private privateOpened: {id:CharacterId;at:number}|null=null;
  private hovered: Partial<Record<CharacterId,number>>={};
  private lastGreeting=0;
  private nextDeepseek=Date.now()+120000;
  private lastDeepseekClip="";
  private nextBookmark=Date.now()+95000;
  constructor(state: AppState = initialState(), private notify: (state: AppState) => void = () => {}, private generate?: Generate, private delay = 650) {
    this.state = state;
    if (!this.state.agent) this.state.agent = emptyAgentUi();
    if (!this.state.favor) this.state.favor = { focusId: null, streak: 0 };
    if (!this.state.settings.pairTone) this.state.settings.pairTone = 'warm';
    if (!this.state.characterProviders) this.state.characterProviders = {};
    if (!this.state.settings.castPreset) this.state.settings.castPreset = inferCastPreset(this.state.muted);
  }
  /** Wire the independent agent runtime. Chat stop() must not cancel these tasks. */
  enableAgent(mediaCacheDir: string) {
    this.agent = new AgentRuntime({
      mediaCacheDir,
      notify: ui => { this.state.agent = ui; this.publish(); },
      perform: (id, intent) => this.perform(id, intent, 'local'),
      say: (speaker, text, kind) => { this.add(speaker, text, kind); },
      activeCharacters: () => ids.filter(id => !this.state.muted.includes(id)),
      locale: () => this.state.settings.locale,
    });
    this.state.agent = this.agent.getUi();
  }
  private locale() { return this.state.settings.locale; }
  private t(key: string, vars?: Record<string, string | number>) { return translate(this.locale(), key, vars); }
  publish() { this.state.revision++; this.notify(this.state); }
  add(speaker: Message['speaker'], text: string, kind?: Message['kind']) {
    const message = { id: crypto.randomUUID(), speaker, text, at: Date.now(), kind };
    this.state.messages.push(message); this.state.messages = this.state.messages.slice(-500); this.publish(); return message;
  }
  private addPrivate(id:CharacterId,speaker:Message['speaker'],text:string){const message={id:crypto.randomUUID(),speaker,text,at:Date.now()};this.state.privateMessages[id].push(message);this.state.privateMessages[id]=this.state.privateMessages[id].slice(-200);this.publish();return message;}
  perform(id:CharacterId,value:unknown,source:'local'|'model'='local',now=Date.now(),interaction?:Interaction) {
    if(!ids.includes(id))throw new Error(this.t('sys.unknownCharacter'));
    const intent=validatedIntent(value);
    if(id==='xia'&&!interaction){const clipId=socialDeepseekClip(intent.action,intent.bubble??'',now);if(clipId)interaction={kind:'clip',clipId,startedAt:now};}
    const resident=this.state.room.residents[id];
    const current=residentPosition(resident,now);let point: {x:number;y:number}|undefined;
    let target=intent.target;
    if(!target&&['read','sit','water','eat','sleep'].includes(intent.action)) target=this.state.room.furniture.find(f=>f.kind===({read:'bookshelf',sit:'sofa',water:'plant',eat:'table',sleep:'cushion'} as Record<string,string>)[intent.action])?.id;
    if(target){const obj=this.state.room.furniture.find(f=>f.id===target);const other=ids.find(other=>other===target||byId[other].name.toLowerCase()===target!.toLowerCase());if(obj)point=boundedPoint(obj.x+6,obj.y+9);else if(other&&other!==id){const p=residentPosition(this.state.room.residents[other],now);point=boundedPoint(p.x+9,p.y+2);}else throw new Error(this.t('sys.badTarget'));}
    if(intent.action==='walk'&&!point)point=boundedPoint(intent.x??current.x+(this.lifeIndex%2?10:-10),intent.y??current.y);
    if(!this.state.room.wandering)point=undefined;
    const targetId=ids.find(other=>other===target||byId[other].name.toLowerCase()===target?.toLowerCase());
    if(targetId&&targetId!==id){const key=relationshipKey(id,targetId);this.state.bonds[key]=Math.min(100,(this.state.bonds[key]??0)+2);if(source==='model')this.scene.push({at:now+3500,actor:targetId,intent:{action:'wave',emotion:'happy',bubble:localizedProfile(this.locale(),targetId).response,duration:7}});}
    const after=poseForAction(intent.action); const duration=intent.duration!*1000;
    const moving=point&&Math.hypot(point.x-current.x,point.y-current.y)>1;
    const travel=moving?Math.max(800,Math.min(5500,Math.hypot(point!.x-current.x,point!.y-current.y)*85)):0;
    if(moving)this.state.room.residents[id]={...point!,from:current,startedAt:now,arrivesAt:now+travel,after,destination:target?targetDescription(target,this.state.room.furniture):this.t('sys.nearby')};
    else if(intent.action!=='approach')this.state.room.residents[id]={...resident,...current,from:current,startedAt:0,arrivesAt:0,after,destination:''};
    const labels:Record<string,string>={wave:this.t('act.wave'),jump:this.t('act.jump'),celebrate:this.t('act.celebrate'),think:this.t('act.think'),read:this.t('act.read'),shy:this.t('act.shy'),sad:this.t('act.sad'),sit:this.t('act.sit'),water:this.t('act.water'),eat:this.t('act.eat'),sleep:this.t('act.sleep'),walk:this.t('act.walk'),approach:this.t('act.approach'),idle:this.t('act.idle')};
    this.state.bodies[id]={pose:moving?(point!.x>current.x?'walk-right':'walk-left'):after,emotion:intent.emotion??({shy:'shy',sad:'sad',celebrate:'happy',jump:'happy',think:'curious'} as Record<string,Emotion>)[intent.action]??'neutral',until:now+travel+duration,label:labels[intent.action],bubble:intent.bubble??'',interaction};
    const pet=this.state.pets[id];const other=target?ids.find(other=>other===target||byId[other].name.toLowerCase()===target!.toLowerCase()):undefined;
    if(pet&&moving&&this.state.room.wandering&&this.state.presentation.desktopMode==='free'){const progress=this.state.desktopMoves[id];const t=progress?Math.max(0,Math.min(1,(now-progress.startedAt)/(progress.arrivesAt-progress.startedAt))):1;const from=progress?{x:progress.from.x+(progress.to.x-progress.from.x)*t,y:progress.from.y+(progress.to.y-progress.from.y)*t}:{x:pet.x,y:pet.y};const destination=other?this.state.pets[other]:undefined;let x=from.x+(this.lifeIndex%2?0.07:-0.07),y=from.y;if(destination&&destination.displayId===pet.displayId){x=from.x+Math.max(-.22,Math.min(.22,destination.x+(from.x<destination.x?-.08:.08)-from.x));y=destination.y;}const to={x:Math.max(.02,Math.min(.95,x)),y:Math.max(.05,Math.min(.98,y))};const duration=Math.max(1000,Math.abs(to.x-from.x)*22000);this.state.desktopMoves[id]={from,to,startedAt:now,arrivesAt:now+duration,displayId:pet.displayId};this.state.bodies[id].until=Math.max(this.state.bodies[id].until,now+duration+2000);}
    this.state.room.log.unshift({id:crypto.randomUUID(),actor:id,text:`${labels[intent.action]}${target?` · ${targetDescription(target,this.state.room.furniture)}`:''}`,at:now,source});this.state.room.log=this.state.room.log.slice(0,35);this.publish();
    return this.t('sys.didAction',{name:byId[id].name,label:labels[intent.action],moving:moving?this.t('sys.movingSuffix'):''});
  }
  private freezeRoom(now=Date.now()) { this.scene=[];for(const id of ids){const p=residentPosition(this.state.room.residents[id],now);this.state.room.residents[id]={...this.state.room.residents[id],...p,from:p,startedAt:0,arrivesAt:0};const d=this.state.desktopMoves[id];if(d&&this.state.pets[id]){const t=Math.max(0,Math.min(1,(now-d.startedAt)/(d.arrivesAt-d.startedAt)));this.state.pets[id]={...this.state.pets[id]!,x:d.from.x+(d.to.x-d.from.x)*t,y:d.from.y+(d.to.y-d.from.y)*t};}delete this.state.desktopMoves[id];this.state.bodies[id]={...restingBody(),stoppedAt:now};}this.publish(); }
  private playSocial(id:string,now=Date.now()) {const story=socialScenes.find(s=>s.id===id);if(!story||story.cast.some(actor=>this.state.muted.includes(actor)))return;const loc=localizedScene(this.locale(),id);const steps=story.steps.filter(s=>!this.state.muted.includes(s.actor)&&(!s.intent.target||!this.state.muted.includes(s.intent.target as CharacterId)));this.scene=steps.map((step,i)=>{const bubble=loc?.bubbles[story.steps.indexOf(step)]??step.intent.bubble;return{at:now+i*4200,actor:step.actor,intent:{...step.intent,bubble,duration:9},speech:bubble};});this.nextRoomLife=now+steps.length*4200+60000;this.nextSocial=now+steps.length*4200+180000;}
  private playYuri(id:string,now=Date.now()) {
    const story = yuriScenes.find(s => s.id === id);
    if (!story || story.pair.some(actor => this.state.muted.includes(actor))) return;
    const tone = this.state.settings.pairTone ?? 'warm';
    const steps = story.steps(tone).filter(s => !this.state.muted.includes(s.actor) && (!s.intent.target || !this.state.muted.includes(s.intent.target as CharacterId)));
    this.scene = steps.map((step, i) => ({ at: now + i * 4200, actor: step.actor, intent: { ...step.intent, duration: 9 }, speech: step.intent.bubble }));
    this.nextRoomLife = now + steps.length * 4200 + 60000;
    this.nextSocial = now + steps.length * 4200 + 180000;
  }
  private queueRivalryEscalation(favored: CharacterId, now = Date.now()) {
    if (this.state.settings.dnd || this.state.focus || this.state.muted.includes(favored)) return;
    if (!shouldEscalateRivalry(this.state)) return;
    const cast = rivalryEscalationCast(this.state, favored);
    if (!cast.length) return;
    const bubbles = rivalryEscalationBubbles(this.state.settings.pairTone ?? 'warm', favored, cast);
    const queue = bubbles.map((line, i) => ({
      at: now + 900 + i * 1400,
      actor: line.actor,
      intent: { action: i === 0 ? 'approach' : 'shy', target: i === 0 ? favored : undefined, emotion: 'shy' as const, bubble: line.bubble, duration: 8 },
      speech: line.bubble,
    }));
    this.scene = [...queue, ...this.scene];
    this.add('system', this.t('sys.favorRivalry', { name: byId[favored].name, n: this.state.favor.streak }), 'notice');
  }
  stop() {
    // Stops chat/demo turns only. Long agent jobs keep their own controllers.
    this.epoch++; this.abort?.abort(); this.abort = undefined; this.state.busy = false;
    for (const id of ids) this.state.mood[id] = this.state.focus ? 'focus' : 'idle';
    this.state.activity = this.state.focus ? this.t('sys.activityFocus') : this.t('sys.activityYard'); this.publish();
  }
  shutdownAgents() { this.agent?.cancelAll(); }
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
        this.state.mood[line.speaker] = 'talk'; this.state.activity = this.t('sys.thinking',{name:byId[line.speaker].name}); this.publish();
        await this.wait(controller.signal);
        if (round !== this.epoch) break;
        if (useApi && this.generate) {
          const message = channel?this.addPrivate(channel,line.speaker,''):this.add(line.speaker, '');
          try {
            let acted=false;
            const context=channel?{...this.state,messages:this.state.privateMessages[channel]}:this.state;
            const result = await this.generate(context, line.speaker, input, controller.signal, text => { if (round === this.epoch) { message.text = text; this.publish(); } },intent=>{if(round!==this.epoch||controller.signal.aborted)throw new Error(this.t('sys.roundCancelled'));acted=true;return this.perform(line.speaker,intent,'model');});
            if (round === this.epoch) { message.text = result; if (!result.trim()) throw new Error(this.t('sys.emptyModel')); }
            if(round===this.epoch&&!acted)this.perform(line.speaker,inferredIntent(result));
          } catch (error) {
            if (round !== this.epoch) { if (!message.text) {if(channel)this.state.privateMessages[channel]=this.state.privateMessages[channel].filter(m=>m.id!==message.id);else this.state.messages = this.state.messages.filter(m => m.id !== message.id);} break; }
            if (!message.text){if(channel)this.state.privateMessages[channel]=this.state.privateMessages[channel].filter(m=>m.id!==message.id);else this.state.messages = this.state.messages.filter(m => m.id !== message.id);}
            const errorText=error instanceof Error ? error.message : this.t('sys.connectFail');if(channel)this.addPrivate(channel,'system',errorText);else this.add('system',errorText,'error');break;
          }
        } else {this.perform(line.speaker,{...inferredIntent(line.text),bubble:line.text.slice(0,45)});if(channel)this.addPrivate(channel,line.speaker,line.text);else this.add(line.speaker, line.text);}
        this.state.mood[line.speaker] = this.state.focus ? 'focus' : 'idle';this.state.affection[line.speaker]=Math.min(100,this.state.affection[line.speaker]+1); this.publish();
      }
    } finally { if (round === this.epoch) this.stop(); }
  }
  async dispatch(action: Action) {
    if (!action || typeof action !== 'object') throw new Error(this.t('sys.badAction'));
    this.lastInteraction = Date.now();
    switch (action.type) {
      case 'send': {
        if (typeof action.text !== 'string' || !action.text.trim()) return;
        const text = action.text.trim().slice(0, 4000); this.scene=[];this.stop(); this.add('user', text);
        const selected = chooseSpeakers(this.state, text, action.target);
        if (!selected.length) { this.add('system', this.t('sys.muted')); return; }
        if(/(挥手|跳一|跳舞|走一|走走|看书|读书|害羞|坐下|浇水|wave|jump|walk|read|shy|sit|water|手を振|ジャンプ|歩く|読む)/i.test(text)&&this.state.settings.mode==='demo') {const matched=/(挥手|wave|手を振)/i.test(text)?'wave':/(跳|jump|ジャンプ)/i.test(text)?'jump':/(走|walk|歩く)/i.test(text)?'walk':/(书|read|読む)/i.test(text)?'read':/(害羞|shy)/i.test(text)?'shy':/(浇水|water)/i.test(text)?'water':'sit';this.perform(selected[0],{action:matched,bubble:this.t('sys.demoAckBubble')});this.add(selected[0],this.t('sys.demoAck'));return;}
        if (/^(?:请)?(?:陪我|和我一起|一起|开始|开启)(?:一个|一段)?(?:专注|番茄钟)|^(?:专注|番茄钟)(?:\s*\d+\s*分钟)?[吧。！!？?]?$|^(?:focus|pomodoro)(?:\s*\d+\s*(?:min|minutes)?)?$/i.test(text)) {
          const match = text.match(/(\d+)\s*(?:分钟|min|minutes)?/i); await this.dispatch({ type: 'focus', minutes: match ? Number(match[1]) : 25 }); return;
        }
        if (/记住[：:，, ]|remember[:：, ]/i.test(text)) { const memory = text.split(/记住[：:，, ]|remember[:：, ]/i).slice(1).join('').trim(); if (memory) await this.dispatch({ type: 'remember', text: memory }); }
        if (this.state.settings.mode === 'api' && (!this.generate || !this.state.settings.model)) { this.add('system', this.t('sys.needApi'), 'error'); return; }
        await this.sequence(selected.map((speaker, i) => ({ speaker, text: demoReply(speaker, text, this.state.settings.intimacy, i, this.locale()) })), this.state.settings.mode === 'api', text); return;
      }
      case 'presentation': {const p=action.patch;if(p.desktopMode==='dock'||p.desktopMode==='free'){this.freezeRoom();this.state.presentation.desktopMode=p.desktopMode;}if(p.chatForm==='portrait'||p.chatForm==='chibi')this.state.presentation.chatForm=p.chatForm;break;}
      case 'select': if (ids.includes(action.id)) this.state.selected = action.id; break;
      case 'trip': {if(!ids.includes(action.id))return;this.perform(action.id,{action:'sad',emotion:'sad',bubble:tripLine(this.locale()),duration:9},'local',Date.now(),{kind:'trip',startedAt:Date.now()});return;}
      case 'pat': {if(!ids.includes(action.id))return;this.state.affection[action.id]=Math.min(100,this.state.affection[action.id]+2);applyFavor(this.state,action.id,1);this.perform(action.id,{action:'shy',emotion:'happy',bubble:patLine(this.locale(),action.id),duration:7},'local',Date.now(),{kind:'pat',startedAt:Date.now()});this.queueRivalryEscalation(action.id);return;}
      case 'feed': {
        if(!ids.includes(action.id)||!['rice','cake','fish','tea'].includes(action.food))return;
        const name=this.t('food.'+action.food);
        const favorite=action.id==='xia'&&action.food==='rice'||action.id==='gemini'&&action.food==='fish'||action.id==='rin'&&action.food==='tea'||action.id==='kimi'&&action.food==='cake';
        this.state.affection[action.id]=Math.min(100,this.state.affection[action.id]+(favorite?4:2));
        applyFavor(this.state,action.id,2);
        const now=Date.now();
        this.perform(action.id,{action:'eat',emotion:'happy',bubble:feedLine(this.locale(),action.id,action.food,name,this.state.relationship.address),duration:8},'local',now,{kind:'feed',startedAt:now,food:action.food});
        const partner=cpPartner(action.id);
        if(!this.state.muted.includes(partner)&&bondOf(this.state.bonds,action.id,partner)>=40){
          const share=shareSnackBubble(this.state.settings.pairTone??'warm',action.id,partner,name);
          this.scene.push({at:now+2800,actor:action.id,intent:{action:'approach',target:partner,emotion:'happy',bubble:share,duration:7},speech:share});
        }
        this.queueRivalryEscalation(action.id,now);
        return;
      }
      case 'hover': {if(!ids.includes(action.id)||this.state.settings.dnd||!this.state.settings.autonomous)return;const now=Date.now();if(now-(this.hovered[action.id]??0)<90000||now-this.lastGreeting<15000)return;this.hovered[action.id]=now;this.lastGreeting=now;this.perform(action.id,{action:'wave',emotion:'happy',bubble:hoverLine(this.locale(),this.state.relationship.address,byId[action.id].name),duration:6});return;}
      case 'reminder': {if(action.operation==='remove')this.state.reminders=this.state.reminders.filter(r=>r.id!==action.id);else if(action.operation==='toggle'){const r=this.state.reminders.find(r=>r.id===action.id);if(r){r.enabled=!r.enabled;r.nextAt=Date.now()+r.intervalMinutes*60000;}}else if(typeof action.text==='string'&&action.text.trim()&&Number.isFinite(action.intervalMinutes)&&action.intervalMinutes!>=1&&action.intervalMinutes!<=1440&&this.state.reminders.length<12)this.state.reminders.push({id:crypto.randomUUID(),text:action.text.trim().slice(0,120),intervalMinutes:action.intervalMinutes!,nextAt:Date.now()+action.intervalMinutes!*60000,enabled:true});break;}
      case 'relationship': {if(!['friend','pet','romance'].includes(action.mode))return;this.state.relationship={mode:action.mode,userName:String(action.userName).slice(0,30),address:String(action.address).slice(0,30)};break;}
      case 'private-open': {
        this.stop();
        if(!ids.includes(action.id))return;this.state.selected=action.id;const now=Date.now();if(this.privateOpened?.id===action.id&&now-this.privateOpened.at<20000){this.publish();return;}this.privateOpened={id:action.id,at:now};this.state.affection[action.id]=Math.min(100,this.state.affection[action.id]+2);
        const address=this.state.relationship.address||(this.locale()==='en'?'you':this.locale()==='ja'?'あなた':'你');
        const greeting=privateGreeting(this.locale(),action.id,address);
        applyFavor(this.state,action.id,3);
        this.perform(action.id,{action:'celebrate',emotion:'happy',bubble:greeting.slice(0,52),duration:9},'local',now,{kind:'chat',startedAt:now});this.addPrivate(action.id,action.id,greeting);
        this.scene=ids.filter(id=>id!==action.id&&!this.state.muted.includes(id)).map((actor,i)=>({at:now+900+i*1100,actor,intent:{action:i===0?'approach':'shy',target:i===0?action.id:undefined,emotion:'shy',bubble:jealousLine(this.locale(),actor),duration:8}}));
        this.queueRivalryEscalation(action.id,now);
        this.publish();return;
      }
      case 'private-send': {
        if(!ids.includes(action.id)||typeof action.text!=='string'||!action.text.trim())return;this.stop();this.addPrivate(action.id,'user',action.text.trim().slice(0,4000));
        await this.sequence([{speaker:action.id,text:demoReply(action.id,action.text,this.state.settings.intimacy,0,this.locale())}],this.state.settings.mode==='api',action.text,action.id);return;
      }
      case 'companion-visit': {
        if(!ids.includes(action.id)||!ids.includes(action.target)||action.id===action.target)throw new Error('Invalid companion');
        const now=Date.now();this.perform(action.id,{action:'approach',target:action.target,emotion:'happy',bubble:localizedProfile(this.locale(),action.id).response,duration:9},'local',now);
        this.scene.push({at:now+3500,actor:action.target,intent:{action:'wave',emotion:'happy',bubble:localizedProfile(this.locale(),action.target).response,duration:9}});
        this.add(action.id,localizedProfile(this.locale(),action.id).response);return;
      }
      case 'play-clip': {
        if(action.id!=='xia')throw new Error('This video pack belongs to DeepSeek.');
        const pool=deepseekClips.filter(c=>(!action.group||c.group===action.group)&&c.id!==this.lastDeepseekClip);
        const clip=action.clipId?clipById(action.clipId):pool[Math.floor(Math.random()*pool.length)];
        if(!clip)throw new Error('Unknown animation clip');
        const now=Math.max(Date.now(),(this.state.bodies.xia.interaction?.startedAt??0)+1);
        this.lastDeepseekClip=clip.id;
        if(clip.group==='food'){this.state.affection.xia=Math.min(100,this.state.affection.xia+2);applyFavor(this.state,'xia',1);}
        this.perform('xia',{action:'think',duration:15,bubble:clip.title},'local',now,{kind:'clip',clipId:clip.id,startedAt:now});
        this.state.bodies.xia.until=now+Math.max(clip.seconds*1000+500,clip.title==='睡觉-开始'?40000:0);
        this.state.bodies.xia.label=clip.title;this.publish();return;
      }
      case 'perform': this.perform(action.id,action.intent);return;
      case 'social-scene': this.stop();this.freezeRoom();this.playSocial(action.id);this.tick();return;
      case 'yuri-scene': this.stop();this.freezeRoom();this.playYuri(action.id);this.tick();return;
      case 'connection': { if(!providers.some(p=>p.id===action.provider)||!action.profile||typeof action.profile.model!=='string'||typeof action.profile.endpoint!=='string')throw new Error(this.t('sys.badConfig'));this.state.connections[action.provider]={model:action.profile.model.trim().slice(0,120),endpoint:action.profile.endpoint.trim().slice(0,400),tools:action.profile.tools!==false};if(this.state.settings.provider===action.provider)this.state.settings.model=action.profile.model.trim();break; }
      case 'room-settings': {const p=action.patch;if(typeof p.autonomous==='boolean')this.state.room.autonomous=p.autonomous;if(typeof p.wandering==='boolean')this.state.room.wandering=p.wandering;if(p.theme==='peach'||p.theme==='night')this.state.room.theme=p.theme;if(p.wandering===false)this.freezeRoom();break;}
      case 'furniture': {
        if(action.operation==='reset'){this.state.room.furniture=defaultFurniture();break;}
        if(action.operation==='remove'){this.state.room.furniture=this.state.room.furniture.filter(f=>f.id!==action.id);break;}
        if(!['sofa','table','bookshelf','plant','lamp','cushion'].includes(action.kind??'')&&action.operation==='add')throw new Error(this.t('sys.unknownFurniture'));
        if(!Number.isFinite(action.x)||!Number.isFinite(action.y))throw new Error(this.t('sys.badPosition'));const p=boundedPoint(action.x!,action.y!);
        if(action.operation==='add'&&this.state.room.furniture.length<16)this.state.room.furniture.push({id:`${action.kind}-${crypto.randomUUID().slice(0,6)}`,kind:action.kind!,...p});
        if(action.operation==='move'){const item=this.state.room.furniture.find(f=>f.id===action.id);if(item)Object.assign(item,p);}
        break;
      }
      case 'showcase': {
        this.stop();this.freezeRoom();const now=Date.now();this.nextRoomLife=now+60000;
        const cast=ids.filter(id=>!this.state.muted.includes(id));
        const a=cast.includes('xia')?'xia':cast[0],b=cast.includes('glm')?'glm':cast[1]??a,c=cast.includes('kimi')?'kimi':cast[2]??a;if(!a)return;
        const show=showcaseCopy(this.locale());
        if(action.scene==='welcome')this.scene=cast.map((actor,i)=>{const line=show.report(byId[actor].name);return{at:now+i*750,actor,intent:{action:'wave',emotion:'happy',bubble:line},speech:line};});
        if(action.scene==='tea'){const lines=show.tea();this.scene=[{at:now,actor:a,intent:{action:'eat',target:this.state.room.furniture.find(f=>f.kind==='table')?.id,emotion:'happy',bubble:lines[0]},speech:lines[0]},{at:now+2500,actor:b,intent:{action:'approach',target:a,bubble:lines[1]},speech:lines[1]},{at:now+5500,actor:c,intent:{action:'read',target:this.state.room.furniture.find(f=>f.kind==='bookshelf')?.id,bubble:lines[2]},speech:lines[2]},{at:now+10500,actor:a,intent:{action:'jump',emotion:'happy',bubble:lines[3]},speech:lines[3]}];}
        if(action.scene==='rivalry'){const bubbles=show.rivalry();const speech=show.rivalrySpeech();this.scene=[{at:now,actor:a,intent:{action:'jump',emotion:'happy',bubble:bubbles[0]},speech:speech[0]},{at:now+2200,actor:b,intent:{action:'approach',target:a,emotion:'curious',bubble:bubbles[1]},speech:speech[1]},{at:now+5000,actor:a,intent:{action:'shy',emotion:'shy',bubble:bubbles[2]},speech:speech[2]},{at:now+8000,actor:c,intent:{action:'wave',emotion:'happy',bubble:bubbles[3]},speech:speech[3]}];}
        this.tick(now);return;
      }
      case 'skin': if (ids.includes(action.id) && (action.skin === 'chibi' || action.skin === 'animated')) this.state.skins[action.id] = byId[action.id].atlas===false?'chibi':action.skin; break;
      case 'praise': {
        if (!ids.includes(action.id)) return;
        this.stop(); this.state.selected = action.id; this.state.affection[action.id] = Math.min(100, this.state.affection[action.id] + 3);
        applyFavor(this.state, action.id, 3);
        this.add('user', praiseUserLine(this.locale(), byId[action.id].name));
        {const round=this.epoch;await this.sequence(praiseLines(action.id, this.state.settings.intimacy, this.locale()));
        // sequence starts and finishes one round; a newer request cancels this reaction.
        if(this.epoch===round+2){const now=Date.now();this.perform(action.id,{action:'shy',emotion:'happy',duration:7},'local',now,{kind:'affection',startedAt:now});this.queueRivalryEscalation(action.id,now);}}return;
      }
      case 'mute': if (ids.includes(action.id)) { this.stop(); this.freezeRoom(); this.state.muted = this.state.muted.includes(action.id) ? this.state.muted.filter(id => id !== action.id) : [...this.state.muted, action.id]; this.state.settings.castPreset = inferCastPreset(this.state.muted); } break;
      case 'cast-preset': {
        if (action.preset !== 'all' && action.preset !== 'core' && action.preset !== 'custom') return;
        this.stop();
        this.freezeRoom();
        if (action.preset === 'custom') {
          this.state.settings.castPreset = 'custom';
        } else {
          this.state.settings.castPreset = action.preset;
          this.state.muted = mutedForPreset(action.preset);
        }
        break;
      }
      case 'character-provider': {
        if (!ids.includes(action.id)) return;
        if (action.provider === null || action.provider === '') {
          delete this.state.characterProviders[action.id];
        } else if (providers.some(p => p.id === action.provider)) {
          this.state.characterProviders[action.id] = action.provider;
        }
        break;
      }
      case 'settings': {
        const p = action.patch;
        if (!p || typeof p !== 'object') return;
        for (const key of ['dnd', 'autonomous', 'petsVisible', 'agentBridge'] as const) if (typeof p[key] === 'boolean') this.state.settings[key] = p[key];
        if (Number.isFinite(p.intimacy)) this.state.settings.intimacy = Math.max(0, Math.min(100, p.intimacy!));
        if (typeof p.model === 'string') this.state.settings.model = p.model.trim().slice(0, 120);
        if (providers.some(v => v.id === p.provider)) this.state.settings.provider = p.provider!;
        if (p.mode === 'demo' || p.mode === 'api') this.state.settings.mode = p.mode;
        if (isAppLocale(p.locale)) this.state.settings.locale = p.locale;
        if (p.pairTone === 'soft' || p.pairTone === 'warm' || p.pairTone === 'vivid') this.state.settings.pairTone = p.pairTone;
        if (p.castPreset === 'all' || p.castPreset === 'core' || p.castPreset === 'custom') this.state.settings.castPreset = p.castPreset;
        if (p.mode || p.model !== undefined || p.provider || p.dnd === true || p.autonomous === false) this.stop();
        if(p.dnd===true)this.freezeRoom();
        break;
      }
      case 'focus': {
        if (!Number.isFinite(action.minutes) || action.minutes < 1 || action.minutes > 180) { this.add('system', this.t('sys.focusRange')); return; }
        if (this.state.focus) { this.add('system', this.t('sys.focusBusy')); return; }
        const active = ids.filter(id => !this.state.muted.includes(id));
        const owner = active.includes('rin') ? 'rin' : active[0];
        if (!owner) { this.add('system', this.t('sys.focusNeedMember')); return; }
        this.stop(); this.state.focus = { id: crypto.randomUUID(), endAt: Date.now() + action.minutes * 60_000, minutes: action.minutes, owner };
        this.add('system', this.t('sys.focusStart', { minutes: action.minutes, name: byId[owner].name }));
        {const focus=focusDialogue(this.locale());await this.sequence([
          { speaker: owner, text: focus.owner(action.minutes) },
          ...active.filter(id => id !== owner).slice(0, 1).map(speaker => ({ speaker, text: speaker === 'xia' ? focus.xia() : focus.other() })),
        ]);} return;
      }
      case 'cancel-focus': this.stop(); this.state.focus = null; this.add('system', this.t('sys.focusCancel')); this.stop(); return;
      case 'banter':
        if (this.state.focus) { this.add('system', this.t('sys.focusQuiet')); return; }
        this.stop();this.playSocial(socialScenes[this.socialIndex++%socialScenes.length].id);this.tick();return;
      case 'stop': this.stop();this.freezeRoom(); return;
      case 'watch-start': {
        if (!this.agent) { this.add('system', this.t('sys.watchNotReady'), 'error'); return; }
        if (typeof action.path !== 'string' || !action.path.trim()) { this.add('system', this.t('sys.watchNeedFile'), 'error'); return; }
        const speakers = Array.isArray(action.speakers)
          ? action.speakers.filter(id => ids.includes(id) && !this.state.muted.includes(id))
          : undefined;
        const videoName = action.displayName || this.t('sys.localVideo');
        this.add('system', this.t('sys.watchImport', { name: videoName }), 'notice');
        await this.agent.start({
          kind: 'watch_party',
          goal: this.t('sys.watchGoal', { name: action.displayName || action.path }),
          speakers,
          grants: defaultWatchGrants(),
          source: {
            kind: 'local_file',
            value: action.path,
            displayName: action.displayName,
            sidecarCaptionPath: action.captionPath,
          },
        });
        return;
      }
      case 'browse-start': {
        if (!this.agent) { this.add('system', this.t('sys.watchNotReady'), 'error'); return; }
        const query = typeof action.query === 'string' ? action.query.trim().slice(0, 160) : '';
        if (!query) { this.add('system', this.t('sys.browseNeedQuery'), 'error'); return; }
        const actor = action.actor && ids.includes(action.actor) ? action.actor : ids.find(id => !this.state.muted.includes(id));
        this.add('system', this.t('sys.browseStart', { query }), 'notice');
        await this.agent.start({
          kind: 'browse',
          goal: this.t('sys.browseGoal', { query }),
          actor,
          grants: defaultBrowseGrants(),
          budget: { maxSteps: 8, maxMs: 90_000, maxSpeakers: 1, maxDiscussionTurns: 0, maxMediaSeconds: 0 },
          source: { kind: 'url', value: query, displayName: query },
        });
        return;
      }
      case 'agent-control': {
        if (!this.agent) return;
        if (typeof action.id !== 'string' || !['pause', 'resume', 'cancel'].includes(action.command)) throw new Error(this.t('sys.badTaskControl'));
        await this.agent.control(action.id, action.command);
        return;
      }
      case 'watch-clear': {
        this.state.agent = { ...this.state.agent, watchParty: null, events: this.state.agent.events.filter(e => e.kind !== 'discussion_turn') };
        this.publish();
        return;
      }
      case 'remember': {
        if (typeof action.text !== 'string') return; const text = action.text.trim().slice(0, 500); if (!text) return;
        if (!this.state.memories.some(m => m.text === text)) this.state.memories.push({ id: crypto.randomUUID(), text, at: Date.now() });
        this.state.memories = this.state.memories.slice(-100); this.add('system', this.t('sys.remembered')); return;
      }
      case 'forget': this.state.memories = this.state.memories.filter(m => m.id !== action.id); break;
      case 'clear-chat': this.stop(); this.state.messages = []; this.add('system', this.t('sys.cleared')); return;
      case 'move': if (ids.includes(action.id) && [action.x, action.y, action.displayId].every(Number.isFinite)) {delete this.state.desktopMoves[action.id];this.state.pets[action.id] = { x: Math.max(0, Math.min(1, action.x)), y: Math.max(0, Math.min(1, action.y)), displayId: action.displayId };} break;
      default: throw new Error(this.t('sys.unsupported'));
    }
    this.publish();
  }
  tick(now = Date.now()) {
    if(!this.state.settings.dnd)for(const r of this.state.reminders)if(r.enabled&&now>=r.nextAt){r.nextAt=now+r.intervalMinutes*60000;const actor=ids.find(id=>!this.state.muted.includes(id));if(actor){this.perform(actor,{action:'wave',emotion:'happy',bubble:r.text,duration:10},'local',now);this.add(actor,`${this.state.relationship.address}，${r.text}`);}}
    let changed=false;
    const due=this.scene.filter(item=>item.at<=now);this.scene=this.scene.filter(item=>item.at>now);
    for(const item of due){if(this.state.muted.includes(item.actor)||this.state.muted.includes(item.intent.target as CharacterId))continue;try{this.perform(item.actor,item.intent,'local',now);if(item.speech)this.add(item.actor,item.speech);}catch{}}
    for(const id of ids){const r=this.state.room.residents[id];if(r.arrivesAt&&now>=r.arrivesAt){r.arrivesAt=0;r.startedAt=0;r.from={x:r.x,y:r.y};this.state.bodies[id].pose=r.after;changed=true;}if(this.state.bodies[id].until&&now>this.state.bodies[id].until){this.state.bodies[id]=restingBody();changed=true;}}
    for(const id of ids){const d=this.state.desktopMoves[id];if(d&&now>=d.arrivesAt){this.state.pets[id]={...d.to,displayId:d.displayId};delete this.state.desktopMoves[id];changed=true;}}
    if(changed)this.publish();
    if(now>=this.nextDeepseek){
      this.nextDeepseek=now+120000;
      if(this.state.settings.autonomous&&this.state.room.autonomous&&!this.state.settings.dnd&&!this.state.focus&&!this.state.busy&&!this.scene.length&&!this.state.muted.includes('xia')&&!this.state.bodies.xia.until){
        const pool=['东张西望','超大伸懒腰','悠闲哼歌','原地专心玩魔方'].map(clipByTitle).filter(c=>c&&c.id!==this.lastDeepseekClip);
        const clip=pool[this.lifeIndex++%pool.length];if(clip){this.lastDeepseekClip=clip.id;this.perform('xia',{action:'think',duration:15},'local',now,{kind:'clip',clipId:clip.id,startedAt:now});this.state.bodies.xia.until=now+clip.seconds*1000+500;this.publish();}
      }
    }
    if(now>=this.nextBookmark){
      this.nextBookmark=now+95000;
      if(this.state.settings.autonomous&&this.state.room.autonomous&&!this.state.settings.dnd&&!this.state.focus&&!this.state.busy&&!this.scene.length&&!this.state.muted.includes('rin')&&!this.state.bodies.rin.until&&!this.state.desktopMoves.rin&&!this.state.room.residents.rin.arrivesAt){
        this.perform('rin',{action:'think',emotion:'neutral',duration:6},'local',now,{kind:'bookmark',startedAt:now});
        this.state.bodies.rin.label=this.t('sys.bookmarkLabel');this.publish();
      }
    }
    if(this.state.settings.autonomous&&!this.state.settings.dnd&&!this.state.focus&&!this.state.busy&&this.state.room.autonomous&&!this.scene.length&&now>=this.nextSocial){
      const yuri = pickYuriScene(this.state.bonds, this.state.muted, this.yuriIndex++);
      if (yuri && this.yuriIndex % 2 === 0) this.playYuri(yuri.id, now);
      else this.playSocial(socialScenes[this.socialIndex++%socialScenes.length].id,now);
    }
    if(this.state.settings.autonomous&&!this.state.settings.dnd&&!this.state.focus&&!this.state.busy&&this.state.room.autonomous&&this.state.room.wandering&&!this.scene.length&&now>=this.nextRoomLife){
      this.nextRoomLife=now+60000;
      const active=ids.filter(id=>!this.state.muted.includes(id));
      const id=active[this.lifeIndex++%Math.max(1,active.length)];
      if(id){const action=id==='rin'||id==='kimi'?'read':id==='glm'?'water':this.lifeIndex%4===0?'walk':'sit';try{this.perform(id,{action,emotion:'neutral'},'local',now);}catch{}}
    }
    if (this.state.focus && now >= this.state.focus.endAt) {
      const task = this.state.focus; this.state.focus = null;
      for (const id of ids) { this.state.mood[id] = 'idle'; this.state.affection[id] = Math.min(100, this.state.affection[id] + 1); }
      this.state.activity = this.t('sys.focusDone');
      this.add('system', this.t('sys.focusEnded', { minutes: task.minutes }));
      if (!this.state.settings.dnd && !this.state.muted.includes(task.owner)) this.add(task.owner, this.t('sys.focusOwnerDone'));
      return;
    }
    if (this.state.settings.dnd || !this.state.settings.autonomous || this.state.focus || this.state.busy || now < this.nextAutonomous || now - this.lastInteraction < 120_000) return;
    this.nextAutonomous = now + 10 * 60_000;
    const speaker = ids.find(id => !this.state.muted.includes(id));
    if (speaker) this.add(speaker, this.t('sys.idleNudge'));
  }
}
