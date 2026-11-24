import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Button, colors } from '../ui';
import { useCountdown } from './shared';

const HEIGHT = 420;
const ITEM = 64;

type Faller = { id: number; x: number; y: number; symbol: string; good: boolean; speed: number };

// Things fall from the top. Tap the good ones before they hit the bottom.
// Tapping a bad one costs a point. speed: 1 is gentle, 2 is fast.
export function Catch({
  good,
  bad,
  target,
  seconds,
  speed,
  onDone,
}: {
  good: string[];
  bad: string[];
  target: number;
  seconds: number;
  speed: number;
  onDone: (won: boolean) => void;
}) {
  const [started, setStarted] = useState(false);
  const [items, setItems] = useState<Faller[]>([]);
  const [caught, setCaught] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const { left, finish, finished } = useCountdown(seconds, onDone, started);
  const nextId = useRef(0);
  const width = Math.min(Dimensions.get('window').width, 500) - 40;

  useEffect(() => {
    if (!started) return;
    let tick = 0;
    const id = setInterval(() => {
      tick++;
      setItems((list) => {
        const moved = list.map((f) => ({ ...f, y: f.y + f.speed })).filter((f) => f.y < HEIGHT);
        // A new item about every half second (faster on harder levels).
        if (tick % Math.max(6, Math.round(14 / speed)) === 0) {
          const isBad = bad.length > 0 && Math.random() < 0.3;
          const pool = isBad ? bad : good;
          moved.push({
            id: nextId.current++,
            x: Math.random() * (width - ITEM),
            y: -ITEM,
            symbol: pool[Math.floor(Math.random() * pool.length)],
            good: !isBad,
            speed: (3 + Math.random() * 2) * speed,
          });
        }
        return moved;
      });
    }, 40);
    return () => clearInterval(id);
  }, [started]);

  const tap = (f: Faller) => {
    if (finished.current) return;
    setItems((list) => list.filter((x) => x.id !== f.id));
    if (f.good) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const next = caught + 1;
      setCaught(next);
      if (next >= target) finish(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setCaught((c) => Math.max(0, c - 1));
      setFlash(`Oops! Not the ${f.symbol}`);
      setTimeout(() => setFlash(null), 900);
    }
  };

  if (!started) {
    return (
      <View style={{ gap: 12 }}>
        <Body>
          Catch {target} of these in {seconds} seconds: {good.join(' ')}
        </Body>
        {bad.length > 0 && <Body>Don't tap these: {bad.join(' ')}</Body>}
        <Button title="Ready? Go!" onPress={() => setStarted(true)} />
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <Body>
        Time left: {left}s · Caught {caught} of {target}
      </Body>
      <View style={[styles.sky, { width, height: HEIGHT }]}>
        {items.map((f) => (
          <Pressable key={f.id} onPressIn={() => tap(f)} hitSlop={10} style={[styles.item, { left: f.x, top: f.y }]}>
            <Text style={{ fontSize: 44 }}>{f.symbol}</Text>
          </Pressable>
        ))}
        {flash && <Text style={styles.flash}>{flash}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sky: { alignSelf: 'center', backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' },
  item: { position: 'absolute', width: ITEM, height: ITEM, alignItems: 'center', justifyContent: 'center' },
  flash: { position: 'absolute', bottom: 16, alignSelf: 'center', color: colors.bad, fontSize: 20, fontWeight: '800' },
});
