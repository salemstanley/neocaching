import { Checkpoint, Game, MiniGame, Prize, TagCode } from './types';

// Thanksgiving "Turkey Trot": a 3.1 mile loop that starts and ends at the
// Stanleys' house in Bozeman. All three age versions use the same hidden tags,
// so the spots only need setting up once (they share spotsId).
//
// TODO when Salem sends the map pins: fill in TURKEY_TROT_START, the bends
// (street corners) and the clues that point to each real hiding spot.

const SPOTS_ID = 'turkey-trot';
const COLOR = '#E8873A';

type Age = 'kids' | 'teens' | 'adults';

// The dish collected at each stop, by age. Kids get kid favorites, teens get
// the classics, and adults get the fancy versions.
const PRIZES: Record<Age, Prize[]> = {
  kids: [
    { emoji: '🧀', name: 'a big scoop of mac and cheese' },
    { emoji: '🥔', name: 'a mountain of mashed potatoes' },
    { emoji: '🥫', name: 'a wobbly can of cranberry jelly' },
    { emoji: '🍞', name: 'a warm buttery roll' },
    { emoji: '🍗', name: 'a giant turkey drumstick' },
    { emoji: '🎂', name: 'the Piecaken' },
  ],
  teens: [
    { emoji: '🫛', name: 'a bowl of green bean casserole' },
    { emoji: '🥔', name: 'mashed potatoes and gravy' },
    { emoji: '🍒', name: 'a dish of cranberry sauce' },
    { emoji: '🍞', name: 'a basket of rolls' },
    { emoji: '🍗', name: 'the roast turkey' },
    { emoji: '🎂', name: 'the Piecaken' },
  ],
  adults: [
    { emoji: '🫛', name: 'green bean casserole with crispy fried onions' },
    { emoji: '🥔', name: 'garlic mashed potatoes with a boat of gravy' },
    { emoji: '🍊', name: 'homemade cranberry-orange relish' },
    { emoji: '🥐', name: 'a basket of buttery Parker House rolls' },
    { emoji: '🍗', name: 'a golden herb-roasted turkey' },
    { emoji: '🎂', name: 'the legendary Piecaken' },
  ],
};

