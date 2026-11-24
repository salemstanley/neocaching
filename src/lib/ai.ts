import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { Checkpoint, Game, MiniGame, MiniGameKind, TAG_LABELS, tagsForCount } from '../game/types';

// What the course wizard asks for.
export type WizardStop = {
  // Where the tag is hidden, in the planner's words ("under the big slide").
  hidingSpot: string;
  // Optional thing to do here ("eat dinner at the taco place").
  activityIdea: string;
  challenge: MiniGameKind | 'surprise';
};

export type WizardInput = {
  players: string; // names and ages, e.g. "Lily, 9"
  occasion: string; // e.g. "birthday", "date night"
  storyIdea: string;
  extraNotes: string;
  timed: boolean;
  stops: WizardStop[]; // 3 to 10, in tag order; the last is the finale
};

const StopSchema = z.object({
  title: z.string(),
  story: z.string(),
  challengeKind: z.enum(['trivia', 'speedTap', 'memory', 'activity', 'wordSearch', 'merge', 'match3', 'catch']),
  // Used when challengeKind is trivia (1-3 questions), otherwise empty.
  questions: z.array(z.object({ question: z.string(), answers: z.array(z.string()), correctIndex: z.number().int() })),
  // Used when challengeKind is activity, otherwise empty.
  task: z.string(),
  // Used when challengeKind is speedTap, otherwise empty.
  tapButtonLabel: z.string(),
  // memory: 6 different emoji. merge: 6 emoji from smallest to biggest thing.
  // match3: 5 different emoji. catch: 2-3 emoji to catch. Otherwise empty.
  emojis: z.array(z.string()),
  // catch only: 1-2 emoji to avoid. Otherwise empty.
  avoidEmojis: z.array(z.string()),
  // wordSearch only: 5-8 single words, 3-9 letters, no spaces. Otherwise empty.
  words: z.array(z.string()),
  // What floats in the camera when the tag is tapped, e.g. one emoji and "a golden crown".
  prizeEmoji: z.string(),
  prizeName: z.string(),
  winText: z.string(),
  loseText: z.string(),
  // Clue to the NEXT stop's hiding spot. Empty for the last stop.
  clueToNext: z.string(),
});

const CourseSchema = z.object({
  title: z.string(),
  tagline: z.string(),
  intro: z.string(),
  startClue: z.string(),
  ending: z.string(),
  stops: z.array(StopSchema),
});

const SYSTEM = `You write courses for Neocaching, a phone game. Players follow clues to hidden NFC tags, in order. The planner says how many (3 to 10); the last one is the grand finale. At each tag they read a short piece of story, then do a challenge.

Write a course from the planner's details:
- One story that builds across all the stops and pays off at the finale and ending. Match the occasion, the story idea, and the players' names and ages.
- Each clue leads to the NEXT tag's hiding spot. Make it a fun riddle tied to the story that a player of that age can solve, but never so vague that they could get stuck. The start clue leads to the Start tag.
- Challenge kinds: "trivia" (1-3 questions, exactly 4 answers each, correctIndex is 0-3), "speedTap" (tapping fast; give a short button label that fits the story), "memory" (exactly 6 different emoji that fit the story), "activity" (a real-world task done at that spot), "wordSearch" (5-8 words from the story to find in a letter grid), "merge" (a 2048-style game: 6 emoji that grow from smallest to biggest, like seed, sprout, flower, bouquet), "match3" (match-3 like Candy Crush: 5 different emoji pieces), "catch" (tap falling things: 2-3 emoji to catch and 1-2 to avoid). Use the kind the planner chose; for "surprise", pick what fits best and vary the kinds across the course.
- When the planner gives an activity idea for a stop, make that stop an activity built around it.
- Trivia can be about the players, the theme, or general knowledge for their age. Only use facts you are sure of.
- Keep every story beat to 2-4 short sentences. Keep it warm, playful and safe for all ages.
- Each stop has a prize that floats in the camera view when the tag is tapped: one emoji and a short name ("a golden key"). Make the prizes build toward the finale.
- Leave unused fields empty. Write exactly as many stops as the planner lists, in order.`;

function describe(input: WizardInput) {
  const tags = tagsForCount(input.stops.length);
  const stops = input.stops
    .map((s, i) => {
      const lines = [`${TAG_LABELS[tags[i]]}${i === tags.length - 1 ? ' (grand finale)' : ''}:`, `  hidden: ${s.hidingSpot || '(not described)'}`];
      if (s.activityIdea.trim()) lines.push(`  activity idea: ${s.activityIdea}`);
      lines.push(`  challenge: ${s.challenge}`);
      return lines.join('\n');
    })
    .join('\n');
  return [
    `Players (names and ages): ${input.players || 'not given'}`,
    `Occasion: ${input.occasion || 'not given'}`,
    `Story idea: ${input.storyIdea || 'surprise me'}`,
    input.extraNotes.trim() ? `Other notes: ${input.extraNotes}` : '',
    `Timed race: ${input.timed ? 'yes' : 'no, relaxed pace'}`,
    '',
    `Stops (${input.stops.length}):`,
    stops,
  ]
    .filter((l) => l !== '')
    .join('\n');
}

