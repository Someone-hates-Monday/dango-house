import {PortraitSprite} from './PortraitSprite';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUp, MessageCircle, Users, Sprout, Settings2, Minus, X, ChevronDown, ChevronRight, Heart, Moon, Sun, Volume2, VolumeX, Sparkles, Coffee, Clock3, PanelTop, Square, Plug, Check, Trash2, Plus, ArrowLeft, Eye, EyeOff, Leaf, Send, BookOpen, Clapperboard } from 'lucide-react';
import { characters, byId, providers, guestGallery } from './shared/characters';
import type { Action, AppState, CharacterId, Character, Message } from './shared/types';
import { Sprite, EmotionFx } from './Sprite';
import { Room, useNow } from './Room';
import { Connections } from './Connections';
import { PrivateChat } from './PrivateChat';
import { DesktopCast } from './DesktopPet';
import { WatchParty } from './WatchParty';
import { TaskTray } from './TaskTray';
import { FavorStrip } from './FavorStrip';
import { useI18n } from './useI18n';
import { translate, defaultLocale } from './shared/i18n';
import { isImpersonating, preferredProvider, providerLabel } from './shared/cast';
import './style.css';
import './community.css';
import './room.css';
import './sprites.css';
import './motion.css';

function useGarden() {
  const [state, setState] = useState<AppState | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!window.garden) { setError(translate(defaultLocale, 'app.bridgeMissing')); return; }
    const receive = (value: AppState) => setState(old => !old || value.revision >= old.revision ? value : old);
    const off = window.garden.subscribe(receive);
    void window.garden.getState().then(receive).catch(() => setError(translate(defaultLocale, 'app.stateError')));
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
function App() {
  const { state, error } = useGarden();
  const [page, setPage] = useState('room');
  const { t } = useI18n(state);
  if (!state) return <div className="loading"><Sprout size={32} /><p>{error || t('app.loading')}</p></div>;
  const selected = byId[state.selected];
  const titles: Record<string, string> = { room: t('title.room'), chat: t('title.chat'), watch: t('title.watch'), characters: t('title.characters'), memories: t('title.memories'), settings: t('title.settings') };
  const memberStatus = (id: CharacterId) => state.muted.includes(id) ? t('member.resting') : state.mood[id] === 'talk' ? t('member.talking') : state.focus ? t('member.focus') : t('member.home');
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><img src="./icon.png" alt={t('brand.name')} /><div><strong>{t('brand.name')}</strong><span>{t('brand.sub')}</span></div></div>
      <div className="workspace-label">{t('brand.workspace')} <span>01</span></div>
      <nav><button className={page === 'room' ? 'active' : ''} onClick={() => setPage('room')}><Heart size={19} />{t('nav.room')}<span className="nav-count">{t('nav.new')}</span></button>
        <button className={page === 'chat' ? 'active' : ''} onClick={() => setPage('chat')}><MessageCircle size={19} />{t('nav.chat')}<span className="nav-count">{characters.length}</span></button>
        <button className={page === 'watch' ? 'active' : ''} onClick={() => setPage('watch')}><Clapperboard size={19} />{t('nav.watch')}{state.agent?.tasks.some(task => task.status === 'running' || task.status === 'paused') && <span className="nav-count">·</span>}</button>
        <button className={page === 'characters' ? 'active' : ''} onClick={() => setPage('characters')}><Users size={19} />{t('nav.characters')}</button>
        <button className={page === 'memories' ? 'active' : ''} onClick={() => setPage('memories')}><BookOpen size={19} />{t('nav.memories')}{state.memories.length > 0 && <span className="nav-count">{state.memories.length}</span>}</button>
      </nav>
      <div className="members-label">{t('brand.members')} <span>{characters.length}</span></div>
      <div className="member-list">{characters.map(c => <button key={c.id} className={state.selected === c.id ? 'chosen' : ''} onClick={() => dispatch({ type: 'select', id: c.id })}>
        <Avatar id={c.id} small /><span><strong>{c.name}</strong><small>{memberStatus(c.id)}</small></span><i className={state.muted.includes(c.id) ? 'muted-dot' : ''} />
      </button>)}</div>
      <div className="sidebar-bottom">
        <div className="little-note"><Leaf size={16} /><p>{t('brand.note').split('\n').map((line, i) => <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>)}</p></div>
        <button className={`settings-nav ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}><Settings2 size={18} />{t('nav.settings')}<ChevronRight size={15} /></button>
        <div className="profile"><span>{t('chat.me')}</span><div><strong>{t('brand.owner')}</strong><small>{t('brand.welcomeHome')}</small></div><span className="version">v0.3.9</span></div>
      </div>
    </aside>
    <div className="main-column">
      <header className="titlebar"><span>{t('brand.name')} <ChevronRight size={12} /> {titles[page]}</span><div className="window-buttons"><span className={`mode-pill ${state.settings.mode === 'api' ? 'api-mode' : ''}`}><i />{state.settings.mode === 'demo' ? t('mode.demo') : t('mode.api')}</span><button aria-label={t('window.minimize')} onClick={() => window.garden.window('minimize')}><Minus size={17} /></button><button aria-label={t('window.close')} onClick={() => window.garden.window('close')}><X size={17} /></button></div></header>
      {page !== 'watch' && <TaskTray state={state} />}
      {(page === 'room' || page === 'chat') && <FavorStrip state={state} />}
      {page === 'room' && <Room state={state} />}
      {page === 'chat' && <Chat state={state} />}
      {page === 'watch' && <WatchParty state={state} />}
      {page === 'characters' && <CharacterLibrary state={state} onSelect={id => { dispatch({ type: 'select', id }); setPage('chat'); }} />}
      {page === 'memories' && <Memories state={state} />}
      {page === 'settings' && <Connections state={state} />}
    </div>
    {page === 'chat' && <aside className="character-panel"><div className="panel-heading">{t('panel.duty')} <span>{t('panel.cast')}</span></div><div className="selected-art" style={{ background: selected.pale }}><span className="art-spark s1">✦</span><span className="art-spark s2">+</span>{state.presentation.chatForm==='portrait'?<PortraitSprite character={selected} body={state.bodies[selected.id]}/>:<Sprite character={selected} mood={state.mood[selected.id]} skin={state.skins[selected.id]} pose={state.bodies[selected.id].pose} cue={state.bodies[selected.id].until} activity={state.bodies[selected.id].bubble} interaction={state.bodies[selected.id].interaction} stoppedAt={state.bodies[selected.id].stoppedAt} />}<span className="art-ground" /></div><div className="character-title"><h2>{selected.name}</h2><span><i />{state.muted.includes(selected.id) ? t('member.muted') : t('member.beside')}</span>{state.settings.mode === 'api' && isImpersonating(selected.id, preferredProvider(state, selected.id)) && <small className="via-badge">{t('panel.via', { name: providerLabel(preferredProvider(state, selected.id)) })}</small>}</div><p className="subtitle">{selected.subtitle}</p><div className="tags">{selected.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="skin-picker"><label>{t('panel.chatForm')}<select aria-label={t('panel.chatForm')} value={state.presentation.chatForm} onChange={e=>dispatch({type:'presentation',patch:{chatForm:e.target.value as 'portrait'|'chibi'}})}><option value="portrait">{t('panel.portrait')}</option><option value="chibi">{t('panel.chibi')}</option></select></label><label>{t('panel.skin')}<select aria-label={t('panel.skin')} value={state.skins[selected.id]} onChange={e => dispatch({ type: 'skin', id: selected.id, skin: e.target.value as 'chibi' | 'animated' })}><option value="chibi">{t('panel.skinChibi')}</option><option value="animated">{t('panel.skinAnimated')}</option></select></label><small>{t('panel.skinHint')}</small></div><div className="affection"><div><span><Heart size={14} />{t('panel.warmth')}</span><b>{state.affection[selected.id]} <small>/ 100</small></b></div><div className="progress"><i style={{ width: `${state.affection[selected.id]}%`, background: selected.color }} /></div><small>{t('panel.warmthHint')}</small></div><button className="praise-button" onClick={() => dispatch({ type: 'praise', id: selected.id })}><Heart size={16} />{t('chat.praise', { name: selected.name })}<span>+3</span></button><button className="mute-button" onClick={() => dispatch({ type: 'mute', id: selected.id })}>{state.muted.includes(selected.id) ? <Volume2 size={15} /> : <VolumeX size={15} />}{state.muted.includes(selected.id) ? t('panel.unmute') : t('panel.mute')}</button><div className="panel-divider" /><div className="panel-setting"><span><Moon size={16} />{t('panel.dnd')}</span><Toggle value={state.settings.dnd} label={t('panel.dnd')} onChange={() => dispatch({ type: 'settings', patch: { dnd: !state.settings.dnd } })} /></div><p className="helper">{t('panel.dndHint')}</p><div className="panel-setting"><span><PanelTop size={16} />{t('panel.pets')}</span><Toggle value={state.settings.petsVisible} label={t('panel.pets')} onChange={() => dispatch({ type: 'settings', patch: { petsVisible: !state.settings.petsVisible } })} /></div><p className="helper">{t('panel.petsHint')}</p><div className="panel-footer"><Sprout size={20}/><p>{t('panel.footer').split('\n').map((line, i) => <React.Fragment key={i}>{i > 0 && <br />}{line}</React.Fragment>)}</p></div></aside>}
  </div>;
}

function Chat({ state }: { state: AppState }) {
  const { t, locale } = useI18n(state);
  const [text, setText] = useState('');
  const [target, setTarget] = useState<CharacterId | ''>('');
  const [now, setNow] = useState(Date.now());
  const tail = useRef<HTMLDivElement>(null);
  useEffect(() => { tail.current?.scrollIntoView({ behavior: 'smooth' }); }, [state.messages.length, state.messages.at(-1)?.text, state.busy]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const remaining = state.focus ? Math.max(0, Math.ceil((state.focus.endAt - now) / 1000)) : 0;
  const submit = () => { if (text.trim()) { dispatch({ type: 'send', text, target: target || undefined }); setText(''); } };
  return <>
    <div className="chat-heading"><div><h1>{t('chat.title')} <span>{t('chat.subtitle')}</span></h1><p><i /> {state.activity}</p></div><button className="subtle-button" onClick={() => dispatch({ type: 'banter' })}><Sparkles size={16} />{t('chat.banter')}</button></div>
    <div className="garden-stage"><div className="stage-copy"><span className="eyebrow">{t('chat.stageEyebrow')}</span><h2>{t('chat.stageTitle')}</h2><p>{state.settings.mode === 'demo' ? t('chat.stageDemo') : t('chat.stageApi')}</p><span className="stage-label"><Sun size={13}/> {t('chat.weather')}</span></div><div className="stage-window"><div className="window-sun"/><div className="window-hill"/><div className="window-mullion"/></div><div className="stage-pets">{characters.map(c => <button key={c.id} className={`stage-pet ${state.selected === c.id ? 'selected' : ''}`} onClick={() => { dispatch({ type: 'select', id: c.id }); setTarget(c.id); }}><Sprite character={c} mood={state.mood[c.id]} skin={state.skins[c.id]} pose={state.bodies[c.id].pose} /><span><i style={{ background: c.color }} />{c.name}</span></button>)}</div><div className="stage-floor"/></div>
    {state.focus && <div className="focus-banner"><Clock3 size={18} /><span>{t('chat.focus')} <small>{t('chat.focusOwner', { name: byId[state.focus.owner].name })}</small></span><strong>{Math.floor(remaining / 60).toString().padStart(2,'0')}:{(remaining % 60).toString().padStart(2,'0')}</strong><button onClick={() => dispatch({ type: 'cancel-focus' })}>{t('chat.focusEnd')}</button></div>}
    <div className="messages"><div className="day-marker"><span />{t('chat.today')}<span /></div>{state.messages.map(message => <ChatMessage key={message.id} message={message} locale={locale} t={t} />)}{state.busy && <div className="typing"><span/><span/><span/><small>{state.activity}</small><button onClick={() => dispatch({ type: 'stop' })}>{t('chat.stop')}</button></div>}<div ref={tail}/></div>
    <div className="composer-area"><div className="quick-actions"><button onClick={() => dispatch({ type: 'praise', id: state.selected })}><Heart size={14}/>{t('chat.praise', { name: byId[state.selected].name })}</button><button disabled={!!state.focus} onClick={() => dispatch({ type: 'focus', minutes: 25 })}><Clock3 size={14}/>{t('chat.focus25')}</button><button onClick={() => dispatch({ type: 'send', text: locale === 'en' ? 'Let’s take a break' : locale === 'ja' ? '少し休もう' : '休息一会儿吧' })}><Coffee size={14}/>{t('chat.rest')}</button></div><div className="composer"><textarea aria-label={t('chat.message')} placeholder={target ? t('chat.placeholderOne', { name: byId[target].name }) : t('chat.placeholderAll')} value={text} maxLength={4000} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }} /><div className="composer-toolbar"><select aria-label={t('chat.target')} value={target} onChange={event => setTarget(event.target.value as CharacterId | '')}><option value="">{t('chat.targetAll')}</option>{characters.map(c => <option key={c.id} value={c.id}>@ {c.name}</option>)}</select><span>{t('chat.sendHint')}</span>{state.busy && <button className="stop-button" title={t('chat.stopGen')} aria-label={t('chat.stopGen')} onClick={() => dispatch({ type: 'stop' })}><Square size={13}/></button>}<button className="send-button" disabled={!text.trim()} aria-label={t('chat.send')} onClick={submit}><ArrowUp size={20}/></button></div></div><div className="composer-note"><i />{state.settings.mode === 'demo' ? t('chat.noteDemo') : t('chat.noteApi')}</div></div>
  </>;
}
function ChatMessage({ message, locale, t }: { message: Message; locale: string; t: (key: string, vars?: Record<string, string | number>) => string }) {
  if (message.speaker === 'system') return <div className={`system-message ${message.kind === 'error' ? 'error' : ''}`}><span>{message.text}</span></div>;
  const user = message.speaker === 'user';
  const character = user ? null : byId[message.speaker as CharacterId];
  const stamp = new Date(message.at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return <div className={`chat-message ${user ? 'user' : ''}`}>{!user && <Avatar id={character!.id}/>}<div className="message-body"><div className="message-meta"><strong>{user ? t('chat.me') : character!.name}</strong>{!user && <span className="role-label">{character!.tags[0]}</span>}<time>{stamp}</time></div><div className="bubble">{message.text || <span className="pending">{t('chat.pending')}</span>}</div></div>{user && <span className="user-avatar">{t('chat.me')}</span>}</div>;
}
function CharacterLibrary({ state, onSelect }: { state: AppState; onSelect: (id: CharacterId) => void }) {
  const { t } = useI18n(state);
  return <section className="content-page community-library"><div className="eyebrow">{t('lib.eyebrow')}</div><h1>{t('lib.title')}</h1><p className="page-intro">{t('lib.intro')}</p><div className="character-grid">{characters.map(c => <article className="character-card" key={c.id} style={{ background: c.pale }}><div className="character-art"><Sprite character={c}/></div><span className="cast-label">{t('lib.living')}</span><h2>{c.name}</h2><p>{c.subtitle}</p><div className="tags">{c.tags.map(tag => <span key={tag}>{tag}</span>)}</div><p className="personality">{c.personality.replace('采用 CrossPet 社区二创版本：', '')}</p><p className="source-note">{c.source}</p><button className="outline-button" onClick={() => onSelect(c.id)}>{t('lib.chat')} <ChevronRight size={15}/></button></article>)}</div><div className="source-panel"><h3>{t('lib.sourceTitle')}</h3><p>{t('lib.sourceBody1')}</p><p>{t('lib.sourceBody2')}</p><code>CrossPet / fywdy · public/community & public/animated</code></div></section>;
}
function Memories({ state }: { state: AppState }) {
  const { t, locale } = useI18n(state);
  const [text, setText] = useState('');
  return <section className="content-page"><div className="eyebrow">{t('mem.eyebrow')}</div><h1>{t('mem.title')}</h1><p className="page-intro">{t('mem.intro')}</p><form className="memory-form" onSubmit={event => { event.preventDefault(); if (text.trim()) { dispatch({ type: 'remember', text }); setText(''); } }}><input aria-label={t('mem.new')} maxLength={500} value={text} onChange={e => setText(e.target.value)} placeholder={t('mem.placeholder')}/><button className="primary-button" disabled={!text.trim()}><Plus size={17}/>{t('mem.add')}</button></form>{state.memories.length ? <div className="memory-list">{state.memories.map(memory => <article key={memory.id}><span className="memory-icon"><Leaf size={20}/></span><div><p>{memory.text}</p><small>{new Date(memory.at).toLocaleDateString(locale)} · {t('mem.saved')}</small></div><button aria-label={t('mem.delete', { text: memory.text })} onClick={() => dispatch({ type: 'forget', id: memory.id })}><Trash2 size={17}/></button></article>)}</div> : <div className="empty-memory"><Sprout size={42}/><h2>{t('mem.emptyTitle')}</h2><p>{t('mem.emptyBody').split('\n').map((line, i) => <React.Fragment key={i}>{i > 0 && <br/>}{line}</React.Fragment>)}</p></div>}<div className="quiet-info"><BookOpen size={18}/><span>{t('mem.note')}</span></div></section>;
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
function PrivateWindow(){const {state,error}=useGarden();const id=new URLSearchParams(location.search).get('character') as CharacterId;const locale=state?.settings.locale??'zh-CN';const loading=translate(locale,'private.loading');return state&&byId[id]?<PrivateChat state={state} id={id}/>:<div className="loading">{error||loading}</div>;}
const view = new URLSearchParams(location.search).get('view');
createRoot(document.getElementById('root')!).render(<React.StrictMode>{view === 'pets' ? <Pets/> : view === 'private' ? <PrivateWindow/> : <App/>}</React.StrictMode>);
