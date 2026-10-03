import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, useScale } from '../theme';

export type FeedbackKind = 'none' | 'success' | 'failure' | 'error';

type Props = {
  kind: FeedbackKind;
  message: string;
  onTryAgain: () => void;
  onSkip: () => void;
};

const TONE: Record<Exclude<FeedbackKind, 'none'>, string> = {
  success: colors.success,
  failure: colors.failure,
  error: colors.failure,
};

export function FeedbackPanel({ kind, message, onTryAgain, onSkip }: Props) {
  const { scale } = useScale();
  const showActions = kind === 'failure' || kind === 'error';

  return (
    <View style={styles.container}>
      {kind !== 'none' && (
        <Text
          style={[styles.message, { fontSize: 22 * scale, color: TONE[kind] }]}
          accessibilityLiveRegion="assertive"
        >
          {message}
        </Text>
      )}
      <View style={[styles.actions, { gap: 12 * scale }]}>
        {showActions && (
          <ActionButton label="🔁 Try Again" color={colors.buttonSecondary} onPress={onTryAgain} scale={scale} />
        )}
        <ActionButton
          label="⏭ Skip Word"
          color={showActions ? colors.record : colors.surface}
          onPress={onSkip}
          scale={scale}
        />
      </View>
    </View>
  );
}

function ActionButton({
  label,
  color,
  onPress,
  scale,
}: {
  label: string;
  color: string;
  onPress: () => void;
  scale: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: color,
          paddingVertical: 12 * scale,
          paddingHorizontal: 22 * scale,
          minHeight: 48,
        },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, { fontSize: 17 * scale }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  message: {
    fontWeight: '900',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    borderRadius: 999,
    alignItems: 'center',
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
