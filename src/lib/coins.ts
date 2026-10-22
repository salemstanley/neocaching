import { SpotLocation, TagCode } from '../game/types';
import { bearingDeg, distanceM, offsetBy } from './location';

// 25 feet between coins.
export const COIN_SPACING_M = 7.62;
// How close you need to walk to a coin to grab it. Phone GPS often wanders
// 3-5 m, so this is a little generous.
export const COIN_RADIUS_M = 7;

export type Coin = SpotLocation & { id: string; good: boolean };

// Coins for the stretch of trail from one tag to the next. Good coins sit
// every 25 feet on the straight line between the two tags. Wrong-way coins sit
// behind the starting tag, pointing away from the next one.
export function coinsForLeg(nextTag: TagCode, from: SpotLocation, to: SpotLocation): Coin[] {
  const total = distanceM(from, to);
  const bearing = bearingDeg(from, to);
  const coins: Coin[] = [];

  // Spread coins evenly, about 25 feet apart, never closer than that to either
  // tag. Short stretches still get one coin halfway.
  const count = Math.max(1, Math.round(total / COIN_SPACING_M) - 1);
  for (let i = 0; i < count; i++) {
    coins.push({ id: `${nextTag}-good-${i}`, good: true, ...offsetBy(from, (total * (i + 1)) / (count + 1), bearing) });
  }
  // Start 2 coins out so standing at the tag doesn't trigger them.
  for (let k = 2; k <= 5; k++) {
    coins.push({ id: `${nextTag}-bad-${k}`, good: false, ...offsetBy(from, k * COIN_SPACING_M, bearing + 180) });
  }
  return coins;
}
