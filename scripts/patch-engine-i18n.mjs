import fs from 'node:fs';

const path = 'electron/engine.ts';
let s = fs.readFileSync(path, 'utf8');

s = s.replace(
  `import { chooseSpeakers, demoReply, initialState, praiseLines, ids } from '../src/shared/director';
import type { Action, AppState, CharacterId, Message, AvatarIntent, Emotion } from '../src/shared/types';
import { boundedPoint, defaultFurniture, inferredIntent, poseForAction, restingBody, residentPosition, targetDescription, validatedIntent } from '../src/shared/world';
import { emptyAgentUi } from '../src/shared/agent';
import { isAppLocale } from '../src/shared/i18n';
import { AgentRuntime, defaultWatchGrants } from './agent/runtime';`,
  `import { chooseSpeakers, demoReply, initialState, praiseLines, ids } from '../src/shared/director';
import type { Action, AppState, CharacterId, Message, AvatarIntent, Emotion } from '../src/shared/types';
import { boundedPoint, defaultFurniture, inferredIntent, poseForAction, restingBody, residentPosition, targetDescription, validatedIntent } from '../src/shared/world';
import { emptyAgentUi } from '../src/shared/agent';
import { isAppLocale, translate } from '../src/shared/i18n';
import {
  feedLine, focusDialogue, hoverLine, jealousLine, localizedProfile, localizedScene,
  patLine, privateGreeting, praiseUserLine, showcaseCopy, tripLine,
} from '../src/shared/dialogue/pack';
import { AgentRuntime, defaultWatchGrants } from './agent/runtime';`,
);

if (!s.includes('private locale()')) {
  s = s.replace(
    '  publish() { this.state.revision++; this.notify(this.state); }',
    `  private locale() { return this.state.settings.locale; }
  private t(key: string, vars?: Record<string, string | number>) { return translate(this.locale(), key, vars); }
  publish() { this.state.revision++; this.notify(this.state); }`,
  );
}

s = s.replace(
  `      activeCharacters: () => ids.filter(id => !this.state.muted.includes(id)),
    });`,
  `      activeCharacters: () => ids.filter(id => !this.state.muted.includes(id)),
      locale: () => this.state.settings.locale,
    });`,
);

// perform() core strings
s = s.replace(`if(!ids.includes(id))throw new Error('未知角色');`, `if(!ids.includes(id))throw new Error(this.t('sys.unknownCharacter'));`);
s = s.replace(
  `else throw new Error('目标不存在，请使用小屋中列出的家具 ID 或另一位角色 ID');`,
  `else throw new Error(this.t('sys.badTarget'));`,
);
s = s.replace(
  `destination:target?targetDescription(target,this.state.room.furniture):'附近'`,
  `destination:target?targetDescription(target,this.state.room.furniture):this.t('sys.nearby')`,
);
s = s.replace(
  `const labels:Record<string,string>={wave:'挥手打招呼',jump:'开心跳一跳',celebrate:'开心庆祝',think:'认真思考',read:'坐下来读书',shy:'有点害羞',sad:'有点委屈',sit:'坐一会儿',water:'照顾小绿植',eat:'一起吃点心',sleep:'安静休息',walk:'小步走动',approach:'靠近伙伴',idle:'安静待机'};`,
  `const labels:Record<string,string>={wave:this.t('act.wave'),jump:this.t('act.jump'),celebrate:this.t('act.celebrate'),think:this.t('act.think'),read:this.t('act.read'),shy:this.t('act.shy'),sad:this.t('act.sad'),sit:this.t('act.sit'),water:this.t('act.water'),eat:this.t('act.eat'),sleep:this.t('act.sleep'),walk:this.t('act.walk'),approach:this.t('act.approach'),idle:this.t('act.idle')};`,
);
s = s.replace(
  `if(targetId&&targetId!==id){const key=relationshipKey(id,targetId);this.state.bonds[key]=Math.min(100,(this.state.bonds[key]??0)+2);if(source==='model')this.scene.push({at:now+3500,actor:targetId,intent:{action:'wave',emotion:'happy',bubble:socialProfiles[targetId].response,duration:7}});}
`,
  `if(targetId&&targetId!==id){const key=relationshipKey(id,targetId);this.state.bonds[key]=Math.min(100,(this.state.bonds[key]??0)+2);if(source==='model')this.scene.push({at:now+3500,actor:targetId,intent:{action:'wave',emotion:'happy',bubble:localizedProfile(this.locale(),targetId).response,duration:7}});}
`,
);
s = s.replace(
  `return \`已让\${byId[id].name}\${labels[intent.action]}\${moving?'，正在走向目标':''}\`;`,
  `return this.t('sys.didAction',{name:byId[id].name,label:labels[intent.action],moving:moving?this.t('sys.movingSuffix'):''});`,
);

