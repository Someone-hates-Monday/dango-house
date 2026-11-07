import type {ClaudeClip} from './claude-animation';

/** Manual Claude pack for in-app review / play-clip. Titles bilingual for QA. */
export type ClaudeClipMeta={
  id:ClaudeClip;
  title:string;
  group:'core'|'emotion'|'social'|'food'|'move';
  seconds:number;
};

export const claudeClips:ClaudeClipMeta[]=[
  {id:'idle',title:'待机 / Idle',group:'core',seconds:5},
  {id:'pat',title:'摸头 / Pat',group:'core',seconds:5},
  {id:'affection',title:'亲昵旧片 / Affection (legacy)',group:'core',seconds:5},
  {id:'chat',title:'挥手旧片 / Chat (legacy)',group:'core',seconds:5},
  {id:'rice',title:'吃饭团 / Rice',group:'food',seconds:5},
  {id:'bookmark',title:'书签 / Bookmark',group:'core',seconds:5},
  // listen / chosenAgain A3 are waist-cropped — omitted from in-app library until A4 remakes.
  {id:'rivalrySoft',title:'被冷落 / Soft rivalry',group:'emotion',seconds:5},
  {id:'reassure',title:'安慰 / Reassure',group:'social',seconds:5},
  {id:'gptJoke',title:'捂嘴笑 / GPT joke',group:'social',seconds:5},
  {id:'thinking',title:'思考 / Thinking',group:'emotion',seconds:5},
  {id:'success',title:'完成耸肩 / Success',group:'emotion',seconds:5},
  {id:'hesitate',title:'犹豫行礼 / Hesitate',group:'emotion',seconds:5},
  {id:'goodnight',title:'晚安行礼 / Goodnight',group:'social',seconds:5},
  {id:'fishShy',title:'大鱼挡脸 / Fish-shy',group:'food',seconds:5},
  {id:'walk',title:'走路(左向片) / Walk',group:'move',seconds:5},
  {id:'walkOpposite',title:'对面走 / Walk opposite',group:'move',seconds:5},
  {id:'recoverStep',title:'停步收势 / Recover step',group:'move',seconds:5},
  {id:'turnToLeft',title:'转向左 / Turn to left',group:'move',seconds:5},
  {id:'turnToRight',title:'转向右 / Turn to right',group:'move',seconds:5},
];

export const claudeClipById=(id:string)=>claudeClips.find(c=>c.id===id);
