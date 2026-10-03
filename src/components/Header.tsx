import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  scale: number;
  playersDisabled: boolean;
  onEditPlayers: () => void;
};

export function Header({ scale, playersDisabled, onEditPlayers }: Props) {
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { fontSize: 26 * scale }]} accessibilityRole="header">
        🎤 Sing First
      </Text>
      <Pressable
        onPress={onEditPlayers}
        disabled={playersDisabled}
        accessibilityRole="button"
        hitSlop={8}
        style={({ pressed }) => [
          styles.button,
          { paddingHorizontal: 14 * scale, paddingVertical: 8 * scale },
          playersDisabled && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.buttonText, { fontSize: 15 * scale }]}>👥 Players</Text>
      </Pressable>
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
  button: {
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: 999,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.6,
  },
});
