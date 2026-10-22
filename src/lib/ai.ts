import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { Checkpoint, Game, MiniGame, MiniGameKind, TAG_CODES, TAG_LABELS } from '../game/types';

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
  stops: WizardStop[]; // 6, in tag order
};

const StopSchema = z.object({
  title: z.string(),
  story: z.string(),
  challengeKind: z.enum(['trivia', 'speedTap', 'memory', 'activity']),
  // Used when challengeKind is trivia (1-3 questions), otherwise empty.
  questions: z.array(z.object({ question: z.string(), answers: z.array(z.string()), correctIndex: z.number().int() })),
  // Used when challengeKind is activity, otherwise empty.
  task: z.string(),
  // Used when challengeKind is speedTap, otherwise empty.
  tapButtonLabel: z.string(),
  // Used when challengeKind is memory (6 emoji), otherwise empty.
  emojis: z.array(z.string()),
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

const SYSTEM = `You write courses for Neocaching, a phone game. Players follow clues to 6 hidden NFC tags, in order: Start, Tag 1, Tag 2, Tag 3, Tag 4, then Tag 5 (the grand finale). At each tag they read a short piece of story, then do a challenge.

Write a course from the planner's details:
- One story that builds across all 6 stops and pays off at the finale and ending. Match the occasion, the story idea, and the players' names and ages.
- Each clue leads to the NEXT tag's hiding spot. Make it a fun riddle tied to the story that a player of that age can solve, but never so vague that they could get stuck. The start clue leads to the Start tag.
- Challenge kinds: "trivia" (1-3 questions, exactly 4 answers each, correctIndex is 0-3), "speedTap" (tapping fast; give a short button label that fits the story), "memory" (exactly 6 different emoji that fit the story), "activity" (a real-world task done at that spot). Use the kind the planner chose; for "surprise", pick what fits best and vary the kinds across the course.
- When the planner gives an activity idea for a stop, make that stop an activity built around it.
- Trivia can be about the players, the theme, or general knowledge for their age. Only use facts you are sure of.
- Keep every story beat to 2-4 short sentences. Keep it warm, playful and safe for all ages.
- Leave unused fields empty. Write exactly 6 stops.`;

function describe(input: WizardInput) {
  const stops = input.stops
    .map((s, i) => {
      const lines = [`${TAG_LABELS[TAG_CODES[i]]}:`, `  hidden: ${s.hidingSpot || '(not described)'}`];
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
    'Stops:',
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

  const checkpoints: Checkpoint[] = TAG_CODES.map((tag, i) => {
    const stop = course.stops[Math.min(i, course.stops.length - 1)];
    const isFinale = i === TAG_CODES.length - 1;
    return {
      tag,
      title: stop.title,
      story: stop.story,
      miniGame: toMiniGame(stop, isFinale),
      winText: stop.winText,
      loseText: stop.loseText,
      clue: isFinale ? undefined : stop.clueToNext,
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