s = s.replace(
  `this.state.activity = this.state.focus ? '大家在安静陪你专注' : '大家都在庭院里'; this.publish();`,
  `this.state.activity = this.state.focus ? this.t('sys.activityFocus') : this.t('sys.activityYard'); this.publish();`,
);

s = s.replace(
  `this.state.mood[line.speaker] = 'talk'; this.state.activity = \`\${byId[line.speaker].name}正在想怎么回应你\`; this.publish();`,
  `this.state.mood[line.speaker] = 'talk'; this.state.activity = this.t('sys.thinking',{name:byId[line.speaker].name}); this.publish();`,
);
s = s.replace(
  `intent=>{if(round!==this.epoch||controller.signal.aborted)throw new Error('回合已取消');acted=true;return this.perform(line.speaker,intent,'model');});
            if (round === this.epoch) { message.text = result; if (!result.trim()) throw new Error('模型没有返回文字，请检查模型是否支持文本聊天。'); }`,
  `intent=>{if(round!==this.epoch||controller.signal.aborted)throw new Error(this.t('sys.roundCancelled'));acted=true;return this.perform(line.speaker,intent,'model');});
            if (round === this.epoch) { message.text = result; if (!result.trim()) throw new Error(this.t('sys.emptyModel')); }`,
);
s = s.replace(
  `const errorText=error instanceof Error ? error.message : '连接失败，请稍后重试。';`,
  `const errorText=error instanceof Error ? error.message : this.t('sys.connectFail');`,
);

