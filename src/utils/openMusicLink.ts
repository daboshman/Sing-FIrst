import { Linking, Platform } from 'react-native';

export type OpenResult = 'opened' | 'app-missing';

function isIOSWeb(): boolean {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac, so also check for touch support.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/**
 * Opens a song in the YouTube/Spotify app without leaving the game.
 *
 * On iOS browsers a new tab + universal link leaves an empty tab behind, so
 * we launch the app's own URL scheme from this tab instead. If the page is
 * still visible shortly after, the app isn't installed and the caller can
 * offer the website. Elsewhere the web link opens in a new tab (or natively).
 */
export function openMusicLink(appUrl: string, webUrl: string): Promise<OpenResult> {
  if (Platform.OS !== 'web') {
    Linking.openURL(webUrl);
    return Promise.resolve('opened');
  }
  if (!isIOSWeb()) {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
    return Promise.resolve('opened');
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: OpenResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
      resolve(result);
    };
    const onVisibility = () => {
      if (document.hidden) finish('opened');
    };
    const onHide = () => finish('opened');

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    const timer = setTimeout(() => finish(document.hidden ? 'opened' : 'app-missing'), 1600);
    window.location.href = appUrl;
  });
}

/** Opens the website in a new tab — only used when the player asks for it. */
export function openWebsite(webUrl: string) {
  if (Platform.OS === 'web') window.open(webUrl, '_blank', 'noopener,noreferrer');
  else Linking.openURL(webUrl);
}
