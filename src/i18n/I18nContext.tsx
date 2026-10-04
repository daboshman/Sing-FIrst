import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { STRINGS, type Strings, type UiLanguage } from './strings';

type I18n = {
  lang: UiLanguage;
  t: Strings;
  isRTL: boolean;
  /** For styles that must follow the UI direction (writingDirection, textAlign). */
  dir: 'ltr' | 'rtl';
};

const I18nContext = createContext<I18n>({ lang: 'en', t: STRINGS.en, isRTL: false, dir: 'ltr' });

export function I18nProvider({ lang, children }: { lang: UiLanguage; children: ReactNode }) {
  const isRTL = lang === 'he';

  // On the web, the page direction mirrors every flex row and aligns text
  // for us — Hebrew reads right to left.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [lang, isRTL]);

  return (
    <I18nContext.Provider value={{ lang, t: STRINGS[lang], isRTL, dir: isRTL ? 'rtl' : 'ltr' }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18n {
  return useContext(I18nContext);
}
