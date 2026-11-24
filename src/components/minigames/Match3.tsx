import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, colors } from '../ui';

const N = 7;
type Grid = number[]; // piece index per cell, row by row

const rand = (kinds: number) => Math.floor(Math.random() * kinds);

// Every cell that is part of a line of 3 or more of the same piece.
export function findMatches(g: Grid): Set<number> {
  const hits = new Set<number>();
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = g[r * N + c];
      if (c <= N - 3 && g[r * N + c + 1] === v && g[r * N + c + 2] === v) {
        let k = c;
        while (k < N && g[r * N + k] === v) hits.add(r * N + k++);
      }
      if (r <= N - 3 && g[(r + 1) * N + c] === v && g[(r + 2) * N + c] === v) {
        let k = r;
        while (k < N && g[k * N + c] === v) hits.add(k++ * N + c);
      }
    }
  }
  return hits;
}

// Removes matched pieces, drops the rest down, and fills from the top.
export function collapse(g: Grid, hits: Set<number>, kinds: number): Grid {
  const next = [...g];
  for (let c = 0; c < N; c++) {
    const keep: number[] = [];
    for (let r = N - 1; r >= 0; r--) if (!hits.has(r * N + c)) keep.push(next[r * N + c]);
    for (let r = N - 1, i = 0; r >= 0; r--, i++) next[r * N + c] = i < keep.length ? keep[i] : rand(kinds);
  }
  return next;
}

export function hasMove(g: Grid): boolean {
  for (let i = 0; i < N * N; i++) {
    for (const j of [i + 1, i + N]) {
      if (j >= N * N || (j === i + 1 && j % N === 0)) continue;
      const s = [...g];
      [s[i], s[j]] = [s[j], s[i]];
      if (findMatches(s).size) return true;
    }
  }
  return false;
}

// A board with no lines already made, but at least one move to make.
export function freshGrid(kinds: number): Grid {
  for (;;) {
    const g: Grid = [];
    for (let i = 0; i < N * N; i++) {
      const c = i % N;
      const banned = new Set<number>();
      if (c >= 2 && g[i - 1] === g[i - 2]) banned.add(g[i - 1]);
      if (i >= 2 * N && g[i - N] === g[i - 2 * N]) banned.add(g[i - N]);
      const options = Array.from({ length: kinds }, (_, k) => k).filter((k) => !banned.has(k));
      g.push(options[rand(options.length)]);
    }
    if (hasMove(g)) return g;
  }
}

// Candy Crush style. Tap a piece, then tap a neighbor to swap them. Line up 3
// or more of the same to clear them. Clear enough pieces before your moves run out.
export function Match3({
  pieces,
  target,
  moves,
  onDone,
}: {
  pieces: string[];
  target: number;
  moves: number;
  onDone: (won: boolean) => void;
}) {
  const kinds = Math.max(3, Math.min(pieces.length, 6));
  // (Fewer kinds of pieces make an easier board.)
  const start = useMemo(() => freshGrid(kinds), [kinds]);
  const [grid, setGrid] = useState<Grid>(start);
  const [picked, setPicked] = useState<number | null>(null);
  const [cleared, setCleared] = useState(0);
  const [movesLeft, setMovesLeft] = useState(moves);
  const [over, setOver] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const size = Math.floor((Math.min(Dimensions.get('window').width, 480) - 50) / N);

  const tap = (i: number) => {
    if (over) return;
    if (picked === null) return setPicked(i);
    if (picked === i) return setPicked(null);
    const a = picked;
    const neighbors = Math.abs(a - i) === N || (Math.abs(a - i) === 1 && Math.floor(a / N) === Math.floor(i / N));
    if (!neighbors) return setPicked(i);
    setPicked(null);

    let g = [...grid];
    [g[a], g[i]] = [g[i], g[a]];
    let hits = findMatches(g);
    if (!hits.size) {
      setNote('No match there. Try another swap.');
      return;
    }
    setNote(null);
    let total = 0;
    let combo = 0;
    while (hits.size) {
      total += hits.size;
      combo++;
      g = collapse(g, hits, kinds);
      hits = findMatches(g);
    }
    if (!hasMove(g)) g = freshGrid(kinds);
    Haptics.impactAsync(combo > 1 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const nowCleared = cleared + total;
    const nowMoves = movesLeft - 1;
    setGrid(g);
    setCleared(nowCleared);
    setMovesLeft(nowMoves);
    if (combo > 1) setNote(`Combo x${combo}!`);
    if (nowCleared >= target) {
      setOver(true);
      setTimeout(() => onDone(true), 500);
    } else if (nowMoves <= 0) {
      setOver(true);
      setTimeout(() => onDone(false), 500);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Body>
        Cleared {Math.min(cleared, target)} of {target} · {movesLeft} moves left
      </Body>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${Math.min(100, (cleared / target) * 100)}%` }]} />
      </View>
      <Body style={{ color: colors.muted, fontSize: 14 }}>Tap a piece, then a piece next to it, to swap. Line up 3 or more!</Body>
      <View style={[styles.board, { width: size * N + 8 }]}>
        {grid.map((v, i) => (
          <Pressable key={i} onPress={() => tap(i)} style={[styles.cell, { width: size, height: size }, picked === i && styles.picked]}>
            <Text style={{ fontSize: size * 0.62 }}>{pieces[v]}</Text>
          </Pressable>
        ))}
      </View>
      {note && <Body style={{ color: colors.gold, textAlign: 'center' }}>{note}</Body>}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { width: '100%', height: 14, borderRadius: 7, backgroundColor: colors.card, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.good },
  board: { alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', padding: 4, borderRadius: 12, backgroundColor: colors.card },
  cell: { alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  picked: { backgroundColor: colors.gold },
});
