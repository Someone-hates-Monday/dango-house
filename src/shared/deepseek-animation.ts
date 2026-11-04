import {deepseekClips} from './deepseek-clips';
import type {Interaction} from './motion';
import type {Pose} from './types';
export const clipById=(id:string)=>deepseekClips.find(c=>c.id===id);
export const clipByTitle=(title:string)=>deepseekClips.find(c=>c.title===title);
export function chooseDeepseekClip(pose:Pose,cue:number,interaction?:Interaction){
  if(pose.startsWith('walk'))return 'walk';
  if(interaction?.kind==='clip')return clipById(interaction.clipId??'')?.id??'idle';
  const pick=(titles:string[])=>clipByTitle(titles[Math.abs(Math.trunc(cue))%titles.length])?.id??'idle';
  if(interaction?.kind==='pat')return pick(['点击回应-害羞惊讶','点击回应-挠痒咯咯笑']);
  if(interaction?.kind==='affection')return pick(['点击回应-开心跃动','女仆屈膝礼仪','鲸鱼吐泡泡特效']);
  if(interaction?.kind==='chat')return pick(['点击回应-元气挥手','碎碎念-对屏碎碎念']);
  if(interaction?.kind==='feed')return interaction.food==='rice'?'rice':pick(['大口吃零食','吃午餐','偷吃零食被抓住']);
  if(pose==='think')return pick(['工作状态-思考冒泡','深度思考碎碎念','轻快记录']);
  if(pose==='read')return pick(['工作状态-清点归档','写代码']);
  return ({idle:'idle','walk-left':'walk','walk-right':'walk',wave:'wave',jump:'happy',sad:'sad',wait:'shy'} as Partial<Record<Pose,string>>)[pose]??'idle';
}
export function socialDeepseekClip(action:string,bubble:string,cue:number):string|undefined {
  const title=/饭|吃|点心|rice|snack|ご飯/i.test(bubble)?'是啊，吃什么':/留|座|一起|陪|together|一緒/i.test(bubble)?'女仆屈膝礼仪':undefined;
  if(title)return clipByTitle(title)?.id;
  if(action==='sleep')return clipByTitle('睡觉-开始')?.id;
  if(action==='water')return clipByTitle('凭空生花')?.id;
  if(action==='sit')return clipByTitle(cue%2?'悠闲哼歌':'东张西望')?.id;
  return undefined;
}
