import { Game } from './types';

// The ending the player earned: the path they picked most often, or 'tie'
// when it's even. Courses without endings use their one ending.
export function endingFor(game: Game, choices: string[]): string {
  if (!game.endings) return game.ending;
  const counts = new Map<string, number>();
  for (const c of choices) counts.set(c, (counts.get(c) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const key = !sorted.length ? 'tie' : sorted.length > 1 && sorted[0][1] === sorted[1][1] ? 'tie' : sorted[0][0];
  return game.endings[key] ?? game.endings.tie ?? game.ending;
}
