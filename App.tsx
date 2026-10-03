import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { requestMicPermission } from './src/hooks/useRecorder';
import { GameScreen } from './src/screens/GameScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import type { Player } from './src/types';

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [screen, setScreen] = useState<'setup' | 'game'>('setup');

  // Ask for the microphone from the "Start game" tap itself — iOS browsers
  // ignore permission requests that don't come straight from a user gesture.
  const startGame = async () => {
    await requestMicPermission();
    setScreen('game');
  };

  return (
    <SafeAreaProvider>
      {screen === 'setup' ? (
        <SetupScreen players={players} onChangePlayers={setPlayers} onStart={startGame} />
      ) : (
        <GameScreen players={players} onChangePlayers={setPlayers} onEditPlayers={() => setScreen('setup')} />
      )}
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
