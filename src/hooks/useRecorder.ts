import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
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

// Shared across screens so a permission granted on "Start game" is remembered.
let lastPermission: MicPermission = 'unknown';

/**
 * Asks for the microphone. On the web this must run inside a tap handler —
 * iOS browsers silently refuse requests that aren't triggered by the user.
 */
export async function requestMicPermission(): Promise<boolean> {
  try {
    const { granted } = await requestRecordingPermissionsAsync();
    lastPermission = granted ? 'granted' : 'denied';
    if (granted) await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    return granted;
  } catch {
    lastPermission = 'denied';
    return false;
  }
}

export function useRecorder() {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const [permission, setPermission] = useState<MicPermission>(lastPermission);

  const requestPermission = useCallback(async () => {
    const granted = await requestMicPermission();
    setPermission(lastPermission);
    return granted;
  }, []);

  // Native apps can ask straight away; on the web we wait for a tap.
  useEffect(() => {
    if (Platform.OS !== 'web' && lastPermission !== 'granted') requestPermission();
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
