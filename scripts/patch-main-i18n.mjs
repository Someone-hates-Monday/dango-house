import fs from 'node:fs';

const path = 'src/main.tsx';
let src = fs.readFileSync(path, 'utf8');
const start = src.indexOf('function Chat({ state }: { state: AppState }) {');
const end = src.indexOf('function Settings({ state }: { state: AppState }) {');
if (start < 0 || end < 0) throw new Error(`markers not found ${start} ${end}`);

const replacement = `function Chat({ state }: { state: AppState }) {
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
    <div className="garden-stage"><div className="stage-copy"><span className="eyebrow">{t('chat.stageEyebrow')}</span><h2>{t('chat.stageTitle')}</h2><p>{state.settings.mode === 'demo' ? t('chat.stageDemo') : t('chat.stageApi')}</p><span className="stage-label"><Sun size={13}/> {t('chat.weather')}</span></div><div className="stage-window"><div className="window-sun"/><div className="window-hill"/><div className="window-mullion"/></div><div className="stage-pets">{characters.map(c => <button key={c.id} className={\`stage-pet \${state.selected === c.id ? 'selected' : ''}\`} onClick={() => { dispatch({ type: 'select', id: c.id }); setTarget(c.id); }}><Sprite character={c} mood={state.mood[c.id]} skin={state.skins[c.id]} pose={state.bodies[c.id].pose} /><span><i style={{ background: c.color }} />{c.name}</span></button>)}</div><div className="stage-floor"/></div>
    {state.focus && <div className="focus-banner"><Clock3 size={18} /><span>{t('chat.focus')} <small>{t('chat.focusOwner', { name: byId[state.focus.owner].name })}</small></span><strong>{Math.floor(remaining / 60).toString().padStart(2,'0')}:{(remaining % 60).toString().padStart(2,'0')}</strong><button onClick={() => dispatch({ type: 'cancel-focus' })}>{t('chat.focusEnd')}</button></div>}
    <div className="messages"><div className="day-marker"><span />{t('chat.today')}<span /></div>{state.messages.map(message => <ChatMessage key={message.id} message={message} locale={locale} t={t} />)}{state.busy && <div className="typing"><span/><span/><span/><small>{state.activity}</small><button onClick={() => dispatch({ type: 'stop' })}>{t('chat.stop')}</button></div>}<div ref={tail}/></div>
    <div className="composer-area"><div className="quick-actions"><button onClick={() => dispatch({ type: 'praise', id: state.selected })}><Heart size={14}/>{t('chat.praise', { name: byId[state.selected].name })}</button><button disabled={!!state.focus} onClick={() => dispatch({ type: 'focus', minutes: 25 })}><Clock3 size={14}/>{t('chat.focus25')}</button><button onClick={() => dispatch({ type: 'send', text: locale === 'en' ? 'Let’s take a break' : locale === 'ja' ? '少し休もう' : '休息一会儿吧' })}><Coffee size={14}/>{t('chat.rest')}</button></div><div className="composer"><textarea aria-label={t('chat.message')} placeholder={target ? t('chat.placeholderOne', { name: byId[target].name }) : t('chat.placeholderAll')} value={text} maxLength={4000} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }} /><div className="composer-toolbar"><select aria-label={t('chat.target')} value={target} onChange={event => setTarget(event.target.value as CharacterId | '')}><option value="">{t('chat.targetAll')}</option>{characters.map(c => <option key={c.id} value={c.id}>@ {c.name}</option>)}</select><span>{t('chat.sendHint')}</span>{state.busy && <button className="stop-button" title={t('chat.stopGen')} aria-label={t('chat.stopGen')} onClick={() => dispatch({ type: 'stop' })}><Square size={13}/></button>}<button className="send-button" disabled={!text.trim()} aria-label={t('chat.send')} onClick={submit}><ArrowUp size={20}/></button></div></div><div className="composer-note"><i />{state.settings.mode === 'demo' ? t('chat.noteDemo') : t('chat.noteApi')}</div></div>
  </>;
}
function ChatMessage({ message, locale, t }: { message: Message; locale: string; t: (key: string, vars?: Record<string, string | number>) => string }) {
  if (message.speaker === 'system') return <div className={\`system-message \${message.kind === 'error' ? 'error' : ''}\`}><span>{message.text}</span></div>;
  const user = message.speaker === 'user';
  const character = user ? null : byId[message.speaker as CharacterId];
  const stamp = new Date(message.at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return <div className={\`chat-message \${user ? 'user' : ''}\`}>{!user && <Avatar id={character!.id}/>}<div className="message-body"><div className="message-meta"><strong>{user ? t('chat.me') : character!.name}</strong>{!user && <span className="role-label">{character!.tags[0]}</span>}<time>{stamp}</time></div><div className="bubble">{message.text || <span className="pending">{t('chat.pending')}</span>}</div></div>{user && <span className="user-avatar">{t('chat.me')}</span>}</div>;
}
function CharacterLibrary({ state, onSelect }: { state: AppState; onSelect: (id: CharacterId) => void }) {
  const { t } = useI18n(state);
  return <section className="content-page community-library"><div className="eyebrow">{t('lib.eyebrow')}</div><h1>{t('lib.title')}</h1><p className="page-intro">{t('lib.intro')}</p><div className="character-grid">{characters.map(c => <article className="character-card" key={c.id} style={{ background: c.pale }}><div className="character-art"><Sprite character={c}/></div><span className="cast-label">{t('lib.living')}</span><h2>{c.name}</h2><p>{c.subtitle}</p><div className="tags">{c.tags.map(tag => <span key={tag}>{tag}</span>)}</div><p className="personality">{c.personality.replace('采用 CrossPet 社区二创版本：', '')}</p><p className="source-note">{c.source}</p><button className="outline-button" onClick={() => onSelect(c.id)}>{t('lib.chat')} <ChevronRight size={15}/></button></article>)}</div><div className="source-panel"><h3>{t('lib.sourceTitle')}</h3><p>{t('lib.sourceBody1')}</p><p>{t('lib.sourceBody2')}</p><code>CrossPet / fywdy · public/community & public/animated</code></div></section>;
}
function Memories({ state }: { state: AppState }) {
  const { t, locale } = useI18n(state);
  const [text, setText] = useState('');
  return <section className="content-page"><div className="eyebrow">{t('mem.eyebrow')}</div><h1>{t('mem.title')}</h1><p className="page-intro">{t('mem.intro')}</p><form className="memory-form" onSubmit={event => { event.preventDefault(); if (text.trim()) { dispatch({ type: 'remember', text }); setText(''); } }}><input aria-label={t('mem.new')} maxLength={500} value={text} onChange={e => setText(e.target.value)} placeholder={t('mem.placeholder')}/><button className="primary-button" disabled={!text.trim()}><Plus size={17}/>{t('mem.add')}</button></form>{state.memories.length ? <div className="memory-list">{state.memories.map(memory => <article key={memory.id}><span className="memory-icon"><Leaf size={20}/></span><div><p>{memory.text}</p><small>{new Date(memory.at).toLocaleDateString(locale)} · {t('mem.saved')}</small></div><button aria-label={t('mem.delete', { text: memory.text })} onClick={() => dispatch({ type: 'forget', id: memory.id })}><Trash2 size={17}/></button></article>)}</div> : <div className="empty-memory"><Sprout size={42}/><h2>{t('mem.emptyTitle')}</h2><p>{t('mem.emptyBody').split('\\n').map((line, i) => <React.Fragment key={i}>{i > 0 && <br/>}{line}</React.Fragment>)}</p></div>}<div className="quiet-info"><BookOpen size={18}/><span>{t('mem.note')}</span></div></section>;
}
`;

fs.writeFileSync(path, src.slice(0, start) + replacement + src.slice(end));
console.log('ok');
