import { byId } from './shared/characters';
import { socialProfiles, relationshipKey } from './shared/social';
import { bondTier } from './shared/bonds';
import type { AppState } from './shared/types';
import { useI18n } from './useI18n';
import { localizedProfile } from './shared/dialogue/pack';

/** Relationship feedback; stories start through companion interactions and autonomy. */
export function SocialBar({ state }: { state: AppState }) {
  const { t, locale } = useI18n(state);
  const targetId = socialProfiles[state.selected].target;
  const profile = localizedProfile(locale, state.selected);
  const bond = state.bonds[relationshipKey(state.selected, targetId)] ?? 0;
  const tier = bondTier(bond);
  const memory = state.companionEvents?.at(-1);
  return (
    <section className="social-bar">
      <div>
        <strong>
          {byId[state.selected].name} → {byId[targetId].name}{' '}
          <span>{t('social.bond', { n: bond })} · {t('social.bondTier', { tier: t('social.tier.' + tier) })}</span>
        </strong>
        <p>{profile.feeling}</p>
        {memory && <small>{memory.recall}</small>}
      </div>
    </section>
  );
}
