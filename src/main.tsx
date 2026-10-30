import {PortraitSprite} from './PortraitSprite';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUp, MessageCircle, Users, Sprout, Settings2, Minus, X, ChevronDown, ChevronRight, Heart, Moon, Sun, Volume2, VolumeX, Sparkles, Coffee, Clock3, PanelTop, Square, Plug, Check, Trash2, Plus, ArrowLeft, Eye, EyeOff, Leaf, Send, BookOpen } from 'lucide-react';
import { characters, byId, providers, guestGallery } from './shared/characters';
import type { Action, AppState, CharacterId, Character, Message } from './shared/types';
import { Sprite, EmotionFx } from './Sprite';
import { Room, useNow } from './Room';
import { Connections } from './Connections';
import { PrivateChat } from './PrivateChat';
import { DesktopCast } from './DesktopPet';
import './style.css';
import './community.css';
import './room.css';
import './sprites.css';
import './motion.css';

function useGarden() {
  const [state, setState] = useState<AppState | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!window.garden) { setError('请通过桌面应用启动团子小屋：npm run dev'); return; }
    const receive = (value: AppState) => setState(old => !old || value.revision >= old.revision ? value : old);
    const off = window.garden.subscribe(receive);
    void window.garden.getState().then(receive).catch(() => setError('读取公馆失败，请重启应用。'));
    return off;
  }, []);
  return { state, error };
}
function Avatar({ id, small = false }: { id: CharacterId; small?: boolean }) {
  return <span className={`avatar ${small ? 'small' : ''}`} style={{ background: byId[id].pale }}><Sprite character={byId[id]} forceRig /></span>;
}
function Toggle({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) {
  return <button className={`toggle ${value ? 'on' : ''}`} role="switch" aria-checked={value} aria-label={label} onClick={onChange}><span /></button>;
}
const dispatch = (action: Action) => void window.garden.dispatch(action);
const time = (at: number) => new Date(at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
function App() {
  const { state, error } = useGarden();
  const [page, setPage] = useState('room');
  if (!state) return <div className="loading"><Sprout size={32} /><p>{error || '伙伴们正在收拾公馆…'}</p></div>;
  const selected = byId[state.selected];
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><img src="./icon.png" alt="团子小屋" /><div><strong>团子小屋</strong><span>DANGO HOUSE</span></div></div>
      <div className="workspace-label">AI 娘的日常 <span>01</span></div>
      <nav><button className={page === 'room' ? 'active' : ''} onClick={() => setPage('room')}><Heart size={19} />互动小屋<span className="nav-count">NEW</span></button>
        <button className={page === 'chat' ? 'active' : ''} onClick={() => setPage('chat')}><MessageCircle size={19} />公馆群聊<span className="nav-count">{characters.length}</span></button>
        <button className={page === 'characters' ? 'active' : ''} onClick={() => setPage('characters')}><Users size={19} />伙伴图鉴</button>
        <button className={page === 'memories' ? 'active' : ''} onClick={() => setPage('memories')}><BookOpen size={19} />共同记忆{state.memories.length > 0 && <span className="nav-count">{state.memories.length}</span>}</button>
      </nav>
      <div className="members-label">住在这里的伙伴 <span>{characters.length}</span></div>
      <div className="member-list">{characters.map(c => <button key={c.id} className={state.selected === c.id ? 'chosen' : ''} onClick={() => dispatch({ type: 'select', id: c.id })}>
        <Avatar id={c.id} small /><span><strong>{c.name}</strong><small>{state.muted.includes(c.id) ? '安静休息中' : state.mood[c.id] === 'talk' ? '正在说话' : state.focus ? '陪你专注' : '在公馆里'}</small></span><i className={state.muted.includes(c.id) ? 'muted-dot' : ''} />
      </button>)}</div>
      <div className="sidebar-bottom">
        <div className="little-note"><Leaf size={16} /><p>不必一直说话。<br />待在一起，也很好。</p></div>
        <button className={`settings-nav ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}><Settings2 size={18} />连接与偏好<ChevronRight size={15} /></button>
        <div className="profile"><span>我</span><div><strong>公馆主人</strong><small>今天也欢迎回家</small></div><span className="version">v0.3.7</span></div>
      </div>
    </aside>
    <div className="main-column">
      <header className="titlebar"><span>团子小屋 <ChevronRight size={12} /> {({ room: '互动小屋', chat: '公馆群聊', characters: '伙伴图鉴', memories: '共同记忆', settings: '连接与偏好' } as Record<string,string>)[page]}</span><div className="window-buttons"><span className={`mode-pill ${state.settings.mode === 'api' ? 'api-mode' : ''}`}><i />{state.settings.mode === 'demo' ? '离线演示' : 'API 模式'}</span><button aria-label="最小化" onClick={() => window.garden.window('minimize')}><Minus size={17} /></button><button aria-label="收起到托盘" onClick={() => window.garden.window('close')}><X size={17} /></button></div></header>
      {page === 'room' && <Room state={state} />}
      {page === 'chat' && <Chat state={state} />}
      {page === 'characters' && <CharacterLibrary onSelect={id => { dispatch({ type: 'select', id }); setPage('chat'); }} />}
      {page === 'memories' && <Memories state={state} />}
      {page === 'settings' && <Connections state={state} />}
    </div>
    {page === 'chat' && <aside className="character-panel"><div className="panel-heading">今日值班 <span>COMMUNITY CAST</span></div><div className="selected-art" style={{ background: selected.pale }}><span className="art-spark s1">✦</span><span className="art-spark s2">+</span>{state.presentation.chatForm==='portrait'?<PortraitSprite character={selected} body={state.bodies[selected.id]}/>:<Sprite character={selected} mood={state.mood[selected.id]} skin={state.skins[selected.id]} pose={state.bodies[selected.id].pose} cue={state.bodies[selected.id].until} activity={state.bodies[selected.id].bubble} interaction={state.bodies[selected.id].interaction} stoppedAt={state.bodies[selected.id].stoppedAt} />}<span className="art-ground" /></div><div className="character-title"><h2>{selected.name}</h2><span><i />{state.muted.includes(selected.id) ? '正在休息' : '在你身边'}</span></div><p className="subtitle">{selected.subtitle}</p><div className="tags">{selected.tags.map(t => <span key={t}>{t}</span>)}</div><div className="skin-picker"><label>聊天形象<select aria-label="聊天形象" value={state.presentation.chatForm} onChange={e=>dispatch({type:'presentation',patch:{chatForm:e.target.value as 'portrait'|'chibi'}})}><option value="portrait">正常比例 · 轻动效</option><option value="chibi">Q 版动态</option></select></label><label>外观样式<select aria-label="外观样式" value={state.skins[selected.id]} onChange={e => dispatch({ type: 'skin', id: selected.id, skin: e.target.value as 'chibi' | 'animated' })}><option value="chibi">Q 版 · 表情套装</option><option value="animated">Q 版 · 动态增强</option></select></label><small>切换外观，保留记忆和关系</small></div><div className="affection"><div><span><Heart size={14} />熟悉的温度</span><b>{state.affection[selected.id]} <small>/ 100</small></b></div><div className="progress"><i style={{ width: `${state.affection[selected.id]}%`, background: selected.color }} /></div><small>一起积累的小事，会慢慢被记住。</small></div><button className="praise-button" onClick={() => dispatch({ type: 'praise', id: selected.id })}><Heart size={16} />夸夸{selected.name}<span>+3</span></button><button className="mute-button" onClick={() => dispatch({ type: 'mute', id: selected.id })}>{state.muted.includes(selected.id) ? <Volume2 size={15} /> : <VolumeX size={15} />}{state.muted.includes(selected.id) ? '邀请她加入聊天' : '让她安静一会儿'}</button><div className="panel-divider" /><div className="panel-setting"><span><Moon size={16} />免打扰</span><Toggle value={state.settings.dnd} label="免打扰" onChange={() => dispatch({ type: 'settings', patch: { dnd: !state.settings.dnd } })} /></div><p className="helper">安静陪伴，暂停主动发言。</p><div className="panel-setting"><span><PanelTop size={16} />桌面伙伴</span><Toggle value={state.settings.petsVisible} label="桌面伙伴" onChange={() => dispatch({ type: 'settings', patch: { petsVisible: !state.settings.petsVisible } })} /></div><p className="helper">Ctrl + Shift + G 随时隐藏或唤回</p><div className="panel-footer"><Sprout size={20}/><p>熟悉的她们，<br/>新的共同日常。</p></div></aside>}
  </div>;
}

function Chat({ state }: { state: AppState }) {
  const [text, setText] = useState('');
  const [target, setTarget] = useState<CharacterId | ''>('');
  const [now, setNow] = useState(Date.now());
  const tail = useRef<HTMLDivElement>(null);
  useEffect(() => { tail.current?.scrollIntoView({ behavior: 'smooth' }); }, [state.messages.length, state.messages.at(-1)?.text, state.busy]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const remaining = state.focus ? Math.max(0, Math.ceil((state.focus.endAt - now) / 1000)) : 0;
  const submit = () => { if (text.trim()) { dispatch({ type: 'send', text, target: target || undefined }); setText(''); } };
  return <>
    <div className="chat-heading"><div><h1>公馆群聊 <span>AI GIRLS LOUNGE</span></h1><p><i /> {state.activity}</p></div><button className="subtle-button" onClick={() => dispatch({ type: 'banter' })}><Sparkles size={16} />让她们聊聊</button></div>
    <div className="garden-stage"><div className="stage-copy"><span className="eyebrow">FAMILIAR FACES, A NEW STORY</span><h2>她们的故事，从这里继续。</h2><p>{state.settings.mode === 'demo' ? '熟悉的 AI 娘，都住进了这间小屋。' : '一个小小公馆，装得下所有想说的话。'}</p><span className="stage-label"><Sun size={13}/> 晴 · 适合一起发呆</span></div><div className="stage-window"><div className="window-sun"/><div className="window-hill"/><div className="window-mullion"/></div><div className="stage-pets">{characters.map(c => <button key={c.id} className={`stage-pet ${state.selected === c.id ? 'selected' : ''}`} onClick={() => { dispatch({ type: 'select', id: c.id }); setTarget(c.id); }}><Sprite character={c} mood={state.mood[c.id]} skin={state.skins[c.id]} pose={state.bodies[c.id].pose} /><span><i style={{ background: c.color }} />{c.name}</span></button>)}</div><div className="stage-floor"/></div>
    {state.focus && <div className="focus-banner"><Clock3 size={18} /><span>正在一起专注 <small>{byId[state.focus.owner].name}负责计时</small></span><strong>{Math.floor(remaining / 60).toString().padStart(2,'0')}:{(remaining % 60).toString().padStart(2,'0')}</strong><button onClick={() => dispatch({ type: 'cancel-focus' })}>结束计时</button></div>}
    <div className="messages"><div className="day-marker"><span />今天 · 我们在这里相遇<span /></div>{state.messages.map(message => <ChatMessage key={message.id} message={message} />)}{state.busy && <div className="typing"><span/><span/><span/><small>{state.activity}</small><button onClick={() => dispatch({ type: 'stop' })}>停止</button></div>}<div ref={tail}/></div>
    <div className="composer-area"><div className="quick-actions"><button onClick={() => dispatch({ type: 'praise', id: state.selected })}><Heart size={14}/>夸夸{byId[state.selected].name}</button><button disabled={!!state.focus} onClick={() => dispatch({ type: 'focus', minutes: 25 })}><Clock3 size={14}/>一起专注 25 分钟</button><button onClick={() => dispatch({ type: 'send', text: '休息一会儿吧' })}><Coffee size={14}/>休息一下</button></div><div className="composer"><textarea aria-label="发送消息" placeholder={target ? `想对${byId[target].name}说些什么？` : '说点什么，她们都在听…'} value={text} maxLength={4000} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }} /><div className="composer-toolbar"><select aria-label="选择回应对象" value={target} onChange={event => setTarget(event.target.value as CharacterId | '')}><option value="">@ 大家</option>{characters.map(c => <option key={c.id} value={c.id}>@ {c.name}</option>)}</select><span>Enter 发送 · Shift + Enter 换行</span>{state.busy && <button className="stop-button" title="停止生成" aria-label="停止生成" onClick={() => dispatch({ type: 'stop' })}><Square size={13}/></button>}<button className="send-button" disabled={!text.trim()} aria-label="发送" onClick={submit}><ArrowUp size={20}/></button></div></div><div className="composer-note"><i />{state.settings.mode === 'demo' ? '离线演示 · 回复来自内置角色脚本，不调用 API' : '真实 API 回复 · 轻互动使用本地规则 · 记忆保存在本机'}</div></div>
  </>;
}
function ChatMessage({ message }: { message: Message }) {
  if (message.speaker === 'system') return <div className={`system-message ${message.kind === 'error' ? 'error' : ''}`}><span>{message.text}</span></div>;
  const user = message.speaker === 'user';
  const character = user ? null : byId[message.speaker as CharacterId];
  return <div className={`chat-message ${user ? 'user' : ''}`}>{!user && <Avatar id={character!.id}/>}<div className="message-body"><div className="message-meta"><strong>{user ? '我' : character!.name}</strong>{!user && <span className="role-label">{character!.tags[0]}</span>}<time>{time(message.at)}</time></div><div className="bubble">{message.text || <span className="pending">正在想…</span>}</div></div>{user && <span className="user-avatar">我</span>}</div>;
}
function CharacterLibrary({ onSelect }: { onSelect: (id: CharacterId) => void }) {
  return <section className="content-page community-library"><div className="eyebrow">THE COMMUNITY CAST</div><h1>是你熟悉的 AI 娘们。</h1><p className="page-intro">采用现有社区形象与对应版本的人设，保留她们原本的辨识度。</p><div className="character-grid">{characters.map(c => <article className="character-card" key={c.id} style={{ background: c.pale }}><div className="character-art"><Sprite character={c}/></div><span className="cast-label">入住中 · COMMUNITY CAST</span><h2>{c.name}</h2><p>{c.subtitle}</p><div className="tags">{c.tags.map(t => <span key={t}>{t}</span>)}</div><p className="personality">{c.personality.replace('采用 CrossPet 社区二创版本：', '')}</p><p className="source-note">{c.source}</p><button className="outline-button" onClick={() => onSelect(c.id)}>去找她聊聊 <ChevronRight size={15}/></button></article>)}</div><div className="source-panel"><h3>角色与素材出处</h3><p>当前立绘与表情来自 CrossPet 社区素材包，按 CC BY-NC-SA 4.0 保留署名用于非商业原型。DeepSeek 原型来自上善无形，鲸鱼女仆与白龙等设计参考 ZipZipPipe；具体来源和版本均保存在素材清单。</p><p>人物性格采用 CrossPet 的社区演绎，属于同人版本，不代表厂商官方设定，也不把不同作者的 CP 和剧情设定混为唯一正史。七位都已入住。六位使用 fywdy 动画图集，GLM 保留 CrossPet 黑狐造型，以表情差分和局部运动表现。小屋剧情为参考同人关系后编写的原创短场景。</p><code>CrossPet / fywdy · public/community 与 public/animated 素材清单</code></div></section>;
}
function Memories({ state }: { state: AppState }) {
  const [text, setText] = useState('');
  return <section className="content-page"><div className="eyebrow">LITTLE THINGS WE REMEMBER</div><h1>一起记住的小事。</h1><p className="page-intro">把你愿意分享的偏好留在这里，真实模型聊天时会带上这些记忆。</p><form className="memory-form" onSubmit={event => { event.preventDefault(); if (text.trim()) { dispatch({ type: 'remember', text }); setText(''); } }}><input aria-label="新的共同记忆" maxLength={500} value={text} onChange={e => setText(e.target.value)} placeholder="比如：我喜欢雨天，工作时希望保持安静"/><button className="primary-button" disabled={!text.trim()}><Plus size={17}/>记住这件事</button></form>{state.memories.length ? <div className="memory-list">{state.memories.map(memory => <article key={memory.id}><span className="memory-icon"><Leaf size={20}/></span><div><p>{memory.text}</p><small>{new Date(memory.at).toLocaleDateString('zh-CN')} · 用户主动保存</small></div><button aria-label={`删除记忆：${memory.text}`} onClick={() => dispatch({ type: 'forget', id: memory.id })}><Trash2 size={17}/></button></article>)}</div> : <div className="empty-memory"><Sprout size={42}/><h2>留一点属于你的线索。</h2><p>记忆由你主动添加，随时可以删除。<br/>角色包不会带走你的私人记忆。</p></div>}<div className="quiet-info"><BookOpen size={18}/><span>当前采用显式记忆。自动总结和记忆编辑将在后续版本完善。</span></div></section>;
}
function Settings({ state }: { state: AppState }) {
  const [provider, setProvider] = useState(state.settings.provider);
  const [model, setModel] = useState(state.settings.model);
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [testing, setTesting] = useState(false);
  useEffect(() => { void window.garden.keyStatus().then(setSaved); }, []);
  const selected = providers.find(p => p.id === provider)!;
  const save = async () => {
    try { if (key.trim()) { await window.garden.saveKey(provider, key); setKey(''); setSaved(await window.garden.keyStatus()); } await window.garden.dispatch({ type: 'settings', patch: { provider, model } }); setNotice('配置已保存。请测试连接后再切换到 API 模式。'); }
    catch { setNotice('保存失败，系统凭证保护可能暂不可用。'); }
  };
  return <section className="content-page settings-page"><div className="eyebrow">MAKE YOURSELF AT HOME</div><h1>让陪伴，合你的心意。</h1><p className="page-intro">先在演示模式里逛逛，也可以接入自己的模型。</p><div className="settings-section"><h2><Plug size={19}/>模型连接</h2><div className="mode-selector"><button className={state.settings.mode === 'demo' ? 'selected' : ''} onClick={() => dispatch({ type: 'settings', patch: { mode: 'demo' } })}><Sprout size={20}/><span><strong>离线演示</strong><small>内置脚本 · 无 API 费用</small></span>{state.settings.mode === 'demo' && <Check size={17}/>}</button><button className={state.settings.mode === 'api' ? 'selected' : ''} onClick={() => { if (!saved.includes(provider) || !model.trim()) { setNotice('请先保存 API Key 和模型 ID，再开启真实聊天。'); return; } void window.garden.dispatch({ type: 'settings', patch: { provider, model, mode: 'api' } }); }}><MessageCircle size={20}/><span><strong>真实 API 聊天</strong><small>使用你自己的服务和额度</small></span>{state.settings.mode === 'api' && <Check size={17}/>}</button></div><label>模型服务<select value={provider} onChange={event => { setProvider(event.target.value); setModel(''); setKey(''); setNotice(''); }}>{providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="provider-description">{selected.hint}<span>{saved.includes(provider) ? '本机已保存凭证 · 待测试或重新测试' : '尚未配置'}</span></div><label>模型 ID<input value={model} onChange={event => setModel(event.target.value)} placeholder="填写服务账号实际支持的模型 ID" maxLength={120}/></label><label>API Key<input type="password" autoComplete="off" value={key} onChange={event => setKey(event.target.value)} placeholder={saved.includes(provider) ? '已加密保存 · 留空保留现有凭证' : '仅在本机受保护存储，不写入聊天记录'}/></label><div className="connection-actions"><button className="primary-button" onClick={() => void save()}>保存配置</button><button className="outline-button" disabled={testing || !model.trim() || !saved.includes(provider)} onClick={async () => { setTesting(true); setNotice('正在发起一次最小真实请求…'); try { setNotice(await window.garden.testConnection(provider, model)); } catch (error) { setNotice(error instanceof Error ? error.message.replace(/^Error invoking remote method '[^']+': Error: /, '') : '连接失败'); } finally { setTesting(false); } }}>{testing ? '连接中…' : '测试连接'}</button>{saved.includes(provider) && <button className="text-button" onClick={async () => { await window.garden.saveKey(provider, ''); setSaved(await window.garden.keyStatus()); setNotice('已删除本机凭证。'); }}>删除凭证</button>}</div>{notice && <div className="settings-notice" role="status">{notice}</div>}<p className="helper">七家提供接口适配，尚未通过你的账号实测。测试会产生一次实际请求；网页订阅与 API 额度分别确认。当前角色共用所选模型。</p></div><div className="settings-section"><h2><Heart size={19}/>相处方式</h2><div className="preference-row"><div><strong>主动陪伴</strong><p>空闲时低频问候，共用十分钟冷却。</p></div><Toggle label="主动陪伴" value={state.settings.autonomous} onChange={() => dispatch({ type: 'settings', patch: { autonomous: !state.settings.autonomous } })}/></div><div className="preference-row"><div><strong>免打扰</strong><p>暂停主动问候，保留手动聊天。</p></div><Toggle label="设置免打扰" value={state.settings.dnd} onChange={() => dispatch({ type: 'settings', patch: { dnd: !state.settings.dnd } })}/></div><div className="range-label"><strong>亲密与争宠强度</strong><span>{state.settings.intimacy < 25 ? '朋友式陪伴' : state.settings.intimacy < 70 ? '轻轻撒娇' : '热闹一点'}</span></div><input className="intimacy-range" type="range" aria-label="亲密与争宠强度" min="0" max="100" value={state.settings.intimacy} onChange={event => dispatch({ type: 'settings', patch: { intimacy: Number(event.target.value) } })}/><div className="range-ends"><span>安静的朋友</span><span>更亲密的互动</span></div></div><div className="settings-section"><h2>本地数据</h2><p className="helper">聊天、共同记忆与专注状态保存在当前 Windows 用户的应用数据目录。关闭窗口后驻留托盘。</p><button className="outline-button" onClick={() => { if (window.confirm('清空群聊记录？共同记忆会保留。')) dispatch({ type: 'clear-chat' }); }}>清空群聊记录</button><button className="text-button" onClick={() => window.garden.window('quit')}>退出团子小屋</button></div></section>;
}

function Pets() {
  const { state } = useGarden();
  const params = new URLSearchParams(window.location.search);
  const displayId = Number(params.get('display'));
  const primary = params.get('primary') === 'true';
  useEffect(() => {
    document.documentElement.classList.add('pet-document');
    let interactive = false;
    const move = (e: PointerEvent) => { const next = !!(e.target as Element)?.closest('.desktop-pet'); if (next !== interactive) { interactive = next; window.garden.hitTest(next); } };
    document.addEventListener('pointermove', move);
    const leave = () => { interactive = false; window.garden.hitTest(false); };
    document.addEventListener('pointerleave', leave);
    return () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', leave); };
  }, []);
  if (!state) return null;
  return <div className="pet-overlay"><DesktopCast state={state} displayId={displayId} primary={primary}/></div>;
}
function PrivateWindow(){const {state,error}=useGarden();const id=new URLSearchParams(location.search).get('character') as CharacterId;return state&&byId[id]?<PrivateChat state={state} id={id}/>:<div className="loading">{error||'专属聊天准备中…'}</div>;}
const view = new URLSearchParams(location.search).get('view');
createRoot(document.getElementById('root')!).render(<React.StrictMode>{view === 'pets' ? <Pets/> : view === 'private' ? <PrivateWindow/> : <App/>}</React.StrictMode>);
