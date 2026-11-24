import { View } from 'react-native';
import { POINTS } from '../game/scoring';
import { Game } from '../game/types';
import { Body, Button, Card, Screen, Title, colors } from '../components/ui';

function Row({ label, points }: { label: string; points: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Body style={{ flex: 1 }}>{label}</Body>
      <Body style={{ fontWeight: '800', color: points.startsWith('-') || points.startsWith('Half') ? colors.bad : colors.good }}>{points}</Body>
    </View>
  );
}

// How to play and how points work, shown before the clock starts.
export function Rules({ game, onStart, onBack }: { game: Game; onStart: () => void; onBack: () => void }) {
  const timed = game.timed !== false;
  const par = game.parMinutes ?? 15;
  return (
    <Screen>
      <Title>How to play</Title>
      <Body style={{ color: game.starColor, fontSize: 22, fontWeight: '800' }}>{game.title}</Body>
      {game.badge && <Body style={{ color: colors.muted }}>{game.badge}</Body>}

      <Card>
        <Body>1. Read the clue and find the hidden tag. There are {game.checkpoints.length} tags, and you have to find them in order.</Body>
        <Body>2. Tap the back of your phone on the tag. You have to be standing near it.</Body>
        <Body>3. Catch what floats up in the camera, read the story, and play the challenge.</Body>
        <Body>4. Walk the trail to the next tag. Coins float along the way. Tap "Look for coins" to see where they are.</Body>
        <Body>5. Find the last tag and beat the final challenge to finish!</Body>
        {game.rules?.map((rule, i) => (
          <Body key={i}>• {rule}</Body>
        ))}
      </Card>

      <Card>
        <Body style={{ fontWeight: '800', fontSize: 20 }}>Points</Body>
        <Row label="Each tag you find" points={`+${POINTS.cache}`} />
        <Row label="Each coin on the right path" points={`+${POINTS.coin}`} />
        <Row label="Wrong-way coin (you hear a buzz)" points={`${POINTS.wrongWayCoin}`} />
        <Row label="Direction arrow on (coins and tag on that stretch)" points="Half" />
        <Row label='"Show me the hiding spot" photo' points={`${POINTS.hint}`} />
        {timed && <Row label={`Time bonus: each second under ${par} minutes`} points="+1" />}
        {timed && game.penaltySeconds > 0 && <Row label="Losing a challenge adds time" points={`+${game.penaltySeconds}s`} />}
        <Body style={{ color: colors.muted, fontSize: 14 }}>Challenges never cost points, and the arrow doesn't change them.</Body>
      </Card>

      <Button title={timed ? 'Start the clock!' : "Let's go!"} onPress={onStart} />
      <Button kind="secondary" title="Back" onPress={onBack} />
    </Screen>
  );
}
