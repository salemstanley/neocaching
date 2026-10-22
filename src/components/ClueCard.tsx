import { Body, Card, colors } from './ui';

// The story clue pointing to the next tag.
export function ClueCard({ clue }: { clue: string }) {
  return (
    <Card style={{ borderWidth: 2, borderColor: colors.gold }}>
      <Body style={{ color: colors.gold, fontWeight: '800' }}>🧭 Your clue</Body>
      <Body>{clue}</Body>
    </Card>
  );
}
