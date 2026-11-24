import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/components/ui';
import { StarAR } from './src/components/StarAR';
import { BUILT_IN_GAMES, findGame } from './src/game/games';
import { POINTS, timeBonus, withArrow } from './src/game/scoring';
import { copyCourse, newCourse } from './src/game/template';
import { Game, TagCode } from './src/game/types';
import {
  Run,
  addScore,
  loadCustomCourses,
  loadRun,
  loadSettings,
  runSeconds,
  saveCustomCourse,
  saveRun,
  saveSettings,
} from './src/lib/storage';
import { ChoiceOutcome } from './src/components/minigames/Choice';
import { CheckpointScreen } from './src/screens/CheckpointScreen';
import { CourseEditor } from './src/screens/CourseEditor';
import { CourseWizard } from './src/screens/CourseWizard';
import { Finish } from './src/screens/Finish';
import { Home } from './src/screens/Home';
import { Leaderboard } from './src/screens/Leaderboard';
import { Play } from './src/screens/Play';
import { Rules } from './src/screens/Rules';
import { Setup } from './src/screens/Setup';

type View =
  | { name: 'home' }
  | { name: 'play' }
  | { name: 'checkpoint'; tag: TagCode }
  | { name: 'finish'; seconds: number; points: number; bonus: number }
  | { name: 'leaderboard' }
  | { name: 'setup' }
  | { name: 'demo' }
  | { name: 'edit'; course: Game }
  | { name: 'wizard' }
  | { name: 'rules'; game: Game };

export default function App() {
  const [view, setView] = useState<View>({ name: 'home' });
  const [run, setRunState] = useState<Run | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [courses, setCourses] = useState<Game[]>(BUILT_IN_GAMES);

  const refreshCourses = () => loadCustomCourses().then((custom) => setCourses([...BUILT_IN_GAMES, ...custom]));

  useEffect(() => {
    refreshCourses();
    loadRun().then(setRunState);
    loadSettings().then((s) => setPlayerName(s.playerName));
  }, []);

  const setRun = (next: Run | null) => {
    setRunState(next);
    saveRun(next);
  };

  const game: Game | undefined = run ? findGame(courses, run.gameId) : undefined;

  const startGame = (g: Game) => {
    setRun({ gameId: g.id, startedAt: Date.now(), penaltySeconds: 0, done: [], points: 0, coins: [], arrowLegs: [], hintTags: [] });
    setView({ name: 'play' });
  };

  const checkpointDone = (tag: TagCode, won: boolean, outcome: ChoiceOutcome = {}) => {
    if (!run || !game) return;
    // Finding the cache scores points whether or not the mini-game is won.
    const earned = run.points + withArrow(POINTS.cache, run.arrowLegs.includes(tag)) + (outcome.bonus ?? 0);
    // A yes-or-no stop can wipe out every point (said yes, then left early).
    const lostIt = !!outcome.wipe;
    const next: Run = {
      ...run,
      done: [...run.done, tag],
      points: lostIt ? 0 : earned,
      // Leaving the ice cream shop early isn't a lost challenge, so no time penalty.
      penaltySeconds: run.penaltySeconds + (won || lostIt ? 0 : game.penaltySeconds),
    };
    if (tag === 'boss') {
      setRun(next);
      const seconds = runSeconds(next);
      setView({ name: 'finish', seconds, points: next.points, bonus: timeBonus(game, seconds) });
    } else {
      setRun(next);
      setView({ name: 'play' });
    }
  };

  const saveScore = async (name: string, seconds: number, points: number) => {
    if (game) await addScore({ name, gameId: game.id, seconds, points, date: new Date().toISOString() });
    const settings = await loadSettings();
    await saveSettings({ ...settings, playerName: name });
    setPlayerName(name);
    setRun(null);
    setView({ name: 'leaderboard' });
  };

  const home = () => setView({ name: 'home' });

  let screen;
  if (view.name === 'play' && run && game) {
    screen = <Play game={game} run={run} onRunChange={setRun} onCheckpoint={(tag) => setView({ name: 'checkpoint', tag })} onQuit={home} />;
  } else if (view.name === 'checkpoint' && game) {
    const checkpoint = game.checkpoints.find((c) => c.tag === view.tag)!;
    screen = <CheckpointScreen game={game} checkpoint={checkpoint} onDone={(won, outcome) => checkpointDone(view.tag, won, outcome)} />;
  } else if (view.name === 'finish' && game) {
    screen = (
      <Finish
        game={game}
        seconds={view.seconds}
        points={view.points}
        bonus={view.bonus}
        defaultName={playerName}
        onSave={(name) => saveScore(name, view.seconds, view.points + view.bonus)}
      />
    );
  } else if (view.name === 'rules') {
    screen = <Rules game={view.game} onStart={() => startGame(view.game)} onBack={home} />;
  } else if (view.name === 'leaderboard') {
    screen = <Leaderboard courses={courses} onBack={home} />;
  } else if (view.name === 'setup') {
    screen = <Setup onBack={home} />;
  } else if (view.name === 'demo') {
    screen = <StarAR color={colors.gold} onCaught={home} />;
  } else if (view.name === 'wizard') {
    screen = (
      <CourseWizard
        onCreated={async (course) => {
          await refreshCourses();
          setView({ name: 'edit', course });
        }}
        onOpenSettings={() => setView({ name: 'setup' })}
        onBack={home}
      />
    );
  } else if (view.name === 'edit') {
    screen = (
      <CourseEditor
        key={view.course.id}
        initial={view.course}
        onChanged={refreshCourses}
        onCopy={async (c) => {
          const copy = copyCourse(c);
          await saveCustomCourse(copy);
          await refreshCourses();
          setView({ name: 'edit', course: copy });
        }}
        onBack={home}
      />
    );
  } else {
    screen = (
      <Home
        courses={courses}
        run={run}
        onEdit={(course) => setView({ name: 'edit', course })}
        onWizard={() => setView({ name: 'wizard' })}
        onNewCourse={async () => {
          const course = newCourse();
          await saveCustomCourse(course);
          await refreshCourses();
          setView({ name: 'edit', course });
        }}
        onImported={async (course) => {
          await refreshCourses();
          setView({ name: 'edit', course });
        }}
        onStart={(g) => setView({ name: 'rules', game: g })}
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