// Harder games the older you get.
const GAMES: Record<Age, MiniGame[]> = {
  kids: [
    { kind: 'catch', good: ['🧀', '🍝'], bad: [], target: 10, seconds: 40, speed: 0.8 },
    { kind: 'merge', ladder: ['🌱', '🥔', '🧈', '🥣', '🍲', '🍽️'], goal: 3, seconds: 180 },
    { kind: 'match3', pieces: ['🍒', '🍎', '🍇', '🍐'], target: 25, moves: 25 },
    { kind: 'wordSearch', words: ['PIE', 'ROLL', 'CORN', 'YUM', 'FALL'], size: 7, seconds: 240 },
    {
      kind: 'trivia',
      questions: [
        { question: 'What sound does a turkey make?', answers: ['Moo', 'Gobble gobble', 'Quack', 'Oink'], correctIndex: 1 },
        { question: 'What month is Thanksgiving in?', answers: ['July', 'March', 'November', 'December'], correctIndex: 2 },
      ],
    },
    { kind: 'memory', symbols: ['🥧', '🎂', '🍗', '🌽', '🍞', '🥔'], seconds: 150 },
  ],
  teens: [
    { kind: 'catch', good: ['🫛', '🧅'], bad: ['🐛'], target: 15, seconds: 30, speed: 1.2 },
    { kind: 'merge', ladder: ['🌱', '🥔', '🧈', '🥣', '🍲', '🍽️'], goal: 4, seconds: 150 },
    { kind: 'match3', pieces: ['🍒', '🍊', '🍎', '🍇', '🍐'], target: 40, moves: 20 },
    { kind: 'wordSearch', words: ['TURKEY', 'GRAVY', 'STUFFING', 'PILGRIM', 'HARVEST', 'ROLLS'], size: 10, seconds: 180 },
    {
      kind: 'trivia',
      questions: [
        { question: 'Which ship brought the Pilgrims to America in 1620?', answers: ['The Mayflower', 'The Santa Maria', 'The Titanic', 'The Endeavour'], correctIndex: 0 },
        { question: 'What is a baby turkey called?', answers: ['A kid', 'A poult', 'A cub', 'A calf'], correctIndex: 1 },
        {
          question: 'Which president made Thanksgiving a national holiday in 1863?',
          answers: ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'Teddy Roosevelt'],
          correctIndex: 2,
        },
      ],
    },
    { kind: 'memory', symbols: ['🥧', '🎂', '🍗', '🌽', '🍞', '🥔', '🍒', '🫛'], seconds: 90 },
  ],
  adults: [
    { kind: 'catch', good: ['🫛', '🧅'], bad: ['🐛', '🧦'], target: 20, seconds: 30, speed: 1.6 },
    { kind: 'merge', ladder: ['🌱', '🥔', '🧈', '🥣', '🍲', '🍽️', '👑'], goal: 5, seconds: 180 },
    { kind: 'match3', pieces: ['🍒', '🍊', '🍎', '🍇', '🍐', '🥝'], target: 50, moves: 18 },
    {
      kind: 'wordSearch',
      words: ['CRANBERRY', 'CASSEROLE', 'GRATITUDE', 'PUMPKIN', 'MAYFLOWER', 'PLYMOUTH', 'HARVEST'],
      size: 12,
      diagonal: true,
      seconds: 240,
    },
    {
      kind: 'trivia',
      questions: [
        {
          question: 'The 1621 harvest feast at Plymouth was shared by the Pilgrims and which people?',
          answers: ['The Cherokee', 'The Wampanoag', 'The Lakota', 'The Navajo'],
          correctIndex: 1,
        },
        {
          question: 'Which magazine editor campaigned for years to make Thanksgiving a national holiday?',
          answers: ['Sarah Josepha Hale', 'Louisa May Alcott', 'Harriet Beecher Stowe', 'Emily Dickinson'],
          correctIndex: 0,
        },
        {
          question: 'In 1939, FDR moved Thanksgiving a week earlier. What did critics call it?',
          answers: ['Turkeygate', 'The Early Bird', 'Franksgiving', 'Fall Fiasco'],
          correctIndex: 2,
        },
        {
          question: "Which store started New York's famous Thanksgiving Day Parade in 1924?",
          answers: ['Gimbels', 'Sears', 'Woolworth', "Macy's"],
          correctIndex: 3,
        },
      ],
    },
    { kind: 'memory', symbols: ['🥧', '🎂', '🍗', '🌽', '🍞', '🥔', '🍒', '🫛'], seconds: 60 },
  ],
};

const TAGS: TagCode[] = ['cp1', 'cp2', 'cp3', 'cp4', 'cp5', 'boss'];

// The story is the same for every age; the words get a little grown-up for adults.
type Beat = { title: string; story: (p: Prize) => string; win: string; lose: string; clue?: string };

