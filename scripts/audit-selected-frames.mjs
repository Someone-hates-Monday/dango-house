import fs from 'node:fs';
import {animationFrames} from '../src/shared/animation.ts';
const all=[];for(const file of ['claude','grok','deepseek','gpt','gemini','kimi'])for(const pose of ['idle','walk-left','walk-right','wave','jump','sad','wait','think','read'])for(const cell of animationFrames(file,pose))all.push({file,pose,...cell});fs.writeFileSync('test-results/selected-frames.json',JSON.stringify(all));
