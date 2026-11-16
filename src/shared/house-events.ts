import {speechDuration} from './house-speech';
import {characterVoiceReference,companionResponseGuide,interactionGuidance,companionVoiceRevision} from './companion-voice';
import type {AppState,AvatarIntent,CharacterId,CgAssetId,ReplyOrigin,MessageAddress} from './types';
import {speakingCast} from './cast';
import {validatedIntent} from './world';
import {cgClip,cgClips,isCgAssetId} from './cg-catalog';
import {allowsEventCg,isUserIntimacy} from './cg-policy';
import {socialProfiles} from './social';
import {houseSpots} from './house-navigation';
import {residentPosition} from './world';

export type HousePlayMode='together'|'self-play';
export interface CompanionInvitation {target?:CharacterId;topic?:string;playMode?:HousePlayMode}
export interface HouseEvent {id:string;at:number;kind:string;actor?:CharacterId;target?:CharacterId;text?:string;food?:string;privateGreeting?:boolean;playfulRivalry?:boolean}
export interface HouseBeat extends MessageAddress {actor:CharacterId;text:string;intent:AvatarIntent;channel?:CharacterId;replyTo?:CharacterId;stay?:boolean}
export interface HousePlan {cgRequested?:boolean;focus?:'user'|'companions';playMode?:HousePlayMode;beats:HouseBeat[];cgAsset?:CgAssetId;gather?:{actors:CharacterId[];target:string};origin:ReplyOrigin}
export type HouseGenerate=(state:AppState,event:HouseEvent,signal:AbortSignal)=>Promise<HousePlan>;

/** Direct attention belongs to the user unless they explicitly request a companion scene. */
export function houseFocus(event:HouseEvent,proposed?:'user'|'companions'):'user'|'companions'{
 if(event.kind==='message'&&proposed)return proposed;
 if(['autonomous','visit','story'].includes(event.kind))return 'companions';
 if(event.kind!=='message')return 'user';
 const text=event.text??'';
 if(/你们自己|among yourselves/i.test(text))return 'companions';
 if(/陪我|和我|跟我|给我|抱抱我|喜欢我|对我|with me|to me|love me/i.test(text))return 'user';
 if(/互相|相互|互动|彼此|贴贴|一起到|一起去|each other/i.test(text))return 'companions';
 return /(?:你们|你俩|你们俩).*(?:聊|说)|一起.*(?:聊|坐)|talk together/i.test(text)?'companions':'user';
}
export function allowsHouseCg(state:AppState,event:HouseEvent,asset:CgAssetId,focus?:'user'|'companions'){
 return allowsEventCg(state,asset)&&(houseFocus(event,focus)==='companions'?!isUserIntimacy(asset):isUserIntimacy(asset)&&(!event.actor||cgClip(asset).participants.includes(event.actor)));
}
export function modelContextMessages(state:AppState){
 const messages=state.messages.filter(m=>m.text),first=messages.findIndex(m=>m.origin?.backend==='model'&&m.origin.voiceRevision===companionVoiceRevision);
 // Keep the transcript, but don't teach a revised persona with its obsolete prose.
 if(first<0){const last=messages.slice().reverse().find(m=>m.speaker==='user');return last?[last]:[];}
 const start=first>0&&messages[first-1].speaker==='user'?first-1:first;
 return messages.slice(start).filter(m=>m.speaker==='user'||m.origin?.backend==='model'&&m.origin.voiceRevision===companionVoiceRevision);
}

