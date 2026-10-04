import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../i18n/I18nContext';
import { colors } from '../theme';
import type { Player } from '../types';

export type BuzzerState = 'ready' | 'singing' | 'locked';

type Props = {
  player: Player;
  state: BuzzerState;
  progress: number; // 0..1 of the singing time used
  scale: number;
  onBuzz: () => void;
  onDone: () => void;
};

const useNativeDriver = Platform.OS !== 'web';

export function PlayerBuzzer({ player, state, progress, scale, onBuzz, onDone }: Props) {
  const { t } = useI18n();
  const pulse = useRef(new Animated.Value(0)).current;
  // True when the current touch is the one that buzzed in, so releasing it
  // doesn't immediately count as "done".
  const pressBuzzed = useRef(false);
  // Shrink the text to fit the tile — tiles get small with many players.
  const [box, setBox] = useState({ width: 0, height: 0 });
  const fit = box.height ? Math.max(0.55, Math.min(scale, box.height / 165, box.width / 170)) : scale;

  useEffect(() => {
    if (state !== 'singing') {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver }),
        Animated.timing(pulse, { toValue: 0, duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [state, pulse]);

  const hint = state === 'ready' ? t.tap : state === 'singing' ? t.singingTapDone : '';

  return (
    <Pressable
      // onPressIn fires on first touch, so the fastest finger really wins.
      onPressIn={() => {
        pressBuzzed.current = state === 'ready';
        if (state === 'ready') onBuzz();
      }}
      onPress={() => {
        if (!pressBuzzed.current && state === 'singing') onDone();
      }}
      onLayout={(e) => setBox(e.nativeEvent.layout)}
      disabled={state === 'locked'}
      accessibilityRole="button"
      accessibilityLabel={state === 'singing' ? t.tapWhenDone(player.name) : t.buzzIn(player.name)}
      accessibilityState={{ disabled: state === 'locked' }}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: player.color,
          borderRadius: 22 * scale,
          padding: 12 * scale,
          borderWidth: state === 'singing' ? 5 * scale : 0,
        },
        state === 'locked' && styles.locked,
        pressed && state === 'ready' && styles.pressed,
      ]}
    >
      {state === 'singing' && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.glow, { borderRadius: 18 * scale, opacity: pulse }]}
        />
      )}
      <Text style={[styles.name, { fontSize: 24 * fit }]} numberOfLines={1}>
        {player.name}
      </Text>
      <Text style={[styles.score, { fontSize: 44 * fit }]} accessibilityLabel={t.points(player.score)}>
        {player.score}
      </Text>
      {!!hint && <Text style={[styles.hint, { fontSize: 15 * fit }]}>{hint}</Text>}
      {state === 'singing' && (
        <View style={[styles.track, { height: 8 * fit, marginTop: 8 * fit }]}>
          <View style={[styles.fill, { width: `${Math.max(0, 1 - progress) * 100}%` }]} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.text,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  glow: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  locked: {
    opacity: 0.35,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  name: {
    alignSelf: 'stretch',
    textAlign: 'center',
    color: colors.text,
    fontWeight: '900',
    writingDirection: 'auto',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 4,
  },
  score: {
    color: colors.text,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 4,
  },
  hint: {
    color: colors.text,
    fontWeight: '800',
    opacity: 0.9,
    letterSpacing: 1,
  },
  track: {
    width: '80%',
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.text,
    borderRadius: 999,
  },
});
