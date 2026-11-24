import { Checkpoint, Game, MiniGame, Prize, SpotLocation, TagCode } from './types';

// Thanksgiving "Turkey Trot": a 3.1 mile loop around the Stanleys' house in
// Bozeman, 10 tags, single player. All three age versions use the same hidden
// tags (they share spotsId), so spots and photos only need setting up once.

const SPOTS_ID = 'turkey-trot';
const COLOR = '#E8873A';

type Age = 'kids' | 'teens' | 'adults';

const TAGS: TagCode[] = ['cp1', 'cp2', 'cp3', 'cp4', 'cp5', 'cp6', 'cp7', 'cp8', 'cp9', 'boss'];

// From Salem's Google Maps pins (2026-11-24). Tag 3 (Bergamont Ct) had no pin
// yet, so it is set on the spot in the app.
const SPOTS: Partial<Record<TagCode, SpotLocation>> = {
  cp1: { latitude: 45.6538927, longitude: -111.0106507 }, // front porch
  cp2: { latitude: 45.656357, longitude: -111.011326 }, // Painted Hills sign
  cp3: { latitude: 45.656322, longitude: -111.005939 }, // trailhead dog bag dispenser
  cp4: { latitude: 45.65641, longitude: -110.996593 }, // stop sign, Bozeman Trail Rd & Arrowleaf Hills Rd
  // cp5: Bergamont Ct & Arrowleaf Hills Rd, not pinned yet
  cp6: { latitude: 45.649662, longitude: -111.003042 }, // Boreal Way & Arrowleaf Hills Rd
  cp7: { latitude: 45.644336, longitude: -111.007392 }, // mailbox for 151 McGee
  cp8: { latitude: 45.650252, longitude: -111.008593 }, // McGee & Cook Ct sign
  cp9: { latitude: 45.650099, longitude: -111.010118 }, // middle Flowering Crabapple tree
  boss: { latitude: 45.653763, longitude: -111.010587 }, // basketball hoop
};

// Where each tag is hidden. The clue after each stop points to the next one.
const CLUES: string[] = [
  'Head out to the sign that says "Painted Hills". The tag is on the sign.',
  'Go to the Painted Hills trailhead. Look near the doggie poop bag dispenser.',
  'Find the stop sign where Bozeman Trail Road meets Arrowleaf Hills Road.',
  'Walk to the corner of Bergamont Court and Arrowleaf Hills Road. Look on a branch in the trees behind the street sign.',
  'Head to where Boreal Way meets Arrowleaf Hills Road.',
  'Find the mailbox for 151 McGee.',
  'Find the street sign at McGee and Cook Court.',
  'Look for three Flowering Crabapple trees. The tag is on or around the middle one.',
  "Head home! The final boss is waiting by the basketball hoop at the Stanleys' house.",
];

// The dish collected at each stop. Kids get kid favorites, teens the classics,
// and adults the fancy versions. Everyone starts with an empty plate and fills it.
const PRIZES: Record<Age, Prize[]> = {
  kids: [
    { emoji: '🍽️', name: 'a big empty plate' },
    { emoji: '🧀', name: 'a scoop of mac and cheese' },
    { emoji: '🥔', name: 'a mountain of mashed potatoes' },
    { emoji: '🥫', name: 'a wobbly can of cranberry jelly' },
    { emoji: '🍞', name: 'a warm buttery roll' },
    { emoji: '🍗', name: 'a giant turkey drumstick' },
    { emoji: '🍠', name: 'sweet potatoes with marshmallows' },
    { emoji: '🌽', name: 'a corn on the cob' },
    { emoji: '🥖', name: 'a pile of stuffing' },
    { emoji: '🎂', name: 'the Piecaken' },
  ],
  teens: [
    { emoji: '🍽️', name: 'an empty dinner plate' },
    { emoji: '🫛', name: 'a bowl of green bean casserole' },
    { emoji: '🥔', name: 'mashed potatoes and gravy' },
    { emoji: '🍒', name: 'a dish of cranberry sauce' },
    { emoji: '🍞', name: 'a basket of rolls' },
    { emoji: '🍗', name: 'the roast turkey' },
    { emoji: '🍠', name: 'a sweet potato casserole' },
    { emoji: '🌽', name: 'a bowl of buttered corn' },
    { emoji: '🥖', name: 'a pan of stuffing' },
    { emoji: '🎂', name: 'the Piecaken' },
  ],
  adults: [
    { emoji: '🍽️', name: 'a plate from the good china' },
    { emoji: '🫛', name: 'green bean casserole with crispy fried onions' },
    { emoji: '🥔', name: 'garlic mashed potatoes with a boat of gravy' },
    { emoji: '🍊', name: 'homemade cranberry-orange relish' },
    { emoji: '🥐', name: 'a basket of Parker House rolls' },
    { emoji: '🍗', name: 'a golden herb-roasted turkey' },
    { emoji: '🍠', name: 'candied yams with pecans' },
    { emoji: '🌽', name: 'a dish of creamed corn' },
    { emoji: '🥖', name: 'sausage and sage stuffing' },
    { emoji: '🎂', name: 'the legendary Piecaken' },
  ],
};

