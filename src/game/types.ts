// The code written onto each physical NFC tag. The same 6 tags are shared by
// every game; each game decides what happens at each one.
export type TagCode = 'cp1' | 'cp2' | 'cp3' | 'cp4' | 'cp5' | 'boss';

export const TAG_CODES: TagCode[] = ['cp1', 'cp2', 'cp3', 'cp4', 'cp5', 'boss'];

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
  | { kind: 'memory'; symbols: string[]; seconds: number };

export type Checkpoint = {
  tag: TagCode;
  title: string;
  // Story shown after the tag is tapped and the star is caught.
  story: string;
  // Shown after the mini-game, win or lose.
  winText: string;
  loseText: string;
  miniGame: MiniGame;
};

export type Game = {
  id: string;
  title: string;
  tagline: string;
  intro: string;
  ending: string;
  // Seconds added to the clock when a mini-game is lost.
  penaltySeconds: number;
  checkpoints: Checkpoint[]; // cp1..cp5 then boss, in that order
  starColor: string;
};

// Where each tag is stuck in the real world. One set per location (loop).
export type SpotLocation = { latitude: number; longitude: number };
