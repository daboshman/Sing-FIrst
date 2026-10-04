import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { requestMicPermission } from './src/hooks/useRecorder';
import { I18nProvider } from './src/i18n/I18nContext';
import { loadSettings, saveSettings } from './src/services/settings';
import { GameScreen } from './src/screens/GameScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import type { WordMode } from './src/data/words';
import type { Player } from './src/types';

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [screen, setScreen] = useState<'setup' | 'game'>('setup');
  const [settings, setSettings] = useState(loadSettings);
  const { wordMode, uiLanguage } = settings;

  useEffect(() => saveSettings(settings), [settings]);

  // Ask for the microphone from the "Start game" tap itself — iOS browsers
  // ignore permission requests that don't come straight from a user gesture.
  const startGame = async () => {
    await requestMicPermission();
    setScreen('game');
  };

  return (
    <SafeAreaProvider>
      <I18nProvider lang={uiLanguage}>
        {screen === 'setup' ? (
          <SetupScreen
            players={players}
            onChangePlayers={setPlayers}
            wordMode={wordMode}
            onChangeWordMode={(mode: WordMode) => setSettings((s) => ({ ...s, wordMode: mode }))}
            uiLanguage={uiLanguage}
            onChangeUiLanguage={(lang) => setSettings((s) => ({ ...s, uiLanguage: lang }))}
            onStart={startGame}
          />
        ) : (
          <GameScreen
            players={players}
            onChangePlayers={setPlayers}
            onEditPlayers={() => setScreen('setup')}
            wordMode={wordMode}
          />
        )}
      </I18nProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
