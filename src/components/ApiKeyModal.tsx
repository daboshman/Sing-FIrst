import { useEffect, useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, useScale } from '../theme';

type Props = {
  visible: boolean;
  currentKey: string | null;
  onSave: (key: string) => void;
  onClear: () => void;
  onClose: () => void;
};

export function ApiKeyModal({ visible, currentKey, onSave, onClear, onClose }: Props) {
  const { scale } = useScale();
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (visible) setDraft('');
  }, [visible]);

  const trimmed = draft.trim();
  const canSave = trimmed.startsWith('sk-') && trimmed.length > 20;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { padding: 24 * scale, borderRadius: 24 * scale }]}>
          <Text style={[styles.title, { fontSize: 22 * scale }]}>OpenAI API key</Text>
          <Text style={[styles.body, { fontSize: 15 * scale }]}>
            Sing First uses OpenAI Whisper to hear your singing. Paste your own API key — it's saved only on this
            device and sent only to api.openai.com.
          </Text>
          <Text
            style={[styles.link, { fontSize: 15 * scale }]}
            onPress={() => Linking.openURL('https://platform.openai.com/api-keys')}
            accessibilityRole="link"
          >
            Get a key at platform.openai.com/api-keys
          </Text>

          {currentKey && (
            <Text style={[styles.current, { fontSize: 14 * scale }]}>
              Current key: sk-…{currentKey.slice(-4)}
            </Text>
          )}

          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="sk-..."
            placeholderTextColor="#9A8BC4"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { fontSize: 16 * scale, padding: 14 * scale }]}
            accessibilityLabel="OpenAI API key"
            onSubmitEditing={() => canSave && onSave(trimmed)}
          />

          <View style={styles.row}>
            {currentKey && (
              <Pressable onPress={onClear} style={[styles.btn, styles.btnGhost]} accessibilityRole="button">
                <Text style={[styles.btnGhostText, { fontSize: 15 * scale }]}>Remove key</Text>
              </Pressable>
            )}
            <View style={{ flex: 1 }} />
            <Pressable onPress={onClose} style={[styles.btn, styles.btnGhost]} accessibilityRole="button">
              <Text style={[styles.btnGhostText, { fontSize: 15 * scale }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onSave(trimmed)}
              disabled={!canSave}
              style={[styles.btn, styles.btnPrimary, !canSave && styles.disabled]}
              accessibilityRole="button"
            >
              <Text style={[styles.btnPrimaryText, { fontSize: 15 * scale }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,0,30,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  title: {
    color: colors.cardText,
    fontWeight: '900',
  },
  body: {
    color: '#4A3B6B',
    lineHeight: 21,
  },
  link: {
    color: colors.buttonSecondary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  current: {
    color: '#4A3B6B',
    fontWeight: '600',
  },
  input: {
    borderWidth: 2,
    borderColor: '#D9CCF5',
    borderRadius: 12,
    color: colors.cardText,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  btn: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    minHeight: 44,
    justifyContent: 'center',
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  btnGhostText: {
    color: colors.buttonSecondary,
    fontWeight: '700',
  },
  btnPrimary: {
    backgroundColor: colors.record,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.4,
  },
});
