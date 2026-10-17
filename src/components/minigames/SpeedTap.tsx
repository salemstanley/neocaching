import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Button, colors } from '../ui';

// Tap the big button enough times before the clock runs out.
export function SpeedTap({
  taps,
  seconds,
  label,
  onDone,
}: {
  taps: number;
  seconds: number;
  label: string;
  onDone: (won: boolean) => void;
}) {
  const [started, setStarted] = useState(false);
  const [count, setCount] = useState(0);
  const [left, setLeft] = useState(seconds);
  const finished = useRef(false);

  const finish = (won: boolean) => {
    if (finished.current) return;
    finished.current = true;
    onDone(won);
  };

  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 0.1)), 100);
    return () => clearInterval(id);
  }, [started]);

  useEffect(() => {
    if (started && left <= 0) finish(false);
  }, [left, started]);

  const tap = () => {
    if (finished.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const next = count + 1;
    setCount(next);
    if (next >= taps) finish(true);
  };

  if (!started) {
    return (
      <View style={{ gap: 12 }}>
        <Body>
          Tap {taps} times in {seconds} seconds.
        </Body>
        <Button title="Ready? Go!" onPress={() => setStarted(true)} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16, alignItems: 'center' }}>
      <Text style={styles.timer}>{left.toFixed(1)}s</Text>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${Math.min(100, (count / taps) * 100)}%` }]} />
      </View>
      <Body>
        {count} / {taps}
      </Body>
      <Pressable onPressIn={tap} style={({ pressed }) => [styles.big, pressed && { transform: [{ scale: 0.94 }] }]}>
        <Text style={styles.bigText}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  timer: { color: colors.gold, fontSize: 44, fontWeight: '800' },
  bar: { width: '100%', height: 16, borderRadius: 8, backgroundColor: colors.card, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.good },
  big: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  bigText: { color: colors.bg, fontSize: 22, fontWeight: '800', textAlign: 'center' },
});