s = s.replace(`if (!action || typeof action !== 'object') throw new Error('无效操作');`, `if (!action || typeof action !== 'object') throw new Error(this.t('sys.badAction'));`);
s = s.replace(`if (!selected.length) { this.add('system', '成员已静音，可以在右侧让她重新加入。'); return; }`, `if (!selected.length) { this.add('system', this.t('sys.muted')); return; }`);
s = s.replace(
  `if(/挥手|跳一|跳舞|走一|走走|看书|读书|害羞|坐下|浇水/.test(text)&&this.state.settings.mode==='demo') {const matched=/挥手/.test(text)?'wave':/跳/.test(text)?'jump':/走/.test(text)?'walk':/书/.test(text)?'read':/害羞/.test(text)?'shy':/浇水/.test(text)?'water':'sit';this.perform(selected[0],{action:matched,bubble:'收到！看我的～'});this.add(selected[0],'收到！我现在就做给你看。');return;}`,
  `if(/(挥手|跳一|跳舞|走一|走走|看书|读书|害羞|坐下|浇水|wave|jump|walk|read|shy|sit|water|手を振|ジャンプ|歩く|読む)/i.test(text)&&this.state.settings.mode==='demo') {const matched=/(挥手|wave|手を振)/i.test(text)?'wave':/(跳|jump|ジャンプ)/i.test(text)?'jump':/(走|walk|歩く)/i.test(text)?'walk':/(书|read|読む)/i.test(text)?'read':/(害羞|shy)/i.test(text)?'shy':/(浇水|water)/i.test(text)?'water':'sit';this.perform(selected[0],{action:matched,bubble:this.t('sys.demoAckBubble')});this.add(selected[0],this.t('sys.demoAck'));return;}`,
);
s = s.replace(
  `if (/^(?:请)?(?:陪我|和我一起|一起|开始|开启)(?:一个|一段)?(?:专注|番茄钟)|^(?:专注|番茄钟)(?:\\s*\\d+\\s*分钟)?[吧。！!?？]?$/.test(text)) {
          const match = text.match(/(\\d+)\\s*分钟/); await this.dispatch({ type: 'focus', minutes: match ? Number(match[1]) : 25 }); return;
        }
        if (/记住[：:，, ]/.test(text)) { const memory = text.split(/记住[：:，, ]/).slice(1).join('').trim(); if (memory) await this.dispatch({ type: 'remember', text: memory }); }
        if (this.state.settings.mode === 'api' && (!this.generate || !this.state.settings.model)) { this.add('system', '请先在连接设置填写模型 ID 和 API Key，或切回离线演示。', 'error'); return; }
        await this.sequence(selected.map((speaker, i) => ({ speaker, text: demoReply(speaker, text, this.state.settings.intimacy, i) })), this.state.settings.mode === 'api', text); return;`,
  `if (/^(?:请)?(?:陪我|和我一起|一起|开始|开启)(?:一个|一段)?(?:专注|番茄钟)|^(?:专注|番茄钟)(?:\\s*\\d+\\s*分钟)?[吧。！!?？]?$|^(?:focus|pomodoro)(?:\\s*\\d+\\s*(?:min|minutes)?)?$/i.test(text)) {
          const match = text.match(/(\\d+)\\s*(?:分钟|min|minutes)?/i); await this.dispatch({ type: 'focus', minutes: match ? Number(match[1]) : 25 }); return;
        }
        if (/记住[：:，, ]|remember[:：, ]/i.test(text)) { const memory = text.split(/记住[：:，, ]|remember[:：, ]/i).slice(1).join('').trim(); if (memory) await this.dispatch({ type: 'remember', text: memory }); }
        if (this.state.settings.mode === 'api' && (!this.generate || !this.state.settings.model)) { this.add('system', this.t('sys.needApi'), 'error'); return; }
        await this.sequence(selected.map((speaker, i) => ({ speaker, text: demoReply(speaker, text, this.state.settings.intimacy, i, this.locale()) })), this.state.settings.mode === 'api', text); return;`,
);

