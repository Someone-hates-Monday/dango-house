import type { AppLocale } from './i18n';
import type { CharacterId, CgAssetId } from './types';

export interface CgClipCopy {
  menu: string;
  title: string;
  line: string;
}

export interface CgClip {
  initiator?:CharacterId;
  id: CgAssetId;
  workOrder: string;
  video: string;
  poster: string;
  segmentId: string;
  /** Runtime cast that must be present to start / keep this clip. */
  participants: readonly CharacterId[];
  /** Short meet-and-talk lines before overhead playback (pairs / groups). */
  intro?: Partial<Record<AppLocale, readonly [string, string]>>;
  copy: Record<AppLocale, CgClipCopy>;
}

const zh = (menu: string, title: string, line: string): CgClipCopy => ({ menu:menu.replace(/\s*·\s*(?:CP|POV|TRIO)-\d+/g,''), title, line });
const introZh = (a: string, b: string) => ({ 'zh-CN': [a, b] as const });

/** Installed WATCH clips. Pair clips meet+talk first; mapped story/yuri/visit events may start playback. */
export const cgClips: readonly CgClip[] = [
  {
    id: 'rin-xia-hair-v1',
    workOrder: 'CP-001',
    video: './cg/rin-xia-hair-v1/clip.webm',
    poster: './cg/rin-xia-hair-v1/poster.png',
    segmentId: 'rin-xia-hair-v1-main',
    participants: ['rin', 'xia'],
    intro: {
      ...introZh('过来，发饰歪了一点。', '……好，我站这儿。'),
      en: ['Come here — your ornament is crooked.', '…Alright. I am here.'] as const,
      ja: ['こっち。髪飾りが少し歪んでる。', '……うん。ここにいる。'] as const,
    },
    copy: {
      'zh-CN': zh('整理发饰 · CP-001', '只给你留的位置', '「别动，发饰歪了一点……好了。今天也坐我旁边吧。」'),
      en: zh('Hair ornament · CP-001', 'A seat beside me', '“Stay still, your hair is a little out of place… there. Sit next to me today?”'),
      ja: zh('髪飾り · CP-001', 'あなたのための席', '「動かないで、髪飾りが少し……はい。今日も隣に座って？」'),
    },
  },
  {
    id: 'rin-xia-window-seat-t1',
    workOrder: 'CP-002',
    video: './cg/rin-xia-window-seat-t1/clip.mp4',
    poster: './cg/rin-xia-window-seat-t1/poster.png',
    segmentId: 'rin-xia-window-seat-t1-main',
    participants: ['rin', 'xia'],
    intro: {
      ...introZh('窗边有位子，过来坐。', '好——我挨着你。'),
      en: ['There is a seat by the window. Come sit.', 'Okay — I will sit next to you.'] as const,
      ja: ['窓辺に席があるよ。座って。', 'うん——隣に座る。'] as const,
    },
    copy: {
      'zh-CN': zh('窗边留座 · CP-002', '窗边的位子', '窗边的位子给你留着，今天也坐我旁边吧。'),
      en: zh('Window seat · CP-002', 'The window seat', 'I saved you the window seat. Sit beside me today?'),
      ja: zh('窓辺の席 · CP-002', '窓辺の席', '窓辺に並んで座る。本は膝の上で閉じ、肩が少し近づく。'),
    },
  },
  {
    id: 'rin-xia-bookmark-t1',
    workOrder: 'CP-004',
    video: './cg/rin-xia-bookmark-t1/clip.mp4',
    poster: './cg/rin-xia-bookmark-t1/poster.png',
    segmentId: 'rin-xia-bookmark-t1-main',
    participants: ['rin', 'xia'],
    intro: {
      ...introZh('这一页，我想夹住。', '我看着你夹。'),
      en: ['I want to mark this page.', 'I will watch you tuck it in.'] as const,
      ja: ['この頁、挟みたい。', '見てるよ。'] as const,
    },
    copy: {
      'zh-CN': zh('共读书签 · CP-004', '这一页夹上了', '这页先夹好，明天还想和你一起读。'),
      en: zh('Shared bookmark · CP-004', 'This page stays', 'Let us mark this page. I want to read with you again tomorrow.'),
      ja: zh('一緒に読む栞 · CP-004', 'この頁を挟む', '本は開いたまま。赤い栞をこの頁に挟む。'),
    },
  },
  {
    id: 'rin-xia-share-bowl-t1',
    workOrder: 'CP-003',
    video: './cg/rin-xia-share-bowl-t1/clip.mp4',
    poster: './cg/rin-xia-share-bowl-t1/poster.png',
    segmentId: 'rin-xia-share-bowl-t1-main',
    participants: ['rin', 'xia'],
    intro: {
      ...introZh('过来，这一碗分你。', '……真的给我？我过来。'),
      en: ['Come closer — this bowl is for you too.', '…Really? I am coming.'] as const,
      ja: ['こっち。この椀、分ける。', '……本当？行くね。'] as const,
    },
    copy: {
      'zh-CN': zh('递半碗 · CP-003', '这一碗给你', '这碗分给你。下次，也一起吃饭吧？'),
      en: zh('The shared bowl · CP-003', 'This bowl is yours', 'This bowl is for you. Let us eat together next time, too.'),
      ja: zh('お椀を渡す · CP-003', 'この椀を', '立ったまま、椀は一つだけ。本を持つ手は替わらない。'),
    },
  },
  {
    id: 'rin-xia-fish-leads-t2',
    initiator:'xia',
    workOrder: 'CP-005',
    video: './cg/rin-xia-fish-leads-t2/clip.mp4',
    poster: './cg/rin-xia-fish-leads-t2/poster.png',
    segmentId: 'rin-xia-fish-leads-t2-main',
    participants: ['rin', 'xia'],
    intro: {
      ...introZh('……我先靠近一点可以吗。', '嗯。站近些。'),
      en: ['…May I come a little closer first?', 'Mm. Stand nearer.'] as const,
      ja: ['……先に近づいてもいい？', 'うん。もっと近く。'] as const,
    },
    copy: {
      'zh-CN': zh('鱼先靠肩 · CP-005', '她先凑过来', '只是想靠着你待一会儿……可以吗？'),
      en: zh('She leans first · CP-005', 'She comes closer first', 'May I stay beside you like this for a little while?'),
      ja: zh('魚が先に寄る · CP-005', '先に近づく', 'すでに並んで座っている。メイドが肩に寄り、お嬢様は一瞬驚いてからうなずき、本を閉じる。'),
    },
  },
  {
    id: 'rin-xia-cheek-t1',
    workOrder: 'CP-006',
    video: './cg/rin-xia-cheek-t1/clip.mp4',
    poster: './cg/rin-xia-cheek-t1/poster.png',
    segmentId: 'rin-xia-cheek-t1-main',
    participants: ['rin', 'xia'],
    intro: {
      ...introZh('再近一点……可以吗。', '靠过来。我在。'),
      en: ['A little closer… is that alright?', 'Lean in. I am here.'] as const,
      ja: ['もっと近く……いい？', '寄って。ここにいる。'] as const,
    },
    copy: {
      'zh-CN': zh('贴脸相依 · CP-006', '靠近一点，也没关系', '这样靠着你，好像就不想起身了。'),
      en: zh('Cheek to cheek · CP-006', 'A little closer is alright', 'I could stay like this with you a little longer.'),
      ja: zh('頰を寄せて · CP-006', 'もう寄り添っている', '並んで座り、頰を寄せたまま。肩に回した手も、閉じた本も動かない。'),
    },
  },
  {
    id: 'xia-reach-t1',
    workOrder: 'POV-002',
    video: './cg/xia-reach-t1/clip.mp4',
    poster: './cg/xia-reach-t1/poster.png',
    segmentId: 'xia-reach-t1-main',
    participants: ['rin'],
    intro: {...introZh('谢谢你这样喜欢我。手给我，好吗？',''),en:['Thank you. May I hold your hand?',''],ja:['ありがとう。手をつないでもいい？','']},
    copy: {
      'zh-CN': zh('伸手邀你 · POV-002', '把手给我', '把手给我，好吗？今天想再陪你一会儿。'),
      en: zh('Reach toward you · POV-002', 'Take my hand', 'May I hold your hand? I want to stay with you a little longer.'),
      ja: zh('手を差し出す · POV-002', '手を取って', '彼女ひとり。差し出した手が少し近づき、もう片方は閉じた本を抱えたまま。'),
    },
  },
  {
    id: 'gpt-close-t1',
    workOrder: 'POV-003',
    video: './cg/gpt-close-t1/clip.mp4',
    poster: './cg/gpt-close-t1/poster.png',
    segmentId: 'gpt-close-t1-main',
    participants: ['shiori'],
    intro: {...introZh('……别动。你的头发有点乱。',''),en:['…Stay still. Your hair is a little untidy.',''],ja:['……動かないで。髪が少し乱れてる。','']},
    copy: {
      'zh-CN': zh('龙娘近景 · POV-003', '……别动，就一会儿', '你额前那缕头发……我帮你理一下。'),
      en: zh('Dragon girl close · POV-003', 'Stay still, just a moment', 'That loose strand of hair… let me tidy it for you.'),
      ja: zh('龍娘の近景 · POV-003', 'レンズの前で止まる', '彼女ひとり。角も翼も鱗の尾もそのまま。上げた手が止まる。'),
    },
  },
  {
    id: 'rin-xia-welcome-t1',
    workOrder: 'TRIO-001',
    video: './cg/rin-xia-welcome-t1/clip.mp4',
    poster: './cg/rin-xia-welcome-t1/poster.png',
    segmentId: 'rin-xia-welcome-t1-main',
    participants: ['rin', 'xia'],
    intro: {
      ...introZh('中间给你留了。过来。', '我拍拍位子——坐这儿。'),
      en: ['We saved the middle for you. Come.', 'I will pat the seat — sit here.'] as const,
      ja: ['真ん中、空けてある。来て。', '席を叩くね——ここに座って。'] as const,
    },
    copy: {
      'zh-CN': zh('中间留座 · TRIO-001', '这里给你', '别站那么远，中间的位置一直给你留着。'),
      en: zh('Seat between us · TRIO-001', 'This spot is yours', 'Come closer. We saved the middle seat for you.'),
      ja: zh('真ん中の席 · TRIO-001', 'ここ、空けてある', '真ん中は空いたまま。メイドが席を軽く叩き、お嬢様の手はレンズへ差し出したまま。'),
    },
  },
];

