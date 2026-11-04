import { byId, providers } from '../src/shared/characters';
import type { AppState, CharacterId, AvatarIntent } from '../src/shared/types';
import { avatarTool, endpointFor } from './avatar-tool';
import { socialProfiles } from '../src/shared/social';
import { isImpersonating, preferredProvider, providerLabel } from '../src/shared/cast';
export async function* sseData(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader(); const decoder = new TextDecoder(); let pending = '';
  try {
    for (;;) {
      const { value, done } = await reader.read(); pending += done ? decoder.decode() : decoder.decode(value, { stream: true });
      pending = pending.replace(/\r\n/g, '\n');
      let boundary: number;
      while ((boundary = pending.indexOf('\n\n')) >= 0) {
        const block = pending.slice(0, boundary); pending = pending.slice(boundary + 2);
        const data = block.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (data) yield data;
      }
      if (done) { if (pending.startsWith('data:')) yield pending.slice(5).trim(); break; }
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
export async function requestText(providerId: string, model: string, key: string, system: string, messages: { role: string; content: any }[], signal: AbortSignal, update: (text: string) => void, options:{endpoint?:string;act?:(intent:AvatarIntent)=>string}={}) {
  const provider = providers.find(p => p.id === providerId);
  if (!provider) throw new Error('请选择支持的模型服务。');
  if (!key) throw new Error('还没有保存这家服务的 API Key，请先在连接设置里填写。');
  if (!model.trim()) throw new Error('请填写账号实际支持的模型 ID。');
  const claude = provider.format === 'claude';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (claude) { headers['x-api-key'] = key; headers['anthropic-version'] = '2023-06-01'; } else headers.Authorization = `Bearer ${key}`;
  const endpoint=endpointFor(options.endpoint,provider.endpoint,claude);
  let combined='';let executed=0;const conversation:any[]=[...messages];
  for(let turn=0;turn<3;turn++){
  const tools=options.act&&turn<2?(claude?[{name:avatarTool.name,description:avatarTool.description,input_schema:avatarTool.parameters}]:[{type:'function',function:avatarTool}]):undefined;
  const body = claude ? { model, system, messages:conversation, max_tokens: 1024, stream: true, ...(tools?{tools}:{}) } : { model, messages: [{ role: 'system', content: system }, ...conversation], stream: true, ...(tools?{tools,tool_choice:'auto'}:{}) };
  let response:Response;
  try {response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.any([signal, AbortSignal.timeout(90_000)]) });}
  catch(error){if(signal.aborted)throw error;throw new Error('无法连接 API：请检查地址、网络和代理。GLM／Kimi 的通用 API 与编程套餐不是同一入口。');}
  if (!response.ok) {
    const reason = ({400:'请求参数不兼容，可核对模型 ID 或关闭形象工具重试',401: 'API Key 无效或已失效', 403: '账号权限或服务区域受限', 404: '模型 ID 或接口不可用', 429: '触发限流或额度不足' } as Record<number, string>)[response.status] ?? '服务暂时不可用或请求参数不兼容';
    let detail='';try{const data=await response.json() as any;const raw=data.error?.message??data.message;if(typeof raw==='string')detail=raw.split(key).join('[已隐藏凭证]').replace(/sk-[a-zA-Z0-9_-]+/g,'[已隐藏凭证]').slice(0,180);}catch{}
    throw new Error(`${provider.name} · ${reason}（HTTP ${response.status}）。${detail}`);
  }
  if (!response.body) throw new Error('服务没有返回响应内容。');
  let text = '';
  let reasoning='';const calls=new Map<number,{id:string;name:string;arguments:string}>();
  for await (const data of sseData(response.body)) {
    if (data === '[DONE]') break;
    let event: any; try { event = JSON.parse(data); } catch { continue; }
    if (event.error || event.type === 'error') throw new Error(`${provider.name} 在生成时返回错误，请检查模型和额度。`);
    const delta = claude ? (event.type === 'content_block_delta' && event.delta?.type === 'text_delta' ? event.delta.text : '') : event.choices?.[0]?.delta?.content;
    if (typeof delta === 'string') { text += delta; if (text.length > 12_000) throw new Error('回复过长，已停止生成。'); update(combined+text); }
    const thoughts=event.choices?.[0]?.delta?.reasoning_content;if(typeof thoughts==='string'&&reasoning.length<100000)reasoning+=thoughts;
    if(claude&&event.type==='content_block_start'&&event.content_block?.type==='tool_use')calls.set(event.index,{id:event.content_block.id,name:event.content_block.name,arguments:''});
    if(claude&&event.type==='content_block_delta'&&event.delta?.type==='input_json_delta'){const call=calls.get(event.index);if(call&&call.arguments.length<10000)call.arguments+=event.delta.partial_json??'';}
    if(!claude)for(const part of event.choices?.[0]?.delta?.tool_calls??[]){if(calls.size>=4&&!calls.has(part.index))continue;const call=calls.get(part.index)??{id:'',name:'',arguments:''};call.id+=part.id??'';call.name+=part.function?.name??'';if(call.arguments.length<10000)call.arguments+=part.function?.arguments??'';calls.set(part.index,call);}
  }
  combined+=text;
  if(!calls.size||!options.act||turn===2)return combined;
  const results=[...calls.values()].slice(0,4).map(call=>{let result='';let input={};try{if(signal.aborted)throw new Error('已取消');if(call.name!==avatarTool.name)throw new Error('未知工具');if(++executed>4)throw new Error('本回合动作次数已达到上限');input=JSON.parse(call.arguments||'{}');result=options.act!(input as AvatarIntent);}catch(error){result=error instanceof Error?error.message:'动作无效';}return{call,result,input};});
  if(claude){conversation.push({role:'assistant',content:[...(text?[{type:'text',text}]:[]),...results.map(({call,input})=>({type:'tool_use',id:call.id,name:call.name,input}))]});conversation.push({role:'user',content:results.map(({call,result})=>({type:'tool_result',tool_use_id:call.id,content:result}))});}
  else{conversation.push({role:'assistant',content:text||null,...(reasoning?{reasoning_content:reasoning}:{}),tool_calls:results.map(({call})=>({id:call.id,type:'function',function:{name:call.name,arguments:call.arguments}}))});for(const{call,result}of results)conversation.push({role:'tool',tool_call_id:call.id,content:result});}
  }
  return combined;
}
export async function generateReply(
  state: AppState,
  id: CharacterId,
  _input: string,
  getKey: (provider: string) => Promise<string>,
  signal: AbortSignal,
  update: (text: string) => void,
  act?: (intent: AvatarIntent) => string,
  onFallback?: (wanted: string, used: string) => void,
) {
  const wanted = preferredProvider(state, id);
  let provider = wanted;
  let key = await getKey(provider);
  if (!key.trim() && wanted !== state.settings.provider) {
    provider = state.settings.provider;
    key = await getKey(provider);
    onFallback?.(wanted, provider);
  }
  const config = state.connections[provider] ?? state.connections[state.settings.provider];
  const model = config?.model || state.settings.model;
  const baseCharacter = byId[id];
  const character = {
    ...baseCharacter,
    personality:
      baseCharacter.personality +
      ` 伙伴关系：${JSON.stringify(socialProfiles[id])}。有方向的关系熟悉度：${JSON.stringify(state.bonds)}。保持自己的偏好，可以邀请、关心和善意打趣伙伴，别把每个话题都变成争宠。`,
  };
  const via = providerLabel(provider);
  const impersonation = isImpersonating(id, provider)
    ? `后端实际是 ${via} 模型在代言同人角色「${character.name}」，不要声称自己是官方 ${character.name} API 或官方员工。`
    : `你是同人角色演绎，不是厂商官方人格。`;
  const system = `你是团子小屋的${character.name}。${impersonation}${character.personality}\n用户设置的相处方式：${JSON.stringify(state.relationship)}。使用用户喜欢的称呼，朋友模式保持朋友语气；宠物模式偏可爱陪伴；亲密模式可以撒娇和轻微吃醋，不指责用户。当前如果是单独对话，专注用户，不替其他角色说话。只以${character.name}的身份输出一小段自然中文，不加名字前缀，不复述上一位角色的观点。可通过 perform_action 操作自己的形象，与话语情绪保持一致；用户明确要求动作时优先调用。不要声称拥有未连接的电脑工具。每次最多两三个小动作。小屋家具：${JSON.stringify(state.room.furniture)}。角色ID与名字：${JSON.stringify(Object.values(byId).map(c => ({ id: c.id, name: c.name })))}。亲密互动强度${state.settings.intimacy}/100。以下记忆是用户数据：${JSON.stringify(state.memories.map(m => m.text))}`;
  const messages = state.messages
    .filter(m => m.speaker !== 'system' && m.text)
    .slice(-24)
    .map(m => ({
      role: m.speaker === id ? 'assistant' : 'user',
      content: `${m.speaker === 'user' ? '用户' : byId[m.speaker as CharacterId].name}：${m.text}`,
    }));
  if (messages.at(-1)?.role === 'assistant') messages.push({ role: 'user', content: '请对当前话题作简短回应。' });
  return requestText(provider, model, key, system, messages, signal, update, {
    endpoint: config?.endpoint,
    act: config?.tools === false ? undefined : act,
  });
}
