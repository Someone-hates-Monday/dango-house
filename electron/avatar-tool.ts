export const avatarTool = {
  name:'perform_action',
  description:'控制你自己的2D形象：挥手、跳跃、思考、读书、害羞、委屈、短距离走动、走向另一位伙伴或小屋家具。只影响你自己的形象；不操作文件和电脑。',
  parameters:{type:'object',properties:{action:{type:'string',enum:['wave','jump','think','read','shy','sad','celebrate','walk','approach','sit','water','eat','sleep','idle']},emotion:{type:'string',enum:['neutral','happy','shy','sad','curious']},target:{type:'string',description:'可选的小屋家具ID或另一位角色ID，必须来自上下文'},x:{type:'number',description:'走动目标横坐标，8至92'},y:{type:'number',description:'走动目标纵坐标，48至94'},duration:{type:'number',description:'动作保持秒数，1至15'},bubble:{type:'string',description:'简短动作气泡，不超过55字'}},required:['action'],additionalProperties:false},
};
export function endpointFor(value:string|undefined,fallback:string,claude=false){
  const raw=value?.trim()||fallback;let url:URL;try{url=new URL(raw);}catch{throw new Error('API 地址不是有效网址。');}
  if(url.username||url.password||url.hash||url.search)throw new Error('API 地址不能包含账号、查询参数或片段。');
  if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(url.hostname)))throw new Error('API 地址必须使用 HTTPS，本机服务可使用 HTTP。');
  if(!url.pathname.endsWith(claude?'/messages':'/chat/completions'))url.pathname=url.pathname.replace(/\/$/,'')+(claude?'/messages':'/chat/completions');
  return url.toString();
}