s = s.replace(
  `case 'trip': {if(!ids.includes(action.id))return;this.perform(action.id,{action:'sad',emotion:'sad',bubble:'哎呀……让我趴一会儿，再慢慢站起来。',duration:9},'local',Date.now(),{kind:'trip',startedAt:Date.now()});return;}
      case 'pat': {if(!ids.includes(action.id))return;this.state.affection[action.id]=Math.min(100,this.state.affection[action.id]+2);const lines:Record<CharacterId,string>={xia:'嘿嘿……尾巴停不下来了，再摸一下嘛～',rin:'嗯……书可以先放一会儿。谢谢你。',shiori:'……只许摸一下。不是说停下。',gemini:'呼噜呼噜～喵，摸到猫猫的开心开关了！',glm:'再摸要收费哦～……好吧，这次也免费。',kimi:'像月光落在头顶一样，暖暖的。',grok:'好吧，这一招对我有效。再来一下？'};this.perform(action.id,{action:'shy',emotion:'happy',bubble:lines[action.id],duration:7},'local',Date.now(),{kind:'pat',startedAt:Date.now()});return;}
      case 'feed': {if(!ids.includes(action.id)||!['rice','cake','fish','tea'].includes(action.food))return;const name={rice:'大米饭',cake:'小蛋糕',fish:'小鱼干',tea:'热茶'}[action.food];const favorite=action.id==='xia'&&action.food==='rice'||action.id==='gemini'&&action.food==='fish'||action.id==='rin'&&action.food==='tea'||action.id==='kimi'&&action.food==='cake';this.state.affection[action.id]=Math.min(100,this.state.affection[action.id]+(favorite?4:2));this.perform(action.id,{action:'eat',emotion:'happy',bubble:action.id==='xia'&&action.food==='rice'?'大米饭！是白米饭！再来一碗好不好～':\`\${name}收到了！谢谢\${this.state.relationship.address}，一起吃一点吧。\`,duration:8},'local',Date.now(),{kind:'feed',startedAt:Date.now(),food:action.food});return;}
      case 'hover': {if(!ids.includes(action.id)||this.state.settings.dnd||!this.state.settings.autonomous)return;const now=Date.now();if(now-(this.hovered[action.id]??0)<90000||now-this.lastGreeting<15000)return;this.hovered[action.id]=now;this.lastGreeting=now;this.perform(action.id,{action:'wave',emotion:'happy',bubble:\`\${this.state.relationship.address}，来找\${byId[action.id].name}玩吗？点头部摸摸，点身体可以悄悄聊天。\`,duration:6});return;}`,
  `case 'trip': {if(!ids.includes(action.id))return;this.perform(action.id,{action:'sad',emotion:'sad',bubble:tripLine(this.locale()),duration:9},'local',Date.now(),{kind:'trip',startedAt:Date.now()});return;}
      case 'pat': {if(!ids.includes(action.id))return;this.state.affection[action.id]=Math.min(100,this.state.affection[action.id]+2);this.perform(action.id,{action:'shy',emotion:'happy',bubble:patLine(this.locale(),action.id),duration:7},'local',Date.now(),{kind:'pat',startedAt:Date.now()});return;}
      case 'feed': {if(!ids.includes(action.id)||!['rice','cake','fish','tea'].includes(action.food))return;const name=this.t('food.'+action.food);const favorite=action.id==='xia'&&action.food==='rice'||action.id==='gemini'&&action.food==='fish'||action.id==='rin'&&action.food==='tea'||action.id==='kimi'&&action.food==='cake';this.state.affection[action.id]=Math.min(100,this.state.affection[action.id]+(favorite?4:2));this.perform(action.id,{action:'eat',emotion:'happy',bubble:feedLine(this.locale(),action.id,action.food,name,this.state.relationship.address),duration:8},'local',Date.now(),{kind:'feed',startedAt:Date.now(),food:action.food});return;}
      case 'hover': {if(!ids.includes(action.id)||this.state.settings.dnd||!this.state.settings.autonomous)return;const now=Date.now();if(now-(this.hovered[action.id]??0)<90000||now-this.lastGreeting<15000)return;this.hovered[action.id]=now;this.lastGreeting=now;this.perform(action.id,{action:'wave',emotion:'happy',bubble:hoverLine(this.locale(),this.state.relationship.address,byId[action.id].name),duration:6});return;}`,
);

s = s.replace(
  `        const address=this.state.relationship.address||'你';const greetings:Record<CharacterId,string>={xia:\`\${address}这次选我啦！嘿嘿，饭碗先放一边，现在只想听你说话～\`,rin:\`是想和我单独说话吗？我把书合上了。现在的时间，留给\${address}。\`,shiori:\`……选我？嗯，过来坐。龙尾在动？你看错了。\`,gemini:\`选中猫猫啦！喵～今天的灵感和小秘密，都想先讲给\${address}听。\`,glm:\`哎呀，今天轮到我了～这段专属陪伴，可要好好珍惜哦。\`,kimi:\`\${address}来找我啦。书签夹好了，接下来只听你的故事。\`,grok:\`我就知道你眼光不错！好了，今天的专属频道开播，想聊什么？\`};
        this.perform(action.id,{action:'celebrate',emotion:'happy',bubble:greetings[action.id].slice(0,52),duration:9},'local',now,{kind:'chat',startedAt:now});this.addPrivate(action.id,action.id,greetings[action.id]);
        const jealous:Record<CharacterId,string>={xia:'诶，这次不选大鱼吗？我连饭都留了半碗……下次记得找我呀！',rin:'嗯，你们慢慢聊。我把书签留着，等你想听另一个故事时再来。',shiori:'……我才没有在等。下次想聊天，也可以找我。',gemini:'喵？猫猫也有很多新点子呢……下次会轮到我吧？',glm:'这次先让给她。不过下次的专属时间，我先预约啦～',kimi:'那我先看一会儿书。你回来时，我还在这一页等你。',grok:'哎呀，被抢先了。下次给我留个位置？我这儿还有个特别好笑的梗。'};
        this.scene=ids.filter(id=>id!==action.id&&!this.state.muted.includes(id)).map((actor,i)=>({at:now+900+i*1100,actor,intent:{action:i===0?'approach':'shy',target:i===0?action.id:undefined,emotion:'shy',bubble:jealous[actor],duration:8}}));this.publish();return;`,
  `        const address=this.state.relationship.address||(this.locale()==='en'?'you':this.locale()==='ja'?'あなた':'你');
        const greeting=privateGreeting(this.locale(),action.id,address);
        this.perform(action.id,{action:'celebrate',emotion:'happy',bubble:greeting.slice(0,52),duration:9},'local',now,{kind:'chat',startedAt:now});this.addPrivate(action.id,action.id,greeting);
        this.scene=ids.filter(id=>id!==action.id&&!this.state.muted.includes(id)).map((actor,i)=>({at:now+900+i*1100,actor,intent:{action:i===0?'approach':'shy',target:i===0?action.id:undefined,emotion:'shy',bubble:jealousLine(this.locale(),actor),duration:8}}));this.publish();return;`,
);

