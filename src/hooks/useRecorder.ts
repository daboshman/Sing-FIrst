import { useCallback, useEffect, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type RecordingOptions,
} from 'expo-audio';

export type MicPermission = 'unknown' | 'granted' | 'denied';

// Mono is plenty for a voice and keeps uploads small. HIGH_QUALITY records
// .m4a on iOS/Android (LOW_QUALITY uses .3gp on Android, which Whisper rejects).
const RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
};

export function useRecorder() {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const [permission, setPermission] = useState<MicPermission>('unknown');

  const requestPermission = useCallback(async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      setPermission(granted ? 'granted' : 'denied');
      if (granted) {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      }
      return granted;
    } catch {
      setPermission('denied');
      return false;
    }
  }, []);

  // Ask for the microphone as soon as the app loads.
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const startRecording = useCallback(async () => {
    if (permission !== 'granted' && !(await requestPermission())) {
      throw new Error('Microphone permission is required to play.');
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
  }, [permission, recorder, requestPermission]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    await recorder.stop();
    return recorder.uri;
  }, [recorder]);

  return { permission, requestPermission, startRecording, stopRecording };
}
