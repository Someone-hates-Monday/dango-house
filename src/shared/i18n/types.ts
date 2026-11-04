export type AppLocale = 'zh-CN' | 'en' | 'ja';

export const locales: { id: AppLocale; native: string; english: string }[] = [
  { id: 'zh-CN', native: '简体中文', english: 'Chinese' },
  { id: 'en', native: 'English', english: 'English' },
  { id: 'ja', native: '日本語', english: 'Japanese' },
];

export const defaultLocale: AppLocale = 'zh-CN';

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'zh-CN' || value === 'en' || value === 'ja';
}

/** Flat message catalog. Missing keys fall back to zh-CN then the key itself. */
export type MessageCatalog = Record<string, string>;
