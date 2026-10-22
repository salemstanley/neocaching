import { SpotLocation, TagCode } from '../game/types';
import { bearingDeg, distanceM, offsetBy } from './location';

// 25 feet between coins.
export const COIN_SPACING_M = 7.62;
// How close you need to walk to a coin to grab it.
export const COIN_RADIUS_M = 5;

export type Coin = SpotLocation & { id: string; good: boolean };

// Coins for the stretch of trail from one tag to the next. Good coins sit
// every 25 feet on the straight line between the two tags. Wrong-way coins sit
// behind the starting tag, pointing away from the next one.
export function coinsForLeg(nextTag: TagCode, from: SpotLocation, to: SpotLocation): Coin[] {
  const total = distanceM(from, to);
  const bearing = bearingDeg(from, to);
  const coins: Coin[] = [];

  for (let d = COIN_SPACING_M, i = 0; d < total - COIN_SPACING_M; d += COIN_SPACING_M, i++) {
    coins.push({ id: `${nextTag}-good-${i}`, good: true, ...offsetBy(from, d, bearing) });
  }
  // Start 2 coins out so standing at the tag doesn't trigger them.
  for (let k = 2; k <= 5; k++) {
    coins.push({ id: `${nextTag}-bad-${k}`, good: false, ...offsetBy(from, k * COIN_SPACING_M, bearing + 180) });
  }
  return coins;
}
