import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { colors } from '../theme';

type Props = {
  word: string;
  scale: number;
};

export function WordCard({ word, scale }: Props) {
  const { t } = useI18n();
  return (
    <View style={[styles.card, { paddingVertical: 14 * scale, paddingHorizontal: 20 * scale, borderRadius: 24 * scale }]}>
      <Text style={[styles.prompt, { fontSize: 15 * scale }]}>{t.singAWord}</Text>
      <Text
        style={[styles.word, { fontSize: 52 * scale }]}
        numberOfLines={1}
        accessibilityLabel={t.targetWord(word)}
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
