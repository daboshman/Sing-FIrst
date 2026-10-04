import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  spotifyAppUrl,
  spotifySearchUrl,
  youtubeAppUrl,
  youtubeSearchUrl,
  type Song,
} from '../services/identifySong';
import { colors } from '../theme';
import { useI18n } from '../i18n/I18nContext';
import { isolate } from '../utils/bidi';
import { openMusicLink, openWebsite } from '../utils/openMusicLink';

export type SongLookup =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; song: Song | null }
  // No reliable identification (Hebrew): search the sung lyrics instead.
  | { status: 'search'; query: string };

type Props = {
  lookup: SongLookup;
  label: string;
  scale: number;
};

type Service = { name: string; webUrl: string };

export function SongCard({ lookup, label, scale }: Props) {
  const { t, dir } = useI18n();
  // Set when the app isn't installed, to offer the website instead.
  const [missingApp, setMissingApp] = useState<Service | null>(null);
  const song = lookup.status === 'done' ? lookup.song : null;
  const query = lookup.status === 'search' ? lookup.query : null;

  useEffect(() => setMissingApp(null), [song, query]);

  const open = async (name: string, appUrl: string, webUrl: string) => {
    setMissingApp(null);
    if ((await openMusicLink(appUrl, webUrl)) === 'app-missing') setMissingApp({ name, webUrl });
  };

  if (lookup.status === 'idle') return null;

  if (lookup.status === 'loading') {
    return (
      <View style={[styles.card, styles.row, { padding: 10 * scale, borderRadius: 14 * scale }]}>
        <ActivityIndicator color={colors.textMuted} size="small" />
        <Text style={[styles.muted, { fontSize: 15 * scale }]}>{t.whichSong}</Text>
      </View>
    );
  }

  if (!song && !query) {
    return <Text style={[styles.muted, { fontSize: 14 * scale }]}>{t.songUnknown}</Text>;
  }

  // Search terms: "title artist" for an identified song, else the first
  // words of the lyrics (enough to find it, short enough for a search box).
  const terms = song ? `${song.title} ${song.artist}` : query!.split(/\s+/).slice(0, 10).join(' ');

  return (
    <View style={[styles.card, { padding: 12 * scale, borderRadius: 16 * scale, gap: 8 * scale }]}>
      <Text style={[styles.label, { fontSize: 12 * scale }]}>{song ? label : t.findThisSong}</Text>
      {song ? (
        <Text style={[styles.title, { fontSize: 18 * scale, writingDirection: dir }]} numberOfLines={2}>
          🎵 {isolate(song.title)} <Text style={styles.artist}>— {isolate(song.artist)}</Text>
        </Text>
      ) : (
        <Text style={[styles.title, styles.lyrics, { fontSize: 16 * scale, writingDirection: dir }]} numberOfLines={2}>
          🔎 “{isolate(terms)}”
        </Text>
      )}
      <View style={[styles.row, { gap: 10 * scale }]}>
        <LinkButton
          label="▶ YouTube"
          color="#FF0033"
          scale={scale}
          onPress={() => open('YouTube', youtubeAppUrl(terms), youtubeSearchUrl(terms))}
        />
        <LinkButton
          label="● Spotify"
          color="#1DB954"
          scale={scale}
          onPress={() => open('Spotify', spotifyAppUrl(terms), spotifySearchUrl(terms))}
        />
      </View>
      {missingApp && (
        <Text style={[styles.muted, { fontSize: 14 * scale }]}>
          {t.appMissing(missingApp.name)}{' '}
          <Text style={styles.webLink} onPress={() => openWebsite(missingApp.webUrl)} accessibilityRole="link">
            {t.openWebsite(missingApp.name)}
          </Text>
        </Text>
      )}
    </View>
  );
}

function LinkButton({
  label,
  color,
  scale,
  onPress,
}: {
  label: string;
  color: string;
  scale: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={({ pressed }) => [
        styles.link,
        { backgroundColor: color, paddingVertical: 8 * scale, paddingHorizontal: 16 * scale },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.linkText, { fontSize: 15 * scale }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: colors.text,
    fontWeight: '900',
    textAlign: 'center',
  },
  lyrics: {
    fontWeight: '700',
  },
  artist: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  muted: {
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  webLink: {
    color: colors.text,
    textDecorationLine: 'underline',
  },
  link: {
    borderRadius: 999,
    minHeight: 40,
    justifyContent: 'center',
  },
  linkText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});
