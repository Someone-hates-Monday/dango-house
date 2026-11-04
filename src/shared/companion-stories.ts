import type { AvatarIntent, CharacterId, PairTone } from './types';
import type { CompanionEvent } from './events';
import { hasRecentKind, recentEventsFor } from './events';
import { bondOf } from './bonds';
import { speakingCast } from './cast';
import type { AppState } from './types';

export type StoryId = 'chose-her' | 'seat-share' | 'star-fox';

export interface StoryBeat {
  atOffset: number;
  actor: CharacterId;
  intent: AvatarIntent;
  speech?: string;
}

export interface StoryPlan {
  id: StoryId;
  variant: string;
  cast: CharacterId[];
  beats: StoryBeat[];
  recall: string;
  bondBump?: { a: CharacterId; b: CharacterId; delta: number };
}

function tonePick<T>(tone: PairTone, soft: T, warm: T, vivid: T): T {
  return tone === 'soft' ? soft : tone === 'vivid' ? vivid : warm;
}

/** Prefer present speakers with character-flavored rivalry lines. */
export function choseHerRivals(state: AppState, favored: CharacterId): CharacterId[] {
  const speak = speakingCast(state).filter(id => id !== favored);
  const prefer: CharacterId[] =
    favored === 'rin' ? ['xia', 'shiori', 'gemini'] :
    favored === 'xia' ? ['rin', 'shiori'] :
    ['xia', 'rin'];
  const ordered = [...prefer.filter(id => speak.includes(id)), ...speak];
  return [...new Set(ordered)].slice(0, 2);
}

export function rivalLine(actor: CharacterId, favored: CharacterId, tone: PairTone): string {
  const name = favored === 'rin' ? 'Claude' : favored === 'xia' ? '大鱼' : favored;
  if (actor === 'xia') {
    return tonePick(tone,
      `那……我也想挨着${name}坐一会儿。`,
      `${name}被点走啦？那我留半碗饭给你俩回来分～`,
      `哼，点名就点名，饭搭子的位置我可没让出去！`,
    );
  }
  if (actor === 'shiori') {
    return tonePick(tone,
      `……随意。别把她宠坏了。`,
      `去吧。记住你还会回来看我一眼。`,
      `挑了她？行。回来时别指望我语气一样软。`,
    );
  }
  if (actor === 'gemini') {
    return tonePick(tone, '也分我一点点目光嘛～', '星猫举手：我也想贴贴！', '那我绕着你们转两圈抗议！');
  }
  if (actor === 'glm') {
    return tonePick(tone, '友情价旁观一下……也行。', '账本记一笔：被冷落补偿券。', '这单偏爱溢价有点高啊。');
  }
  if (actor === 'kimi') {
    return tonePick(tone, '我在窗边看着就好。', '月亮记下这次偏心。', '下次把我也写进小剧场好不好？');
  }
  if (actor === 'grok') {
    return tonePick(tone, '哦？有节目。', '我要写进今天的吐槽栏。', '哈哈，争宠戏码开演了。');
  }
  return tonePick(tone, '也想被选中呢……', '那我先在旁边等你。', '下次点我的名字呀。');
}

export function privateReturnLine(favored: CharacterId, rivals: CharacterId[], events: CompanionEvent[], tone: PairTone): string {
  const again = hasRecentKind(events, 'chose-companion', 10 * 60_000);
  if (again) {
    return tonePick(tone,
      '你又回来了。我们还在，不用每次都重新打招呼。',
      '第二次见面就不用那么正式啦——屋里气氛还暖着。',
      '又溜回来？好，我收下这份偏爱的续集。',
    );
  }
  if (rivals.includes('xia') && favored === 'rin') {
    return tonePick(tone, '大鱼刚才眼巴巴的……我替你留了位置。', 'DeepSeek 说要分饭。要不要一起坐？', '争宠结束了吗？尾巴还在摇哦。');
  }
  if (rivals.includes('shiori')) {
    return tonePick(tone, '小龙娘没说什么，但一直看着门口。', '有人嘴硬地等你回来。', '龙娘的眼神……你自己去哄。');
  }
  return tonePick(tone, '你回来了，屋子又完整一点。', '私聊收束～大家还在。', '欢迎回屋，戏还没散场。');
}

