import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { spotifySearchUrl, youtubeSearchUrl, type Song } from '../services/identifySong';
import { colors } from '../theme';

export type SongLookup = { status: 'idle' } | { status: 'loading' } | { status: 'done'; song: Song | null };

type Props = {
  lookup: SongLookup;
  label: string;
  scale: number;
};

function openLink(url: string) {
  // On the web open a new tab so the game keeps running.
  if (Platform.OS === 'web') window.open(url, '_blank', 'noopener,noreferrer');
  else Linking.openURL(url);
}

export function SongCard({ lookup, label, scale }: Props) {
  if (lookup.status === 'idle') return null;

  if (lookup.status === 'loading') {
    return (
      <View style={[styles.card, styles.row, { padding: 10 * scale, borderRadius: 14 * scale }]}>
        <ActivityIndicator color={colors.textMuted} size="small" />
        <Text style={[styles.muted, { fontSize: 15 * scale }]}>🎵 Which song was that…</Text>
      </View>
    );
  }

  if (!lookup.song) {
    return <Text style={[styles.muted, { fontSize: 14 * scale }]}>🎵 Couldn't recognize the song</Text>;
  }

  const { song } = lookup;
  return (
    <View style={[styles.card, { padding: 12 * scale, borderRadius: 16 * scale, gap: 8 * scale }]}>
      <Text style={[styles.label, { fontSize: 12 * scale }]}>{label}</Text>
      <Text style={[styles.title, { fontSize: 18 * scale }]} numberOfLines={2}>
        🎵 {song.title} <Text style={styles.artist}>— {song.artist}</Text>
      </Text>
      <View style={[styles.row, { gap: 10 * scale }]}>
        <LinkButton label="▶ YouTube" color="#FF0033" scale={scale} onPress={() => openLink(youtubeSearchUrl(song))} />
        <LinkButton label="● Spotify" color="#1DB954" scale={scale} onPress={() => openLink(spotifySearchUrl(song))} />
      </View>
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
  artist: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  muted: {
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
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
