import { useMemo, useState } from 'react';
import { byId } from './shared/characters';
import { socialProfiles, socialScenes, relationshipKey } from './shared/social';
import { yuriScenes, yuriScenesForBond } from './shared/social-yuri';
import { bondTier } from './shared/bonds';

import type { AppState } from './shared/types';
import { useI18n } from './useI18n';
import { localizedProfile, localizedScene } from './shared/dialogue/pack';

export function SocialBar({ state }: { state: AppState }) {
  const { t, locale } = useI18n(state);
  const [scene, setScene] = useState('bookmark');
  const [yuriId, setYuriId] = useState(yuriScenes[0]?.id ?? 'rin-xia-seat');
  const targetId = socialProfiles[state.selected].target;
  const profile = localizedProfile(locale, state.selected);
  const story = localizedScene(locale, scene);
  const origin = story?.origin ?? socialScenes.find(s => s.id === scene)?.origin ?? '';
  const bond = state.bonds[relationshipKey(state.selected, targetId)] ?? 0;
  const tier = bondTier(bond);
  const availableYuri = useMemo(() => yuriScenesForBond(state.bonds, state.muted), [state.bonds, state.muted]);

  return (
    <section className="social-bar">
      <div>
        <strong>
          {byId[state.selected].name} → {byId[targetId].name}{' '}
          <span>
            {t('social.bond', { n: bond })} · {t('social.bondTier', { tier: t(`social.tier.${tier}`) })}
          </span>
        </strong>
        <p>{profile.feeling}</p>
        <small>{profile.origin}</small>
      </div>
      <div>
        <label htmlFor="social-scene">{t('social.daily')}</label>
        <select id="social-scene" value={scene} onChange={e => setScene(e.target.value)}>
          {socialScenes.map(s => {
            const loc = localizedScene(locale, s.id);
            return (
              <option value={s.id} key={s.id}>
                {(loc?.title ?? s.title)} · {s.cast.map(id => byId[id].name).join(' / ')}
              </option>
            );
          })}
        </select>
        <button onClick={() => void window.garden.dispatch({ type: 'social-scene', id: scene })}>{t('social.play')}</button>
        <small>{t('social.syncHint', { origin })}</small>
      </div>
      <div>
        <label htmlFor="yuri-scene">{t('social.yuriDaily')}</label>
        <select id="yuri-scene" value={yuriId} onChange={e => setYuriId(e.target.value as typeof yuriId)}>
          {yuriScenes.map(s => (
            <option value={s.id} key={s.id} disabled={!availableYuri.some(a => a.id === s.id)}>
              {t(s.titleKey)} · {s.pair.map(id => byId[id].name).join(' / ')}
              {!availableYuri.some(a => a.id === s.id) ? ` (≥${s.minBond})` : ''}
            </option>
          ))}
        </select>
        <button
          disabled={!availableYuri.some(a => a.id === yuriId)}
          onClick={() => void window.garden.dispatch({ type: 'yuri-scene', id: yuriId })}
        >
          {t('social.playYuri')}
        </button>
      </div>
    </section>
  );
}
