import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { SongCard, type SongLookup } from './SongCard';
import type { Player } from '../types';

export type Phase = 'idle' | 'singing' | 'processing' | 'result';
export type ResultKind = 'success' | 'failure' | 'error';

type Props = {
  phase: Phase;
  singer: Player | undefined;
  remainingMs: number;
  transcript: string;
  resultKind: ResultKind | null;
  message: string;
  songLookup: SongLookup;
  canSkip: boolean;
  scale: number;
  onDone: () => void;
  onSkip: () => void;
};

const RESULT_COLOR: Record<ResultKind, string> = {
  success: colors.success,
  failure: colors.failure,
  error: colors.failure,
};

export function TurnPanel({
  phase,
  singer,
  remainingMs,
  transcript,
  resultKind,
  message,
  songLookup,
  canSkip,
  scale,
  onDone,
  onSkip,
}: Props) {
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <View style={[styles.panel, { minHeight: 120 * scale, padding: 14 * scale, borderRadius: 20 * scale }]}>
      {phase === 'idle' && (
        <>
          <Text style={[styles.headline, { fontSize: 22 * scale }]}>First to tap their button sings! 🎤</Text>
          <SongCard lookup={songLookup} label="LAST SONG" scale={scale} />
        </>
      )}

      {phase === 'singing' && singer && (
        <>
          <Text style={[styles.headline, { fontSize: 22 * scale }]}>
            <Text style={{ color: singer.color }}>{singer.name}</Text> is singing…{' '}
            <Text style={[styles.countdown, seconds <= 5 && styles.countdownLow]}>{seconds}s</Text>
          </Text>
          <ActionButton label="⏹ Done singing" color={colors.record} scale={scale} onPress={onDone} />
        </>
      )}

      {phase === 'processing' && (
        <View style={styles.row}>
          <ActivityIndicator color={colors.text} />
          <Text style={[styles.headline, { fontSize: 20 * scale }]}>
            Listening to {singer?.name ?? 'the singer'}…
          </Text>
        </View>
      )}

      {phase === 'result' && resultKind && (
        <>
          <Text
            style={[styles.headline, { fontSize: 22 * scale, color: RESULT_COLOR[resultKind] }]}
            accessibilityLiveRegion="assertive"
          >
            {message}
          </Text>
          {!!transcript && (
            <Text style={[styles.transcript, { fontSize: 16 * scale }]} numberOfLines={3}>
              Heard: “{transcript}”
            </Text>
          )}
          <SongCard lookup={songLookup} label="THAT WAS" scale={scale} />
        </>
      )}

      {canSkip && (phase === 'idle' || phase === 'result') && (
        <ActionButton label="⏭ Skip word" color={colors.buttonSecondary} scale={scale} onPress={onSkip} />
      )}
    </View>
  );
}

function ActionButton({
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
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: color, paddingVertical: 10 * scale, paddingHorizontal: 22 * scale },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, { fontSize: 17 * scale }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%',
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headline: {
    color: colors.text,
    fontWeight: '900',
    textAlign: 'center',
  },
  countdown: {
    color: colors.card,
    fontVariant: ['tabular-nums'],
  },
  countdownLow: {
    color: colors.recording,
  },
  transcript: {
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    writingDirection: 'auto',
  },
  button: {
    borderRadius: 999,
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.text,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
