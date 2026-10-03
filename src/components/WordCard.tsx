import { StyleSheet, Text, View } from 'react-native';
import { colors, useScale } from '../theme';

type Props = {
  word: string;
};

export function WordCard({ word }: Props) {
  const { scale } = useScale();

  return (
    <View style={[styles.card, { padding: 24 * scale, borderRadius: 28 * scale }]}>
      <Text style={[styles.prompt, { fontSize: 16 * scale }]}>Sing a song with the word</Text>
      <Text
        style={[styles.word, { fontSize: 64 * scale }]}
        adjustsFontSizeToFit
        numberOfLines={1}
        accessibilityLabel={`Target word: ${word}`}
      >
        {word.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.card,
    alignItems: 'center',
    transform: [{ rotate: '-1.5deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  prompt: {
    color: colors.cardText,
    fontWeight: '700',
    opacity: 0.75,
  },
  word: {
    color: colors.cardText,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 4,
  },
});
