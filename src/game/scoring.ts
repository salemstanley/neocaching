import { Game } from './types';

// Point values. Turning on the direction arrow halves what coins and caches
// are worth for that stretch of the trail. Mini-games are never affected.
export const POINTS = {
  coin: 10,
  wrongWayCoin: -10,
  cache: 100,
  // Peeking at the photo of where a tag is hidden.
  hint: -25,
};

export function withArrow(points: number, arrowOn: boolean) {
  return arrowOn && points > 0 ? Math.round(points / 2) : points;
}

// Finishing under the course's par time earns 1 bonus point per second to spare.
export function timeBonus(game: Game, seconds: number) {
  if (game.timed === false) return 0;
  return Math.max(0, Math.floor((game.parMinutes ?? 15) * 60 - seconds));
}
