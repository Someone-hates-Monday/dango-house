import { characters, byId } from './characters';
import type { AvatarIntent, CharacterId, Embodiment, Furniture, FurnitureKind, Pose, RoomPoint, RoomResident } from './types';
export const poseLabels: Record<Pose,string> = { idle:'发呆', 'walk-right':'向右走', 'walk-left':'向左走', wave:'挥手', jump:'开心跳跃', sad:'有点委屈', wait:'等待你', think:'认真思考', read:'读书' };
export const furnitureCatalog: {kind:FurnitureKind;name:string}[] = [{kind:'sofa',name:'云朵沙发'},{kind:'table',name:'下午茶桌'},{kind:'bookshelf',name:'故事书架'},{kind:'plant',name:'小绿植'},{kind:'lamp',name:'星星灯'},{kind:'cushion',name:'团子坐垫'}];
export const defaultFurniture = ():Furniture[] => [{id:'sofa',kind:'sofa',x:22,y:59},{id:'tea',kind:'table',x:50,y:74},{id:'books',kind:'bookshelf',x:78,y:47},{id:'plant',kind:'plant',x:13,y:43},{id:'lamp',kind:'lamp',x:89,y:63},{id:'cushion',kind:'cushion',x:66,y:89}];
export const restingBody = ():Embodiment => ({pose:'idle',emotion:'neutral',until:0,label:'发呆',bubble:''});
export const defaultResidents = () => Object.fromEntries(characters.map((c,i)=>[c.id,{x:22+i*9,y:81+(i%2)*10,from:{x:22+i*9,y:81+(i%2)*10},startedAt:0,arrivesAt:0,after:'idle',destination:''}])) as Record<CharacterId,RoomResident>;
export function residentPosition(r:RoomResident,now=Date.now()):RoomPoint { const t = r.arrivesAt>r.startedAt ? Math.max(0,Math.min(1,(now-r.startedAt)/(r.arrivesAt-r.startedAt))) : 1; return {x:r.from.x+(r.x-r.from.x)*t,y:r.from.y+(r.y-r.from.y)*t}; }
export const boundedPoint = (x:number,y:number):RoomPoint => ({x:Math.max(8,Math.min(92,x)),y:Math.max(48,Math.min(94,y))});
export function validatedIntent(value: unknown):AvatarIntent {
  if (!value || typeof value!=='object') throw new Error('动作参数必须是对象');
  const v=value as AvatarIntent;
  if (!['wave','jump','think','read','shy','sad','celebrate','walk','approach','sit','water','eat','sleep','idle'].includes(v.action)) throw new Error('动作不在允许列表中');
  if (v.emotion && !['neutral','happy','shy','sad','curious'].includes(v.emotion)) throw new Error('表情不在允许列表中');
  if (v.target && (typeof v.target!=='string'||v.target.length>80)) throw new Error('目标无效');
  if ((v.x!==undefined&&!Number.isFinite(v.x))||(v.y!==undefined&&!Number.isFinite(v.y))) throw new Error('位置必须是有限数字');
  return {action:v.action,emotion:v.emotion,target:v.target,x:v.x,y:v.y,duration:Math.max(1,Math.min(15,Number(v.duration)||5)),bubble:typeof v.bubble==='string'?v.bubble.slice(0,55):''};
}
export function poseForAction(action:string):Pose { return ({wave:'wave',jump:'jump',celebrate:'jump',think:'think',read:'read',shy:'wait',sad:'sad',sit:'read',water:'wave',eat:'jump',sleep:'idle',idle:'idle'} as Record<string,Pose>)[action]??'idle'; }
export function inferredIntent(text:string):AvatarIntent {
  if(/挥手|你好|招呼/.test(text))return{action:'wave',emotion:'happy'};
  if(/开心|好耶|太棒|谢谢|喜欢/.test(text))return{action:'celebrate',emotion:'happy'};
  if(/抱|害羞|脸红/.test(text))return{action:'shy',emotion:'shy'};
  if(/难过|委屈|呜/.test(text))return{action:'sad',emotion:'sad'};
  if(/读书|看书/.test(text))return{action:'read',target:'books'};
  if(/茶|吃饭|白米饭/.test(text))return{action:'eat',target:'tea',emotion:'happy'};
  return{action:'think',emotion:'curious',duration:4};
}
export function targetDescription(target:string,furniture:Furniture[]):string { const obj=furniture.find(f=>f.id===target); return obj ? furnitureCatalog.find(f=>f.kind===obj.kind)!.name : byId[target as CharacterId]?.name??target; }
