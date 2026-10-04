import { Platform } from 'react-native';

import type { WordMode } from '../data/words';
import type { UiLanguage } from '../i18n/strings';

export type Settings = { uiLanguage: UiLanguage; wordMode: WordMode };

const KEY = 'singfirst.settings';
export const DEFAULT_SETTINGS: Settings = { uiLanguage: 'en', wordMode: 'en' };

/** Remembered on this device (web only) so the table iPad keeps its setup. */
export function loadSettings(): Settings {
  if (Platform.OS !== 'web') return DEFAULT_SETTINGS;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return {
      uiLanguage: saved.uiLanguage === 'he' ? 'he' : 'en',
      wordMode: ['en', 'he', 'mix'].includes(saved.wordMode) ? saved.wordMode : 'en',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (Platform.OS !== 'web') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Private browsing or storage blocked — settings just won't persist.
  }
}