// Same kind of game at each stop for every age, but harder the older you get.
const GAMES: Record<Age, MiniGame[]> = {
  kids: [
    {
      kind: 'trivia',
      questions: [{ question: 'What holiday is it?', answers: ['Halloween', 'Thanksgiving', 'Easter', 'Groundhog Day'], correctIndex: 1 }],
    },
    { kind: 'catch', good: ['🧀', '🍝'], bad: [], target: 10, seconds: 40, speed: 0.8 },
    { kind: 'speedTap', taps: 25, seconds: 12, label: 'Mash the potatoes!' },
    { kind: 'match3', pieces: ['🍒', '🍎', '🍇', '🍐'], target: 25, moves: 25 },
    { kind: 'wordSearch', words: ['PIE', 'ROLL', 'CORN', 'YUM', 'FALL'], size: 7, seconds: 240 },
    {
      kind: 'trivia',
      questions: [
        { question: 'What sound does a turkey make?', answers: ['Moo', 'Gobble gobble', 'Quack', 'Oink'], correctIndex: 1 },
        { question: 'What month is Thanksgiving in?', answers: ['July', 'March', 'November', 'December'], correctIndex: 2 },
      ],
    },
    { kind: 'memory', symbols: ['🍠', '🥧', '🍎', '🍂', '🌽', '🦃'], seconds: 150 },
    { kind: 'catch', good: ['🌽'], bad: [], target: 12, seconds: 40, speed: 0.9 },
    { kind: 'merge', ladder: ['🍞', '🧈', '🥣', '🍲', '🍽️'], goal: 3, seconds: 180 },
    { kind: 'match3', pieces: ['🥧', '🎂', '🍰', '🧁'], target: 30, moves: 25 },
  ],
  teens: [
    {
      kind: 'trivia',
      questions: [
        {
          question: 'Thanksgiving in the US is always on which day of the week?',
          answers: ['Monday', 'Wednesday', 'Thursday', 'Friday'],
          correctIndex: 2,
        },
      ],
    },
    { kind: 'catch', good: ['🫛', '🧅'], bad: ['🐛'], target: 15, seconds: 30, speed: 1.2 },
    { kind: 'speedTap', taps: 40, seconds: 10, label: 'Mash the potatoes!' },
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
    { kind: 'memory', symbols: ['🍠', '🥧', '🍎', '🍂', '🌽', '🦃', '🥔', '🍗'], seconds: 90 },
    { kind: 'catch', good: ['🌽'], bad: ['🐦'], target: 15, seconds: 30, speed: 1.3 },
    { kind: 'merge', ladder: ['🍞', '🧈', '🥣', '🍲', '🍽️', '👑'], goal: 4, seconds: 150 },
    { kind: 'match3', pieces: ['🥧', '🎂', '🍰', '🧁', '🍪'], target: 50, moves: 22 },
  ],
  adults: [
    {
      kind: 'trivia',
      questions: [
        {
          question: 'Which state hosted the 1621 harvest feast often called the first Thanksgiving?',
          answers: ['Virginia', 'New York', 'Pennsylvania', 'Massachusetts'],
          correctIndex: 3,
        },
      ],
    },
    { kind: 'catch', good: ['🫛', '🧅'], bad: ['🐛', '🧦'], target: 20, seconds: 30, speed: 1.6 },
    { kind: 'speedTap', taps: 55, seconds: 10, label: 'Mash the potatoes!' },
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
    { kind: 'memory', symbols: ['🍠', '🥧', '🍎', '🍂', '🌽', '🦃', '🥔', '🍗'], seconds: 60 },
    { kind: 'catch', good: ['🌽'], bad: ['🐦', '🐿️'], target: 20, seconds: 30, speed: 1.7 },
    { kind: 'merge', ladder: ['🍞', '🧈', '🥣', '🍲', '🍽️', '👑'], goal: 5, seconds: 180 },
    { kind: 'match3', pieces: ['🥧', '🎂', '🍰', '🧁', '🍪', '🍩'], target: 60, moves: 20 },
  ],
};

type Beat = { title: string; story: (p: Prize) => string; win: string; lose: string };

