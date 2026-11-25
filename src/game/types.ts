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
  | { kind: 'catch'; good: string[]; bad: string[]; target: number; seconds: number; speed: number }
  // A yes-or-no choice (like stopping for ice cream). Both answers get a
  // cheer. Yes earns bonus points, but only if the player stays nearby for
  // stayMinutes; leaving early wipes out every point they have.
  | { kind: 'choice'; question: string; yesLabel: string; noLabel: string; yesText: string; noText: string; stayMinutes: number; bonus: number };

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
  scene?: Scene;
};

export type Prize = { emoji: string; name: string };

// A short story scene with the course's recurring character, shown when a
// stop opens. Some scenes ask the player to pick what to do; each pick has a
// path (like 'kind' or 'bold') that changes later scenes and the ending.
export type StoryChoice = { label: string; reply: string; path: string };
export type Scene = {
  text: string;
  // An extra line that depends on the player's last pick, by path.
  ifPath?: Record<string, string>;
  choices?: StoryChoice[];
};

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
  // Where the course is played, e.g. "Stanley - Painted Hills 5k". Players pick
  // a location first, then a theme (one of the courses at that location).
  location?: string;
  theme?: string;
  // Where players set off from, if that isn't a tag (like home). The first
  // stretch of coins starts here.
  startSpot?: SpotLocation;
  // Street corners on the way to each tag, so coins follow the streets
  // instead of a straight line.
  bends?: Partial<Record<TagCode, SpotLocation[]>>;
  // Where the tags are hidden, built into the course. Spots saved on the
  // phone (in Set up) take priority.
  presetSpots?: Partial<Record<TagCode, SpotLocation>>;
  // How close you need to walk to a coin, in meters. Defaults to 7. Bigger is
  // kinder when coins run in a straight line across curvy streets.
  coinRadiusM?: number;
  // What floats along the right path instead of coins (emoji, used in turn),
  // and what to call them, e.g. "table settings".
  trailItems?: string[];
  trailName?: string;
  // What happens on a wrong-way coin instead of the buzz, e.g. a turkey attack.
  wrongWay?: { emoji: string; name: string; points: number; sound: 'buzz' | 'turkey' };
  // The recurring story character who shows up at each stop.
  character?: { emoji: string; name: string };
  // Endings by the path the player picked most often ('tie' when even).
  // Falls back to ending.
  endings?: Record<string, string>;
};

// Where each tag is stuck in the real world. Each course has its own set.
export type SpotLocation = { latitude: number; longitude: number };

// The name written on each physical tag sticker, shown in the app so players
// know which tag is which.
// The boss tag is always the Finish. (On the original apartment stickers it's
// the one marked 5.)
export const TAG_LABELS: Record<TagCode, string> = {
  cp1: 'Tag "Start"',
  cp2: 'Tag 1',
  cp3: 'Tag 2',
  cp4: 'Tag 3',
  cp5: 'Tag 4',
  cp6: 'Tag 5',
  cp7: 'Tag 6',
  cp8: 'Tag 7',
  cp9: 'Tag 8',
  boss: 'Tag "Finish" (final boss)',
};
