import { Text } from 'react-native';
import { GAMES } from '../game/games';
import { Game } from '../game/types';
import { Run } from '../lib/storage';
import { Body, Button, Card, Screen, Title, colors } from '../components/ui';

export function Home({
  run,
  onStart,
  onResume,
  onLeaderboard,
  onSetup,
  onDemo,
}: {
  run: Run | null;
  onStart: (game: Game) => void;
  onResume: () => void;
  onLeaderboard: () => void;
  onSetup: () => void;
  onDemo: () => void;
}) {
  return (
    <Screen>
      <Title>Neocaching</Title>
      <Body style={{ color: colors.muted }}>
        Find the 5 checkpoint tags, tap your phone on each one, then face the final boss. The clock is ticking!
      </Body>

      {run && <Button title="Continue your game" onPress={onResume} />}

      {GAMES.map((game) => (
        <Card key={game.id}>
          <Text style={{ color: game.starColor, fontSize: 22, fontWeight: '800' }}>{game.title}</Text>
          <Body>{game.tagline}</Body>
          <Button title={run ? 'Start over' : 'Start game'} onPress={() => onStart(game)} />
        </Card>
      ))}

      <Button kind="secondary" title="High scores" onPress={onLeaderboard} />
      <Button kind="secondary" title="Show me the star" onPress={onDemo} />
      <Button kind="secondary" title="Set up tags and spots" onPress={onSetup} />
    </Screen>
  );
}
