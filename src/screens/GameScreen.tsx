import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Header } from '../components/Header';
import { PlayerBuzzer, type BuzzerState } from '../components/PlayerBuzzer';
import { TurnPanel, type Phase, type ResultKind } from '../components/TurnPanel';
import { WordCard } from '../components/WordCard';
import { pickRandomWord } from '../data/words';
import { useRecorder } from '../hooks/useRecorder';
import { transcribeAudio } from '../services/transcribe';
import { colors, useScale } from '../theme';
import type { Player } from '../types';
import { transcriptContainsWord } from '../utils/matchWord';

const MAX_SINGING_MS = 30_000;
const MIN_RECORDING_MS = 700;
const NEXT_WORD_DELAY_MS = 2500;

type Props = {
  players: Player[];
  onChangePlayers: (update: (players: Player[]) => Player[]) => void;
  onEditPlayers: () => void;
};

export function GameScreen({ players, onChangePlayers, onEditPlayers }: Props) {
  const { scale: baseScale, width, height } = useScale();
  // Vertical space is precious here — the buzzers must fit without scrolling.
  const scale = Math.max(0.85, Math.min(baseScale, height / 600));
  const { permission, requestPermission, startRecording, stopRecording } = useRecorder();

  const [currentWord, setCurrentWord] = useState(() => pickRandomWord());
  const [phase, setPhase] = useState<Phase>('idle');
  const [singerId, setSingerId] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [resultKind, setResultKind] = useState<ResultKind | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [waitingForNextWord, setWaitingForNextWord] = useState(false);

  // Refs guard against races: two players buzzing in the same frame, or a tap
  // on "Done" landing at the same moment as the 30s auto-stop.
  const lockedRef = useRef(false);
  const recordingRef = useRef(false);
  const singerRef = useRef<string | null>(null);
  const startedAtRef = useRef(0);
  const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextWordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoStopTimer.current) clearTimeout(autoStopTimer.current);
      if (nextWordTimer.current) clearTimeout(nextWordTimer.current);
    };
  }, []);

  // Tick the countdown while someone is singing.
  useEffect(() => {
    if (phase !== 'singing') return;
    setElapsedMs(0);
    const id = setInterval(() => setElapsedMs(Date.now() - startedAtRef.current), 200);
    return () => clearInterval(id);
  }, [phase]);

  const showResult = (kind: ResultKind, message: string) => {
    setResultKind(kind);
    setFeedbackMessage(message);
    setPhase('result');
  };

  const nextWord = useCallback(() => {
    if (nextWordTimer.current) clearTimeout(nextWordTimer.current);
    nextWordTimer.current = null;
    setCurrentWord((prev) => pickRandomWord(prev));
    setTranscribedText('');
    setResultKind(null);
    setFeedbackMessage('');
    setSingerId(null);
    setPhase('idle');
    setWaitingForNextWord(false);
    lockedRef.current = false;
  }, []);

  const finishTurn = async () => {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    if (autoStopTimer.current) clearTimeout(autoStopTimer.current);

    const playerId = singerRef.current;
    const player = players.find((p) => p.id === playerId);
    const duration = Date.now() - startedAtRef.current;
    setPhase('processing');

    let uri: string | null = null;
    try {
      uri = await stopRecording();
    } catch {
      // Ignore — handled as a missing recording below.
    }
    if (!uri || !playerId) {
      lockedRef.current = false;
      showResult('error', 'The recording failed — no points lost. Buzz again!');
      return;
    }

    let text = '';
    if (duration >= MIN_RECORDING_MS) {
      try {
        text = await transcribeAudio(uri);
      } catch (e) {
        lockedRef.current = false;
        const reason = e instanceof Error ? e.message : 'Something went wrong.';
        showResult('error', `${reason} No points lost.`);
        return;
      }
    }

    setTranscribedText(text);
    const hit = transcriptContainsWord(text, currentWord);
    onChangePlayers((ps) => ps.map((p) => (p.id === playerId ? { ...p, score: p.score + (hit ? 1 : -1) } : p)));

    const name = player?.name ?? 'Player';
    if (hit) {
      showResult('success', `🎉 ${name} got it! +1`);
      setWaitingForNextWord(true);
      // Stay locked until the new word appears.
      nextWordTimer.current = setTimeout(nextWord, NEXT_WORD_DELAY_MS);
    } else {
      showResult(
        'failure',
        text
          ? `😬 No “${currentWord}” there — ${name} loses a point. Anyone else?`
          : `😬 I didn't hear any singing — ${name} loses a point.`,
      );
      lockedRef.current = false; // same word, everyone can buzz again
    }
  };

  // Keep the auto-stop timer pointed at the latest finishTurn.
  const finishRef = useRef(finishTurn);
  finishRef.current = finishTurn;

  const buzz = async (playerId: string) => {
    if (lockedRef.current) return;
    lockedRef.current = true;

    singerRef.current = playerId;
    setSingerId(playerId);
    setTranscribedText('');
    setResultKind(null);
    setFeedbackMessage('');

    try {
      await startRecording();
    } catch (e) {
      lockedRef.current = false;
      setSingerId(null);
      showResult('error', e instanceof Error ? e.message : 'Could not start the microphone.');
      return;
    }

    recordingRef.current = true;
    startedAtRef.current = Date.now();
    setPhase('singing');
    autoStopTimer.current = setTimeout(() => finishRef.current(), MAX_SINGING_MS);
  };

  const buzzerState = (id: string): BuzzerState => {
    if (phase === 'singing') return id === singerId ? 'singing' : 'locked';
    if (phase === 'processing' || waitingForNextWord) return 'locked';
    return 'ready';
  };

  const singer = players.find((p) => p.id === singerId);
  const busy = phase === 'singing' || phase === 'processing';
  const grid = layoutGrid(players.length, width > height);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, { padding: 14 * scale, gap: 12 * scale }]}>
        <View style={[styles.top, { gap: 12 * scale }]}>
          <Header scale={scale} playersDisabled={busy} onEditPlayers={onEditPlayers} />

          {permission === 'denied' && (
            <Text style={[styles.warning, { fontSize: 15 * scale }]} onPress={requestPermission}>
              🎙️ Microphone access is blocked. Allow it in your settings, then tap here.
            </Text>
          )}

          <WordCard word={currentWord} scale={scale} />

          <TurnPanel
            phase={phase}
            singer={singer}
            remainingMs={Math.max(0, MAX_SINGING_MS - elapsedMs)}
            transcript={transcribedText}
            resultKind={resultKind}
            message={feedbackMessage}
            canSkip={!waitingForNextWord}
            scale={scale}
            onDone={() => finishRef.current()}
            onSkip={nextWord}
          />
        </View>

        <View style={[styles.grid, { gap: 12 * scale }]}>
          {grid.map((row, r) => (
            <View key={r} style={[styles.gridRow, { gap: 12 * scale }]}>
              {row.map((index) => {
                const player = players[index];
                return (
                  <PlayerBuzzer
                    key={player.id}
                    player={player}
                    state={buzzerState(player.id)}
                    progress={player.id === singerId ? elapsedMs / MAX_SINGING_MS : 0}
                    scale={scale}
                    onBuzz={() => buzz(player.id)}
                    onDone={() => finishRef.current()}
                  />
                );
              })}
              {/* Keep tiles in a short last row the same size as the rest. */}
              {Array.from({ length: grid[0].length - row.length }, (_, i) => (
                <View key={`spacer-${i}`} style={styles.spacer} />
              ))}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

/** Splits player indexes into rows that fill the screen nicely. */
function layoutGrid(count: number, landscape: boolean): number[][] {
  if (count === 0) return [[]];
  let columns: number;
  if (landscape) columns = count <= 4 ? count : Math.ceil(count / 2);
  else columns = count === 1 ? 1 : 2;

  const rows: number[][] = [];
  for (let i = 0; i < count; i += columns) {
    rows.push(Array.from({ length: Math.min(columns, count - i) }, (_, j) => i + j));
  }
  return rows;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  top: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    alignItems: 'center',
  },
  grid: {
    flex: 1,
    minHeight: 120,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  spacer: {
    flex: 1,
  },
  warning: {
    width: '100%',
    color: colors.text,
    backgroundColor: 'rgba(255,79,154,0.25)',
    borderRadius: 12,
    padding: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});
