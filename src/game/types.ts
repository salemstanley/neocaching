// The code written onto each physical NFC tag. The same tags are shared by
// every game; each game decides what happens at each one. A course uses 3 to
// 10 tags: Start, then numbered tags, and always ends on the boss tag.
export type TagCode = 'cp1' | 'cp2' | 'cp3' | 'cp4' | 'cp5' | 'cp6' | 'cp7' | 'cp8' | 'cp9' | 'boss';

export const TAG_CODES: TagCode[] = ['cp1', 'cp2', 'cp3', 'cp4', 'cp5', 'cp6', 'cp7', 'cp8', 'cp9', 'boss'];

export const MIN_TAGS = 3;
export const MAX_TAGS = 10;

// The tag codes a course with this many tags uses, in order.
export function tagsForCount(count: number): TagCode[] {
  const n = Math.max(MIN_TAGS, Math.min(MAX_TAGS, Math.round(count)));
  return [...TAG_CODES.slice(0, n - 1), 'boss'];
}

// Text stored on the tag, e.g. "neocaching:cp1".
export const TAG_PREFIX = 'neocaching:';

export type TriviaQuestion = {
  question: string;
  answers: string[];
  correctIndex: number;
};

export type MiniGame =
  | { kind: 'trivia'; questions: TriviaQuestion[] }
  | { kind: 'speedTap'; taps: number; seconds: number; label: string }
  | { kind: 'memory'; symbols: string[]; seconds: number }
  // A real-world task (eat dinner, take a selfie, dance). Always counts as a win.
  | { kind: 'activity'; task: string }
  // Find every word hidden in a grid of letters. Words run across or down,
  // and with diagonal on, also diagonally.
  | { kind: 'wordSearch'; words: string[]; size: number; diagonal?: boolean; seconds: number }
  // 2048 style: swipe to slide tiles, matching tiles merge into the next item.
  // ladder lists the items from smallest to biggest; reach goal (an index into
  // ladder) to win.
  | { kind: 'merge'; ladder: string[]; goal: number; seconds: number }
  // Candy Crush style: swap neighbors to line up 3 or more of a kind.
  | { kind: 'match3'; pieces: string[]; target: number; moves: number }
  // Things fall from the top; tap the good ones, skip the bad ones.
  | { kind: 'catch'; good: string[]; bad: string[]; target: number; seconds: number; speed: number };

export type MiniGameKind = MiniGame['kind'];

export type Checkpoint = {
  tag: TagCode;
  title: string;
  // Story shown after the tag is tapped and the star is caught.
  story: string;
  // Shown after the mini-game, win or lose.
  winText: string;
  loseText: string;
  // Shown after the mini-game: points the player toward the next tag and moves
  // the story along. The final boss has none.
  clue?: string;
  miniGame: MiniGame;
  // What floats in the camera view at this stop instead of the star, e.g. a
  // bowl of green bean casserole.
  prize?: Prize;
};

export type Prize = { emoji: string; name: string };

export type Game = {
  id: string;
  title: string;
  tagline: string;
  intro: string;
  // Leads the player to the first tag.
  startClue: string;
  ending: string;
  // Seconds added to the clock when a mini-game is lost.
  penaltySeconds: number;
  // Untimed courses (like a date night) show no clock and give no time bonus.
  timed?: boolean;
  // Finishing under this earns a time bonus. Defaults to 15.
  parMinutes?: number;
  // Made in the app's course maker rather than built in.
  custom?: boolean;
  checkpoints: Checkpoint[]; // 3 to 10 stops, ending with boss, in the order players must find them
  starColor: string;
  // Courses that share the same hidden tags (like the age versions of one
  // course) use one id here so the spots are set up only once.
  spotsId?: string;
  // Extra rules shown on the How to play screen.
  rules?: string[];
  // Shown under the title on the home screen, e.g. "Ages 10 and under".
  badge?: string;
  // Where players set off from, if that isn't a tag (like home). The first
  // stretch of coins starts here.
  startSpot?: SpotLocation;
  // Street corners on the way to each tag, so coins follow the streets
  // instead of a straight line.
  bends?: Partial<Record<TagCode, SpotLocation[]>>;
};

// Where each tag is stuck in the real world. Each course has its own set.
export type SpotLocation = { latitude: number; longitude: number };

// The name written on each physical tag sticker, shown in the app so players
// know which tag is which.
// Tags 6 to 9 came later, so a 10-tag course goes Start, 1-4, 6-9, then 5 (the boss).
export const TAG_LABELS: Record<TagCode, string> = {
  cp1: 'Tag "Start"',
  cp2: 'Tag 1',
  cp3: 'Tag 2',
  cp4: 'Tag 3',
  cp5: 'Tag 4',
  cp6: 'Tag 6',
  cp7: 'Tag 7',
  cp8: 'Tag 8',
  cp9: 'Tag 9',
  boss: 'Tag 5 (final boss)',
};
