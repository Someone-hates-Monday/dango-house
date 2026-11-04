import { characters, byId } from './characters';
import type { AppState, CharacterId, Message } from './types';
import { boundedPoint, defaultFurniture, defaultResidents, restingBody } from './world';
import { providers } from './characters';
import { defaultBonds, socialProfiles } from './social';
import { emptyAgentUi } from './agent';
import { defaultLocale, isAppLocale, type AppLocale } from './i18n';
import { demoReplyLocalized, praiseLinesLocalized } from './dialogue/pack';
export const ids = characters.map(c => c.id);
export function initialState(now = Date.now()): AppState {
  return {
    presentation:{desktopMode:'free',chatForm:'portrait'},
    version: 1, revision: 0, selected: 'xia', muted: [], affection: Object.fromEntries(ids.map(id=>[id,id==='xia'?32:id==='rin'?28:30])) as AppState['affection'],
    mood: Object.fromEntries(ids.map(id=>[id,'idle'])) as AppState['mood'], pets: {},
    skins: Object.fromEntries(characters.map(c=>[c.id,c.atlas===false?'chibi':'animated'])) as AppState['skins'],
    bodies: Object.fromEntries(ids.map(id=>[id,restingBody()])) as AppState['bodies'],
    room: {residents:defaultResidents(),furniture:defaultFurniture(),theme:'peach',autonomous:true,wandering:true,log:[]},
    connections: Object.fromEntries(providers.map(p=>[p.id,{model:'',endpoint:p.endpoint,tools:true}])),
    characterProviders: {},
    privateMessages:Object.fromEntries(ids.map(id=>[id,[] as Message[]])) as AppState['privateMessages'],
    relationship:{mode:'friend',userName:'你',address:'你'},desktopMoves:{},
    bonds:defaultBonds(),favor:{focusId:null,streak:0},
    reminders:[{id:'water',text:'喝点水，活动一下吧。',intervalMinutes:30,nextAt:now+30*60000,enabled:false}],
    settings: { dnd: false, autonomous: true, intimacy: 55, petsVisible: true, provider: 'glm', model: '', mode: 'demo', locale: defaultLocale, pairTone: 'warm', agentBridge: false, castPreset: 'all' },
    memories: [], focus: null, agent: emptyAgentUi(), activity: '大家都在庭院里', busy: false,
    messages: [
      { id: 'welcome', speaker: 'system', text: '欢迎回到团子小屋！先去「互动小屋」看看大家在做什么吧。', at: now },
      ...characters.map((c, i): Message => ({ id: `welcome-${c.id}`, speaker: c.id, text: c.greeting, at: now + i })),
    ],
  };
}
export function chooseSpeakers(state: AppState, text: string, target?: CharacterId): CharacterId[] {
  const active = ids.filter(id => !state.muted.includes(id));
  if (!active.length) return [];
  const mentioned = target ?? ids.find(id => text.includes(`@${byId[id].name}`));
  if (mentioned) return active.includes(mentioned) ? [mentioned] : [];
  const last = state.messages.filter(m => ids.includes(m.speaker as CharacterId)).at(-1)?.speaker;
  const previous = state.messages.filter(m => ids.includes(m.speaker as CharacterId)).slice(-2).map(m=>m.speaker);
  const start = (active.indexOf(last as CharacterId)+1)%active.length;
  const first = active[start];
  const second = active.find((id,i) => i!==start&&!previous.includes(id)) ?? active.find(id=>id!==first);
  return second ? [first, second] : [first];
}
export function demoReply(id: CharacterId, text: string, intimacy: number, index = 0, locale: AppLocale = defaultLocale): string {
  return demoReplyLocalized(id, text, intimacy, locale, index);
}
export function praiseLines(id: CharacterId, intimacy: number, locale: AppLocale = defaultLocale): { speaker: CharacterId; text: string }[] {
  return praiseLinesLocalized(id, intimacy, locale);
}
export function restoreState(value: unknown, now = Date.now()): AppState {
  const base = initialState(now);
  if (!value || typeof value !== 'object' || (value as any).version !== 1) return base;
  const saved = value as Partial<AppState>;
  if(saved.presentation?.desktopMode==='dock')base.presentation.desktopMode='dock';
  if(saved.presentation?.chatForm==='chibi')base.presentation.chatForm='chibi';
  base.messages = Array.isArray(saved.messages) ? saved.messages.filter(m => m && typeof m.text === 'string' && typeof m.id === 'string' && ['user', 'system', ...ids].includes(m.speaker)).slice(-500) : base.messages;
  base.memories = Array.isArray(saved.memories) ? saved.memories.filter(m => m && typeof m.text === 'string' && typeof m.id === 'string').slice(-100) : [];
  if (saved.settings && typeof saved.settings === 'object') {
    for (const key of ['dnd', 'autonomous', 'petsVisible', 'agentBridge'] as const) if (typeof saved.settings[key] === 'boolean') base.settings[key] = saved.settings[key];
    if (Number.isFinite(saved.settings.intimacy)) base.settings.intimacy = Math.max(0, Math.min(100, saved.settings.intimacy));
    if (typeof saved.settings.provider === 'string') base.settings.provider = saved.settings.provider;
    if (typeof saved.settings.model === 'string') base.settings.model = saved.settings.model.slice(0, 120);
    if (saved.settings.mode === 'api') base.settings.mode = 'api';
    if (isAppLocale(saved.settings.locale)) base.settings.locale = saved.settings.locale;
    if (saved.settings.pairTone === 'soft' || saved.settings.pairTone === 'warm' || saved.settings.pairTone === 'vivid') {
      base.settings.pairTone = saved.settings.pairTone;
    }
    if (saved.settings.castPreset === 'all' || saved.settings.castPreset === 'core' || saved.settings.castPreset === 'custom') {
      base.settings.castPreset = saved.settings.castPreset;
    }
  }
  if (ids.includes(saved.selected!)) base.selected = saved.selected!;
  base.muted = Array.isArray(saved.muted) ? saved.muted.filter(id => ids.includes(id)) : [];
  if (saved.characterProviders && typeof saved.characterProviders === 'object') {
    const next: AppState['characterProviders'] = {};
    for (const id of ids) {
      const value = saved.characterProviders[id];
      if (typeof value === 'string' && providers.some(p => p.id === value)) next[id] = value;
    }
    base.characterProviders = next;
  }
  for (const id of ids) {
    if (saved.bodies && byId[id].atlas!==false && (saved.skins?.[id] === 'animated'||saved.skins?.[id]==='chibi')) base.skins[id] = saved.skins[id];
    if (Number.isFinite(saved.affection?.[id])) base.affection[id] = Math.max(0, Math.min(100, saved.affection![id]));
    const p = saved.pets?.[id];
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.displayId)) base.pets[id] = p;
  }
  if (saved.room) {
    const r=saved.room;
    if(r.theme==='night')base.room.theme='night';
    for(const k of ['autonomous','wandering'] as const)if(typeof r[k]==='boolean')base.room[k]=r[k];
    if(Array.isArray(r.furniture))base.room.furniture=r.furniture.filter(f=>f&&typeof f.id==='string'&&['sofa','table','bookshelf','plant','lamp','cushion'].includes(f.kind)&&Number.isFinite(f.x)&&Number.isFinite(f.y)).slice(0,16).map(f=>({...f,...boundedPoint(f.x,f.y)}));
    for(const id of ids){const p=r.residents?.[id];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){const point=boundedPoint(p.x,p.y);base.room.residents[id]={...base.room.residents[id],...point,from:point};}}
  }
  if(saved.connections&&typeof saved.connections==='object')for(const p of providers){const c=saved.connections[p.id];if(c&&typeof c.model==='string'&&typeof c.endpoint==='string')base.connections[p.id]={model:c.model.slice(0,120),endpoint:c.endpoint.slice(0,400),tools:c.tools!==false};}
  if(saved.privateMessages)for(const id of ids){const list=saved.privateMessages[id];if(Array.isArray(list))base.privateMessages[id]=list.filter(m=>m&&typeof m.id==='string'&&typeof m.text==='string'&&(m.speaker==='user'||m.speaker===id||m.speaker==='system')).slice(-200);}
  if(saved.relationship&&['friend','pet','romance'].includes(saved.relationship.mode)){base.relationship={mode:saved.relationship.mode,userName:String(saved.relationship.userName||'你').slice(0,30),address:String(saved.relationship.address||'你').slice(0,30)};}
  if(saved.bonds&&typeof saved.bonds==='object')for(const[k,v]of Object.entries(saved.bonds))if(k.split(/[:>]/).length===2&&k.split(/[:>]/).every(id=>ids.includes(id as CharacterId))&&Number.isFinite(v))base.bonds[k]=Math.max(0,Math.min(100,v));
  if(saved.favor&&typeof saved.favor==='object'){
    const focus=saved.favor.focusId;
    base.favor={
      focusId: focus && ids.includes(focus) ? focus : null,
      streak: Number.isFinite(saved.favor.streak) ? Math.max(0, Math.min(99, saved.favor.streak!)) : 0,
    };
  }
  if(Array.isArray(saved.reminders))base.reminders=saved.reminders.filter(r=>r&&typeof r.id==='string'&&typeof r.text==='string'&&Number.isFinite(r.intervalMinutes)&&r.intervalMinutes>=1&&r.intervalMinutes<=1440&&Number.isFinite(r.nextAt)).slice(0,12);
  if(!saved.connections&&base.settings.model)base.connections[base.settings.provider]={...base.connections[base.settings.provider],model:base.settings.model};
  const f = saved.focus;
  if (f && typeof f.id === 'string' && Number.isFinite(f.endAt) && Number.isFinite(f.minutes) && ids.includes(f.owner)) base.focus = f;
  // Agent tasks are process-local: restore a cleared UI shell so stale running jobs never resurrect.
  base.agent = emptyAgentUi();
  return base;
}