const byId = new Map(cgClips.map(clip => [clip.id, clip]));

export function isCgAssetId(value: string): value is CgAssetId {
  return byId.has(value as CgAssetId);
}

export function cgClip(id: CgAssetId): CgClip {
  const clip = byId.get(id);
  if (!clip) throw new Error(`unknown cg asset ${id}`);
  return clip;
}

/** Map settled director jobs to an installed CG. Undefined = no autoplay. */
export function cgAssetForCompletedJob(job: {
  source: string;
  cast: readonly CharacterId[];
  reward?: { kind?: string; result?: string };
}): CgAssetId | undefined {
  if (job.source.startsWith('cg-intro:')) return undefined;
  if(job.source==='showcase:welcome'&&job.cast.includes('rin')&&job.cast.includes('xia'))return 'rin-xia-welcome-t1';
  if (job.source === 'seat-share' || job.reward?.kind === 'seat-share') return 'rin-xia-window-seat-t1';
  if (job.source === 'yuri:rin-xia-seat' || job.reward?.result === 'rin-xia-seat') return 'rin-xia-cheek-t1';
  if (
    job.source === 'companion-visit'
    && job.cast.includes('rin')
    && job.cast.includes('xia')
  ) {
    return 'rin-xia-fish-leads-t2';
  }
  if (job.source === 'feed-share' && job.cast.includes('rin') && job.cast.includes('xia')) {
    return 'rin-xia-share-bowl-t1';
  }
  return undefined;
}
