import { apartmentTurkeyTrot, pioneerGame } from './pioneer';
import { littleValleyGames } from './littleValley';
import { turkeyTrotGames } from './turkeyTrot';
import { Game } from './types';

// Courses that come with the app. Players make more in the course maker.
export const BUILT_IN_GAMES: Game[] = [...littleValleyGames, ...turkeyTrotGames, apartmentTurkeyTrot, pioneerGame];

export function findGame(courses: Game[], id: string): Game | undefined {
  return courses.find((g) => g.id === id);
}