s = s.replace(
  `await this.sequence([{speaker:action.id,text:demoReply(action.id,action.text,this.state.settings.intimacy)}],this.state.settings.mode==='api',action.text,action.id);return;`,
  `await this.sequence([{speaker:action.id,text:demoReply(action.id,action.text,this.state.settings.intimacy,0,this.locale())}],this.state.settings.mode==='api',action.text,action.id);return;`,
);

s = s.replace(`throw new Error('配置无效');`, `throw new Error(this.t('sys.badConfig'));`);
s = s.replace(`throw new Error('未知家具');`, `throw new Error(this.t('sys.unknownFurniture'));`);
s = s.replace(`throw new Error('位置无效');`, `throw new Error(this.t('sys.badPosition'));`);

s = s.replace(
  `        if(action.scene==='welcome')this.scene=cast.map((actor,i)=>({at:now+i*750,actor,intent:{action:'wave',emotion:'happy',bubble:\`\${byId[actor].name}来报到啦！\`},speech:\`\${byId[actor].name}来报到啦！\`}));
        if(action.scene==='tea')this.scene=[{at:now,actor:a,intent:{action:'eat',target:this.state.room.furniture.find(f=>f.kind==='table')?.id,emotion:'happy',bubble:'开饭啦！我先去占位置～'},speech:'开饭啦！我先去占位置～'},{at:now+2500,actor:b,intent:{action:'approach',target:a,bubble:'点心我也要一份哦～'},speech:'点心我也要一份哦～'},{at:now+5500,actor:c,intent:{action:'read',target:this.state.room.furniture.find(f=>f.kind==='bookshelf')?.id,bubble:'那我带一本故事书过来。'},speech:'那我带一本故事书过来。'},{at:now+10500,actor:a,intent:{action:'jump',emotion:'happy',bubble:'大家一起吃！'},speech:'大家一起吃！'}];
        if(action.scene==='rivalry')this.scene=[{at:now,actor:a,intent:{action:'jump',emotion:'happy',bubble:'今天我被夸了！'},speech:'今天我被夸了，可以多分一点关注吗？'},{at:now+2200,actor:b,intent:{action:'approach',target:a,emotion:'curious',bubble:'我也很努力哦～'},speech:'我也很努力哦～这次的点心分我一半？'},{at:now+5000,actor:a,intent:{action:'shy',emotion:'shy',bubble:'那……分你半碗饭好了。'},speech:'那……分你半碗饭好了。'},{at:now+8000,actor:c,intent:{action:'wave',emotion:'happy',bubble:'一起坐下吧，书里还有新故事。'},speech:'一起坐下吧，书里还有新故事。'}];`,
  `        const show=showcaseCopy(this.locale());
        if(action.scene==='welcome')this.scene=cast.map((actor,i)=>{const line=show.report(byId[actor].name);return{at:now+i*750,actor,intent:{action:'wave',emotion:'happy',bubble:line},speech:line};});
        if(action.scene==='tea'){const lines=show.tea();this.scene=[{at:now,actor:a,intent:{action:'eat',target:this.state.room.furniture.find(f=>f.kind==='table')?.id,emotion:'happy',bubble:lines[0]},speech:lines[0]},{at:now+2500,actor:b,intent:{action:'approach',target:a,bubble:lines[1]},speech:lines[1]},{at:now+5500,actor:c,intent:{action:'read',target:this.state.room.furniture.find(f=>f.kind==='bookshelf')?.id,bubble:lines[2]},speech:lines[2]},{at:now+10500,actor:a,intent:{action:'jump',emotion:'happy',bubble:lines[3]},speech:lines[3]}];}
        if(action.scene==='rivalry'){const bubbles=show.rivalry();const speech=show.rivalrySpeech();this.scene=[{at:now,actor:a,intent:{action:'jump',emotion:'happy',bubble:bubbles[0]},speech:speech[0]},{at:now+2200,actor:b,intent:{action:'approach',target:a,emotion:'curious',bubble:bubbles[1]},speech:speech[1]},{at:now+5000,actor:a,intent:{action:'shy',emotion:'shy',bubble:bubbles[2]},speech:speech[2]},{at:now+8000,actor:c,intent:{action:'wave',emotion:'happy',bubble:bubbles[3]},speech:speech[3]}];}`,
);

