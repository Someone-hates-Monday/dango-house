import type {Interaction} from './motion';
import type {Pose} from './types';

export const claudeClipIds=[
  'idle','pat','affection','chat','rice','bookmark','walk','walkOpposite',
  'listen','rivalrySoft','chosenAgain','reassure','gptJoke',
  'thinking','success','hesitate','goodnight','fishShy',
  'recoverStep','turnToLeft','turnToRight',
] as const;
export type ClaudeClip=(typeof claudeClipIds)[number];
export function isClaudeClip(id:string):id is ClaudeClip{
  return (claudeClipIds as readonly string[]).includes(id);
}

/** Enter/loop/exit for Claude walk.webm (faces screen-left). */
export const claudeWalkClip={enterEnd:.58,loopStart:.58,loopEnd:4.42,exitStart:4.42,exitEnd:5.04};
/** Enter/loop/exit for walk-opposite.webm (faces screen-right). */
export const claudeWalkOppositeClip={enterEnd:2.21,loopStart:2.21,loopEnd:4.21,exitStart:4.21,exitEnd:5.04};
export function walkClipWindow(clip:ClaudeClip){
  return clip==='walkOpposite'?claudeWalkOppositeClip:claudeWalkClip;
}

/** Prefer a real clip from interaction; never let a no-op interaction hide pose clips. */
export function claudeReactionClip(pose:Pose,interaction:Interaction|undefined,now=Date.now()):ClaudeClip{
  const fromInteraction=claudeInteractionClip(interaction,now);
  if(fromInteraction!=='idle')return fromInteraction;
  return claudePoseClip(pose);
}

// These are explicit events. An arbitrary happy response must not play eating.
export function claudeInteractionClip(interaction:Interaction|undefined,now=Date.now()):ClaudeClip{
  if(!interaction||now<interaction.startedAt||now-interaction.startedAt>10000)return 'idle';
  if(interaction.kind==='clip'&&interaction.clipId&&isClaudeClip(interaction.clipId))return interaction.clipId;
  if(interaction.kind==='feed'){
    if(interaction.food==='rice')return 'rice';
    if(interaction.food==='fish')return 'fishShy';
    if(interaction.food==='cake')return 'affection';
    if(interaction.food==='tea')return 'chat';
    return 'idle';
  }
  if(interaction.kind==='pat')return 'pat';
  // listen/chosen-again A3 are waist-cropped; use full-body production clips until A4 remakes exist.
  if(interaction.kind==='affection')return 'affection';
  if(interaction.kind==='chat')return 'chat';
  if(interaction.kind==='bookmark')return 'bookmark';
  if(interaction.kind==='trip')return 'rivalrySoft';
  return 'idle';
}

export function claudePoseClip(pose:Pose):ClaudeClip{
  // walk.webm faces left; walk-opposite faces right. Mirror only as fallback in the sprite.
  if(pose==='walk-right')return 'walkOpposite';
  if(pose==='walk-left')return 'walk';
  if(pose==='think')return 'thinking';
  if(pose==='read')return 'bookmark';
  if(pose==='wave')return 'chat';
  if(pose==='jump')return 'success';
  if(pose==='sad')return 'rivalrySoft';
  if(pose==='wait')return 'hesitate';
  return 'idle';
}

/** When engine has no Interaction yet, pick a Claude reaction clip from action/bubble (rin only). */
export function socialClaudeClip(action:string,bubble:string,_cue=0):ClaudeClip|undefined{
  if(/晚安|睡觉|sleep|おやすみ|good\s*night/i.test(bubble)||action==='sleep')return 'goodnight';
  if(/安慰|别怕|没关系|comfort|大丈夫|reassure/i.test(bubble))return 'reassure';
  if(/笑话|好笑|GPT|龙娘|joke|笑って/i.test(bubble))return 'gptJoke';
  if(/大鱼|DeepSeek|xia|鱼干|fish/i.test(bubble)&&/靠近|害羞|挡|shy|近づ/i.test(bubble))return 'fishShy';
  if(action==='sleep')return 'goodnight';
  if(action==='think')return 'thinking';
  if(action==='celebrate'||action==='jump')return 'success';
  if(action==='shy')return 'hesitate';
  if(action==='sad')return 'rivalrySoft';
  if(action==='wave')return 'chat';
  if(action==='read'||action==='sit')return 'bookmark';
  if(action==='water')return 'chat';
  if(action==='eat')return 'rice';
  return undefined;
}
