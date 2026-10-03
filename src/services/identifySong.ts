import { IDENTIFY_URL } from '../config';

export type Song = { title: string; artist: string };

/**
 * Asks the Sing First Worker which song these sung lyrics come from.
 * Resolves to null when the song can't be identified or anything fails —
 * song recognition is a bonus, never a reason to interrupt the game.
 */
export async function identifySong(lyrics: string): Promise<Song | null> {
  try {
    const response = await fetch(IDENTIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: lyrics }),
    });
    if (!response.ok) return null;
    const data: { song?: Song | null } = await response.json();
    return data.song?.title && data.song.artist ? data.song : null;
  } catch {
    return null;
  }
}

export function youtubeSearchUrl({ title, artist }: Song): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${artist}`)}`;
}

export function spotifySearchUrl({ title, artist }: Song): string {
  return `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
}

// App URL schemes, used on iOS browsers to open the installed app directly.
export function youtubeAppUrl({ title, artist }: Song): string {
  return `youtube://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${artist}`)}`;
}

export function spotifyAppUrl({ title, artist }: Song): string {
  return `spotify:search:${encodeURIComponent(`${title} ${artist}`)}`;
}
