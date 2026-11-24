import { useState } from 'react';
import { Checkpoint, Game } from '../game/types';
import { Activity } from '../components/minigames/Activity';
import { Catch } from '../components/minigames/Catch';
import { Choice, ChoiceOutcome } from '../components/minigames/Choice';
import { Match3 } from '../components/minigames/Match3';
import { Merge } from '../components/minigames/Merge';
import { WordSearch } from '../components/minigames/WordSearch';
import { MemoryMatch } from '../components/minigames/MemoryMatch';
import { SpeedTap } from '../components/minigames/SpeedTap';
import { Trivia } from '../components/minigames/Trivia';
import { ClueCard } from '../components/ClueCard';
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
  onDone: (won: boolean, outcome?: ChoiceOutcome) => void;
}) {
  const [phase, setPhase] = useState<Phase>('star');
  const [won, setWon] = useState(false);
  const [outcome, setOutcome] = useState<ChoiceOutcome>({});

  if (phase === 'star') {
    return <StarAR color={game.starColor} prize={checkpoint.prize} onCaught={() => setPhase('story')} />;
  }

  const finishGame = (didWin: boolean, result: ChoiceOutcome = {}) => {
    setWon(didWin);
    setOutcome(result);
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
          <Button title={mg.kind === 'activity' ? 'See your mission' : 'Start the challenge'} onPress={() => setPhase('game')} />
        </>
      )}
      {phase === 'game' && mg.kind === 'trivia' && <Trivia questions={mg.questions} onDone={finishGame} />}
      {phase === 'game' && mg.kind === 'speedTap' && (
        <SpeedTap taps={mg.taps} seconds={mg.seconds} label={mg.label} onDone={finishGame} />
      )}
      {phase === 'game' && mg.kind === 'memory' && (
        <MemoryMatch symbols={mg.symbols} seconds={mg.seconds} onDone={finishGame} />
      )}
      {phase === 'game' && mg.kind === 'activity' && <Activity task={mg.task} onDone={finishGame} />}
      {phase === 'game' && mg.kind === 'wordSearch' && (
        <WordSearch words={mg.words} size={mg.size} diagonal={mg.diagonal} seconds={mg.seconds} onDone={finishGame} />
      )}
      {phase === 'game' && mg.kind === 'merge' && <Merge ladder={mg.ladder} goal={mg.goal} seconds={mg.seconds} onDone={finishGame} />}
      {phase === 'game' && mg.kind === 'match3' && <Match3 pieces={mg.pieces} target={mg.target} moves={mg.moves} onDone={finishGame} />}
      {phase === 'game' && mg.kind === 'choice' && (
        <Choice
          question={mg.question}
          yesLabel={mg.yesLabel}
          noLabel={mg.noLabel}
          yesText={mg.yesText}
          noText={mg.noText}
          stayMinutes={mg.stayMinutes}
          bonus={mg.bonus}
          onDone={finishGame}
        />
      )}
      {phase === 'game' && mg.kind === 'catch' && (
        <Catch good={mg.good} bad={mg.bad} target={mg.target} seconds={mg.seconds} speed={mg.speed} onDone={finishGame} />
      )}
      {phase === 'result' && (
        <>
          {checkpoint.prize && (
            <Card style={{ alignItems: 'center' }}>
              <Body style={{ fontSize: 64, lineHeight: 76 }}>{checkpoint.prize.emoji}</Body>
              <Body style={{ textAlign: 'center' }}>You collected {checkpoint.prize.name}!</Body>
            </Card>
          )}
          <Card>
            <Body style={{ fontSize: 22, fontWeight: '800', color: won ? colors.good : colors.bad }}>
              {outcome.wipe ? 'Busted!' : won ? 'Challenge complete!' : game.timed === false || !game.penaltySeconds ? 'Not quite!' : `Not quite. +${game.penaltySeconds}s penalty`}
            </Body>
            <Body>{won ? checkpoint.winText : checkpoint.loseText}</Body>
          </Card>
          {checkpoint.clue && <ClueCard clue={checkpoint.clue} />}
          <Button title="Continue" onPress={() => onDone(won, outcome)} />
        </>
      )}
    </Screen>
  );
}
