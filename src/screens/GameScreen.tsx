import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiKeyModal } from '../components/ApiKeyModal';
import { FeedbackPanel, type FeedbackKind } from '../components/FeedbackPanel';
import { Header } from '../components/Header';
import { RecordButton } from '../components/RecordButton';
import { TranscriptBox } from '../components/TranscriptBox';
import { WordCard } from '../components/WordCard';
import { pickRandomWord } from '../data/words';
import { useRecorder } from '../hooks/useRecorder';
import { clearApiKey, loadApiKey, saveApiKey } from '../services/apiKey';
import { transcribeAudio } from '../services/transcribe';
import { colors, useScale } from '../theme';
import { transcriptContainsWord } from '../utils/matchWord';

const MAX_RECORDING_MS = 10_000; // auto-stop so clips stay short (and cheap)
const MIN_RECORDING_MS = 700;
const NEXT_WORD_DELAY_MS = 1800;

export function GameScreen() {
  const { scale } = useScale();
  const { permission, requestPermission, startRecording, stopRecording } = useRecorder();

  // Core game state
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState(() => pickRandomWord());
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackKind, setFeedbackKind] = useState<FeedbackKind>('none');

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const recordingRef = useRef(false);
  const startedAtRef = useRef(0);
  const autoStopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextWordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadApiKey().then((key) => {
      setApiKey(key);
      if (!key) setSettingsOpen(true);
    });
    return () => {
      if (autoStopTimer.current) clearTimeout(autoStopTimer.current);
      if (nextWordTimer.current) clearTimeout(nextWordTimer.current);
    };
  }, []);

  const showFeedback = (kind: FeedbackKind, message: string) => {
    setFeedbackKind(kind);
    setFeedbackMessage(message);
  };

  const resetRound = useCallback(() => {
    setTranscribedText('');
    setFeedbackKind('none');
    setFeedbackMessage('');
  }, []);

  const nextWord = useCallback(() => {
    if (nextWordTimer.current) clearTimeout(nextWordTimer.current);
    nextWordTimer.current = null;
    setCurrentWord((prev) => pickRandomWord(prev));
    resetRound();
  }, [resetRound]);

  const handleStop = async () => {
    if (!recordingRef.current) return; // already stopped (tap + auto-stop race)
    recordingRef.current = false;
    if (autoStopTimer.current) clearTimeout(autoStopTimer.current);
    setIsRecording(false);

    let uri: string | null = null;
    try {
      uri = await stopRecording();
    } catch {
      showFeedback('error', 'Recording failed. Try again!');
      return;
    }

    if (!uri || Date.now() - startedAtRef.current < MIN_RECORDING_MS) {
      showFeedback('failure', 'That was too short — sing a bit more!');
      return;
    }
    if (!apiKey) {
      setSettingsOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      const text = await transcribeAudio(uri, apiKey);
      setTranscribedText(text || '(silence)');

      if (transcriptContainsWord(text, currentWord)) {
        setScore((s) => s + 1);
        showFeedback('success', 'Correct! +1 Point 🎉');
        nextWordTimer.current = setTimeout(nextWord, NEXT_WORD_DELAY_MS);
      } else {
        showFeedback('failure', "Oops, I didn't hear the word!");
      }
    } catch (e) {
      showFeedback('error', e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Keep the auto-stop timer pointed at the latest handleStop.
  const stopRef = useRef(handleStop);
  stopRef.current = handleStop;

  const handleStart = async () => {
    if (!apiKey) {
      showFeedback('error', 'Add your OpenAI API key to start playing.');
      setSettingsOpen(true);
      return;
    }
    resetRound();
    try {
      await startRecording();
    } catch (e) {
      showFeedback('error', e instanceof Error ? e.message : 'Could not start the microphone.');
      return;
    }
    recordingRef.current = true;
    startedAtRef.current = Date.now();
    setIsRecording(true);
    autoStopTimer.current = setTimeout(() => stopRef.current(), MAX_RECORDING_MS);
  };

  const handleSaveKey = async (key: string) => {
    await saveApiKey(key);
    setApiKey(key);
    setSettingsOpen(false);
    if (feedbackKind === 'error') resetRound();
  };

  const handleClearKey = async () => {
    await clearApiKey();
    setApiKey(await loadApiKey());
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.column, { gap: 22 * scale, paddingHorizontal: 16 * scale }]}>
          <Header score={score} onOpenSettings={() => setSettingsOpen(true)} />

          {permission === 'denied' && (
            <Text style={[styles.warning, { fontSize: 15 * scale }]} onPress={requestPermission}>
              🎙️ Microphone access is blocked. Allow it in your settings, then tap here.
            </Text>
          )}

          <WordCard word={currentWord} />

          <RecordButton
            isRecording={isRecording}
            isProcessing={isProcessing}
            disabled={feedbackKind === 'success'}
            onPress={isRecording ? handleStop : handleStart}
          />

          <TranscriptBox text={transcribedText} />

          <FeedbackPanel
            kind={feedbackKind}
            message={feedbackMessage}
            onTryAgain={resetRound}
            onSkip={nextWord}
          />
        </View>
      </ScrollView>

      <ApiKeyModal
        visible={settingsOpen}
        currentKey={apiKey}
        onSave={handleSaveKey}
        onClear={handleClearKey}
        onClose={() => setSettingsOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  column: {
    width: '100%',
    maxWidth: 680,
    alignItems: 'center',
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