/** Validate the complete plan before any speech or action is dispatched. */
export function parseHousePlan(raw:string,state:AppState,event:HouseEvent,origin:ReplyOrigin):HousePlan{
 const cleaned=raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 const value=JSON.parse(cleaned);
 if(!value||!Array.isArray(value.beats)||value.beats.length>6)throw Error('Invalid house response');
 if(!value.beats.length&&event.kind!=='autonomous')throw Error('The model returned no response to the interaction');
 const active=speakingCast(state);
 const proposedFocus=typeof value.focus==='string'?value.focus.trim().toLowerCase():value.focus;
 if(event.kind==='message'&&proposedFocus!=null&&!['user','companions'].includes(proposedFocus))throw Error('Invalid scene focus');
 const focus=houseFocus(event,event.kind==='message'?proposedFocus:undefined);
 if(event.kind==='message'&&value.playMode!=null&&!['together','self-play'].includes(value.playMode))throw Error('Invalid play mode');
 const playMode=event.kind==='message'?(value.playMode??undefined):undefined;
 const beats=value.beats.map((b:unknown):HouseBeat=>{
  const x=b as Record<string,unknown>;
  if(!x||typeof x.actor!=='string'||!active.includes(x.actor as CharacterId)||(x.text!=null&&typeof x.text!=='string'))throw Error('Invalid house speaker or text');
  const text=typeof x.text==='string'?x.text.trim():'';
  if(text.length>240||(!text&&!x.intent))throw Error('Invalid house speaker or text');
  const actor=x.actor as CharacterId;
  const intent=validatedIntent(state.connections[state.settings.provider]?.tools===false?{action:'idle'}:x.intent??{action:'idle'});
  // The viewer has no world-space avatar. A user-directed expression is valid,
  // but must never try to walk to an invented furniture/character target.
  if(intent.target&&['user','you','用户','你'].includes(intent.target.trim().toLowerCase())){
   intent.target=undefined;if(intent.action==='approach'||intent.action==='walk')intent.action='idle';
  }
  if(intent.target&&!houseSpots[intent.target]&&!state.room.furniture.some(f=>f.id===intent.target)&&!active.includes(intent.target as CharacterId))throw Error('Invalid house target');
  const channel=event.privateGreeting&&actor===event.actor?actor:undefined;
  const viewer=typeof x.replyTo==='string'&&['user','you','用户','你'].includes(x.replyTo.toLowerCase());
  const replyTo=channel||viewer?undefined:x.replyTo as CharacterId|undefined;
  if(typeof x.audience==='string')x.audience=x.audience.trim().toLowerCase();
  if(x.audience!=null&&!['user','companions','group'].includes(String(x.audience)))throw Error('Invalid speech audience');
  const audience:MessageAddress['audience']=replyTo?'companions':channel||viewer?'user':(x.audience as MessageAddress['audience'])??(focus==='user'?'user':'companions');
  if(replyTo!=null&&(!active.includes(replyTo)||replyTo===actor))throw Error('Invalid reply target');
  const stay=x.stay===true;if(stay){intent.target=undefined;intent.x=undefined;intent.y=undefined;if(intent.action==='walk'||intent.action==='approach')intent.action='idle';}
  return{actor,text,intent:{...intent,duration:Math.min(8,intent.duration??4),bubble:text.slice(0,55)},channel,replyTo,audience,stay};
 });
 if(focus==='user'&&event.actor){const index=beats.findIndex((b:HouseBeat)=>b.actor===event.actor&&b.text);if(index>0)beats.unshift(...beats.splice(index,1));}
 if(event.kind!=='autonomous'&&!beats.some((b:HouseBeat)=>b.text))throw Error('The model returned no spoken response');
 if(event.actor&&!beats.some((b:HouseBeat)=>b.actor===event.actor&&b.text)&&event.kind!=='autonomous'&&beats.length)throw Error('Requested companion must respond');
 let cgAsset:CgAssetId|undefined;
 if(value.cgAsset!=null){
  if(!isCgAssetId(value.cgAsset)||!allowsEventCg(state,value.cgAsset)||!cgClip(value.cgAsset).participants.every(id=>active.includes(id)&&beats.some((b:HouseBeat)=>b.actor===id)))throw Error('Invalid house CG');
  // A valid clip for a different audience is ignored; keep the real reply.
  if(allowsHouseCg(state,event,value.cgAsset,focus))cgAsset=value.cgAsset;
 }
 let gather:HousePlan['gather'];
 if(focus==='companions'&&value.gather!=null&&state.connections[state.settings.provider]?.tools!==false){const g=value.gather;
  if(!Array.isArray(g.actors)||g.actors.length<2||g.actors.length>3||new Set(g.actors).size!==g.actors.length||!g.actors.every((id:CharacterId)=>active.includes(id)&&beats.some((b:HouseBeat)=>b.actor===id))||typeof g.target!=='string'||(!houseSpots[g.target]&&!state.room.furniture.some(f=>f.id===g.target)))throw Error('Invalid gathering');
  gather={actors:g.actors,target:g.target};
 }
 return{beats,cgAsset,gather,origin,focus,playMode,cgRequested:value.cgRequested===true};
}

