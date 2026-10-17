import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GAMES } from '../game/games';
import { Score, formatTime, loadScores } from '../lib/storage';
import { Body, Button, Card, Screen, Title, colors } from '../components/ui';

export function Leaderboard({ onBack }: { onBack: () => void }) {
  const [scores, setScores] = useState<Score[] | null>(null);

  useEffect(() => {
    loadScores().then(setScores);
  }, []);

  return (
    <Screen>
      <Title>High scores</Title>
      {GAMES.map((game) => {
        const list = (scores ?? []).filter((s) => s.gameId === game.id).slice(0, 10);
        return (
          <Card key={game.id}>
            <Body style={{ fontWeight: '800', color: game.starColor }}>{game.title}</Body>
            {list.length === 0 && <Body style={{ color: colors.muted }}>No scores yet. Be the first!</Body>}
            {list.map((s, i) => (
              <View key={`${s.date}-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Body>
                  {i + 1}. {s.name}
                </Body>
                <Body style={{ color: colors.gold }}>{formatTime(s.seconds)}</Body>
              </View>
            ))}
          </Card>
        );
      })}
      <Button kind="secondary" title="Back" onPress={onBack} />
    </Screen>
  );
}
