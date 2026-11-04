import {CompanionInteractions} from './CompanionInteractions';
import { PortraitSprite } from './PortraitSprite';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Minus, X, Heart, Hand, ChevronRight } from 'lucide-react';
import type { AppState, CharacterId } from './shared/types';
import { byId } from './shared/characters';
import { Sprite, EmotionFx } from './Sprite';
import { foodMeta, useNow } from './Room';
import { useI18n } from './useI18n';

export function PrivateChat({ state, id }: { state: AppState; id: CharacterId }) {
  const { t } = useI18n(state);
  const character = byId[id];
  const [text, setText] = useState('');
  const tail = useRef<HTMLDivElement>(null);
  const now = useNow();
  const body = state.bodies[id];
  const messages = state.privateMessages[id];
  const relation =
    state.relationship.mode === 'romance'
      ? t('settings.romance')
      : state.relationship.mode === 'pet'
        ? t('settings.pet')
        : t('settings.friend');

  useEffect(() => {
    tail.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages.at(-1)?.text]);

  const send = () => {
    if (text.trim()) {
      void window.garden.dispatch({ type: 'private-send', id, text });
      setText('');
    }
  };

  return (
    <div className="private-window">
      <header className="private-titlebar">
        <span>
          🍡 {t('brand.name')} <ChevronRight size={12} /> {character.name}
        </span>
        <button aria-label={t('private.minimize')} onClick={() => window.garden.window('minimize')}>
          <Minus size={15} />
        </button>
        <button aria-label={t('private.close')} onClick={() => window.garden.window('close')}>
          <X size={15} />
        </button>
      </header>
      <div className="private-hero" style={{ background: character.pale }}>
        <div className="private-character">
          {state.presentation.chatForm === 'portrait' ? (
            <PortraitSprite character={character} body={body} />
          ) : (
            <Sprite
              character={character}
              skin={state.skins[id]}
              pose={body.pose}
              cue={body.until}
              activity={body.bubble}
              interaction={body.interaction}
              stoppedAt={body.stoppedAt}
              frozen={state.settings.dnd}
            />
          )}
          <EmotionFx emotion={body.until > now ? body.emotion : 'neutral'} />
        </div>
        <div>
          <span className="eyebrow">JUST YOU & ME</span>
          <h1>{character.name}</h1>
          <p>{body.until > now ? body.label : t('private.listening')}</p>
          <span className="private-affection">
            <Heart size={12} /> {state.affection[id]} · {relation}
          </span>
        </div>
      </div>
      <div className="private-messages">
        {messages.map(m => (
          <div key={m.id} className={`private-message ${m.speaker === 'user' ? 'mine' : m.speaker === 'system' ? 'notice' : ''}`}>
            <small>
              {m.speaker === 'user'
                ? state.relationship.userName
                : m.speaker === 'system'
                  ? t('private.system')
                  : character.name}
            </small>
            <p>{m.text || t('private.thinking')}</p>
          </div>
        ))}
        <div ref={tail} />
      </div>
      <div className="private-touch">
        <button onClick={() => void window.garden.dispatch({ type: 'presentation', patch: { chatForm: state.presentation.chatForm === 'portrait' ? 'chibi' : 'portrait' } })}>
          {state.presentation.chatForm === 'portrait' ? t('private.switchChibi') : t('private.switchPortrait')}
        </button>
        <button onClick={() => void window.garden.dispatch({ type: 'pat', id })}>
          <Hand size={14} />
          {t('private.pat')}
        </button>
        {foodMeta.slice(0, 2).map(f => (
          <button key={f.id} onClick={() => void window.garden.dispatch({ type: 'feed', id, food: f.id })}>
            {f.icon}
            {t(f.key)}
          </button>
        ))}
        {state.busy && <button onClick={() => void window.garden.dispatch({ type: 'stop' })}>{t('private.stop')}</button>}
      </div>
      <CompanionInteractions id={id} state={state}/><div className="private-composer">
        <textarea
          aria-label={t('private.message')}
          placeholder={t('private.placeholder', { name: character.name })}
          value={text}
          maxLength={4000}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button aria-label={t('private.send')} disabled={!text.trim()} onClick={send}>
          <ArrowUp size={18} />
        </button>
      </div>
      <footer>
        {state.settings.mode === 'demo'
          ? t('private.footerDemo')
          : t('private.footerApi', { provider: state.settings.provider.toUpperCase() })}
      </footer>
    </div>
  );
}
