import { Checkpoint, Game, TAG_CODES } from './types';

// Starter content for a brand-new course, so it's playable right away and
// easy to edit. Uses a mix of challenge types to show what's possible.
const STARTERS: Omit<Checkpoint, 'tag'>[] = [
  {
    title: 'The Start',
    story: 'Your adventure begins here! Answer this to prove you are ready.',
    miniGame: {
      kind: 'trivia',
      questions: [{ question: 'Who planned this adventure for you?', answers: ['Mom', 'Dad', 'A wizard', 'Nobody knows'], correctIndex: 1 }],
    },
    winText: 'Correct! The adventure is officially on.',
    loseText: 'Nice try! The adventure starts anyway.',
    clue: 'Your next stop is close by. Look for Tag 1.',
  },
  {
    title: 'Stop 1',
    story: 'Quick! Show us how fast you are.',
    miniGame: { kind: 'speedTap', taps: 30, seconds: 10, label: 'Tap tap tap!' },
    winText: 'Lightning fast!',
    loseText: 'So close!',
    clue: 'Head to Tag 2.',
  },
  {
    title: 'Stop 2',
    story: 'Time to test your memory.',
    miniGame: { kind: 'memory', symbols: ['🎂', '🎈', '🎁', '🎉', '🍕', '🦄'], seconds: 60 },
    winText: 'What a memory!',
    loseText: 'Those were tricky!',
    clue: 'Head to Tag 3.',
  },
  {
    title: 'Stop 3',
    story: 'This stop is a real-world mission.',
    miniGame: { kind: 'activity', task: 'Take a silly selfie right here.' },
    winText: 'Mission complete!',
    loseText: '',
    clue: 'Head to Tag 4.',
  },
  {
    title: 'Stop 4',
    story: 'Almost there! One more question.',
    miniGame: {
      kind: 'trivia',
      questions: [{ question: 'What is the best day of the year?', answers: ['Today!', 'Monday', 'Tax day', 'Dentist day'], correctIndex: 0 }],
    },
    winText: 'Exactly right!',
    loseText: 'Hmm, the answer was today!',
    clue: 'The final stop awaits at Tag 5!',
  },
  {
    title: 'The Grand Finale',
    story: 'This is it! Give it everything you have.',
    miniGame: { kind: 'speedTap', taps: 50, seconds: 15, label: 'Tap to win!' },
    winText: 'You did it!',
    loseText: 'What an effort!',
  },
];

export function newCourse(): Game {
  return {
    id: `custom-${Date.now()}`,
    custom: true,
    title: 'My adventure',
    tagline: 'A custom Neocaching adventure.',
    intro: 'Welcome to your adventure! Find all 6 tags to finish.',
    startClue: 'Find the tag marked Start to begin.',
    ending: 'You found every tag. Well done!',
    penaltySeconds: 30,
    timed: true,
    parMinutes: 30,
    starColor: '#F5B841',
    checkpoints: TAG_CODES.map((tag, i) => ({ tag, ...STARTERS[i] })),
  };
}

// An editable copy of any course (e.g. a built-in one).
export function copyCourse(course: Game): Game {
  return { ...JSON.parse(JSON.stringify(course)), id: `custom-${Date.now()}`, custom: true, title: `${course.title} (copy)` };
}
