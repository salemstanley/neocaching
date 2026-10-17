import { pioneerGame } from './pioneer';
import { Game } from './types';

// Every game uses the same 6 tags. Add new themes here.
export const GAMES: Game[] = [pioneerGame];

export function findGame(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}
