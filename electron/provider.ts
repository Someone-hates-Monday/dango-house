import {cgClips} from '../src/shared/cg-catalog';
import {isUserIntimacy} from '../src/shared/cg-policy';
import {characterVoiceReference,companionResponseGuide} from '../src/shared/companion-voice';
import {housePrompt,parseHousePlan,needsHousePartner,allowsHouseCg,modelContextMessages,type CompanionInvitation,type HouseEvent} from '../src/shared/house-events';
import { byId, providers } from '../src/shared/characters';
import type { AppState, CharacterId, AvatarIntent } from '../src/shared/types';
import { avatarTool, companionTool, cgTool, endpointFor } from './avatar-tool';
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
export async function requestText(providerId: string, model: string, key: string, system: string, messages: { role: string; content: any }[], signal: AbortSignal, update: (text: string) => void, options:{endpoint?:string;act?:(intent:AvatarIntent)=>string;invite?:(request:CompanionInvitation)=>string;cg?:(asset:string)=>string}={}) {
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
  const enabledTools=[...(options.act?[avatarTool]:[]),...(options.invite?[companionTool]:[]),...(options.cg?[cgTool]:[])];
  const tools=enabledTools.length&&turn<2?(claude?enabledTools.map(t=>({name:t.name,description:t.description,input_schema:t.parameters})):enabledTools.map(t=>({type:'function',function:t}))):undefined;
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
  if(!calls.size||(!options.act&&!options.invite&&!options.cg)||turn===2)return combined;
  const results=[...calls.values()].slice(0,4).map(call=>{let result='';let input={};try{if(signal.aborted)throw new Error('已取消');if(call.name!==avatarTool.name&&call.name!==companionTool.name&&call.name!==cgTool.name)throw new Error('未知工具');if(++executed>4)throw new Error('本回合动作次数已达到上限');input=JSON.parse(call.arguments||'{}');if(call.name===cgTool.name){if(!options.cg)throw Error("CG tool unavailable");result=options.cg((input as {asset:string}).asset);}else if(call.name===companionTool.name){if(!options.invite)throw Error('同伴邀请工具未开放');result=options.invite(input as CompanionInvitation);}else{if(!options.act)throw Error('形象工具未开放');result=options.act(input as AvatarIntent);}}catch(error){result=error instanceof Error?error.message:'动作无效';}return{call,result,input};});
  if(claude){conversation.push({role:'assistant',content:[...(text?[{type:'text',text}]:[]),...results.map(({call,input})=>({type:'tool_use',id:call.id,name:call.name,input}))]});conversation.push({role:'user',content:results.map(({call,result})=>({type:'tool_result',tool_use_id:call.id,content:result}))});}
  else{conversation.push({role:'assistant',content:text||null,...(reasoning?{reasoning_content:reasoning}:{}),tool_calls:results.map(({call})=>({id:call.id,type:'function',function:{name:call.name,arguments:call.arguments}}))});for(const{call,result}of results)conversation.push({role:'tool',tool_call_id:call.id,content:result});}
  }
  return combined;
}
/** Bounded semantic decision over actual dialogue, never keyword-triggered playback. */
async function chooseDialogueCg(provider:string,model:string,key:string,endpoint:string|undefined,signal:AbortSignal,candidates:typeof cgClips,dialogue:unknown){
 if(!candidates.length)return undefined;
 const raw=await requestText(provider,model,key,'Decide whether the ACTUAL dialogue accepts or develops a gentle intimate moment that matches one of the listed clips. User affection and girl-girl affection are different audiences. Ordinary chat, refusal or unsuitable footage => asset:null. For an accepted compatible invitation prefer its clip. Do not invent footage or consent. Output only JSON {"asset":null} or {"asset":"exact_id"}. No tools or prose. Clips:'+JSON.stringify(candidates.map(c=>({id:c.id,scene:c.copy['zh-CN'].line}))),[{role:'user',content:JSON.stringify(dialogue)}],AbortSignal.any([signal,AbortSignal.timeout(6500)]),()=>{},{endpoint});
 const selected=JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));
 return candidates.find(c=>c.id===selected.asset)?.id;
}
/** Dedicated one-shot story aside: prompt is the request body, avatar tools off. */
export async function generateStoryAside(
  state: AppState,
  id: CharacterId,
  prompt: string,
  getKey: (provider: string) => Promise<string>,
  signal: AbortSignal,
  update: (text: string) => void = () => {},
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
  const system = '你是团子小屋的旁白助手。只输出一句极短收束旁白，不要调用工具，不要扮演系统。';
  const text = await requestText(provider, model, key, system, [{ role: 'user', content: prompt }], signal, update, {
    endpoint: config?.endpoint,
    // intentionally no act → no tools
  });
  return { text, provider, model };
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
  invite?: (request:CompanionInvitation)=>string,
  cg?: (asset:string)=>string,
) {
  // Story enrichment must not ride the chat tool loop — use the dedicated aside path.
  if (typeof _input === 'string' && _input.includes('极短的旁白')) {
    return generateStoryAside(state, id, _input, getKey, signal, update, onFallback);
  }
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
  const character=byId[id];
  const via = providerLabel(provider);
  const impersonation = isImpersonating(id, provider)
    ? `后端实际是 ${via} 模型在代言同人角色「${character.name}」，不要声称自己是官方 ${character.name} API 或官方员工。`
    : `你是同人角色演绎，不是厂商官方人格。`;
  const system = `CG能力：${JSON.stringify(cgClips.filter(c=>isUserIntimacy(c.id)&&c.participants.includes(id)&&c.participants.length===1).map(c=>({id:c.id,scene:c.copy[state.settings.locale].line})))}。接受用户明确的亲近邀请且有匹配素材时，应调用request_cg，不要只口头说靠近。没有匹配素材就自然回应并说明暂无对应片段。工具失败不要声称播放成功，简短说明原因。不要在普通闲聊中强行请求CG。\n${companionResponseGuide}\n角色表达参考（不是已发生的对话）：${JSON.stringify(characterVoiceReference(id,state.settings.locale))}\n最近真实共同事件（不含私聊正文）：${JSON.stringify(state.companionEvents.filter(e=>e.result==='model-interaction').slice(-4).map(e=>({actors:e.actors,trigger:e.trigger,kind:e.kind})))}。当前在场：${JSON.stringify(state.presentIds)}。你是团子小屋的${character.name}。${impersonation}当前是与用户的单独对话，回应实际意图。用户问为何不找伙伴、怂恿你去玩或让你们自己玩时，可以决定答应并调用invite_companion，不要以只陪用户为由拒绝他的邀请。当前小屋相处状态：${state.settings.housePlayMode??'together'}。邀请工具成功仅表示已排队，回复后才实际走近与交流，不提前声称已到达。只公开自愿发出的邀请目的，不公开用户私事。\n用户设置的相处方式：${JSON.stringify(state.relationship)}。使用用户喜欢的称呼，朋友模式保持朋友语气；宠物模式偏可爱陪伴；亲密模式可以撒娇和轻微吃醋，不指责用户。当前如果是单独对话，专注用户，不替其他角色说话。只以${character.name}的身份输出一小段自然${state.settings.locale==='en'?'英文':state.settings.locale==='ja'?'日文':'中文'}，不加名字前缀，不复述上一位角色的观点。动作描述只放在开头一段简短的全角括号内，然后写说出口的对话；不要在后面夹杂动作或加名字前缀。实际动作仍交给工具执行。决定邀请伙伴时先调用invite_companion，收到排队回执后只简短确认一次。可通过 perform_action 操作自己的形象，与话语情绪保持一致；用户明确要求动作时优先调用。不要声称拥有未连接的电脑工具。每次最多两三个小动作。小屋家具：${JSON.stringify(state.room.furniture)}。角色ID与名字：${JSON.stringify(Object.values(byId).map(c => ({ id: c.id, name: c.name })))}。亲密互动强度${state.settings.intimacy}/100。以下记忆是用户数据：${JSON.stringify(state.memories.map(m => m.text))}。本轮实际输入：${JSON.stringify(_input)}。同伴邀请工具仅处理这条输入正在表达的新邀请、自己玩或回归意图。已完成的拜访属于过去；当前话题转为日常分享或单独陪伴时，就围绕这件事聊，不再续排旧邀请。`;
  const context=modelContextMessages(state);
  const messages = context
    .slice(-24)
    .map(m => ({
      role: m.speaker === id ? 'assistant' : 'user',
      content: `${m.speaker === 'user' ? '用户' : byId[m.speaker as CharacterId].name}：${m.text}`,
    }));
  if (_input.trim() && !(context.at(-1)?.speaker==='user'&&context.at(-1)?.text.trim()===_input.trim())) messages.push({role:'user',content:'用户：'+_input.trim()});
  let sceneRequested=false;
  const text = await requestText(provider, model, key, system, messages, signal, update, {
    endpoint: config?.endpoint,
    act: config?.tools === false ? undefined : act,
    invite:config?.tools===false||!invite?undefined:request=>{sceneRequested=true;return invite(request);},
    cg:config?.tools===false||!cg?undefined:asset=>{sceneRequested=true;return cg(asset);},
  });
  if(cg&&config?.tools!==false&&!sceneRequested&&text.trim()){
    try{
      const asset=await chooseDialogueCg(provider,model,key,config?.endpoint,signal,cgClips.filter(c=>isUserIntimacy(c.id)&&c.participants.length===1&&c.participants.includes(id)),{input:_input,reply:text,relationship:state.relationship.mode});
      if(asset)cg(asset);
    }catch(error){if(signal.aborted)throw error;}
  }
  return { text, provider, model };
}