function toMiniGame(stop: z.infer<typeof StopSchema>, isFinale: boolean): MiniGame {
  switch (stop.challengeKind) {
    case 'activity':
      return { kind: 'activity', task: stop.task || 'Celebrate this stop together!' };
    case 'speedTap':
      return { kind: 'speedTap', taps: isFinale ? 50 : 30, seconds: isFinale ? 15 : 10, label: stop.tapButtonLabel || 'Tap!' };
    case 'memory': {
      const symbols = [...new Set(stop.emojis)].slice(0, 8);
      return { kind: 'memory', symbols: symbols.length >= 3 ? symbols : ['⭐', '🎈', '🎁', '🎉', '🍕', '🦄'], seconds: 60 };
    }
    case 'wordSearch': {
      const words = stop.words.map((w) => w.toUpperCase().replace(/[^A-Z]/g, '')).filter((w) => w.length >= 3 && w.length <= 10);
      return words.length >= 3
        ? { kind: 'wordSearch', words: words.slice(0, 8), size: 10, seconds: isFinale ? 180 : 150 }
        : { kind: 'speedTap', taps: 30, seconds: 10, label: stop.tapButtonLabel || 'Tap!' };
    }
    case 'merge': {
      const ladder = [...new Set(stop.emojis)].slice(0, 8);
      return { kind: 'merge', ladder: ladder.length >= 4 ? ladder : ['🌱', '🌿', '🌷', '💐', '🌳', '🏡'], goal: isFinale ? 5 : 4, seconds: 150 };
    }
    case 'match3': {
      const pieces = [...new Set(stop.emojis)].slice(0, 5);
      return { kind: 'match3', pieces: pieces.length >= 4 ? pieces : ['🍎', '🍊', '🍋', '🍇', '🫐'], target: isFinale ? 50 : 40, moves: 20 };
    }
    case 'catch': {
      const good = [...new Set(stop.emojis)].slice(0, 3);
      return { kind: 'catch', good: good.length ? good : ['⭐'], bad: stop.avoidEmojis.slice(0, 2), target: isFinale ? 20 : 15, seconds: 30, speed: 1 };
    }
    default: {
      const questions = stop.questions
        .filter((q) => q.question && q.answers.length >= 2)
        .map((q) => ({
          question: q.question,
          answers: q.answers.slice(0, 4),
          correctIndex: Math.min(Math.max(0, q.correctIndex), Math.min(4, q.answers.length) - 1),
        }));
      return questions.length
        ? { kind: 'trivia', questions }
        : { kind: 'activity', task: stop.task || 'Give each other a high five!' };
    }
  }
}

// Asks Claude to write a whole course. Costs a few cents of API credit.
export async function writeCourse(apiKey: string, input: WizardInput): Promise<Game> {
  const client = new Anthropic({ apiKey });
  const response = await client.beta.messages.parse({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM,
    messages: [{ role: 'user', content: describe(input) }],
    output_config: { format: betaZodOutputFormat(CourseSchema) },
  });

  if (response.stop_reason === 'refusal') throw new Error("Claude couldn't write this course. Try changing the story idea.");
  const course = response.parsed_output;
  if (!course || course.stops.length === 0) throw new Error('The course came back incomplete. Please try again.');

  const tags = tagsForCount(input.stops.length);
  const checkpoints: Checkpoint[] = tags.map((tag, i) => {
    const isFinale = i === tags.length - 1;
    // The finale is always the last stop Claude wrote.
    const stop = isFinale ? course.stops[course.stops.length - 1] : course.stops[Math.min(i, course.stops.length - 1)];
    return {
      tag,
      title: stop.title,
      story: stop.story,
      miniGame: toMiniGame(stop, isFinale),
      winText: stop.winText,
      loseText: stop.loseText,
      clue: isFinale ? undefined : stop.clueToNext,
      prize: stop.prizeEmoji.trim() ? { emoji: stop.prizeEmoji.trim(), name: stop.prizeName || 'a prize' } : undefined,
    };
  });

  return {
    id: `custom-${Date.now()}`,
    custom: true,
    title: course.title,
    tagline: course.tagline,
    intro: course.intro,
    startClue: course.startClue,
    ending: course.ending,
    penaltySeconds: 30,
    timed: input.timed,
    parMinutes: 30,
    starColor: '#F5B841',
    checkpoints,
  };
}

// Friendly messages for the errors a beginner is likely to hit.
export function explainError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return 'That API key was not accepted. Check it under Write tags and settings.';
  if (e instanceof Anthropic.PermissionDeniedError) return 'That API key is not allowed to do this. Check your Anthropic account.';
  if (e instanceof Anthropic.RateLimitError) return 'Too many requests right now. Wait a minute and try again.';
  if (e instanceof Anthropic.BadRequestError && /credit/i.test(e.message)) return 'Your Anthropic account is out of credit. Add some at console.anthropic.com.';
  if (e instanceof Anthropic.APIConnectionError) return 'No internet connection. Try again when you have signal.';
  if (e instanceof Anthropic.APIError) return `Something went wrong (${e.status}). Please try again.`;
  return e instanceof Error ? e.message : 'Something went wrong. Please try again.';
}
