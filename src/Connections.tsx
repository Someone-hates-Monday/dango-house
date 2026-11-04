import { useState, useEffect } from 'react';
import { Plug, Heart, Check, Plus, Trash2, Bell, Languages, Cable, Users } from 'lucide-react';
import { characters, providers } from './shared/characters';
import type { AppState, Action, AppLocale, BridgeStatus, CastPreset, CharacterId } from './shared/types';
import { locales } from './shared/i18n';
import { useI18n } from './useI18n';
import { providerLabel } from './shared/cast';

const send = (action: Action) => window.garden.dispatch(action);

export function Connections({ state }: { state: AppState }) {
  const { t, locale } = useI18n(state);
  const [provider, setProvider] = useState(['glm', 'kimi'].includes(state.settings.provider) ? state.settings.provider : 'glm');
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
  }, [state.settings.agentBridge, state.revision]);
  const choose = (id: string) => {
    setProvider(id);
    const config = state.connections[id];
    setModel(config?.model ?? '');
    setEndpoint(config?.endpoint ?? providers.find(p => p.id === id)!.endpoint);
    setTools(config?.tools !== false);
    setKey('');
    setNotice('');
  };
  const save = async (test = false) => {
    setWorking(true);
    try {
      if (key.trim()) {
        await window.garden.saveKey(provider, key);
        setKey('');
        setSaved(await window.garden.keyStatus());
      }
      await window.garden.dispatch({ type: 'connection', provider, profile: { model, endpoint, tools } });
      await window.garden.dispatch({ type: 'settings', patch: { provider, model } });
      setNotice(test ? await window.garden.testConnection(provider, model, endpoint) : t('settings.savedOk'));
      return true;
    } catch (error) {
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
      <h1>{t('settings.title')}</h1>

      <div className="settings-section">
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

      <div className="settings-section">
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

      <div className="settings-section">
        <h2>
          <Heart size={18} />
          {t('settings.pairTone')}
        </h2>
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

      <div className="settings-section">
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
        <label>
          {t('settings.chatForm')}
          <select aria-label={t('settings.chatForm')} value={state.presentation.chatForm} onChange={e => void send({ type: 'presentation', patch: { chatForm: e.target.value as 'portrait' | 'chibi' } })}>
            <option value="portrait">{t('settings.portraitOpt')}</option>
            <option value="chibi">{t('settings.chibiOpt')}</option>
          </select>
        </label>
      </div>

      <div className="settings-section">
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

      <div className="settings-section">
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
          <input aria-label={t('settings.model')} value={model} maxLength={120} onChange={e => setModel(e.target.value)} placeholder={t('settings.modelPh')} />
        </label>
        <label>
          {t('settings.key')}
          <input aria-label={t('settings.key')} type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} placeholder={saved.includes(provider) ? t('settings.keySaved') : t('settings.keyNew')} />
        </label>
        <label className="tool-checkbox">
          <input type="checkbox" checked={tools} onChange={e => setTools(e.target.checked)} />
          {t('settings.tools')}
        </label>
        <p className="helper">{t('settings.toolsHint')}</p>
        <div className="connection-actions">
          <button className="pink-button" disabled={working} onClick={() => void save(false)}>
            {t('settings.save')}
          </button>
          <button className="outline-button" disabled={working || !model.trim() || (!key.trim() && !saved.includes(provider))} onClick={() => void save(true)}>
            {working ? t('settings.connecting') : t('settings.saveTest')}
          </button>
          <button
            className="outline-button"
            disabled={working || !model.trim() || !saved.includes(provider)}
            onClick={async () => {
              if (!(await save(false))) return;
              if (saved.includes(provider) && model.trim()) await send({ type: 'settings', patch: { provider, model, mode: 'api' } });
            }}
          >
            {t('settings.enableApi')}
          </button>
          <button className="text-button" onClick={() => void send({ type: 'settings', patch: { mode: 'demo' } })}>
            {t('settings.backDemo')}
          </button>
        </div>
        {notice && (
          <p className="settings-notice" role="status">
            {notice}
          </p>
        )}
        <p className="helper">{t('settings.testHint')}</p>
      </div>

      <div className="settings-section">
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
        <p className="helper">{t('settings.castHint')}</p>
      </div>

      <div className="settings-section">
        <h2>{t('settings.overrideTitle')}</h2>
        <p className="helper">{t('settings.overrideHint')}</p>
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

      <div className="settings-section">
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
            <strong>{t('settings.hoverGreet')}</strong>
            <p>{t('settings.hoverHint')}</p>
          </div>
          <button role="switch" aria-checked={state.settings.autonomous} aria-label={t('settings.autonomous')} className={`toggle ${state.settings.autonomous ? 'on' : ''}`} onClick={() => void send({ type: 'settings', patch: { autonomous: !state.settings.autonomous } })}>
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