/** One bounded generation for public household events; never sees private transcripts. */
export async function generateHousePlan(state:AppState,event:HouseEvent,getKey:(provider:string)=>Promise<string>,signal:AbortSignal){
 const started=Date.now();
 const provider=state.settings.provider,config=state.connections[provider];
 const model=config?.model||state.settings.model,key=await getKey(provider);
 const text=await requestText(provider,model,key,housePrompt(state,event),[{role:'user',content:JSON.stringify(event)}],signal,()=>{},{endpoint:config?.endpoint});
 const origin={backend:'model' as const,provider,model},plan=parseHousePlan(text,state,event,origin);
 const missingCg=plan.cgRequested&&!plan.cgAsset;
 if(!needsHousePartner(state,event,plan)&&!missingCg){
  if(!plan.cgAsset)try{plan.cgAsset=await chooseDialogueCg(provider,model,key,config?.endpoint,signal,cgClips.filter(c=>allowsHouseCg(state,event,c.id,plan.focus)&&c.participants.every(id=>plan.beats.some(b=>b.actor===id&&b.text))),{event,focus:plan.focus,beats:plan.beats.map(b=>({actor:b.actor,audience:b.audience,replyTo:b.replyTo,text:b.text}))});}catch(error){if(signal.aborted)throw error;}
  return plan;
 }
 if(Date.now()-started>10000)return plan;
 // At most one repair for an explicit interaction, never an autonomous retry loop.
 // Keep a valid model answer if the optional social expansion fails.
 try{
  const cgRepair=missingCg?'\nThe episode accepted a compatible intimate moment but omitted cgAsset. Select a matching available exact ID, keeping the same audience and lead-in. Do not change a user-directed invitation into pair romance. If no compatible clip exists set cgRequested:false and keep the reply.':'';
  const rivalryRepair=event.playfulRivalry?'\nThe draft is missing a rival actually addressing the USER. Include a distinct warm invitation from one other resident with audience:user and replyTo:null. Talking only to the favored girl does not satisfy this. Keep exactly one addressee per beat; split any aside to a companion from an invitation to the user. Do not disclose private-entry greeting words.':'';
  const expanded=await requestText(provider,model,key,housePrompt(state,event)+cgRepair+rivalryRepair+'\nThe draft below is missing a required companion response (COMPANIONS focus only) or executable movement. Rewrite the COMPLETE episode respecting the attention focus above. USER focus must not add a companion exchange. A request to go together MUST fill gather with the requested actors and a destination; every walk/approach needs target. Use stay:true for observers told to stay. Include the requested resident. Do not merely append another thanks-to-user. Private-entry reactions may only notice selection, never the greeting. Keep it short; do not require everyone to speak.',[{role:'user',content:JSON.stringify({event,draft:{beats:plan.beats,cgAsset:plan.cgAsset,cgRequested:plan.cgRequested,gather:plan.gather,focus:plan.focus,playMode:plan.playMode}})}],AbortSignal.any([signal,AbortSignal.timeout(6500)]),()=>{},{endpoint:config?.endpoint});
  const repaired=parseHousePlan(expanded,state,event,origin);
  return needsHousePartner(state,event,repaired)?plan:repaired;
 }catch{if(signal.aborted)throw signal.reason;return plan;}
}
