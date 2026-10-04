import { Platform } from 'react-native';

import type { MicHelpKey } from '../i18n/strings';

/** Which set of microphone instructions fits this browser/device. */
export function detectMicHelp(): { key: MicHelpKey; canOpenSettings: boolean } {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return { key: 'native', canOpenSettings: true };
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, so also check for touch support.
  const iOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const key: MicHelpKey = /FBAN|FBAV|Instagram|WhatsApp|Line\/|Snapchat|TikTok|musical_ly|\bGSA\//.test(ua)
    ? 'in-app'
    : iOS && /CriOS/.test(ua)
      ? 'ios-chrome'
      : iOS && /FxiOS|EdgiOS|OPiOS/.test(ua)
        ? 'ios-other'
        : iOS
          ? 'ios-safari'
          : /Android/.test(ua)
            ? 'android'
            : 'desktop';
  return { key, canOpenSettings: false };
}
