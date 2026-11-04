import {useEffect,useState} from 'react';
import type {Character,Emotion,Pose} from './shared/types';
import {animationFrames,playbackIndex} from './shared/animation';
import {VideoSprite} from './VideoSprite';
import {RigSprite} from './RigSprite';
import {InteractionFx} from './InteractionFx';
import type {Interaction} from './shared/motion';
import {ClaudeVideoSprite} from './ClaudeVideoSprite';
import {claudePack} from './claude-pack';
import {ReactionVideoSprite} from './ReactionVideoSprite';
import {patVideos,idleVideos} from './reaction-pack';
export function Sprite({character,mood='idle',className='',skin='animated',pose,cue=0,activity='',interaction,perch=0,stoppedAt,forceRig=false,onReactionPlaying,frozen=false}:{character:Pick<Character,'name'|'file'|'atlas'>;mood?:string;className?:string;skin?:'chibi'|'animated';pose?:Pose;cue?:number;activity?:string;interaction?:Interaction;perch?:number;stoppedAt?:number;forceRig?:boolean;frozen?:boolean;onReactionPlaying?:(playing:boolean)=>void}){
  const selected=pose??(mood==='happy'?'jump':mood==='talk'?'think':mood==='focus'?'read':'idle');const frames=animationFrames(character.file,selected);const[frame,setFrame]=useState(0);const cell=frames[frame%frames.length];
  useEffect(()=>{const start=Date.now();setFrame(0);const timer=setInterval(()=>setFrame(playbackIndex(character.file,selected,Date.now()-start,frames.length)),80);return()=>clearInterval(timer);},[character.file,selected,cue,frames.length]);
  if(character.file==='deepseek'&&skin==='animated'&&!forceRig&&perch<.01)return <VideoSprite pose={selected} cue={cue} activity={activity} className={className} frame={frame%frames.length} row={cell.row} interaction={interaction} stoppedAt={stoppedAt} frozen={frozen} onReactionPlaying={onReactionPlaying}/>;
  if(character.file==='claude'&&skin==='animated'&&!forceRig&&perch<.01&&!selected.startsWith('walk'))return <ClaudeVideoSprite pack={claudePack} pose={selected} cue={cue} interaction={interaction} stoppedAt={stoppedAt} className={className}/>;
  const rig=<RigSprite file={character.file} pose={selected} cue={cue} interaction={interaction} perch={perch} staticArt={character.atlas===false||skin==='chibi'&&['deepseek','claude','gpt','gemini','glm'].includes(character.file)}/>;
  return <span role="img" aria-label={`${character.name} · ${selected}`} className={`sprite atlas rig-sprite ${className}`} data-frame={frame%frames.length} data-row={cell.row} data-column={cell.column}>{idleVideos[character.file]&&!forceRig&&perch<.01?<ReactionVideoSprite src={patVideos[character.file]} idleSrc={idleVideos[character.file]} file={character.file} pose={selected} cue={cue} interaction={interaction} stoppedAt={stoppedAt} frozen={frozen} onPlayingChange={onReactionPlaying}>{rig}</ReactionVideoSprite>:<>{rig}<InteractionFx file={character.file} interaction={interaction}/></>}</span>;
}
export function EmotionFx({emotion}:{emotion:Emotion}){return emotion==='neutral'?null:<span aria-label={`情绪：${emotion}`} className={`emotion-fx emotion-${emotion}`}>{emotion==='happy'?<><i>♥</i><i>✦</i><i>♥</i></>:emotion==='shy'?<><i>♥</i><i>…</i></>:emotion==='sad'?<><i>·</i><i>︵</i></>:<><i>?</i><i>✦</i></>}</span>;}
