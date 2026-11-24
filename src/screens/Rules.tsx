import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { POINTS } from '../game/scoring';
import { Game } from '../game/types';
import { Body, Button, Card, Screen, Title, colors } from '../components/ui';

function Row({ label, points }: { label: string; points: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Body style={{ flex: 1, fontSize: 15 }}>{label}</Body>
      <Body style={{ fontSize: 15, fontWeight: '800', color: points.startsWith('-') || points === 'Half' ? colors.bad : colors.good }}>{points}</Body>
    </View>
  );
}

// A short backstory to set up the game. The surprises along the way (trail
// items, the wrong-way warning) are left for players to discover.
export function Rules({ game, onStart, onBack }: { game: Game; onStart: () => void; onBack: () => void }) {
  const [showPoints, setShowPoints] = useState(false);
  const timed = game.timed !== false;
  const course = /5k/i.test(game.location ?? '') ? 'the 5k course' : 'the course';

  return (
    <Screen>
      <Title>{game.title}</Title>

      <Card style={{ gap: 14 }}>
        <Body style={{ fontSize: 20 }}>{game.intro || game.tagline}</Body>
        <Body style={{ fontSize: 19 }}>🏃 Follow {course}.</Body>
        <Body style={{ fontSize: 19 }}>
          🔍 {timed ? 'Find the tags along the way to earn bonus points, or go for time!' : 'Find the tags along the way to earn bonus points.'}
        </Body>
      </Card>

      <Button title={timed ? 'Ready, set, go!' : "Let's go!"} onPress={onStart} />

      <Pressable onPress={() => setShowPoints(!showPoints)}>
        <Body style={{ color: colors.muted, textAlign: 'center' }}>{showPoints ? 'Hide the points ▴' : 'How do points work? ▾'}</Body>
      </Pressable>
      {showPoints && (
        <Card>
          <Row label="Find a tag" points={`+${POINTS.cache}`} />
          <Row label="Peek at the hiding spot" points={`${POINTS.hint}`} />
          <Row label="Use the arrow" points="Half" />
          {timed && <Row label={`Each second under ${game.parMinutes ?? 15} min`} points="+1" />}
          {timed && game.penaltySeconds > 0 && <Row label="Lose a mini-game" points={`+${game.penaltySeconds}s`} />}
          {game.rules?.map((rule, i) => (
            <Body key={i} style={{ color: colors.muted, fontSize: 14 }}>
              • {rule}
            </Body>
          ))}
        </Card>
      )}

      <Button kind="secondary" title="Back" onPress={onBack} />
    </Screen>
  );
}
