import type { AvatarIntent, CharacterId, PairTone } from './types';
import { socialProfiles } from './social';
import { BOND_DAILY, BOND_INTIMATE, bondOf } from './bonds';

export type YuriSceneId =
  | 'rin-xia-seat'
  | 'shiori-xia-share'
  | 'grok-shiori-tease'
  | 'gemini-glm-hug'
  | 'kimi-rin-bookmark'
  | 'favor-triangle';

type ToneLines = Record<PairTone, string[]>;

export interface YuriScene {
  id: YuriSceneId;
  pair: [CharacterId, CharacterId];
  minBond: number;
  /** Localized titles filled by UI via i18n keys `yuri.scene.<id>` */
  titleKey: string;
  steps: (tone: PairTone) => { actor: CharacterId; intent: AvatarIntent }[];
}

const line = (tone: PairTone, pack: ToneLines, index: number) => pack[tone][index] ?? pack.warm[index] ?? pack.soft[index];

export const yuriScenes: YuriScene[] = [
  {
    id: 'rin-xia-seat',
    pair: ['rin', 'xia'],
    minBond: BOND_DAILY,
    titleKey: 'yuri.scene.rin-xia-seat',
    steps: tone => {
      const bubbles: ToneLines = {
        soft: ['窗边还空着，我们一起坐吧。', '好呀，我把饭碗也搬过来。', '……肩膀可以挨近一点。'],
        warm: ['大鱼，我把窗边留给你了——也留给我自己。', '那我坐你旁边！尾巴不会扫到书吧？', '书可以合上。今天想挨着你。'],
        vivid: ['过来。座位是给我们两个的。', '嘿嘿，那我贴紧一点～', '手……可以放在桌边碰到吗？'],
      };
      return [
        { actor: 'rin', intent: { action: 'approach', target: 'xia', emotion: 'shy', bubble: line(tone, bubbles, 0), duration: 8 } },
        { actor: 'xia', intent: { action: 'sit', emotion: 'happy', bubble: line(tone, bubbles, 1), duration: 8 } },
        { actor: 'rin', intent: { action: 'shy', emotion: 'shy', bubble: line(tone, bubbles, 2), duration: 8 } },
      ];
    },
  },
  {
    id: 'shiori-xia-share',
    pair: ['shiori', 'xia'],
    minBond: BOND_DAILY,
    titleKey: 'yuri.scene.shiori-xia-share',
    steps: tone => {
      const bubbles: ToneLines = {
        soft: ['半碗饭……你自己留着。', '那我们一起吃一点点？', '……椅子再近一点就行。'],
        warm: ['不是特意留的。你坐过来。', '小龙娘脸红了！我看到了～', '哼。尾巴碰到你是意外。'],
        vivid: ['靠近点。别让别人听见。', '那我喂你一口好不好？', '……只准这一口。'],
      };
      return [
        { actor: 'shiori', intent: { action: 'approach', target: 'xia', emotion: 'shy', bubble: line(tone, bubbles, 0), duration: 8 } },
        { actor: 'xia', intent: { action: 'eat', emotion: 'happy', bubble: line(tone, bubbles, 1), duration: 8 } },
        { actor: 'shiori', intent: { action: 'shy', emotion: 'shy', bubble: line(tone, bubbles, 2), duration: 8 } },
      ];
    },
  },
  {
    id: 'grok-shiori-tease',
    pair: ['grok', 'shiori'],
    minBond: BOND_DAILY,
    titleKey: 'yuri.scene.grok-shiori-tease',
    steps: tone => {
      const bubbles: ToneLines = {
        soft: ['前辈，今天也想找你玩。', '……说吧，别太吵。', '那我坐近一点，小声说。'],
        warm: ['笑话还没想好，想见你是真的。', '突然正经一点，我反而会慌。', '抓住你袖口了——逃跑无效。'],
        vivid: ['只给你听的悄悄话。', '……靠近了才准说。', '前辈的耳朵红了，记录在案。'],
      };
      return [
        { actor: 'grok', intent: { action: 'approach', target: 'shiori', emotion: 'happy', bubble: line(tone, bubbles, 0), duration: 8 } },
        { actor: 'shiori', intent: { action: 'think', emotion: 'curious', bubble: line(tone, bubbles, 1), duration: 8 } },
        { actor: 'grok', intent: { action: 'shy', emotion: 'happy', bubble: line(tone, bubbles, 2), duration: 8 } },
      ];
    },
  },
  {
    id: 'gemini-glm-hug',
    pair: ['gemini', 'glm'],
    minBond: BOND_INTIMATE,
    titleKey: 'yuri.scene.gemini-glm-hug',
    steps: tone => {
      const bubbles: ToneLines = {
        soft: ['狐狸小姐，今天可以用抱抱付账吗？', '……友情价可以谈。', '那猫猫轻轻抱一下！'],
        warm: ['账本里有一颗小星星，是给你的。', '被发现了呀～那就收好。', '喵，贴紧一点才算成交。'],
        vivid: ['不要算账了，先抱。', '好吧，这一单……很划算。', '铃铛碰到你的时候，我没有躲开。'],
      };
      return [
        { actor: 'gemini', intent: { action: 'approach', target: 'glm', emotion: 'happy', bubble: line(tone, bubbles, 0), duration: 8 } },
        { actor: 'glm', intent: { action: 'shy', emotion: 'shy', bubble: line(tone, bubbles, 1), duration: 8 } },
        { actor: 'gemini', intent: { action: 'celebrate', emotion: 'happy', bubble: line(tone, bubbles, 2), duration: 8 } },
      ];
    },
  },
  {
    id: 'kimi-rin-bookmark',
    pair: ['kimi', 'rin'],
    minBond: BOND_DAILY,
    titleKey: 'yuri.scene.kimi-rin-bookmark',
    steps: tone => {
      const bubbles: ToneLines = {
        soft: ['这一页想和你一起读。', '好，我泡茶。', '书签夹在我们中间。'],
        warm: ['月光落在你的书上，也落在我这边。', '今天靠着读，可以吗？', '可以。肩膀借你。'],
        vivid: ['把书签换成我们的约定。', '……手叠在书页上。', '嗯。这一页只属于我们。'],
      };
      return [
        { actor: 'kimi', intent: { action: 'approach', target: 'rin', emotion: 'happy', bubble: line(tone, bubbles, 0), duration: 8 } },
        { actor: 'rin', intent: { action: 'read', emotion: 'happy', bubble: line(tone, bubbles, 1), duration: 8 } },
        { actor: 'kimi', intent: { action: 'shy', emotion: 'shy', bubble: line(tone, bubbles, 2), duration: 8 } },
      ];
    },
  },
];

