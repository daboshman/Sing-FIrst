import { Platform } from 'react-native';

export type MicHelp = {
  title: string;
  steps: string[];
  tip?: string;
  canOpenSettings: boolean;
};

function detectBrowser() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return Platform.OS;
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, so also check for touch support.
  const iOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (/FBAN|FBAV|Instagram|WhatsApp|Line\/|Snapchat|TikTok|musical_ly|\bGSA\//.test(ua)) return 'in-app';
  if (iOS && /CriOS/.test(ua)) return 'ios-chrome';
  if (iOS && /FxiOS|EdgiOS|OPiOS/.test(ua)) return 'ios-other';
  if (iOS) return 'ios-safari';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

/** Step-by-step instructions for turning the microphone on, per browser. */
export function getMicHelp(): MicHelp {
  switch (detectBrowser()) {
    case 'ios-chrome':
      return {
        title: 'Turn on the microphone for Chrome',
        steps: [
          'Open the Settings app on your iPhone or iPad.',
          'Scroll down and tap Chrome (on newer iOS: Apps → Chrome).',
          'Turn on Microphone.',
          'Come back here and tap “Try again”. When Chrome asks, tap Allow.',
        ],
        tip: 'Still no question popping up? Reload this page and tap “Try again”.',
        canOpenSettings: false,
      };
    case 'ios-safari':
      return {
        title: 'Allow the microphone in Safari',
        steps: [
          'Tap the “aA” or page-menu button in the address bar.',
          'Tap Website Settings → Microphone → Allow.',
          'Come back and tap “Try again”.',
        ],
        tip: 'You can also go to Settings → Apps → Safari → Microphone → Allow.',
        canOpenSettings: false,
      };
    case 'ios-other':
      return {
        title: 'Turn on the microphone for your browser',
        steps: [
          'Open the Settings app on your iPhone or iPad.',
          'Find your browser in the list (on newer iOS: Apps → your browser).',
          'Turn on Microphone, then come back and tap “Try again”.',
        ],
        canOpenSettings: false,
      };
    case 'android':
      return {
        title: 'Allow the microphone in Chrome',
        steps: [
          'Tap the icon to the left of the web address (🔒 or ⚙).',
          'Tap Permissions → Microphone → Allow.',
          'Come back and tap “Try again”.',
        ],
        tip: 'If it’s still blocked: Android Settings → Apps → Chrome → Permissions → Microphone → Allow.',
        canOpenSettings: false,
      };
    case 'in-app':
      return {
        title: 'Open Sing First in your browser',
        steps: [
          'You’re inside another app’s browser (like WhatsApp or Instagram), which can’t use the microphone.',
          'Tap the ⋯ or share button and choose “Open in browser” (Safari or Chrome).',
        ],
        canOpenSettings: false,
      };
    case 'desktop':
      return {
        title: 'Allow the microphone',
        steps: [
          'Click the icon to the left of the web address (🔒 or ⚙).',
          'Set Microphone to Allow.',
          'Tap “Try again” (or reload the page).',
        ],
        canOpenSettings: false,
      };
    default:
      return {
        title: 'Allow the microphone',
        steps: ['Open Settings → Sing First and turn on Microphone.', 'Come back and tap “Try again”.'],
        canOpenSettings: true,
      };
  }
}