const BEATS: Beat[] = [
  {
    title: 'The Runaway Side Dish',
    story: (p) => `There it is, hiding behind a tree: ${p.name}! It wants to come home, but first it needs help gathering the bits that bounced out of the dish. Catch them!`,
    win: 'Every last bit is back in the dish. One down!',
    lose: 'A few bits got away, but the dish is coming home anyway.',
    clue: 'The mashed potatoes rolled off toward the next stop, about half a mile down the trail. Find the next tag!',
  },
  {
    title: 'Potato Mountain',
    story: (p) => `You found ${p.name}! But the potatoes are lumpy. Mash and merge them into a perfect pile.`,
    win: 'Smooth, fluffy, perfect. Into the bag it goes!',
    lose: 'A little lumpy, but it still counts. Onward!',
    clue: 'Something red and wobbly is waiting at the next stop. Keep trotting!',
  },
  {
    title: 'Cranberry Bog',
    story: (p) => `Here's ${p.name}, but the berries are all mixed up with the other fruit. Line them up to sort them out!`,
    win: 'Sorted! The cranberries are ready for the table.',
    lose: 'Most of them made it. Good enough for Grandma!',
    clue: 'Follow the smell of fresh bread to the next stop.',
  },
  {
    title: 'The Bread Basket',
    story: (p) => `You found ${p.name}! The baker hid a secret message in the flour. Find all the words to earn your rolls.`,
    win: 'Message found! The rolls are still warm.',
    lose: "The baker gives you the rolls anyway. It's Thanksgiving!",
    clue: 'The biggest dish of all ran off toward the next stop. Gobble gobble, go!',
  },
  {
    title: 'The Great Turkey Chase',
    story: (p) => `There's ${p.name}! It won't come with you until you prove you know your Thanksgiving facts.`,
    win: 'Correct! The turkey hops into your bag.',
    lose: 'Not quite, but the turkey is tired of running and comes along.',
    clue: "The feast is almost complete. Head back home, where the final boss is waiting. Watch out for the Piecaken!",
  },
  {
    title: 'Boss: The Piecaken',
    story: (p) =>
      `The table is set, but standing in the way is ${p.name}: a whole pie baked inside a cake! It will only let you eat if you can match every dish on its menu.`,
    win: 'The Piecaken bows. Dinner is served!',
    lose: 'The Piecaken laughs, then lets you have a slice anyway.',
  },
];

const AGES: Record<Age, { id: string; title: string; badge: string; par: number; penalty: number; rules: string[] }> = {
  kids: {
    id: 'turkey-trot-kids',
    title: 'Turkey Trot: Little Gobblers',
    badge: 'Ages 10 and under',
    par: 120,
    penalty: 0,
    rules: ['Stay with a grown-up the whole time.', "Losing a challenge doesn't add any time."],
  },
  teens: {
    id: 'turkey-trot-teens',
    title: 'Turkey Trot: Junior Trotters',
    badge: 'Ages 11 to 18',
    par: 75,
    penalty: 30,
    rules: ['Look both ways at every street crossing.'],
  },
  adults: {
    id: 'turkey-trot-adults',
    title: 'Turkey Trot: Grown-Up Gobblers',
    badge: 'Adults',
    par: 60,
    penalty: 60,
    rules: ['Harder challenges and a tighter clock. Losing a challenge adds a full minute.'],
  },
};

function makeGame(age: Age): Game {
  const a = AGES[age];
  const checkpoints: Checkpoint[] = TAGS.map((tag, i) => {
    const beat = BEATS[i];
    const prize = PRIZES[age][i];
    return {
      tag,
      title: beat.title,
      prize,
      story: beat.story(prize),
      winText: beat.win,
      loseText: beat.lose,
      clue: beat.clue,
      miniGame: GAMES[age][i],
    };
  });
  return {
    id: a.id,
    title: a.title,
    badge: a.badge,
    tagline: 'The Thanksgiving dishes ran away! Collect them all on a 3.1 mile loop and bring them home.',
    intro:
      "Oh no! Right before dinner, every dish on the Stanleys' Thanksgiving table jumped up and trotted out the front door. Follow the trail, collect each dish, and bring the feast back home before it gets cold.",
    startClue: 'Head out the front door. The first runaway dish is at the first tag, about half a mile away.',
    ending: 'Every dish is home and the Piecaken has been defeated. Happy Thanksgiving! Time to eat!',
    penaltySeconds: a.penalty,
    timed: true,
    parMinutes: a.par,
    starColor: COLOR,
    spotsId: SPOTS_ID,
    rules: a.rules,
    checkpoints,
  };
}

export const turkeyTrotGames: Game[] = [makeGame('kids'), makeGame('teens'), makeGame('adults')];
