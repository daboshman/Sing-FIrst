import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { WordMode } from '../data/words';
import { colors, useScale } from '../theme';
import { createPlayer, MAX_PLAYERS, type Player } from '../types';

type Props = {
  players: Player[];
  onChangePlayers: (update: (players: Player[]) => Player[]) => void;
  wordMode: WordMode;
  onChangeWordMode: (mode: WordMode) => void;
  onStart: () => void;
};

const WORD_MODES: { mode: WordMode; label: string }[] = [
  { mode: 'en', label: 'English' },
  { mode: 'he', label: 'עברית' },
  { mode: 'mix', label: 'Both · שניהם' },
];

export function SetupScreen({ players, onChangePlayers, wordMode, onChangeWordMode, onStart }: Props) {
  const { scale } = useScale();
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const trimmed = name.trim();
  const full = players.length >= MAX_PLAYERS;
  const hasScores = players.some((p) => p.score !== 0);

  // Takes the text from the submit event when there is one: a fast Enter can
  // arrive before React has re-rendered with the latest typed name.
  const addPlayer = (typed: string = name) => {
    const newName = typed.trim();
    if (!newName || full) return;
    onChangePlayers((ps) => (ps.length >= MAX_PLAYERS ? ps : [...ps, createPlayer(newName, ps)]));
    setName('');
    inputRef.current?.focus();
  };

  const removePlayer = (id: string) => onChangePlayers((ps) => ps.filter((p) => p.id !== id));
  const resetScores = () => onChangePlayers((ps) => ps.map((p) => ({ ...p, score: 0 })));

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.column, { gap: 20 * scale, paddingHorizontal: 16 * scale }]}>
            <Text style={[styles.title, { fontSize: 40 * scale }]} accessibilityRole="header">
              🎤 Sing First
            </Text>
            <Text style={[styles.intro, { fontSize: 16 * scale, lineHeight: 23 * scale }]}>
              Put the device in the middle of the table. When a word appears, the first player to tap their button
              has 30 seconds to sing a song with that word.
            </Text>
            <View style={[styles.rules, { gap: 10 * scale }]}>
              <Text style={[styles.rule, styles.ruleGood, { fontSize: 15 * scale }]}>+1 sang the word</Text>
              <Text style={[styles.rule, styles.ruleBad, { fontSize: 15 * scale }]}>−1 didn't</Text>
            </View>

            <View style={[styles.card, { padding: 18 * scale, borderRadius: 22 * scale, gap: 10 * scale }]}>
              <Text style={[styles.label, { fontSize: 13 * scale }]}>
                PLAYERS ({players.length}/{MAX_PLAYERS})
              </Text>

              {players.length === 0 && (
                <Text style={[styles.muted, { fontSize: 15 * scale }]}>Add at least one player to start.</Text>
              )}

              {players.map((p) => (
                <View key={p.id} style={[styles.playerRow, { paddingVertical: 10 * scale, paddingHorizontal: 14 * scale }]}>
                  <View style={[styles.dot, { backgroundColor: p.color, width: 16 * scale, height: 16 * scale }]} />
                  <Text style={[styles.playerName, { fontSize: 18 * scale }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={[styles.playerScore, { fontSize: 16 * scale }]}>{p.score}</Text>
                  <Pressable
                    onPress={() => removePlayer(p.id)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${p.name}`}
                    style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
                  >
                    <Text style={[styles.removeText, { fontSize: 18 * scale }]}>✕</Text>
                  </Pressable>
                </View>
              ))}

              <View style={[styles.inputRow, { gap: 10 * scale }]}>
                <TextInput
                  ref={inputRef}
                  value={name}
                  onChangeText={setName}
                  placeholder={full ? 'Table is full!' : 'Player name'}
                  placeholderTextColor={colors.textMuted}
                  maxLength={20}
                  editable={!full}
                  autoCorrect={false}
                  returnKeyType="done"
                  // Keep the keyboard up so the next name can be typed right away
                  // (react-native-web still reads blurOnSubmit).
                  submitBehavior="submit"
                  blurOnSubmit={false}
                  onSubmitEditing={(e) => addPlayer(e.nativeEvent.text)}
                  style={[styles.input, { fontSize: 18 * scale, padding: 14 * scale }]}
                  accessibilityLabel="New player name"
                />
                <Pressable
                  onPress={() => addPlayer()}
                  disabled={!trimmed || full}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.addButton,
                    { paddingHorizontal: 20 * scale },
                    (!trimmed || full) && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.addText, { fontSize: 17 * scale }]}>＋ Add</Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.card, { padding: 18 * scale, borderRadius: 22 * scale, gap: 10 * scale }]}>
              <Text style={[styles.label, { fontSize: 13 * scale }]}>WORDS & SONGS</Text>
              <View style={[styles.segment, { borderRadius: 14 * scale }]} accessibilityRole="radiogroup">
                {WORD_MODES.map(({ mode, label }) => {
                  const selected = mode === wordMode;
                  return (
                    <Pressable
                      key={mode}
                      onPress={() => onChangeWordMode(mode)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      style={[
                        styles.segmentItem,
                        { paddingVertical: 12 * scale, borderRadius: 11 * scale },
                        selected && styles.segmentSelected,
                      ]}
                    >
                      <Text
                        style={[styles.segmentText, { fontSize: 16 * scale }, selected && styles.segmentTextSelected]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              onPress={onStart}
              disabled={players.length === 0}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.startButton,
                { paddingVertical: 18 * scale, paddingHorizontal: 40 * scale },
                players.length === 0 && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.startText, { fontSize: 22 * scale }]}>Start game 🎶</Text>
            </Pressable>

            {hasScores && (
              <Pressable onPress={resetScores} accessibilityRole="button" hitSlop={8}>
                <Text style={[styles.reset, { fontSize: 15 * scale }]}>Reset all scores to 0</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  column: {
    width: '100%',
    maxWidth: 620,
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontWeight: '900',
  },
  intro: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  rules: {
    flexDirection: 'row',
  },
  rule: {
    fontWeight: '800',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    overflow: 'hidden',
  },
  ruleGood: {
    color: colors.background,
    backgroundColor: colors.success,
  },
  ruleBad: {
    color: colors.background,
    backgroundColor: colors.failure,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
  },
  label: {
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  muted: {
    color: colors.textMuted,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.backgroundAccent,
    borderRadius: 14,
  },
  dot: {
    borderRadius: 999,
  },
  playerName: {
    flex: 1,
    color: colors.text,
    fontWeight: '800',
    textAlign: 'left',
  },
  playerScore: {
    color: colors.card,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  remove: {
    paddingHorizontal: 6,
  },
  removeText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
  },
  addButton: {
    backgroundColor: colors.buttonSecondary,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 48,
  },
  addText: {
    color: colors.text,
    fontWeight: '800',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: 3,
    gap: 3,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.card,
  },
  segmentText: {
    color: colors.textMuted,
    fontWeight: '800',
  },
  segmentTextSelected: {
    color: colors.cardText,
  },
  startButton: {
    backgroundColor: colors.record,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  startText: {
    color: colors.text,
    fontWeight: '900',
  },
  reset: {
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
