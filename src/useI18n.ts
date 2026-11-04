import { useEffect, useMemo } from 'react';
import type { AppState } from './shared/types';
import { defaultLocale, translate, type AppLocale } from './shared/i18n';

export function useI18n(state?: Pick<AppState, 'settings'> | AppState | null) {
  const locale: AppLocale = state?.settings?.locale ?? defaultLocale;
  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
  }, [locale]);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return { t, locale };
}
