import { StyleSheet, Text, View } from 'react-native';
import { colors, useScale } from '../theme';

type Props = {
  score: number;
};

export function Header({ score }: Props) {
  const { scale } = useScale();

  return (
    <View style={styles.row}>
      <Text style={[styles.title, { fontSize: 30 * scale }]} accessibilityRole="header">
        🎤 Sing First
      </Text>
      <View style={[styles.scorePill, { paddingHorizontal: 16 * scale, paddingVertical: 8 * scale }]}>
        <Text style={[styles.scoreLabel, { fontSize: 12 * scale }]}>SCORE</Text>
        <Text style={[styles.scoreValue, { fontSize: 24 * scale }]} accessibilityLabel={`Score ${score}`}>
          {score}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scorePill: {
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
  },
  scoreLabel: {
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  scoreValue: {
    color: colors.card,
    fontWeight: '900',
  },
});
