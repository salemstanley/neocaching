import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/components/ui';
import { StarAR } from './src/components/StarAR';
import { findGame } from './src/game/games';
import { Game, TagCode } from './src/game/types';
import { Run, addScore, loadRun, loadSettings, runSeconds, saveRun, saveSettings } from './src/lib/storage';
import { CheckpointScreen } from './src/screens/CheckpointScreen';
import { Finish } from './src/screens/Finish';
import { Home } from './src/screens/Home';
import { Leaderboard } from './src/screens/Leaderboard';
import { Play } from './src/screens/Play';
import { Setup } from './src/screens/Setup';

type View =
  | { name: 'home' }
  | { name: 'play' }
  | { name: 'checkpoint'; tag: TagCode }
  | { name: 'finish'; seconds: number }
  | { name: 'leaderboard' }
  | { name: 'setup' }
  | { name: 'demo' };

export default function App() {
  const [view, setView] = useState<View>({ name: 'home' });
  const [run, setRunState] = useState<Run | null>(null);
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    loadRun().then(setRunState);
    loadSettings().then((s) => setPlayerName(s.playerName));
  }, []);

  const setRun = (next: Run | null) => {
    setRunState(next);
    saveRun(next);
  };

  const game: Game | undefined = run ? findGame(run.gameId) : undefined;

  const startGame = (g: Game) => {
    setRun({ gameId: g.id, startedAt: Date.now(), penaltySeconds: 0, done: [] });
    setView({ name: 'play' });
  };

  const checkpointDone = (tag: TagCode, won: boolean) => {
    if (!run || !game) return;
    const next: Run = {
      ...run,
      done: [...run.done, tag],
      penaltySeconds: run.penaltySeconds + (won ? 0 : game.penaltySeconds),
    };
    if (tag === 'boss') {
      setRun(next);
      setView({ name: 'finish', seconds: runSeconds(next) });
    } else {
      setRun(next);
      setView({ name: 'play' });
    }
  };

  const saveScore = async (name: string, seconds: number) => {
    if (game) await addScore({ name, gameId: game.id, seconds, date: new Date().toISOString() });
    const settings = await loadSettings();
    await saveSettings({ ...settings, playerName: name });
    setPlayerName(name);
    setRun(null);
    setView({ name: 'leaderboard' });
  };

  const home = () => setView({ name: 'home' });

  let screen;
  if (view.name === 'play' && run && game) {
    screen = <Play game={game} run={run} onCheckpoint={(tag) => setView({ name: 'checkpoint', tag })} onQuit={home} />;
  } else if (view.name === 'checkpoint' && game) {
    const checkpoint = game.checkpoints.find((c) => c.tag === view.tag)!;
    screen = <CheckpointScreen game={game} checkpoint={checkpoint} onDone={(won) => checkpointDone(view.tag, won)} />;
  } else if (view.name === 'finish' && game) {
    screen = (
      <Finish
        game={game}
        seconds={view.seconds}
        defaultName={playerName}
        onSave={(name) => saveScore(name, view.seconds)}
      />
    );
  } else if (view.name === 'leaderboard') {
    screen = <Leaderboard onBack={home} />;
  } else if (view.name === 'setup') {
    screen = <Setup onBack={home} />;
  } else if (view.name === 'demo') {
    screen = <StarAR color={colors.gold} onCaught={home} />;
  } else {
    screen = (
      <Home
        run={run}
        onStart={startGame}
        onResume={() => setView({ name: 'play' })}
        onLeaderboard={() => setView({ name: 'leaderboard' })}
        onSetup={() => setView({ name: 'setup' })}
        onDemo={() => setView({ name: 'demo' })}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {screen}
    </SafeAreaProvider>
  );
}
