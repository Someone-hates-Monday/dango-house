import {connectBrain} from './connect-brain';
import { useState, useEffect } from 'react';
import { Plug, Heart, Check, Plus, Trash2, Bell, Languages, Cable, Users } from 'lucide-react';
import { characters, providers } from './shared/characters';
import type { AppState, Action, AppLocale, BridgeStatus, CastPreset, CharacterId } from './shared/types';
import { locales } from './shared/i18n';
import { useI18n } from './useI18n';
import { providerLabel, presentCast } from './shared/cast';

const send = (action: Action) => window.garden.dispatch(action);

export function Connections({ state }: { state: AppState }) {
  const { t, locale } = useI18n(state);
  const [group,setGroup]=useState('home');
  const sections=locale==='en'?[['home','House & chat'],['companions','Residents & relationships'],['ai','AI connection'],['advanced','Advanced']]:locale==='ja'?[['home','小屋・会話'],['companions','住人・関係'],['ai','AI接続'],['advanced','詳細設定']]:[['home','小屋与聊天'],['companions','伙伴与关系'],['ai','AI 连接'],['advanced','高级选项']];
  const [provider, setProvider] = useState(providers.some(p=>p.id===state.settings.provider) ? state.settings.provider : 'glm');
  const current = state.connections[provider];
  const [model, setModel] = useState(current?.model ?? '');
  const [endpoint, setEndpoint] = useState(current?.endpoint ?? '');
  const [tools, setTools] = useState(current?.tools !== false);
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(false);
  const [mode, setMode] = useState(state.relationship.mode);
  const [name, setName] = useState(state.relationship.userName);
  const [address, setAddress] = useState(state.relationship.address);
  const [reminder, setReminder] = useState('记得喝水，伸个懒腰哦。');
  const [minutes, setMinutes] = useState(30);
  const [bridge, setBridge] = useState<BridgeStatus | null>(null);
  const [bridgeNotice, setBridgeNotice] = useState('');
  const [snippet, setSnippet] = useState('');
  useEffect(() => {
    void window.garden.keyStatus().then(setSaved);
    void window.garden.bridgeStatus().then(setBridge).catch(() => setBridge(null));
  }, [state.settings.agentBridge]);
  const choose = (id: string) => {
    setProvider(id);
    const config = state.connections[id];
    setModel(config?.model ?? '');
    setEndpoint(config?.endpoint ?? providers.find(p => p.id === id)!.endpoint);
    setTools(config?.tools !== false);
    setKey('');
    setNotice('');
  };
  const save = async () => {
    setWorking(true);
    try {
      const result=await connectBrain({provider,model,endpoint,tools,key});
      setKey('');setSaved(await window.garden.keyStatus());
      setNotice(result+' · '+t('settings.liveStarted'));
      window.garden.window('show-house');
      return true;
    } catch (error) {
      setKey('');setSaved(await window.garden.keyStatus());
      setNotice(error instanceof Error ? error.message.replace(/^Error invoking remote method '[^']+': Error: /, '') : t('settings.connectFail'));
      return false;
    } finally {
      setWorking(false);
    }
  };
  const defaultAddress = (id: typeof mode) => (id === 'romance' ? (locale === 'en' ? 'darling' : locale === 'ja' ? 'だんな' : '老公') : id === 'pet' ? (locale === 'en' ? 'master' : locale === 'ja' ? 'ご主人' : '主人') : locale === 'en' ? 'you' : locale === 'ja' ? 'あなた' : '你');
  return (
    <section className="content-page connections-page">
      <span className="eyebrow">{t('settings.eyebrow')}</span>
      <h1>{locale==='en'?'Global house settings':locale==='ja'?'小屋全体の設定':'小屋全局设置'}</h1>
      <p className="settings-scope">{locale==='en'?'Changes here apply to the whole house, regardless of the selected resident.':locale==='ja'?'選択中の住人に関係なく、小屋全体に適用します。':'这里调整整个小屋，与当前选中了哪位伙伴无关。'}</p>
      <nav className="settings-groups" aria-label={locale==='en'?'Settings categories':locale==='ja'?'設定カテゴリ':'设置分类'}>{sections.map(([id,label])=><button key={id} aria-pressed={group===id} className={group===id?'selected':''} onClick={()=>setGroup(id)}>{label}</button>)}</nav>
      {group==='home'&&<div className="settings-home-guide">{locale==='en'?'Watch speech bubbles above the house; open the base chat for full history. Drag the roof to move, and the bottom-right corner to resize. The roof pin shows its current state.':locale==='ja'?'小屋の上の吹き出しで会話を見て、下のチャットで履歴を読みます。屋根で移動、右下でサイズ調整。ピンは現在の状態を表示します。':'平时看她们的气泡对白，点底部「聊聊」看完整记录。拖动屋顶移动小屋，右下角调整大小；屋檐图钉显示当前置顶状态。'}</div>}
      {group==='advanced'&&<p className="settings-scope">{locale==='en'?'Optional alternate displays and integrations. These are not needed for everyday house companionship.':locale==='ja'?'別表示や外部連携の任意設定です。普段の小屋では必要ありません。':'以下是可选的其他展示方式与外部联动，日常小屋陪伴无需配置。'}</p>}

      <div className="settings-section" data-settings-group="home" hidden={group!=='home'}>
        <h2>
          <Languages size={18} />
          {t('settings.language')}
        </h2>
        <div className="language-options" role="radiogroup" aria-label={t('settings.language')}>
          {locales.map(item => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={locale === item.id}
              className={locale === item.id ? 'selected' : ''}
              onClick={() => void send({ type: 'settings', patch: { locale: item.id as AppLocale } })}
            >
              <strong>{item.native}</strong>
              <small>{item.english}</small>
              {locale === item.id && <Check size={15} />}
            </button>
          ))}
        </div>
        <p className="helper">{t('settings.languageHint')}</p>
      </div>

      <div className="settings-section" data-settings-group="companions" hidden={group!=='companions'}>
        <h2>
          <Heart size={18} />
          {t('settings.relation')}
        </h2>
        <div className="relationship-options">
          {(
            [
              { id: 'friend' as const, name: t('settings.friend'), icon: '☕' },
              { id: 'pet' as const, name: t('settings.pet'), icon: '🐾' },
              { id: 'romance' as const, name: t('settings.romance'), icon: '♥' },
            ]
          ).map(item => (
            <button
              key={item.id}
              className={mode === item.id ? 'selected' : ''}
              onClick={() => {
                setMode(item.id);
                setAddress(defaultAddress(item.id));
              }}
            >
              <span>{item.icon}</span>
              {item.name}
              {mode === item.id && <Check size={15} />}
            </button>
          ))}
        </div>
        <div className="field-pair">
          <label>
            {t('settings.yourName')}
            <input aria-label={t('settings.yourName')} value={name} maxLength={30} onChange={e => setName(e.target.value)} />
          </label>
          <label>
            {t('settings.address')}
            <input aria-label={t('settings.address')} value={address} maxLength={30} onChange={e => setAddress(e.target.value)} placeholder={t('settings.addressPh')} />
          </label>
        </div>
        <button className="pink-button" onClick={() => void send({ type: 'relationship', mode, userName: name.trim() || (locale === 'en' ? 'you' : locale === 'ja' ? 'あなた' : '你'), address: address.trim() || defaultAddress(mode) })}>
          {t('settings.saveRelation')}
        </button>
        <p className="helper">{t('settings.relationHint')}</p>
      </div>

      <div className="settings-section" data-settings-group="companions" hidden={group!=='companions'}>
        <h2>
          <Heart size={18} />
          {t('settings.pairTone')}
        </h2>
        <div className="relationship-options">
          <button aria-pressed={state.settings.pairRomance!==false} className={state.settings.pairRomance!==false?'selected':''} onClick={()=>void send({type:'settings',patch:{pairRomance:state.settings.pairRomance===false}})}>
            {locale==='en'?'Girl–girl affection':locale==='ja'?'女の子同士の親密さ':'女孩之间的贴贴'} · {state.settings.pairRomance===false?(locale==='en'?'Off':locale==='ja'?'オフ':'关闭'):(locale==='en'?'On':locale==='ja'?'オン':'开启')}
          </button>
          <button aria-pressed={state.settings.cgAutoplay!==false} className={state.settings.cgAutoplay!==false?'selected':''} onClick={()=>void send({type:'settings',patch:{cgAutoplay:state.settings.cgAutoplay===false}})}>
            {locale==='en'?'Scene clips after interactions':locale==='ja'?'交流後のシーン再生':'互动后的剧情短片'} · {state.settings.cgAutoplay===false?(locale==='en'?'Off':locale==='ja'?'オフ':'关闭'):(locale==='en'?'On':locale==='ja'?'オン':'开启')}
          </button>
        </div>
        <p className="helper">{locale==='en'?'Girl–girl affection is independent of your role. Romantic scenes toward you follow Lover mode. Scenes appear naturally through interactions.':locale==='ja'?'女の子同士の親密さはあなたとの関係と別設定です。あなたへの恋愛シーンは恋人モードに従います。シーンは交流から自然に始まります。':'女孩之间的贴贴与你的身份分开设置；面向你的恋爱短片只在恋人模式下随互动出现。剧情会通过日常互动自然出现。'}</p>
        <div className="relationship-options">
          {(
            [
              { id: 'soft' as const, name: t('settings.toneSoft') },
              { id: 'warm' as const, name: t('settings.toneWarm') },
              { id: 'vivid' as const, name: t('settings.toneVivid') },
            ]
          ).map(item => (
            <button
              key={item.id}
              className={state.settings.pairTone === item.id ? 'selected' : ''}
              onClick={() => void send({ type: 'settings', patch: { pairTone: item.id } })}
            >
              {item.name}
              {state.settings.pairTone === item.id && <Check size={15} />}
            </button>
          ))}
        </div>
        <p className="helper">{t('settings.pairToneHint')}</p>
      </div>

      <div className="settings-section" data-settings-group="advanced" hidden={group!=='advanced'}>
        <h2>{t('settings.desktop')}</h2>
        <div className="relationship-options">
          {(
            [
              { id: 'free' as const, name: t('settings.freePet') },
              { id: 'dock' as const, name: t('settings.dockPet') },
            ]
          ).map(item => (
            <button key={item.id} className={state.presentation.desktopMode === item.id ? 'selected' : ''} onClick={() => void send({ type: 'presentation', patch: { desktopMode: item.id } })}>
              {item.name}
            </button>
          ))}
        </div>
        <p className="helper">{t('settings.desktopHint')}</p>
        <button className="outline-button" onClick={()=>window.garden.window('show-desktop')}>{locale==='en'?'Use desktop pets':locale==='ja'?'デスクトップペットに切替':'进入桌宠 / Dock 模式'}</button>
        <label>
          {locale==='en'?'Standalone chat artwork (not the mini house)':locale==='ja'?'独立チャットの立ち絵（小屋とは別）':'独立聊天窗口的立绘（不影响迷你小屋）'}
          <select aria-label={t('settings.chatForm')} value={state.presentation.chatForm} onChange={e => void send({ type: 'presentation', patch: { chatForm: e.target.value as 'portrait' | 'chibi' } })}>
            <option value="portrait">{t('settings.portraitOpt')}</option>
            <option value="chibi">{t('settings.chibiOpt')}</option>
          </select>
        </label>
      </div>

      <div className="settings-section" data-settings-group="advanced" hidden={group!=='advanced'}>
        <h2>
          <Cable size={18} />
          {t('settings.bridgeTitle')}
        </h2>
        <p className="helper">{t('settings.bridgeHint')}</p>
        <div className="preference-row">
          <div>
            <strong>{t('settings.bridgeEnable')}</strong>
            <p>{bridge?.running ? t('settings.bridgeRunning', { url: bridge.baseUrl }) : t('settings.bridgeStopped')}</p>
          </div>
          <button
            role="switch"
            aria-checked={!!bridge?.enabled}
            aria-label={t('settings.bridgeEnable')}
            className={`toggle ${bridge?.enabled ? 'on' : ''}`}
            onClick={() => {
              void window.garden
                .bridgeConfigure({ enabled: !bridge?.enabled })
                .then(status => {
                  setBridge(status);
                  setBridgeNotice(status.error || (status.enabled ? t('settings.bridgeOn') : t('settings.bridgeOff')));
                })
                .catch(error => setBridgeNotice(error instanceof Error ? error.message : t('settings.bridgeFail')));
            }}
          >
            <span />
          </button>
        </div>
        {bridge?.enabled && (
          <>
            <label>
              {t('settings.bridgePort')}
              <input
                aria-label={t('settings.bridgePort')}
                type="number"
                min={1024}
                max={65535}
                value={bridge.port}
                onChange={e => setBridge({ ...bridge, port: Number(e.target.value) || bridge.port })}
                onBlur={() => {
                  void window.garden.bridgeConfigure({ enabled: true, port: bridge.port }).then(setBridge);
                }}
              />
            </label>
            <p className="helper mono-path">{t('settings.bridgeToken')}: {bridge.token}</p>
            <div className="connection-actions">
              <button
                className="outline-button"
                type="button"
                onClick={() => void window.garden.bridgeConfigure({ rotateToken: true }).then(setBridge)}
              >
                {t('settings.bridgeRotate')}
              </button>
              {(
                [
                  ['cursor', t('settings.bridgeCursor')] as const,
                  ['claude', t('settings.bridgeClaude')] as const,
                  ['codex', t('settings.bridgeCodex')] as const,
                  ['deepseek', t('settings.bridgeDeepseek')] as const,
                ]
              ).map(([id, label]) => (
                <button
                  key={id}
                  className="outline-button"
                  type="button"
                  onClick={() => {
                    void window.garden.bridgeInstallSnippet(id).then(async text => {
                      setSnippet(text);
                      try {
                        await navigator.clipboard.writeText(text);
                        setBridgeNotice(t('settings.bridgeCopied', { name: label }));
                      } catch {
                        setBridgeNotice(t('settings.bridgeCopyFail'));
                      }
                    });
                  }}
                >
                  {t('settings.bridgeCopy', { name: label })}
                </button>
              ))}
            </div>
            {snippet && <pre className="bridge-snippet">{snippet}</pre>}
          </>
        )}
        {bridgeNotice && (
          <p className="settings-notice" role="status">
            {bridgeNotice}
          </p>
        )}
        <p className="helper">{t('settings.bridgeKeepApp')}</p>
      </div>

      <div className="settings-section" data-settings-group="ai" hidden={group!=='ai'}>
        <h2>
          <Plug size={18} />
          {t('settings.connectTitle')}
        </h2>
        <p className="helper">{t('settings.connectHint')}</p>
        <p className="settings-notice" role="status">
          {t('settings.brainActive', {
            name: providerLabel(state.settings.provider),
            model: state.settings.model || state.connections[state.settings.provider]?.model || '—',
          })}
          {state.settings.mode === 'api' ? ` · ${t('mode.api')}` : ` · ${t('mode.demo')}`}
        </p>
        <p className="helper">{t('settings.brainPick')}</p>
        <div className="provider-tabs">
          {providers.map(p => (
            <button className={provider === p.id ? 'selected' : ''} key={p.id} onClick={() => choose(p.id)}>
              {p.name}
            </button>
          ))}
        </div>
        <label>
          {t('settings.endpoint')}
          <input aria-label={t('settings.endpoint')} value={endpoint} onChange={e => setEndpoint(e.target.value)} />
        </label>
        <label>
          {t('settings.model')}
          <input aria-label={t('settings.model')} aria-describedby="model-id-help" value={model} maxLength={120} onChange={e => setModel(e.target.value)} placeholder={provider==='deepseek'?'deepseek-flash':t('settings.modelPh')} />
        </label>
        <p id="model-id-help" className="helper model-id-help">{t('settings.modelHelp')}{provider==='deepseek'&&<> {t('settings.deepseekHelp')}</>}</p>
        {provider==='deepseek'&&<div className="model-presets" role="group" aria-label={t('settings.modelExamples')}>
          <button type="button" onClick={()=>setModel('deepseek-flash')}><code>deepseek-flash</code><span>{t('settings.modelEveryday')}</span></button>
          <button type="button" onClick={()=>setModel('deepseek-v4-pro')}><code>deepseek-v4-pro</code><span>{t('settings.modelComplex')}</span></button>
        </div>}
        <label>
          {t('settings.key')}
          <input aria-label={t('settings.key')} type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} placeholder={saved.includes(provider) ? t('settings.keySaved') : t('settings.keyNew')} />
        </label>
        <div className="tool-option">
          <label className="tool-checkbox">
            <input type="checkbox" aria-describedby="avatar-tools-help" checked={tools} onChange={e => setTools(e.target.checked)} />
            <span>{t('settings.tools')}</span>
          </label>
          <p id="avatar-tools-help" className="helper">{t('settings.toolsHint')}</p>
        </div>
        <div className="connection-actions">
          <button className="pink-button" disabled={working||!model.trim()||(!key.trim()&&!saved.includes(provider))} onClick={()=>void save()}>{working?t('settings.connecting'):t('settings.connectAndStart')}</button>
          <button className="text-button" onClick={()=>void send({type:'settings',patch:{mode:'demo'}})}>{t('settings.backDemo')}</button>
          <button className="outline-button" onClick={()=>window.garden.window('show-house')}>{t('settings.backHouse')}</button>
        </div>
        {notice && (
          <p className="settings-notice" role="status">
            {notice}
          </p>
        )}
        <p className="helper">{t('settings.testHint')}</p>
      </div>

      <div className="settings-section" data-settings-group="companions" hidden={group!=='companions'}>
        <h2>
          <Users size={18} />
          {t('settings.castTitle')}
        </h2>
        <div className="relationship-options">
          {(
            [
              { id: 'all' as CastPreset, name: t('settings.castAll') },
              { id: 'core' as CastPreset, name: t('settings.castCore') },
              { id: 'custom' as CastPreset, name: t('settings.castCustom') },
            ]
          ).map(item => (
            <button
              key={item.id}
              className={state.settings.castPreset === item.id ? 'selected' : ''}
              onClick={() => void send({ type: 'cast-preset', preset: item.id })}
            >
              {item.name}
              {state.settings.castPreset === item.id && <Check size={15} />}
            </button>
          ))}
        </div>
        <p className="helper">{t('settings.castPresentCount', { n: String(presentCast(state).length) })}</p>
        <div className="cast-present-grid" role="group" aria-label={t('settings.castTitle')}>
          {characters.map(c => {
            const on = presentCast(state).includes(c.id as CharacterId);
            return (
              <label key={c.id} className={`cast-present-card ${on ? 'on' : 'off'}`}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={e => void send({ type: 'cast-present', id: c.id as CharacterId, present: e.target.checked })}
                />
                <span className="cast-present-swatch" style={{ background: c.pale }} />
                <span>
                  <strong>{c.name}</strong>
                  <small>{on ? t('settings.castOnStage') : t('settings.castOffStage')}</small>
                </span>
              </label>
            );
          })}
        </div>
        <p className="helper">{t('settings.castHint')}</p>
      </div>

      <div className="settings-section" data-settings-group="advanced" hidden={group!=='advanced'}>
        <h2>{t('settings.overrideTitle')}</h2>
        <p className="helper">{locale==='en'?'Only overrides the backend for individual private replies. Public house life uses the shared AI connection.':locale==='ja'?'個別の内緒話の接続だけを変更します。小屋の会話は共通AI接続を使います。':'仅覆盖单独私聊回复的后端；小屋公开对话与共同生活统一使用「AI 连接」里的小屋大脑。'}</p>
        <div className="override-grid">
          {characters.map(c => {
            const value = state.characterProviders[c.id as CharacterId] ?? '';
            return (
              <label key={c.id} className="override-row">
                <span>{c.name}</span>
                <select
                  aria-label={`${c.name} provider`}
                  value={value}
                  onChange={e => {
                    const next = e.target.value;
                    void send({ type: 'character-provider', id: c.id, provider: next || null });
                  }}
                >
                  <option value="">{t('settings.overrideHouse')}</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      </div>

      <div className="settings-section" data-settings-group="home" hidden={group!=='home'}>
        <h2>
          <Bell size={18} />
          {t('settings.reminders')}
        </h2>
        {state.reminders.map(r => (
          <div className="reminder-row" key={r.id}>
            <button role="switch" aria-checked={r.enabled} aria-label={r.text} className={`toggle ${r.enabled ? 'on' : ''}`} onClick={() => void send({ type: 'reminder', operation: 'toggle', id: r.id })}>
              <span />
            </button>
            <div>
              <b>{r.text}</b>
              <small>{t('settings.everyMinutes', { n: r.intervalMinutes })}</small>
            </div>
            <button aria-label={t('settings.deleteReminder')} onClick={() => void send({ type: 'reminder', operation: 'remove', id: r.id })}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <div className="reminder-form">
          <input aria-label={t('settings.reminderText')} value={reminder} onChange={e => setReminder(e.target.value)} maxLength={120} />
          <input aria-label={t('settings.reminderMinutes')} type="number" min="1" max="1440" value={minutes} onChange={e => setMinutes(Number(e.target.value))} />
          <button onClick={() => void send({ type: 'reminder', operation: 'add', text: reminder, intervalMinutes: minutes })}>
            <Plus size={16} />
            {t('settings.addReminder')}
          </button>
        </div>
        <div className="preference-row">
          <div>
            <strong>{locale==='en'?'Autonomous life & greetings':locale==='ja'?'自発的な交流・あいさつ':'主动生活与问候'}</strong>
            <p>{t('settings.hoverHint')}</p>
          </div>
          <button role="switch" aria-checked={state.settings.autonomous} aria-label={t('settings.autonomous')} className={`toggle ${state.settings.autonomous ? 'on' : ''}`} onClick={() => {const enabled=!state.settings.autonomous;void send({type:'settings',patch:{autonomous:enabled}});void send({type:'room-settings',patch:{autonomous:enabled}});}}>
            <span />
          </button>
        </div>
        <div className="preference-row">
          <div>
            <strong>{t('settings.dnd')}</strong>
            <p>{t('settings.dndHint')}</p>
          </div>
          <button role="switch" aria-checked={state.settings.dnd} aria-label={t('settings.dnd')} className={`toggle ${state.settings.dnd ? 'on' : ''}`} onClick={() => void send({ type: 'settings', patch: { dnd: !state.settings.dnd } })}>
            <span />
          </button>
        </div>
      </div>
    </section>
  );
}