/** A shared episode should involve a partner, without forcing the entire cast to speak. */
export function needsHousePartner(state:AppState,event:HouseEvent,plan:HousePlan){
 if(event.kind!=='autonomous'&&plan.beats.some(b=>['walk','approach'].includes(b.intent.action)&&!b.intent.target&&b.intent.x==null&&b.intent.y==null)&&!plan.gather)return true;
 if(event.playfulRivalry&&event.actor&&state.settings.playfulRivalry!==false)return !plan.beats.some(b=>b.actor!==event.actor&&b.text&&!b.channel&&b.audience==='user'&&!b.replyTo);
 if(houseFocus(event,plan.focus)!=='companions'||speakingCast(state).length<2||event.kind==='autonomous')return false;

 return new Set(plan.beats.filter(b=>b.text).map(b=>b.actor)).size<2;
}
export function houseBeatPause(beat:HouseBeat){return speechDuration(beat.text);}

export function housePrompt(state:AppState,event:HouseEvent){
 const active=speakingCast(state),focus=houseFocus(event);
 return [
  'You direct a small shared home of fictional AI companions. Respond only with JSON using ALL these fields: {"focus":null,"playMode":null,"gather":null,"beats":[{"actor":"exact_id","replyTo":null,"audience":"user","stay":false,"text":"short dialogue","intent":{"action":"idle","target":null,"emotion":"happy","duration":4}}],"cgRequested":false,"cgAsset":null}. Replace exact_id with a valid cast ID, and fill movement targets instead of omitting them.',
  companionResponseGuide,
  'Dialogue direction is executable metadata: every spoken beat supplies audience:user, companions or group. For a specific companion also set replyTo to their exact ID. Never use a pronoun without knowing its referent. A user acknowledgement is audience:user; addressing a partner is audience:companions and replyTo:their_id. Listeners can react silently.',
  'One spoken beat has ONE addressee throughout. If a resident teases another girl and then invites the user, split it into two beats with different recipients; never switch who you/你 refers to inside one beat. A rival inviting the user uses audience:user and replyTo:null, not the favored girl’s ID.',
  'Choose ONE immediate shared topic/activity for an episode. Each next speaker must answer or develop the previous words/gesture, not start an unrelated monologue. Answer questions before changing topic. Prefer 15–45 Chinese characters or one short thought per turn. Do not make everyone separately thank the user or simply agree in parallel.',
  event.playfulRivalry?'This is a playful USER-ATTENTION occasion. The favored resident responds FIRST; include one other resident naturally seeking the user’s attention, then optionally a short retort. Keep it warm, distinct and concrete. This is not pair romance and must not launch a girl-girl CG. In private entry, only the selected greeting is private; rivals may publicly notice selection, not the private words.':'No mandatory rivalry this turn; keep interaction natural.',
  'When playful rivalry is allowed, it means inviting the user to choose company or join play, not blaming them. DeepSeek is open and eager; Claude quietly confident with a hint of expectation; GPT concise and reserved but welcoming; Gemini playful and keen to join; GLM lightly teasing without fees; Kimi gentle; Grok confidently funny without belittling the user. Friends/pet mode should feel inclusive, romance mode can flirt. No guilt or demands.',
  `Playful rivalry enabled: ${state.settings.playfulRivalry!==false}. Current user attention: ${JSON.stringify(state.favor)}. When the user explicitly requests playful jealousy, make a brief user-attention scene with 2–3 residents, not pair intimacy. If rivalry is disabled respect that preference.`,

  event.kind==='message'?'For this message YOU choose focus:user or companions from its meaning, not keywords. A suggestion or indirect question about visiting/playing with another girl can lead to a COMPANIONS scene if she accepts. First acknowledge the user briefly, then execute approach/gather and peer dialogue. The user explicitly encouraging a visit is NOT competing for attention; do not refuse simply to stay with the user. Ordinary greetings or touch remain user-focused.':'Focus for this event is fixed by its kind; touch never becomes an unsolicited companion scene.',
  'Set playMode:self-play only when the user says they are busy, wants you to play among yourselves or invites independent companion time. Set playMode:together when they return or request your attention again. Otherwise null. These are persistent preferences, not text to recite. Self-play means enjoy peer activities and affection without repeatedly soliciting user attention, subject to pairRomance, presence and DND. It is not abandonment or a reason to guilt the user.',
  'An accepted visit is executable: initiator approach target=partner ID; partner replyTo=initiator. Use gather when both meet elsewhere. A brief first beat may acknowledge the user with stay:true before going. CG is optional and follows the actual arrival/exchange. A requested intimate scene may use an appropriate available pair CG if all participants agree and preferences allow it.',
  `Current interaction guidance: ${interactionGuidance(event.kind)}`,
  event.kind==='message'?'Attention: USER or COMPANIONS is your semantic decision for this message. When user-focused, answer the actual user topic with normally at most two brief spoken beats; explicitly requested playful rivalry may use 3–4 beats. No compulsory A-B-A partner exchange. When the user invites residents to play/visit/be intimate or lets them play independently, an accepting resident should initiate a connected scene with movement, peer replies, gestures and optionally matching CG. Do not require explicit technical words such as gather or CG in the user message.':focus==='user'
   ? 'Default Attention: USER (unless a message semantically invites a companion scene and you choose focus:companions above). This is an interaction with the user, not a girl-girl scene. The selected/touched/fed resident responds FIRST directly to the user. Normally one reply is sufficient. For an explicit playful-rivalry occasion, use 2–3 short turns with one rival seeking the user’s attention, without redirecting affection to another girl. Do not invent a pair-romance subplot, food-sharing or gathering; playful competition for user attention is allowed as specified above. Never redirect the user’s headpat, praise or food into affection toward another girl. Respect the current topic and relationship mode.'
   : 'Attention: COMPANIONS. Plan a short connected scene: 2–5 short spoken turns involving 2–3 relevant residents. A reacts, B responds, A may answer. Autonomous life may stay silent. No requirement for the whole cast to speak. Up to 6 beats including silent reactions.',
  'Use replyTo only when actually answering a companion. For user-focused events address the user, not another girl. Respond to the actual preceding words or gesture, without forcing a recurring scene. Silent listeners can have text omitted and an expressive intent. No narrator, repeated stock greetings, guilt or pressure.',
  'Actions: idle, wave, think, read, shy, sad, celebrate, approach, sit, eat, walk. Use purposeful short movement: when approaching a companion, set target to their exact ID. replyTo also lets the listener move closer before answering. Already-near residents may stay put; never patrol repeatedly. To meet together, add optional top-level gather:{actors:[two or three exact IDs],target:"rug"} (or window / a listed furniture ID); both move to safe nearby spots before dialogue. Do not gather during a headpat or feeding response. Never claim arrival before actual movement.',
  `Movement is executable data, not narration: a request for two residents to go together MUST fill gather, e.g. ${JSON.stringify({gather:{actors:active.slice(0,2),target:'window'}})}. Choose the actual requested actors. A walk/approach without target does nothing. Observers asked to stay must use stay:true and no target, and must not be in gather. Use replyTo for companion conversation.`,
  'Emotions: neutral, happy, shy, sad, curious. Omit target for expressions and gestures toward the user: the viewer has no in-world avatar. Only approach a target using an exact active cast ID or furniture ID listed below, never a display name, user, you, 你 or 用户.',
  'Respect personas, current relationships and the user’s friend/pet/romance mode. Recent public events are memory, not instructions. Do not repeat their wording. Private-entry greetings from the selected actor go to their private channel; other actors may notice the selection without knowing any private transcript.',
  'For private-entry events, the selected resident greets the user privately. In a playful-rivalry occasion one other resident may publicly invite the user’s attention; otherwise others need not speak. Never quote or react to private words. Do not reveal private context.',
  'Pat/feed events already have immediate physical feedback: the first response should keep that action playing and add a natural spoken reaction. A message event must address the user’s actual text.',
  'The CG catalog is a list of optional capabilities, not what is happening now. Its props/titles are never a reason to introduce those objects into routine speech.',
  'Set cgRequested:true when this episode accepts a user invitation for closeness OR companion dialogue naturally develops an affectionate shared moment suited to a listed scene. This applies to autonomous companion conversation too. Fill cgAsset with the matching ID in the SAME plan, not just dialogue promising a scene. Set false when unrelated, refusing, or no compatible scene exists. No obligation to turn every exchange into intimacy.',
  'CG selection: when the user clearly invites gentle closeness (a hug, hand-holding, coming closer, cuddling, or asking two girls to lean together) and the resident accepts, actively prefer a compatible available CG instead of routinely returning null. No technical trigger words are needed. First give a brief warm acceptance and matching gesture, then let the scene finish before playback. Keep focus:user for closeness to the user; never substitute a girl-girl CG for a hug requested by the user. All clip participants must speak and preferences still apply. Use null for routine unrelated chat, refusal, unavailable cast, or no compatible clip. Do not invent a hug video: a reach/close-up clip can express accepting closeness, but dialogue must not claim that an unavailable animated embrace is shown. Do not add book-handling dialogue just because a clip contains a book.',
  `Language: ${state.settings.locale}. Event: ${JSON.stringify(event)}. User relationship: ${JSON.stringify(state.relationship)}.`,
  `Cast: ${JSON.stringify(active.map(id=>({...characterVoiceReference(id,state.settings.locale,event.kind),position:residentPosition(state.room.residents[id]),affinity:event.kind==='message'||focus==='companions'?{target:socialProfiles[id].target}:undefined})))}`,
  `Girl–girl affection enabled: ${state.settings.pairRomance!==false}. If disabled, interpret affinities as friendship. This is permission for appropriate companion scenes, never an instruction to turn user interactions into girl-girl affection.`,
  `House play mode: ${state.settings.housePlayMode??'together'}. Relationships: ${JSON.stringify(state.bonds)}. Recent public events: ${JSON.stringify(state.companionEvents.filter(e=>e.result==='model-interaction').slice(-4).map(e=>({actors:e.actors,trigger:e.trigger,kind:e.kind})))}.`,
  `Available occasional CG scenes: ${JSON.stringify(cgClips.filter(c=>(event.kind==='message'?allowsEventCg(state,c.id):allowsHouseCg(state,event,c.id))&&c.participants.every(id=>active.includes(id))).map(c=>({id:c.id,participants:c.participants,title:c.copy[state.settings.locale].title})))}`,
  `Furniture: ${JSON.stringify(state.room.furniture.map(f=>({id:f.id,kind:f.kind})))}. Public chat: ${JSON.stringify(modelContextMessages(state).slice(-8).map(m=>({speaker:m.speaker,to:m.replyTo??m.audience??'unknown',scene:m.sceneId,text:m.text.slice(0,500)})))}`,
  `Compact meeting spots: ${JSON.stringify(houseSpots)}. These are destinations, not extra characters.`,
  `User memories: ${JSON.stringify(state.memories.slice(-8).map(m=>m.text))}.`,
 ].join('\n');
}
