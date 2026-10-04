import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type RecordingOptions,
} from 'expo-audio';

import { warmMic } from './warmMic';

export type MicPermission = 'unknown' | 'granted' | 'denied';

const isWeb = Platform.OS === 'web';

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
 * iOS browsers silently refuse requests that aren't triggered by the user —
 * and it also opens the mic so the first buzz starts instantly.
 */
export async function requestMicPermission(): Promise<boolean> {
  try {
    if (isWeb) {
      await warmMic.warmUp();
      lastPermission = 'granted';
      return true;
    }
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
  // Web uses warmMic; the expo recorder is only used on iOS/Android.
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const [permission, setPermission] = useState<MicPermission>(lastPermission);
  const preparedRef = useRef(false);

  // Native: prepare ahead of time so a buzz only has to call record().
  const prepareNative = useCallback(async () => {
    if (isWeb || preparedRef.current) return;
    try {
      await recorder.prepareToRecordAsync();
      preparedRef.current = true;
    } catch {
      preparedRef.current = false;
    }
  }, [recorder]);

  const requestPermission = useCallback(async () => {
    const granted = await requestMicPermission();
    setPermission(lastPermission);
    if (granted) prepareNative();
    return granted;
  }, [prepareNative]);

  useEffect(() => {
    // Native apps can ask straight away; on the web we wait for a tap.
    if (!isWeb && lastPermission !== 'granted') requestPermission();
    else if (lastPermission === 'granted') prepareNative();
    // Leaving the game screen closes the mic again.
    return () => {
      if (isWeb) warmMic.release();
    };
  }, [requestPermission, prepareNative]);

  const startRecording = useCallback(async () => {
    if (isWeb) {
      try {
        await warmMic.start();
        if (lastPermission !== 'granted') {
          lastPermission = 'granted';
          setPermission('granted');
        }
      } catch {
        lastPermission = 'denied';
        setPermission('denied');
        throw new Error('mic-permission');
      }
      return;
    }
    if (permission !== 'granted' && !(await requestPermission())) throw new Error('mic-permission');
    if (!preparedRef.current) await recorder.prepareToRecordAsync();
    preparedRef.current = false;
    recorder.record();
  }, [permission, recorder, requestPermission]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (isWeb) return warmMic.stop();
    await recorder.stop();
    const uri = recorder.uri;
    prepareNative(); // get the next turn ready in the background
    return uri;
  }, [recorder, prepareNative]);

  return { permission, requestPermission, startRecording, stopRecording };
}