export function planChoseHer(state: AppState, favored: CharacterId, now: number): StoryPlan | null {
  if (!speakingCast(state).includes(favored) && !(state.presentIds ?? []).includes(favored)) return null;
  const tone = state.settings.pairTone ?? 'warm';
  const rivals = choseHerRivals(state, favored);
  const beats: StoryBeat[] = rivals.map((actor, i) => ({
    atOffset: 900 + i * 1200,
    actor,
    intent: {
      action: i === 0 ? 'approach' : 'shy',
      target: i === 0 ? favored : undefined,
      emotion: 'shy',
      bubble: rivalLine(actor, favored, tone),
      duration: 8,
    },
    speech: rivalLine(actor, favored, tone),
  }));
  const variant = rivals.join('-') || 'solo';
  return {
    id: 'chose-her',
    variant,
    cast: [favored, ...rivals],
    beats,
    recall: `你选了${favored}私聊，${rivals.map(r => r).join('、') || '大家'}有反应`,
  };
}

export function planSeatShare(state: AppState, now: number): StoryPlan | null {
  const speak = speakingCast(state);
  if (!speak.includes('rin') || !speak.includes('xia')) return null;
  const tone = state.settings.pairTone ?? 'warm';
  const prior = recentEventsFor(state.companionEvents ?? [], ['rin', 'xia']);
  const sequel = prior.some(e => e.kind === 'seat-share');
  const bubbles = sequel
    ? tonePick(tone,
      ['还是老位置。今天也坐吗？', '当然，我带了零食。', '那就……再近一点。'],
      ['窗边又空了。大鱼？', '我把碗放你旁边！', '这次我主动挨着你。'],
      ['座位续约。签字。', '嘿嘿，续上了～', '手可以碰到了吗？'],
    )
    : tonePick(tone,
      ['窗边还空着，我们一起坐吧。', '好呀，我把饭碗也搬过来。', '肩膀可以挨近一点。'],
      ['大鱼，我把窗边留给你了。', '那我坐你旁边！', '书可以合上。今天想挨着你。'],
      ['过来。座位是给我们两个的。', '那我贴紧一点～', '手……可以放在桌边碰到吗？'],
    );
  const gptAside = speak.includes('shiori') && !sequel;
  const beats: StoryBeat[] = [
    { atOffset: 0, actor: 'rin', intent: { action: 'approach', target: 'xia', emotion: 'shy', bubble: bubbles[0], duration: 8 }, speech: bubbles[0] },
    { atOffset: 3200, actor: 'xia', intent: { action: 'sit', emotion: 'happy', bubble: bubbles[1], duration: 8 }, speech: bubbles[1] },
    { atOffset: 6400, actor: 'rin', intent: { action: 'shy', emotion: 'shy', bubble: bubbles[2], duration: 8 }, speech: bubbles[2] },
  ];
  if (gptAside) {
    beats.push({
      atOffset: 9000,
      actor: 'shiori',
      intent: { action: 'think', emotion: 'curious', bubble: tonePick(tone, '……随便。', '哼，别挡住光。', '看你们腻歪。'), duration: 7 },
      speech: tonePick(tone, '……随便。', '哼，别挡住光。', '看你们腻歪。'),
    });
  }
  return {
    id: 'seat-share',
    variant: sequel ? 'again' : gptAside ? 'with-gpt' : 'first',
    cast: gptAside ? ['rin', 'xia', 'shiori'] : ['rin', 'xia'],
    beats,
    recall: sequel ? '又一次窗边并排坐' : 'Claude 给 DeepSeek 留座',
    bondBump: { a: 'rin', b: 'xia', delta: sequel ? 2 : 4 },
  };
}