export function yuriScenesForBond(bonds: Record<string, number>, muted: CharacterId[] = []): YuriScene[] {
  return yuriScenes.filter(scene => {
    const [a, b] = scene.pair;
    if (muted.includes(a) || muted.includes(b)) return false;
    return Math.max(bondOf(bonds, a, b), bondOf(bonds, b, a)) >= scene.minBond;
  });
}

export function pickYuriScene(bonds: Record<string, number>, muted: CharacterId[], index: number): YuriScene | undefined {
  const pool = yuriScenesForBond(bonds, muted);
  if (!pool.length) return undefined;
  return pool[index % pool.length];
}

export function favorRivalLines(tone: PairTone, favored: CharacterId, rival: CharacterId): { actor: CharacterId; bubble: string }[] {
  const partner = socialProfiles[favored].target;
  const packs: Record<PairTone, { partner: string; other: string }> = {
    soft: {
      partner: '今天好像更黏她……那我先把位置留好。',
      other: '也分我一点点目光就好。',
    },
    warm: {
      partner: '偏爱可以，但今晚的并肩时间我先预约。',
      other: '哼，我也不是不会吃醋的。',
    },
    vivid: {
      partner: '她被夸了没关系——回来还是要坐我旁边。',
      other: '下次轮到我。说好了。',
    },
  };
  const pack = packs[tone];
  return [
    { actor: partner, bubble: pack.partner },
    { actor: rival === partner ? socialProfiles[partner].target : rival, bubble: pack.other },
  ];
}

export function shareSnackBubble(tone: PairTone, from: CharacterId, to: CharacterId, foodName: string): string {
  const map: Record<PairTone, string> = {
    soft: `${foodName}分你一点，好不好？`,
    warm: `这份${foodName}，想和你一起吃。`,
    vivid: `${foodName}先给你——靠近一点再咬。`,
  };
  void from;
  void to;
  return map[tone];
}
