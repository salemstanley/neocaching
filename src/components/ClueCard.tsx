import { useState } from 'react';
import { TagCode } from '../game/types';
import { compassHint } from '../lib/location';
import { loadSpots } from '../lib/storage';
import { Body, Button, Card, colors } from './ui';

// The story clue pointing to the next tag, plus an optional compass hint
// worked out from the next tag's saved spot.
export function ClueCard({ clue, nextTag }: { clue: string; nextTag: TagCode }) {
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const showCompass = async () => {
    setBusy(true);
    try {
      const spots = await loadSpots();
      setHint(await compassHint(spots[nextTag]));
    } catch (e) {
      setHint(e instanceof Error ? e.message : 'Could not get your location.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ borderWidth: 2, borderColor: colors.gold }}>
      <Body style={{ color: colors.gold, fontWeight: '800' }}>🧭 Your clue</Body>
      <Body>{clue}</Body>
      {hint && <Body style={{ color: colors.gold }}>{hint}</Body>}
      <Button kind="secondary" title={busy ? 'Checking…' : 'Use the compass'} onPress={showCompass} disabled={busy} />
    </Card>
  );
}
