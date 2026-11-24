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

// A quick, fun "here's the idea" before the clock starts. The points table
// is tucked away for anyone who wants it.
export function Rules({ game, onStart, onBack }: { game: Game; onStart: () => void; onBack: () => void }) {
  const [showPoints, setShowPoints] = useState(false);
  const timed = game.timed !== false;
  const trail = game.trailName ?? 'coins';
  const goodies = game.trailItems?.slice(0, 3).join('') ?? '🪙';

  return (
    <Screen>
      <Title>{game.title}</Title>
      <Body style={{ fontSize: 19 }}>{game.tagline}</Body>

      <Card style={{ gap: 12 }}>
        <Body style={{ fontSize: 19 }}>🔍 Follow the clues to {game.checkpoints.length} hidden tags.</Body>
        <Body style={{ fontSize: 19 }}>📱 Tap your phone on each one.</Body>
        <Body style={{ fontSize: 19 }}>🎮 Win the mini-game.</Body>
        <Body style={{ fontSize: 19 }}>
          {goodies} Grab the {trail} along the way.
        </Body>
        {game.wrongWay && <Body style={{ fontSize: 19 }}>{game.wrongWay.emoji} Wrong way? Watch out!</Body>}
        <Body style={{ fontSize: 19 }}>🏆 {timed ? 'Be quick. Score big.' : 'Take your time and have fun.'}</Body>
      </Card>

      <Button title={timed ? "Ready, set, go!" : "Let's go!"} onPress={onStart} />

      <Pressable onPress={() => setShowPoints(!showPoints)}>
        <Body style={{ color: colors.muted, textAlign: 'center' }}>{showPoints ? 'Hide the points ▴' : 'How do points work? ▾'}</Body>
      </Pressable>
      {showPoints && (
        <Card>
          <Row label="Find a tag" points={`+${POINTS.cache}`} />
          <Row label={`Each of the ${trail}`} points={`+${POINTS.coin}`} />
          <Row label={game.wrongWay ? game.wrongWay.name : 'Wrong way'} points={`${game.wrongWay?.points ?? POINTS.wrongWayCoin}`} />
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