s = s.replace(
  `this.add('user', \`\${byId[action.id].name}，今天也很贴心。\`);
        {const round=this.epoch;await this.sequence(praiseLines(action.id, this.state.settings.intimacy));`,
  `this.add('user', praiseUserLine(this.locale(), byId[action.id].name));
        {const round=this.epoch;await this.sequence(praiseLines(action.id, this.state.settings.intimacy, this.locale()));`,
);

s = s.replace(
  `        if (!Number.isFinite(action.minutes) || action.minutes < 1 || action.minutes > 180) { this.add('system', '专注时长可以设为 1 到 180 分钟。'); return; }
        if (this.state.focus) { this.add('system', '已经有一段专注计时在进行，结束或取消后再开始吧。'); return; }
        const active = ids.filter(id => !this.state.muted.includes(id));
        const owner = active.includes('rin') ? 'rin' : active[0];
        if (!owner) { this.add('system', '让至少一位伙伴解除静音，再一起开始吧。'); return; }
        this.stop(); this.state.focus = { id: crypto.randomUUID(), endAt: Date.now() + action.minutes * 60_000, minutes: action.minutes, owner };
        this.add('system', \`专注开始 · \${action.minutes} 分钟 · \${byId[owner].name}负责计时\`);
        await this.sequence([
          { speaker: owner, text: \`计时交给我。这 \${action.minutes} 分钟我们会安静陪你，结束再叫你。\` },
          ...active.filter(id => id !== owner).slice(0, 1).map(speaker => ({ speaker, text: speaker === 'xia' ? '我也报名！那我就负责给你加油，现在先不打扰啦。' : '那我就在这里坐一会儿。你慢慢来。' })),
        ]); return;
      }
      case 'cancel-focus': this.stop(); this.state.focus = null; this.add('system', '这段专注已结束计时，按自己的节奏来就好。'); this.stop(); return;
      case 'banter':
        if (this.state.focus) { this.add('system', '专注期间先安静陪伴，结束后再聊天。'); return; }`,
  `        if (!Number.isFinite(action.minutes) || action.minutes < 1 || action.minutes > 180) { this.add('system', this.t('sys.focusRange')); return; }
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
        if (this.state.focus) { this.add('system', this.t('sys.focusQuiet')); return; }`,
);

s = s.replace(
  `        if (!this.agent) { this.add('system', '观影任务运行时尚未就绪。', 'error'); return; }
        if (typeof action.path !== 'string' || !action.path.trim()) { this.add('system', '请先选择本地短视频。', 'error'); return; }
        const speakers = Array.isArray(action.speakers) ? action.speakers.filter(id => ids.includes(id)) : undefined;
        this.add('system', \`一起看：开始导入「\${action.displayName || '本地视频'}」。分析不会占用聊天停止按钮；要取消请用任务托盘。\`, 'notice');
        await this.agent.start({
          kind: 'watch_party',
          goal: \`一起看：\${action.displayName || action.path}\`,`,
  `        if (!this.agent) { this.add('system', this.t('sys.watchNotReady'), 'error'); return; }
        if (typeof action.path !== 'string' || !action.path.trim()) { this.add('system', this.t('sys.watchNeedFile'), 'error'); return; }
        const speakers = Array.isArray(action.speakers) ? action.speakers.filter(id => ids.includes(id)) : undefined;
        const videoName = action.displayName || this.t('sys.localVideo');
        this.add('system', this.t('sys.watchImport', { name: videoName }), 'notice');
        await this.agent.start({
          kind: 'watch_party',
          goal: this.t('sys.watchGoal', { name: action.displayName || action.path }),`,
);

