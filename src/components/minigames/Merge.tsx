import * as Haptics from 'expo-haptics';
import { useMemo, useRef, useState } from 'react';
import { Dimensions, PanResponder, StyleSheet, Text, View } from 'react-native';
import { Body, Button, colors } from '../ui';
import { useCountdown } from './shared';

const N = 4;
type Board = (number | null)[]; // each tile is a step on the ladder, 0 = smallest

function addTile(board: Board): Board {
  const empty = board.flatMap((v, i) => (v === null ? [i] : []));
  if (!empty.length) return board;
  const next = [...board];
  next[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.85 ? 0 : 1;
  return next;
}

// Slides one row toward its start, merging matching neighbors once.
function slideLine(line: (number | null)[]): (number | null)[] {
  const tiles = line.filter((v): v is number => v !== null);
  const out: number[] = [];
  for (let i = 0; i < tiles.length; i++) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      out.push(tiles[i] + 1);
      i++;
    } else out.push(tiles[i]);
  }
  return [...out, ...Array(N - out.length).fill(null)];
}

type Dir = 'left' | 'right' | 'up' | 'down';

export function move(board: Board, dir: Dir): Board {
  const next = [...board];
  for (let k = 0; k < N; k++) {
    const idx = Array.from({ length: N }, (_, i) => {
      if (dir === 'left') return k * N + i;
      if (dir === 'right') return k * N + (N - 1 - i);
      if (dir === 'up') return i * N + k;
      return (N - 1 - i) * N + k;
    });
    const slid = slideLine(idx.map((i) => board[i]));
    idx.forEach((i, j) => (next[i] = slid[j]));
  }
  return next;
}

const same = (a: Board, b: Board) => a.every((v, i) => v === b[i]);
export const canMove = (b: Board) => (['left', 'right', 'up', 'down'] as Dir[]).some((d) => !same(b, move(b, d)));

const TILE_COLORS = ['#3D2A6E', '#4B3586', '#5E3F9E', '#7A4AA8', '#A0509E', '#C4598A', '#E06B6B', '#F08A4B', '#F5B841', '#5CD38A'];

// 2048 style. Swipe to slide every tile. Two matching tiles merge into the
// next item on the ladder. Make the goal item before time runs out.
export function Merge({
  ladder,
  goal,
  seconds,
  onDone,
}: {
  ladder: string[];
  goal: number;
  seconds: number;
  onDone: (won: boolean) => void;
}) {
  const target = Math.min(Math.max(1, goal), ladder.length - 1);
  const start = useMemo(() => addTile(addTile(Array(N * N).fill(null))), []);
  const [board, setBoard] = useState<Board>(start);
  const { left, finish, finished } = useCountdown(seconds, onDone);
  const boardRef = useRef(board);
  boardRef.current = board;

  const swipe = (dir: Dir) => {
    if (finished.current) return;
    const b = boardRef.current;
    const moved = move(b, dir);
    if (same(b, moved)) return;
    const next = addTile(moved);
    setBoard(next);
    if (next.some((v) => v !== null && v >= target)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => finish(true), 400);
    } else if (!canMove(next)) finish(false);
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };
  const swipeRef = useRef(swipe);
  swipeRef.current = swipe;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Keep the page from scrolling while swiping on the board.
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, g) => {
          if (Math.max(Math.abs(g.dx), Math.abs(g.dy)) < 20) return;
          if (Math.abs(g.dx) > Math.abs(g.dy)) swipeRef.current(g.dx > 0 ? 'right' : 'left');
          else swipeRef.current(g.dy > 0 ? 'down' : 'up');
        },
      }),
    [],
  );

  const size = Math.floor((Math.min(Dimensions.get('window').width, 460) - 60) / N);
  const best = Math.max(...board.map((v) => v ?? 0));

  return (
    <View style={{ gap: 12 }}>
      <Body>Time left: {left}s</Body>
      <Body style={{ color: colors.muted, fontSize: 14 }}>
        Swipe on the board. Matching items merge into the next one. Make {ladder[target]} to win!
      </Body>
      <Text style={styles.ladder}>
        {ladder.slice(0, target + 1).map((item, i) => (
          <Text key={i} style={{ opacity: i <= best ? 1 : 0.35 }}>
            {item}
            {i < target ? ' → ' : ''}
          </Text>
        ))}
      </Text>
      <View {...pan.panHandlers} style={[styles.board, { width: size * N + 10, height: size * N + 10 }]}>
        {board.map((v, i) => (
          <View
            key={i}
            style={[styles.tile, { width: size - 6, height: size - 6, backgroundColor: v === null ? '#24173F' : TILE_COLORS[Math.min(v, TILE_COLORS.length - 1)] }]}
          >
            {v !== null && <Text style={{ fontSize: size * 0.5 }}>{ladder[Math.min(v, ladder.length - 1)]}</Text>}
          </View>
        ))}
      </View>
      {/* Buttons for anyone who finds swiping hard. */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(['left', 'up', 'down', 'right'] as Dir[]).map((d) => (
          <View key={d} style={{ flex: 1 }}>
            <Button kind="secondary" title={{ left: '⬅️', up: '⬆️', down: '⬇️', right: '➡️' }[d]} onPress={() => swipe(d)} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ladder: { color: colors.text, fontSize: 22, textAlign: 'center' },
  board: { alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', padding: 5, borderRadius: 12, backgroundColor: colors.card },
  tile: { margin: 3, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
