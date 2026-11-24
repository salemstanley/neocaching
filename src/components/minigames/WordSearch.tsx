import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, colors } from '../ui';
import { shuffle, useCountdown } from './shared';

type Cell = [number, number];
type Placed = { word: string; cells: Cell[] };

const LETTERS = 'ABCDEFGHIJKLMNOPRSTUVWY';

// Hides the words in a size x size grid and fills the rest with random letters.
export function build(words: string[], size: number, diagonal: boolean) {
  const dirs: Cell[] = diagonal ? [[0, 1], [1, 0], [1, 1], [-1, 1]] : [[0, 1], [1, 0]];
  for (let attempt = 0; attempt < 50; attempt++) {
    const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
    const placed: Placed[] = [];
    let ok = true;
    for (const word of [...words].sort((a, b) => b.length - a.length)) {
      let done = false;
      for (let tries = 0; tries < 200 && !done; tries++) {
        const [dr, dc] = dirs[Math.floor(Math.random() * dirs.length)];
        const r0 = Math.floor(Math.random() * size);
        const c0 = Math.floor(Math.random() * size);
        const cells: Cell[] = [];
        for (let i = 0; i < word.length; i++) cells.push([r0 + dr * i, c0 + dc * i]);
        const fits = cells.every(([r, c], i) => r >= 0 && c >= 0 && r < size && c < size && (grid[r][c] === '' || grid[r][c] === word[i]));
        if (!fits) continue;
        cells.forEach(([r, c], i) => (grid[r][c] = word[i]));
        placed.push({ word, cells });
        done = true;
      }
      if (!done) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    for (const row of grid) for (let c = 0; c < size; c++) if (!row[c]) row[c] = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    return { grid, placed };
  }
  return null;
}

const key = ([r, c]: Cell) => `${r},${c}`;

// Find every hidden word. Tap the first letter of a word, then its last letter.
export function WordSearch({
  words,
  size,
  diagonal = false,
  seconds,
  onDone,
}: {
  words: string[];
  size: number;
  diagonal?: boolean;
  seconds: number;
  onDone: (won: boolean) => void;
}) {
  const clean = useMemo(
    () => [...new Set(words.map((w) => w.toUpperCase().replace(/[^A-Z]/g, '')).filter((w) => w.length >= 2 && w.length <= size))].slice(0, 10),
    [words, size],
  );
  const puzzle = useMemo(() => build(shuffle(clean), size, diagonal), [clean, size, diagonal]);
  const [found, setFound] = useState<string[]>([]);
  const [first, setFirst] = useState<Cell | null>(null);
  const [miss, setMiss] = useState(false);
  const { left, finish, finished } = useCountdown(seconds, onDone);

  if (!puzzle || clean.length === 0) {
    return <Body>This word search could not be made. Ask the course maker to use shorter words.</Body>;
  }

  const cellSize = Math.floor((Math.min(Dimensions.get('window').width, 500) - 48) / size);
  const foundCells = new Set(puzzle.placed.filter((p) => found.includes(p.word)).flatMap((p) => p.cells.map(key)));

  const tap = (cell: Cell) => {
    if (finished.current) return;
    if (!first) {
      setFirst(cell);
      setMiss(false);
      return;
    }
    const a = key(first);
    const b = key(cell);
    const hit = puzzle.placed.find(
      (p) => !found.includes(p.word) && ((key(p.cells[0]) === a && key(p.cells[p.cells.length - 1]) === b) || (key(p.cells[0]) === b && key(p.cells[p.cells.length - 1]) === a)),
    );
    setFirst(null);
    if (!hit) {
      setMiss(a !== b);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const next = [...found, hit.word];
    setFound(next);
    if (next.length === puzzle.placed.length) finish(true);
  };

  return (
    <View style={{ gap: 12 }}>
      <Body>
        Time left: {left}s · Found {found.length} of {puzzle.placed.length}
      </Body>
      <Body style={{ color: colors.muted, fontSize: 14 }}>
        Tap the first letter of a word, then its last letter.{diagonal ? ' Words can run across, down or diagonally.' : ' Words run across or down.'}
      </Body>
      <View style={{ alignSelf: 'center' }}>
        {puzzle.grid.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row' }}>
            {row.map((letter, c) => {
              const k = key([r, c]);
              const isFirst = first && key(first) === k;
              return (
                <Pressable
                  key={c}
                  onPress={() => tap([r, c])}
                  style={[
                    styles.cell,
                    { width: cellSize, height: cellSize },
                    foundCells.has(k) && { backgroundColor: colors.good },
                    isFirst && { backgroundColor: colors.gold },
                  ]}
                >
                  <Text style={[styles.letter, { fontSize: cellSize * 0.55 }, (foundCells.has(k) || isFirst) && { color: colors.bg }]}>{letter}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      {miss && <Body style={{ color: colors.bad }}>Not a word. Try again!</Body>}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {puzzle.placed.map((p) => (
          <Text key={p.word} style={[styles.word, found.includes(p.word) && styles.done]}>
            {p.word}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: colors.card, margin: 1 },
  letter: { color: colors.text, fontWeight: '800' },
  word: { color: colors.text, fontSize: 16, fontWeight: '700' },
  done: { color: colors.good, textDecorationLine: 'line-through' },
});