s = s.replace(`throw new Error('无效的任务控制');`, `throw new Error(this.t('sys.badTaskControl'));`);
s = s.replace(
  `this.state.memories = this.state.memories.slice(-100); this.add('system', '已经记下了。你随时可以在「共同记忆」里删除。'); return;`,
  `this.state.memories = this.state.memories.slice(-100); this.add('system', this.t('sys.remembered')); return;`,
);
s = s.replace(
  `case 'clear-chat': this.stop(); this.state.messages = []; this.add('system', '从这里开始一段新对话。共同记忆仍保留，可单独管理。'); return;`,
  `case 'clear-chat': this.stop(); this.state.messages = []; this.add('system', this.t('sys.cleared')); return;`,
);
s = s.replace(`default: throw new Error('不支持的操作');`, `default: throw new Error(this.t('sys.unsupported'));`);

s = s.replace(
  `this.state.bodies.rin.label='整理书签';this.publish();`,
  `this.state.bodies.rin.label=this.t('sys.bookmarkLabel');this.publish();`,
);
s = s.replace(
  `      this.state.activity = '专注结束，休息一下吧';
      this.add('system', \`\${task.minutes} 分钟专注已结束。辛苦了，给自己一点休息时间。\`);
      if (!this.state.settings.dnd && !this.state.muted.includes(task.owner)) this.add(task.owner, '时间到了。现在可以伸个懒腰，我会继续在这里。');`,
  `      this.state.activity = this.t('sys.focusDone');
      this.add('system', this.t('sys.focusEnded', { minutes: task.minutes }));
      if (!this.state.settings.dnd && !this.state.muted.includes(task.owner)) this.add(task.owner, this.t('sys.focusOwnerDone'));`,
);
s = s.replace(
  `if (speaker) this.add(speaker, '我们还在这里。忙完之后，要不要一起休息一会儿？');`,
  `if (speaker) this.add(speaker, this.t('sys.idleNudge'));`,
);

s = s.replace(
  `private playSocial(id:string,now=Date.now()) {const story=socialScenes.find(s=>s.id===id);if(!story)return;const steps=story.steps.filter(s=>!this.state.muted.includes(s.actor)&&(!s.intent.target||!this.state.muted.includes(s.intent.target as CharacterId)));this.scene=steps.map((step,i)=>({at:now+i*4200,actor:step.actor,intent:{...step.intent,duration:9},speech:step.intent.bubble}));this.nextRoomLife=now+steps.length*4200+60000;this.nextSocial=now+steps.length*4200+180000;}`,
  `private playSocial(id:string,now=Date.now()) {const story=socialScenes.find(s=>s.id===id);if(!story)return;const loc=localizedScene(this.locale(),id);const steps=story.steps.filter(s=>!this.state.muted.includes(s.actor)&&(!s.intent.target||!this.state.muted.includes(s.intent.target as CharacterId)));this.scene=steps.map((step,i)=>{const bubble=loc?.bubbles[story.steps.indexOf(step)]??step.intent.bubble;return{at:now+i*4200,actor:step.actor,intent:{...step.intent,bubble,duration:9},speech:bubble};});this.nextRoomLife=now+steps.length*4200+60000;this.nextSocial=now+steps.length*4200+180000;}`,
);

// drop unused socialProfiles import if still present — keep for relationshipKey
s = s.replace(
  `import { socialScenes, socialProfiles, relationshipKey } from '../src/shared/social';`,
  `import { socialScenes, relationshipKey } from '../src/shared/social';`,
);

fs.writeFileSync(path, s);
console.log('engine patched', s.includes("this.t('sys.muted')"), s.includes('localizedScene'));
