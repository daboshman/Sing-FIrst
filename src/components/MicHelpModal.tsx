import { Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { getMicHelp } from '../utils/micHelp';

type Props = {
  visible: boolean;
  scale: number;
  onTryAgain: () => void;
  onClose: () => void;
};

export function MicHelpModal({ visible, scale, onTryAgain, onClose }: Props) {
  const help = getMicHelp();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { padding: 24 * scale, borderRadius: 24 * scale, gap: 14 * scale }]}>
          <Text style={[styles.emoji, { fontSize: 44 * scale }]}>🎙️</Text>
          <Text style={[styles.title, { fontSize: 22 * scale }]}>{help.title}</Text>
          <Text style={[styles.body, { fontSize: 15 * scale, lineHeight: 22 * scale }]}>
            Sing First needs the microphone to hear you sing.
          </Text>

          <View style={{ gap: 10 * scale }}>
            {help.steps.map((step, i) => (
              <View key={i} style={styles.step}>
                <Text style={[styles.stepNumber, { fontSize: 14 * scale, width: 26 * scale, height: 26 * scale, lineHeight: 26 * scale }]}>
                  {i + 1}
                </Text>
                <Text style={[styles.stepText, { fontSize: 16 * scale, lineHeight: 23 * scale }]}>{step}</Text>
              </View>
            ))}
          </View>

          {help.tip && (
            <Text style={[styles.tip, { fontSize: 14 * scale, lineHeight: 20 * scale }]}>💡 {help.tip}</Text>
          )}

          <View style={[styles.buttons, { gap: 10 * scale }]}>
            <Button label="Try again" primary scale={scale} onPress={onTryAgain} />
            {help.canOpenSettings && <Button label="Open Settings" scale={scale} onPress={() => Linking.openSettings()} />}
            {Platform.OS === 'web' && (
              <Button label="Reload page" scale={scale} onPress={() => window.location.reload()} />
            )}
            <Button label="Close" scale={scale} onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Button({
  label,
  primary,
  scale,
  onPress,
}: {
  label: string;
  primary?: boolean;
  scale: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonGhost,
        { paddingVertical: 10 * scale, paddingHorizontal: 18 * scale },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[primary ? styles.buttonPrimaryText : styles.buttonGhostText, { fontSize: 16 * scale }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,0,30,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
  },
  emoji: {
    textAlign: 'center',
  },
  title: {
    color: colors.cardText,
    fontWeight: '900',
    textAlign: 'center',
  },
  body: {
    color: '#4A3B6B',
    textAlign: 'center',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    color: '#FFFFFF',
    backgroundColor: colors.buttonSecondary,
    borderRadius: 999,
    overflow: 'hidden',
    textAlign: 'center',
    fontWeight: '900',
  },
  stepText: {
    flex: 1,
    color: colors.cardText,
    fontWeight: '600',
  },
  tip: {
    color: '#4A3B6B',
    backgroundColor: '#F3EEFF',
    borderRadius: 12,
    padding: 12,
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 4,
  },
  button: {
    borderRadius: 999,
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.record,
  },
  buttonGhost: {
    backgroundColor: '#F3EEFF',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  buttonGhostText: {
    color: colors.buttonSecondary,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
  },
});