const BEATS: Beat[] = [
  {
    title: 'The Empty Plate',
    story: (p) => `Here's ${p.name}. Every dish on the table ran out the door, and it's up to you to fill this plate back up! First, a warm-up question.`,
    win: "That's right! Your plate is ready. Let's go find some food.",
    lose: 'Close enough. Grab your plate and get moving!',
  },
  {
    title: 'The Runaway Side Dish',
    story: (p) => `There it is, hiding by the sign: ${p.name}! It wants to come home, but first it needs help gathering the bits that bounced out. Catch them!`,
    win: 'Every last bit is back in the dish. One dish down!',
    lose: 'A few bits got away, but the dish is coming home anyway.',
  },
  {
    title: 'Potato Mountain',
    story: (p) => `You found ${p.name}! But the potatoes are still lumpy. Mash them as fast as you can!`,
    win: 'Smooth, fluffy, perfect. Onto the plate!',
    lose: 'A little lumpy, but it still counts. Onward!',
  },
  {
    title: 'Cranberry Bog',
    story: (p) => `Here's ${p.name}, but the berries are all mixed up with the other fruit. Line them up to sort them out!`,
    win: 'Sorted! The cranberries are ready for the table.',
    lose: 'Most of them made it. Good enough for Grandma!',
  },
  {
    title: 'The Bread Basket',
    story: (p) => `You found ${p.name}! The baker hid a secret message in the flour. Find all the words to earn your rolls.`,
    win: 'Message found! The rolls are still warm.',
    lose: "The baker hands you the rolls anyway. It's Thanksgiving!",
  },
  {
    title: 'The Great Turkey Chase',
    story: (p) => `There's ${p.name}! It won't come with you until you prove you know your Thanksgiving facts.`,
    win: 'Correct! The turkey hops onto your plate.',
    lose: 'Not quite, but the turkey is tired of running and comes along.',
  },
  {
    title: 'Sweet Potato Shuffle',
    story: (p) => `You found ${p.name} hiding by the mailbox! They're playing a sneaky game of hide and seek. Find every matching pair.`,
    win: 'Found them all! Onto the plate they go.',
    lose: 'They were sneaky, but you caught them in the end.',
  },
  {
    title: 'Corn Fields',
    story: (p) => `Here's ${p.name}, but the kernels are popping off everywhere! Catch them before they hit the ground.`,
    win: 'Every kernel caught. Nice hands!',
    lose: 'The birds got a few. Plenty left for dinner!',
  },
  {
    title: 'Stuffing Stack',
    story: (p) => `Under the crabapple tree you find ${p.name}. Build it up from bread to a full bowl by merging the pieces together.`,
    win: 'The best stuffing in Bozeman. Your plate is almost full!',
    lose: 'Not quite finished, but it smells amazing. Take it!',
  },
  {
    title: 'Boss: The Piecaken',
    story: (p) =>
      `Your plate is full and you're almost home, but standing by the hoop is ${p.name}: a pie baked inside a cake, and it does NOT want to be dessert! Beat it by clearing its army of sweets.`,
    win: 'The Piecaken is captured! Dinner is served!',
    lose: 'The Piecaken puts up a fight, then gives up and lets you have a slice.',
  },
];

const AGES: Record<Age, { id: string; title: string; badge: string; par: number; penalty: number; rules: string[] }> = {
  kids: {
    id: 'turkey-trot-kids',
    title: 'Turkey Trot: Little Gobblers',
    badge: 'Ages 10 and under',
    par: 150,
    penalty: 0,
    rules: ['Stay with a grown-up the whole time.', "Losing a challenge doesn't add any time."],
  },
  teens: {
    id: 'turkey-trot-teens',
    title: 'Turkey Trot: Junior Trotters',
    badge: 'Ages 11 to 18',
    par: 100,
    penalty: 30,
    rules: ['Look both ways at every street crossing.'],
  },
  adults: {
    id: 'turkey-trot-adults',
    title: 'Turkey Trot: Grown-Up Gobblers',
    badge: 'Adults',
    par: 80,
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
      clue: CLUES[i],
      miniGame: GAMES[age][i],
    };
  });
  return {
    id: a.id,
    title: a.title,
    badge: a.badge,
    tagline: 'The Thanksgiving dishes ran away! Fill your plate on a 3.1 mile loop and capture the Piecaken.',
    intro:
      "Oh no! Right before dinner, every dish on the Stanleys' Thanksgiving table jumped up and trotted out the door. Grab a plate, follow the trail, collect each dish, and capture the Piecaken before dinner gets cold.",
    startClue: 'Your first tag is on the front porch. Tap it to grab your plate!',
    ending: 'Your plate is full and the Piecaken has been captured. Happy Thanksgiving! Time to eat!',
    penaltySeconds: a.penalty,
    timed: true,
    parMinutes: a.par,
    starColor: COLOR,
    spotsId: SPOTS_ID,
    presetSpots: SPOTS,
    // Coins run in straight lines between tags, so give a little extra room
    // where the street curves away from them.
    coinRadiusM: 12,
    rules: a.rules,
    checkpoints,
  };
}

export const turkeyTrotGames: Game[] = [makeGame('kids'), makeGame('teens'), makeGame('adults')];
