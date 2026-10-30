import { characters, byId } from './characters';
import type { AppState, CharacterId, Message } from './types';
import { boundedPoint, defaultFurniture, defaultResidents, restingBody } from './world';
import { providers } from './characters';
import { defaultBonds, socialProfiles } from './social';
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
    privateMessages:Object.fromEntries(ids.map(id=>[id,[] as Message[]])) as AppState['privateMessages'],
    relationship:{mode:'friend',userName:'你',address:'你'},desktopMoves:{},
    bonds:defaultBonds(),reminders:[{id:'water',text:'喝点水，活动一下吧。',intervalMinutes:30,nextAt:now+30*60000,enabled:false}],
    settings: { dnd: false, autonomous: true, intimacy: 55, petsVisible: true, provider: 'glm', model: '', mode: 'demo' },
    memories: [], focus: null, activity: '大家都在庭院里', busy: false,
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
export function demoReply(id: CharacterId, text: string, intimacy: number, index = 0): string {
  const gentle = intimacy < 25;
  const lines: Record<CharacterId, string[]> = {
    xia: ['让我先潜下去想想……等等，我把饭碗放好就来。', '大鱼听着呢！想认真聊，还是一起摸会儿鱼？', '这个话题有意思！能不能边吃饭边说？'],
    rin: ['先说最在意的那一件吧。我把书合上，认真听你说。', '嗯，我们慢慢来。也可以只说说心情，不一定要立刻解决什么。', '大鱼负责热闹，我就帮你把线索整理好。'],
    shiori: ['说吧。我在听，尾巴不会挡住你的屏幕。', '……不是所有事都需要马上有答案。休息一会儿。', '她们说得也有道理。你来决定，我们陪着。'],
    gemini:['喵！我有个新点子，要不要一起试试？','窗边的星星灯真漂亮，我想坐近一点。','等一下，灵感正在跑过来！'],
    glm:['这次的点子，算我附赠的～','我算了算，一起发呆也很划算。','小屋的角落放盆植物，怎么样？'],
    kimi:['我把书签夹好，慢慢听你说。','今天的故事，想从哪一页开始？','一起安静地读一会儿，也很好。'],
    grok:['这个梗我接住了！','今天的小屋剧情，比我想的还热闹。','让我先笑一下，再认真帮你想想。'],
  };
  if (/累|难过|烦|压力|不开心/.test(text)) return ({ xia: '辛苦啦。先吃点东西？我把最好的一碗留给你。', rin: '现在更想让我听你说，还是一起把眼前的事拆小一点？', shiori: '已经很努力了。歇一会儿，我在。' } as Partial<Record<CharacterId,string>>)[id]??'那我们先坐一会儿吧。我在这里，不催你。';
  if (/你好|早上|晚上|嗨|hello/i.test(text)) return byId[id].greeting;
  if (/喜欢|想你|抱抱/.test(text)) return gentle ? `${byId[id].name}在这里，很高兴今天也能和你聊聊天。` : ({ xia: '嘿嘿，那今天的饭也分你一半！尾巴……尾巴自己在动啦。', rin: '嗯，我在。你需要的时候叫我就好。', shiori: '……突然说这个。过来一点，别看我的尾巴。' } as Partial<Record<CharacterId,string>>)[id]??'那我再靠近一点，陪你久一点。';
  if (/喝水|休息/.test(text)) return ({ xia: '一起伸个懒腰！然后……是不是快到饭点啦？', rin: '先离开屏幕片刻。回来时，书签还在这一页。', shiori: '喝点水。不是商量，是提醒。' } as Partial<Record<CharacterId,string>>)[id]??'一起伸个懒腰，休息一下再继续吧。';
  return lines[id][(text.length + index) % 3];
}
export function praiseLines(id: CharacterId, intimacy: number): { speaker: CharacterId; text: string }[] {
  const answers = {
    xia: '嘿嘿～那今天可以多吃一碗饭吗？不是胖，是能量储备！',
    rin: '谢谢。能帮上你的忙，我很高兴。',
    shiori: '……这种事不用特意说出来。尾巴？它自己在动。',
    gemini:'夸我夸我！星星都要亮起来啦！',glm:'眼光不错嘛～今天的陪伴继续附赠。',kimi:'你注意到了呀……那我今天的书签就送给你。',grok:'承认我很棒这件事，你的判断完全正确！',
  };
  const rival = socialProfiles[id].target;
  const replies:Record<CharacterId,string>={xia:'下次也看看我嘛！我已经想好下一个小惊喜了。',rin:'她今天确实很用心。下一杯茶的时间，也分一点给我好吗？',shiori:'哼，我也不是完全没有在照顾你……今天就先让她得意一下。',gemini:'喵～猫猫也要一颗小星星的表扬！',glm:'那我的陪伴积分，也记上一笔吧～',kimi:'那我把这句夸奖夹进书里，下次也想听你对我说。',grok:'收到，下一个最佳陪伴奖我先报名了！'};
  return [{ speaker: id, text: answers[id] }, { speaker: rival, text: intimacy < 25 ? '她今天确实很用心。我们也会继续陪着你的。' : replies[rival] }];
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
    for (const key of ['dnd', 'autonomous', 'petsVisible'] as const) if (typeof saved.settings[key] === 'boolean') base.settings[key] = saved.settings[key];
    if (Number.isFinite(saved.settings.intimacy)) base.settings.intimacy = Math.max(0, Math.min(100, saved.settings.intimacy));
    if (typeof saved.settings.provider === 'string') base.settings.provider = saved.settings.provider;
    if (typeof saved.settings.model === 'string') base.settings.model = saved.settings.model.slice(0, 120);
    if (saved.settings.mode === 'api') base.settings.mode = 'api';
  }
  if (ids.includes(saved.selected!)) base.selected = saved.selected!;
  base.muted = Array.isArray(saved.muted) ? saved.muted.filter(id => ids.includes(id)) : [];
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
  if(Array.isArray(saved.reminders))base.reminders=saved.reminders.filter(r=>r&&typeof r.id==='string'&&typeof r.text==='string'&&Number.isFinite(r.intervalMinutes)&&r.intervalMinutes>=1&&r.intervalMinutes<=1440&&Number.isFinite(r.nextAt)).slice(0,12);
  if(!saved.connections&&base.settings.model)base.connections[base.settings.provider]={...base.connections[base.settings.provider],model:base.settings.model};
  const f = saved.focus;
  if (f && typeof f.id === 'string' && Number.isFinite(f.endAt) && Number.isFinite(f.minutes) && ids.includes(f.owner)) base.focus = f;
  return base;
}
