// Point values. Turning on the direction arrow halves what coins and caches
// are worth for that stretch of the trail. Mini-games are never affected.
export const POINTS = {
  coin: 10,
  wrongWayCoin: -10,
  cache: 100,
};

// Finishing under this many seconds earns 1 bonus point per second to spare.
export const PAR_SECONDS = 15 * 60;

export function withArrow(points: number, arrowOn: boolean) {
  return arrowOn && points > 0 ? Math.round(points / 2) : points;
}

export function timeBonus(seconds: number) {
  return Math.max(0, Math.floor(PAR_SECONDS - seconds));
}
