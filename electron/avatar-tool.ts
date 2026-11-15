export const avatarTool = {
  name:'perform_action',
  description:'控制你自己的2D形象：挥手、跳跃、思考、读书、害羞、委屈、短距离走动、走向另一位伙伴或小屋家具。只影响你自己的形象；不操作文件和电脑。',
  parameters:{type:'object',properties:{action:{type:'string',enum:['wave','jump','think','read','shy','sad','celebrate','walk','approach','sit','water','eat','sleep','idle']},emotion:{type:'string',enum:['neutral','happy','shy','sad','curious']},target:{type:'string',description:'可选的小屋家具ID或另一位角色ID，必须来自上下文'},x:{type:'number',description:'走动目标横坐标，8至92'},y:{type:'number',description:'走动目标纵坐标，48至94'},duration:{type:'number',description:'动作保持秒数，1至15'},bubble:{type:'string',description:'简短动作气泡，不超过55字'}},required:['action'],additionalProperties:false},
};
export const companionTool={
 name:'invite_companion',
 description:'当你决定接受用户建议、去找另一位在场伙伴玩或亲近时，安排一次真实拜访：先完成当前私聊回复，然后小屋执行走近、伙伴接话、Q版动作与合适的共享CG。只提交可公开的邀请话题，不携带私聊内容。用户说自己忙、让你们自己玩时，可设置self-play；用户回来可设置together。不要为了继续独占用户而无故拒绝用户的建议。',
 parameters:{type:'object',properties:{target:{type:'string',description:'想邀请的在场伙伴的精确ID，不是自己。设置together而不拜访时可省略'},topic:{type:'string',description:'公开的简单邀请目的，例如一起休息、聊聊或靠近待会儿，不超过120字，不是私聊摘要'},playMode:{type:'string',enum:['self-play','together'],description:'仅在用户明确表示想让你们自己玩、或回来一起时设置'}},additionalProperties:false},
};
export function endpointFor(value:string|undefined,fallback:string,claude=false){
  const raw=value?.trim()||fallback;let url:URL;try{url=new URL(raw);}catch{throw new Error('API 地址不是有效网址。');}
  if(url.username||url.password||url.hash||url.search)throw new Error('API 地址不能包含账号、查询参数或片段。');
  if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(url.hostname)))throw new Error('API 地址必须使用 HTTPS，本机服务可使用 HTTP。');
  if(!url.pathname.endsWith(claude?'/messages':'/chat/completions'))url.pathname=url.pathname.replace(/\/$/,'')+(claude?'/messages':'/chat/completions');
  return url.toString();
}
