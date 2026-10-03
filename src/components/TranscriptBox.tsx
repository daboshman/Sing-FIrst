import { StyleSheet, Text, View } from 'react-native';
import { colors, useScale } from '../theme';

type Props = {
  text: string;
};

export function TranscriptBox({ text }: Props) {
  const { scale } = useScale();

  return (
    <View style={[styles.box, { padding: 16 * scale, borderRadius: 18 * scale, minHeight: 84 * scale }]}>
      <Text style={[styles.label, { fontSize: 12 * scale }]}>WHAT I HEARD</Text>
      <Text
        style={[styles.text, { fontSize: 18 * scale }, !text && styles.placeholder]}
        accessibilityLiveRegion="polite"
      >
        {text ? `“${text}”` : 'Your singing will show up here…'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: '100%',
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
  },
  label: {
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  text: {
    color: colors.text,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  placeholder: {
    color: colors.textMuted,
    fontStyle: 'normal',
    fontWeight: '400',
  },
});
