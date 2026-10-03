import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GameScreen } from './src/screens/GameScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import type { Player } from './src/types';

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [screen, setScreen] = useState<'setup' | 'game'>('setup');

  return (
    <SafeAreaProvider>
      {screen === 'setup' ? (
        <SetupScreen players={players} onChangePlayers={setPlayers} onStart={() => setScreen('game')} />
      ) : (
        <GameScreen players={players} onChangePlayers={setPlayers} onEditPlayers={() => setScreen('setup')} />
      )}
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
