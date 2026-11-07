import type {ClaudeAnimationPack} from './ClaudeVideoSprite';

/** Production Claude pack. Sit/sleep/Dock video deferred (DeepSeek also has no dedicated sit-down clip). */
export const claudePack:ClaudeAnimationPack={
  idle:{src:'./video/claude/idle.webm'},
  pat:{src:'./video/claude/pat.webm'},
  affection:{src:'./video/claude/affection.webm'},
  chat:{src:'./video/claude/chat.webm'},
  rice:{src:'./video/claude/rice.webm',bakedFood:true},
  bookmark:{src:'./video/claude/bookmark.webm'},
  walk:{src:'./video/claude/walk.webm'},
  walkOpposite:{src:'./video/claude/walk-opposite.webm'},
  // listen/chosen-again A3 waist-crops retired from routing; keep files on disk for lab only.
  rivalrySoft:{src:'./video/claude/rivalry-soft.webm'},
  reassure:{src:'./video/claude/reassure.webm'},
  gptJoke:{src:'./video/claude/gpt-joke.webm'},
  thinking:{src:'./video/claude/thinking.webm'},
  success:{src:'./video/claude/success.webm'},
  hesitate:{src:'./video/claude/hesitate.webm'},
  goodnight:{src:'./video/claude/goodnight.webm'},
  fishShy:{src:'./video/claude/fish-shy.webm'},
  recoverStep:{src:'./video/claude/recover-step.webm'},
  turnToLeft:{src:'./video/claude/turn-to-left.webm'},
  turnToRight:{src:'./video/claude/turn-to-right.webm'},
};
