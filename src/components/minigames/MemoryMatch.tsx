import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, colors } from '../ui';

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Flip cards two at a time and find every pair before time runs out.
export function MemoryMatch({
  symbols,
  seconds,
  onDone,
}: {
  symbols: string[];
  seconds: number;
  onDone: (won: boolean) => void;
}) {
  const cards = useMemo(() => shuffle([...symbols, ...symbols]), [symbols]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [left, setLeft] = useState(seconds);
  const finished = useRef(false);

  const finish = (won: boolean) => {
    if (finished.current) return;
    finished.current = true;
    onDone(won);
  };

  useEffect(() => {
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (left <= 0) finish(false);
  }, [left]);

  const flip = (i: number) => {
    if (finished.current || open.length === 2 || open.includes(i) || matched.has(i)) return;
    const nowOpen = [...open, i];
    setOpen(nowOpen);
    if (nowOpen.length === 2) {
      const [a, b] = nowOpen;
      if (cards[a] === cards[b]) {
        const next = new Set(matched).add(a).add(b);
        setMatched(next);
        setOpen([]);
        if (next.size === cards.length) finish(true);
      } else {
        setTimeout(() => setOpen([]), 700);
      }
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Body>Time left: {left}s</Body>
      <View style={styles.grid}>
        {cards.map((symbol, i) => {
          const faceUp = open.includes(i) || matched.has(i);
          return (
            <Pressable key={i} onPress={() => flip(i)} style={[styles.card, faceUp && styles.up]}>
              <Text style={styles.symbol}>{faceUp ? symbol : '?'}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  card: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  up: { backgroundColor: '#3D2A6E' },
  symbol: { fontSize: 34, color: colors.muted },
});
