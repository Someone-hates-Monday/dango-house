import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState} from '../src/shared/director';
import {houseFocus,housePrompt,parseHousePlan,needsHousePartner} from '../src/shared/house-events';
import {affectionCgFor} from '../src/shared/cg-policy';
import {socialProfiles} from '../src/shared/social';
import {GardenEngine} from '../electron/engine';

const origin={backend:'model' as const,voiceRevision:2,provider:'fixture',model:'fixture'};
const touch={id:'touch',kind:'pat',actor:'xia' as const,at:1};
const beats=[{actor:'rin',text:'我也在听。',intent:{action:'think'}},{actor:'xia',text:'谢谢你的摸摸。',intent:{action:'shy'}}];

test('touch and private entry stay user-focused; explicit companion requests retain social focus',()=>{
 for(const kind of ['pat','feed','praise','private-open','private-return','hover'])assert.equal(houseFocus({...touch,kind}),'user');
 for(const text of ['你好','Claude和DeepSeek谁更喜欢我','你们俩陪我聊天','GPT给我一个拥抱'])assert.equal(houseFocus({...touch,kind:'message',text}),'user',text);
 for(const text of ['你们互相聊聊','DeepSeek和Claude一起到窗边','你们自己聊，别管我','你们俩聊聊今天的事'])assert.equal(houseFocus({...touch,kind:'message',text}),'companions',text);
 assert.equal(houseFocus({...touch,kind:'autonomous'}),'companions');
});

test('direct interactions lead with the selected resident and ignore unrelated pair CG/gathering',()=>{
 const s=initialState();s.presentIds=['xia','rin','shiori'];
 const plan=parseHousePlan(JSON.stringify({beats,cgAsset:'rin-xia-cheek-t1',gather:{actors:['xia','rin'],target:'window'}}),s,touch,origin);
 assert.equal(plan.beats[0].actor,'xia');assert.equal(plan.cgAsset,undefined);assert.equal(plan.gather,undefined);
 const companion=parseHousePlan(JSON.stringify({beats,cgAsset:'rin-xia-cheek-t1',gather:{actors:['xia','rin'],target:'window'}}),s,{...touch,kind:'story'},origin);
 assert.equal(companion.cgAsset,'rin-xia-cheek-t1');assert.equal(companion.gather?.target,'window');
 const solo=parseHousePlan(JSON.stringify({beats:[beats[1]]}),s,touch,origin);
 assert.equal(needsHousePartner(s,touch,solo),false);
 assert.equal(needsHousePartner(s,{...touch,kind:'story'},solo),true);
});

test('CG audience and actor identity both match the interaction',()=>{
 const s=initialState();s.relationship.mode='romance';s.presentIds=['xia','rin','shiori'];
 const plan=(actor:'xia'|'rin')=>parseHousePlan(JSON.stringify({beats,cgAsset:'xia-reach-t1'}),s,{...touch,actor},origin);
 assert.equal(plan('rin').cgAsset,'xia-reach-t1');assert.equal(plan('xia').cgAsset,undefined);
 assert.equal(affectionCgFor('rin'),'xia-reach-t1');assert.equal(affectionCgFor('xia'),undefined);
});

test('model context keeps actual conversation without feeding canned scripts back to the model',()=>{
 const s=initialState();s.messages=[
  {id:'local',at:1,speaker:'rin',text:'CANNED_LOCAL',origin:{backend:'local'}},
  {id:'old',at:2,speaker:'rin',text:'UNVERIFIED_OLD'},
  {id:'user',at:3,speaker:'user',text:'USER_CURRENT'},
  {id:'model',at:4,speaker:'xia',text:'MODEL_CONTEXT',origin},
 ];
 const prompt=housePrompt(s,touch);
 assert.ok(prompt.includes('USER_CURRENT'));assert.ok(prompt.includes('MODEL_CONTEXT'));
 assert.ok(!prompt.includes('CANNED_LOCAL'));assert.ok(!prompt.includes('UNVERIFIED_OLD'));
 for(const profile of Object.values(socialProfiles))assert.ok(!prompt.includes(profile.response));
 assert.ok(!prompt.includes('rin-xia-cheek-t1'));assert.match(prompt,/Attention: USER/);
 assert.match(housePrompt(s,{...touch,kind:'autonomous'}),/Attention: COMPANIONS/);
 assert.equal(s.messages.length,4,'visible history is preserved');
});

test('API private avatar tools never inject an implicit scripted partner response',()=>{
 const s=initialState();s.settings.mode='api';s.settings.autonomous=false;s.room.autonomous=false;s.presentIds=['xia','rin'];
 s.messages=[];const e=new GardenEngine(s);e.perform('xia',{action:'approach',target:'rin',duration:1},'model');
 e.tick(Date.now()+15000);
 assert.equal(e.state.messages.filter(m=>m.speaker==='rin').length,0);
 assert.notEqual(e.state.bodies.rin.bubble,socialProfiles.rin.response);
});