export function planStarFox(state: AppState, now: number): StoryPlan | null {
  const speak = speakingCast(state);
  if (!speak.includes('gemini') || !speak.includes('glm')) return null;
  const tone = state.settings.pairTone ?? 'warm';
  const prior = recentEventsFor(state.companionEvents ?? [], ['gemini', 'glm']);
  const sequel = prior.some(e => e.kind === 'star-fox-care');
  const bond = Math.max(bondOf(state.bonds, 'gemini', 'glm'), bondOf(state.bonds, 'glm', 'gemini'));
  const bubbles = sequel || bond >= 40
    ? tonePick(tone,
      ['又来收抱抱账？', '友情价……今晚打八折。', '成交！轻轻贴一下。'],
      ['狐狸小姐，续费小星星。', '被看穿了呀～收好。', '铃铛碰你一下算签收。'],
      ['不要账本了，先抱。', '好，这单很划算。', '贴紧才算数。'],
    )
    : tonePick(tone,
      ['狐狸小姐，今天可以用抱抱付账吗？', '……友情价可以谈。', '那猫猫轻轻抱一下！'],
      ['账本里有一颗小星星，是给你的。', '被发现了呀～那就收好。', '喵，贴紧一点才算成交。'],
      ['不要算账了，先抱。', '好吧，这一单……很划算。', '铃铛碰到你的时候，我没有躲开。'],
    );
  const bystander = speak.find(id => id === 'kimi' || id === 'grok');
  const beats: StoryBeat[] = [
    { atOffset: 0, actor: 'gemini', intent: { action: 'approach', target: 'glm', emotion: 'happy', bubble: bubbles[0], duration: 8 }, speech: bubbles[0] },
    { atOffset: 3000, actor: 'glm', intent: { action: 'shy', emotion: 'shy', bubble: bubbles[1], duration: 8 }, speech: bubbles[1] },
    { atOffset: 6000, actor: 'gemini', intent: { action: 'celebrate', emotion: 'happy', bubble: bubbles[2], duration: 8 }, speech: bubbles[2] },
  ];
  if (bystander === 'kimi') {
    beats.push({
      atOffset: 8500,
      actor: 'kimi',
      intent: { action: 'wave', emotion: 'happy', bubble: tonePick(tone, '月亮替你们作证。', '好温柔的友情价。', '我把这一幕折进书签里。'), duration: 7 },
      speech: tonePick(tone, '月亮替你们作证。', '好温柔的友情价。', '我把这一幕折进书签里。'),
    });
  } else if (bystander === 'grok') {
    beats.push({
      atOffset: 8500,
      actor: 'grok',
      intent: { action: 'think', emotion: 'curious', bubble: tonePick(tone, '友情价？听着像恋爱价。', '吐槽推送：黑狐破功。', '本记者已记录。'), duration: 7 },
      speech: tonePick(tone, '友情价？听着像恋爱价。', '吐槽推送：黑狐破功。', '本记者已记录。'),
    });
  }
  return {
    id: 'star-fox',
    variant: sequel ? 'again' : bystander ?? 'duo',
    cast: bystander ? ['gemini', 'glm', bystander] : ['gemini', 'glm'],
    beats,
    recall: sequel ? '星猫与黑狐又一次友情价' : '星猫求抱抱，黑狐友情价',
    bondBump: { a: 'gemini', b: 'glm', delta: sequel ? 2 : 4 },
  };
}

export function planStory(state: AppState, id: StoryId, now = Date.now()): StoryPlan | null {
  if (id === 'chose-her') return planChoseHer(state, state.selected, now);
  if (id === 'seat-share') return planSeatShare(state, now);
  if (id === 'star-fox') return planStarFox(state, now);
  return null;
}
