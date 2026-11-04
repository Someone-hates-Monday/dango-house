import { Heart, Sparkles } from 'lucide-react';
import { byId } from './shared/characters';
import { stickiestPair } from './shared/bonds';
import type { AppState } from './shared/types';
import { useI18n } from './useI18n';

export function FavorStrip({ state }: { state: AppState }) {
  const { t } = useI18n(state);
  const favor = state.favor ?? { focusId: null, streak: 0 };
  const sticky = stickiestPair(state.bonds, state.muted);
  return (
    <div className="favor-strip">
      <div>
        <Heart size={14} />
        <span>{t('panel.favor')}</span>
        <strong>
          {favor.focusId
            ? t('panel.favorStreak', { name: byId[favor.focusId].name, n: favor.streak })
            : t('panel.favorNone')}
        </strong>
      </div>
      <div>
        <Sparkles size={14} />
        <span>{t('panel.stickyPair')}</span>
        <strong>
          {sticky && sticky.value > 0
            ? t('panel.stickyValue', { a: byId[sticky.a].name, b: byId[sticky.b].name, n: sticky.value })
            : t('panel.stickyNone')}
        </strong>
      </div>
    </div>
  );
}
