import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Game, TAG_LABELS, TagCode } from '../game/types';
import { checkNearby } from '../lib/location';
import { cancelScan, nfcStatus, readTagCode } from '../lib/nfc';
import { Run, formatTime, loadSettings, loadSpots, runSeconds } from '../lib/storage';
import { ClueCard } from '../components/ClueCard';
import { Body, Button, Card, Screen, Title, colors } from '../components/ui';

export function Play({
  game,
  run,
  onCheckpoint,
  onQuit,
}: {
  game: Game;
  run: Run;
  onCheckpoint: (tag: TagCode) => void;
  onQuit: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Tags must be found in order. The clue for the next tag comes from the one
  // before it (or the game's start clue).
  const nextIndex = game.checkpoints.findIndex((c) => !run.done.includes(c.tag));
  const next = game.checkpoints[nextIndex];
  const clue = nextIndex === 0 ? game.startClue : game.checkpoints[nextIndex - 1].clue;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => {
      clearInterval(id);
      cancelScan();
    };
  }, []);

  const scan = async () => {
    setMessage(null);
    const status = await nfcStatus();
    if (status === 'unsupported') return setMessage('This phone cannot read NFC tags.');
    if (status === 'off') return setMessage('NFC is turned off. Turn it on in your phone settings, then try again.');

    setScanning(true);
    try {
      const tag = await readTagCode();
      if (!tag) return setMessage("That tag isn't a Neocaching checkpoint. Use Set up tags to write it first.");
      if (run.done.includes(tag)) return setMessage('You already captured that tag. Follow your clue to the next one!');
      if (tag !== next.tag) {
        return setMessage(`That's ${TAG_LABELS[tag]}, but you need ${TAG_LABELS[next.tag]} next. Follow your clue!`);
      }

      const settings = await loadSettings();
      if (!settings.skipGps) {
        setMessage('Checking your location…');
        const spots = await loadSpots();
        const near = await checkNearby(spots[tag]);
        if (!near.ok) {
          return setMessage(`You're about ${Math.round(near.distance)} m from this checkpoint. Move closer and tap again.`);
        }
      }
      setMessage(null);
      onCheckpoint(tag);
    } catch (e) {
      setMessage(e instanceof Error && e.message !== 'Already scanning' ? e.message : 'Scan cancelled. Tap the button to try again.');
    } finally {
      setScanning(false);
    }
  };

  const stop = () => {
    cancelScan();
    setScanning(false);
  };

  return (
    <Screen>
      <Title>{game.title}</Title>
      <Text style={{ color: colors.gold, fontSize: 48, fontWeight: '800', textAlign: 'center' }}>
        {formatTime(runSeconds(run, now))}
      </Text>
      {run.penaltySeconds > 0 && (
        <Body style={{ textAlign: 'center', color: colors.bad }}>Includes +{run.penaltySeconds}s penalty time</Body>
      )}

      <Card>
        {game.checkpoints.map((cp) => {
          const done = run.done.includes(cp.tag);
          return (
            <Body key={cp.tag} style={{ color: done ? colors.good : colors.text }}>
              {done ? '✅' : cp.tag === 'boss' ? '👑' : '⭐'} {cp.title}{' '}
              <Body style={{ color: colors.muted, fontSize: 14 }}>({TAG_LABELS[cp.tag]})</Body>
            </Body>
          );
        })}
      </Card>

      {run.done.length === 0 && (
        <Card>
          <Body>{game.intro}</Body>
        </Card>
      )}
      {clue && next && <ClueCard clue={clue} nextTag={next.tag} />}

      {scanning ? (
        <Card style={{ alignItems: 'center' }}>
          <ActivityIndicator color={colors.gold} size="large" />
          <Body>Hold the back of your phone against a tag…</Body>
          <Button kind="secondary" title="Cancel" onPress={stop} />
        </Card>
      ) : (
        <Button title="Tap a checkpoint tag" onPress={scan} />
      )}
      {message && <Body style={{ color: colors.gold }}>{message}</Body>}

      <View style={{ height: 20 }} />
      <Button kind="secondary" title="Back to menu" onPress={onQuit} />
    </Screen>
  );
}
