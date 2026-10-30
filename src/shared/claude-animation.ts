import type {Interaction} from './motion';
import type {Pose} from './types';
export type ClaudeClip='idle'|'pat'|'affection'|'chat'|'rice'|'bookmark';
// These are explicit events. An arbitrary happy response must not play eating.
export function claudeInteractionClip(interaction:Interaction|undefined,now=Date.now()):ClaudeClip{
  if(!interaction||now<interaction.startedAt||now-interaction.startedAt>10000)return 'idle';
  if(interaction.kind==='feed')return interaction.food==='rice'?'rice':'idle';
  if(['pat','affection','chat','bookmark'].includes(interaction.kind))return interaction.kind as ClaudeClip;
  return 'idle';
}
export function claudePoseClip(pose:Pose):ClaudeClip{
  return pose==='wave'?'chat':pose==='read'||pose==='think'?'bookmark':pose==='jump'||pose==='wait'?'affection':'idle';
}
