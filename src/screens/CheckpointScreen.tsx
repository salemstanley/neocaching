import { useState } from 'react';
import { Checkpoint, Game } from '../game/types';
import { MemoryMatch } from '../components/minigames/MemoryMatch';
import { SpeedTap } from '../components/minigames/SpeedTap';
import { Trivia } from '../components/minigames/Trivia';
import { StarAR } from '../components/StarAR';
import { Body, Button, Card, Screen, Title, colors } from '../components/ui';

type Phase = 'star' | 'story' | 'game' | 'result';

// Catch the star → read the story → play the mini-game → see how it went.
export function CheckpointScreen({
  game,
  checkpoint,
  onDone,
}: {
  game: Game;
  checkpoint: Checkpoint;
  onDone: (won: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>('star');
  const [won, setWon] = useState(false);

  if (phase === 'star') {
    return <StarAR color={game.starColor} onCaught={() => setPhase('story')} />;
  }

  const finishGame = (didWin: boolean) => {
    setWon(didWin);
    setPhase('result');
  };

  const mg = checkpoint.miniGame;
  return (
    <Screen>
      <Title>{checkpoint.title}</Title>
      {phase === 'story' && (
        <>
          <Card>
            <Body>{checkpoint.story}</Body>
          </Card>
          <Button title="Start the challenge" onPress={() => setPhase('game')} />
        </>
      )}
      {phase === 'game' && mg.kind === 'trivia' && <Trivia questions={mg.questions} onDone={finishGame} />}
      {phase === 'game' && mg.kind === 'speedTap' && (
        <SpeedTap taps={mg.taps} seconds={mg.seconds} label={mg.label} onDone={finishGame} />
      )}
      {phase === 'game' && mg.kind === 'memory' && (
        <MemoryMatch symbols={mg.symbols} seconds={mg.seconds} onDone={finishGame} />
      )}
      {phase === 'result' && (
        <>
          <Card>
            <Body style={{ fontSize: 22, fontWeight: '800', color: won ? colors.good : colors.bad }}>
              {won ? 'Challenge complete!' : `Not quite. +${game.penaltySeconds}s penalty`}
            </Body>
            <Body>{won ? checkpoint.winText : checkpoint.loseText}</Body>
          </Card>
          <Button title="Continue" onPress={() => onDone(won)} />
        </>
      )}
    </Screen>
  );
}
