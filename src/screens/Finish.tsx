import { useState } from 'react';
import { TextInput } from 'react-native';
import { Game } from '../game/types';
import { formatTime } from '../lib/storage';
import { Body, Button, Card, Screen, Title, colors } from '../components/ui';

export function Finish({
  game,
  seconds,
  points,
  bonus,
  defaultName,
  onSave,
}: {
  game: Game;
  seconds: number;
  points: number;
  bonus: number;
  defaultName: string;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(defaultName);
  return (
    <Screen>
      <Title>You did it!</Title>
      <Card>
        <Body>{game.ending}</Body>
      </Card>
      <Body style={{ fontSize: 22, textAlign: 'center' }}>Your score</Body>
      <Body style={{ fontSize: 52, fontWeight: '800', textAlign: 'center', color: colors.gold }}>
        {points + bonus} pts
      </Body>
      <Card>
        <Body>Coins and caches: {points} pts</Body>
        {game.timed !== false && (
          <Body>
            Time bonus: {bonus} pts (finished in {formatTime(seconds)})
          </Body>
        )}
      </Card>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Your name for the high score list"
        placeholderTextColor={colors.muted}
        maxLength={20}
        style={{ backgroundColor: colors.card, color: colors.text, fontSize: 18, borderRadius: 12, padding: 14 }}
      />
      <Button title="Save my score" onPress={() => onSave(name.trim() || 'Explorer')} />
    </Screen>
  );
}
