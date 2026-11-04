import { useState } from 'react';
import { Clapperboard, FolderOpen, Search, Trash2, Users } from 'lucide-react';
import { byId, characters } from './shared/characters';
import type { AppState, CharacterId } from './shared/types';
import { coverageLabel } from './shared/agent';
import { TaskTray } from './TaskTray';
import { Sprite } from './Sprite';
import { useI18n } from './useI18n';

const send = (action: Parameters<typeof window.garden.dispatch>[0]) => void window.garden.dispatch(action);

export function WatchParty({ state }: { state: AppState }) {
  const { t, locale } = useI18n(state);
  const [speakers, setSpeakers] = useState<CharacterId[]>(['xia', 'rin', 'grok']);
  const [busy, setBusy] = useState(false);
  const [browseBusy, setBrowseBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const party = state.agent?.watchParty;
  const active = characters.filter(c => !state.muted.includes(c.id));

  const toggle = (id: CharacterId) => {
    setSpeakers(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  const importVideo = async () => {
    setBusy(true);
    setNotice('');
    try {
      const picked = await window.garden.pickVideo();
      if (!picked) {
        setNotice(t('watch.cancelPick'));
        return;
      }
      const chosen = speakers.filter(id => active.some(c => c.id === id)).slice(0, 3);
      await window.garden.dispatch({
        type: 'watch-start',
        path: picked.path,
        displayName: picked.displayName,
        captionPath: picked.captionPath,
        speakers: chosen.length ? chosen : undefined,
      });
      setNotice(picked.captionPath ? t('watch.startedCaption') : t('watch.startedMeta'));
    } catch (error) {
      setNotice(error instanceof Error ? error.message.replace(/^Error invoking remote method '[^']+': Error: /, '') : t('watch.importFail'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="content-page watch-party-page">
      <div className="eyebrow">{t('watch.eyebrow')}</div>
      <h1>{t('watch.title')}</h1>
      <p className="page-intro">{t('watch.intro')}</p>

      <TaskTray state={state} />

      <div className="watch-panel">
        <div className="watch-import">
          <Clapperboard size={22} />
          <div>
            <strong>{t('watch.localTitle')}</strong>
            <p>{t('watch.localHint')}</p>
          </div>
          <button className="primary-button" disabled={busy} onClick={() => void importVideo()}>
            <FolderOpen size={16} />
            {busy ? t('watch.working') : t('watch.pick')}
          </button>
        </div>

        <div className="watch-speakers">
          <header>
            <Users size={16} />
            <strong>{t('watch.speakers')}</strong>
          </header>
          <div className="watch-speaker-grid">
            {active.map(c => (
              <button key={c.id} className={speakers.includes(c.id) ? 'selected' : ''} onClick={() => toggle(c.id)}>
                <span style={{ background: c.pale }}>
                  <Sprite character={c} forceRig />
                </span>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="watch-import">
          <Search size={22} />
          <div>
            <strong>{t('watch.browseTitle')}</strong>
            <p>{t('watch.browseHint')}</p>
          </div>
          <div className="watch-browse-form">
            <input
              aria-label={t('watch.browseQuery')}
              placeholder={t('watch.browseQuery')}
              value={query}
              maxLength={160}
              onChange={e => setQuery(e.target.value)}
            />
            <button
              className="primary-button"
              disabled={browseBusy || !query.trim()}
              onClick={() => {
                setBrowseBusy(true);
                setNotice('');
                void window.garden
                  .dispatch({ type: 'browse-start', query: query.trim(), actor: speakers[0], maxResults: 2 })
                  .then(() => setNotice(t('watch.browseWorking')))
                  .catch(error =>
                    setNotice(error instanceof Error ? error.message.replace(/^Error invoking remote method '[^']+': Error: /, '') : t('watch.importFail')),
                  )
                  .finally(() => setBrowseBusy(false));
              }}
            >
              <Search size={16} />
              {browseBusy ? t('watch.browseWorking') : t('watch.browseGo')}
            </button>
          </div>
        </div>

        {notice && (
          <div className="settings-notice" role="status">
            {notice}
          </div>
        )}
      </div>

      {party ? (
        <div className="watch-result">
          <header>
            <div>
              <h2>{party.title}</h2>
              <p>
                {party.coverage ? coverageLabel(party.coverage, locale) : t('watch.coverageUnknown')} · {party.status}
              </p>
            </div>
            <button className="text-button" onClick={() => send({ type: 'watch-clear' })}>
              <Trash2 size={14} />
              {t('watch.clear')}
            </button>
          </header>

          {!!party.limitations.length && (
            <ul className="watch-limitations">
              {party.limitations.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

          <div className="watch-opinions">
            {party.opinions.map(op => (
              <article key={op.id}>
                <strong>{byId[op.characterId].name}</strong>
                <em>{op.reaction}</em>
                <p>{op.interpretation}</p>
                {op.cite?.atMs !== undefined && <small>{t('watch.cite', { sec: Math.round(op.cite.atMs / 1000) })}</small>}
              </article>
            ))}
          </div>

          <div className="watch-turns">
            <h3>{t('watch.replay')}</h3>
            {party.turns.map((turn, index) => (
              <div key={`${turn.at}-${index}`} className="watch-turn">
                <b>{byId[turn.speaker].name}</b>
                <p>{turn.text}</p>
              </div>
            ))}
            {!party.turns.length && <p className="helper">{t('watch.replayEmpty')}</p>}
          </div>

          <div className="watch-recs">
            <h3>{t('watch.recs')}</h3>
            {party.recommendations.length ? (
              party.recommendations.map(card => (
                <a key={card.id} href={card.verifiedUrl} target="_blank" rel="noreferrer" title={card.whyForUser}>
                  {card.title}
                  <small>{t('watch.openLink')}</small>
                </a>
              ))
            ) : (
              <p className="helper">{t('watch.recsEmpty')}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-memory">
          <Clapperboard size={42} />
          <h2>{t('watch.emptyTitle')}</h2>
          <p>
            {t('watch.emptyBody').split('\n').map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        </div>
      )}
    </section>
  );
}
