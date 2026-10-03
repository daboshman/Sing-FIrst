import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'singfirst.openaiApiKey';

// The .env key is only honoured in development builds. Anything read from
// EXPO_PUBLIC_* is inlined into the JS bundle, so production builds never use
// it — players enter their own key, which stays on their device.
const DEV_ENV_KEY = __DEV__ ? process.env.EXPO_PUBLIC_OPENAI_API_KEY : undefined;

export async function loadApiKey(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // Storage can be unavailable (e.g. private browsing) — fall through.
  }
  return DEV_ENV_KEY?.trim() || null;
}

export async function saveApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, key.trim());
}

export async function clearApiKey(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
