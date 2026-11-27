import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_LOCALE, type SupportedLocale } from '../config';
import { TRANSLATIONS, type TranslationDictionary } from './translations';

const STORAGE_KEY = 'noorcut_studio_locale';

function readInitialLocale(): SupportedLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
    if (saved && saved in TRANSLATIONS) {
      return saved;
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }
  return DEFAULT_LOCALE;
}

export interface I18nContextValue {
  locale: SupportedLocale;
  dir: 'rtl' | 'ltr';
  isRtl: boolean;
  t: TranslationDictionary;
  setLocale: (next: SupportedLocale) => void;
}

export function useI18n(): I18nContextValue {
  const [locale, setLocaleState] = useState<SupportedLocale>(readInitialLocale);

  const dir: 'rtl' | 'ltr' = locale === 'ar' ? 'rtl' : 'ltr';
  const t = TRANSLATIONS[locale];

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
    document.title = t.metaTitle;
  }, [dir, locale, t.metaTitle]);

  return {
    locale,
    dir,
    isRtl: dir === 'rtl',
    t,
    setLocale,
  };
}
