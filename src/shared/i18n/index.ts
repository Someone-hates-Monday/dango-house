import { zhCN } from './zh-CN';
import { en } from './en';
import { ja } from './ja';
import { defaultLocale, isAppLocale, type AppLocale, type MessageCatalog } from './types';

export type { AppLocale, MessageCatalog } from './types';
export { defaultLocale, isAppLocale, locales } from './types';

const catalogs: Record<AppLocale, MessageCatalog> = {
  'zh-CN': zhCN,
  en,
  ja,
};

export function translate(locale: AppLocale, key: string, vars?: Record<string, string | number>): string {
  const primary = catalogs[locale]?.[key];
  const fallback = catalogs[defaultLocale][key];
  let text = primary ?? fallback ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

export function catalogKeys(locale: AppLocale = defaultLocale) {
  return Object.keys(catalogs[locale]);
}
