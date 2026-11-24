import { Checkpoint, Game, MiniGame, Prize, SpotLocation, TagCode } from './types';

// Thanksgiving "Turkey Trot": a 5k loop with 10 tags, single player, in three
// age versions. Each place it's played (a "site") brings its own tag spots and
// clues. All versions at one site share the same hidden tags (spotsId), so
// spots and photos only need setting up once.

const COLOR = '#E8873A';

// Everything that changes from one place to another.
export type Site = {
  idPrefix: string; // e.g. 'turkey-trot' makes 'turkey-trot-kids'
  location: string; // shown in the location picker
  family: string; // whose house the feast is at, e.g. "the Stanleys'"
  town: string;
  spots: Partial<Record<TagCode, SpotLocation>>;
  startClue: string;
  clues: string[]; // 9 clues: after each stop, where the next tag is
  // Stops that work differently here, by position (0 = Start), for every age.
  overrides?: Record<number, { title: string; prize: Prize; story: string; winText: string; loseText: string; miniGame: MiniGame }>;
};

type Age = 'kids' | 'teens' | 'adults';

const TAGS: TagCode[] = ['cp1', 'cp2', 'cp3', 'cp4', 'cp5', 'cp6', 'cp7', 'cp8', 'cp9', 'boss'];

// Bozeman, from Salem's Google Maps pins (2026-11-24).
const PAINTED_HILLS_SPOTS: Partial<Record<TagCode, SpotLocation>> = {
  cp1: { latitude: 45.6538927, longitude: -111.0106507 }, // front porch
  cp2: { latitude: 45.656357, longitude: -111.011326 }, // Painted Hills sign
  cp3: { latitude: 45.656322, longitude: -111.005939 }, // trailhead dog bag dispenser
  cp4: { latitude: 45.65641, longitude: -110.996593 }, // stop sign, Bozeman Trail Rd & Arrowleaf Hills Rd
  cp5: { latitude: 45.65126, longitude: -110.996804 }, // trees behind Bergamont Ct & Arrowleaf Hills Rd sign
  cp6: { latitude: 45.649662, longitude: -111.003042 }, // Boreal Way & Arrowleaf Hills Rd
  cp7: { latitude: 45.644336, longitude: -111.007392 }, // mailbox for 151 McGee
  cp8: { latitude: 45.650252, longitude: -111.008593 }, // McGee & Cook Ct sign
  cp9: { latitude: 45.650099, longitude: -111.010118 }, // middle Flowering Crabapple tree
  boss: { latitude: 45.653763, longitude: -111.010587 }, // basketball hoop
};

// Where each tag is hidden. The clue after each stop points to the next one.
const PAINTED_HILLS_CLUES: string[] = [
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
// The games mix holiday traditions: history (the storybook version for kids,
// the less flattering version for grown-ups), food, the turkey trot itself,
// Black Friday and football.
const q = (question: string, answers: string[], correctIndex: number) => ({ question, answers, correctIndex });

const GAMES: Record<Age, MiniGame[]> = {
  kids: [
    {
      kind: 'trivia',
      questions: [
        q('The Pilgrims sailed to America on a ship called the…', ['Rubber Duck', 'Mayflower', 'Titanic', 'Big Pumpkin'], 1),
        q('Who helped the Pilgrims learn to grow corn?', ['Pirates', 'Robots', 'The Wampanoag people', 'Santa Claus'], 2),
      ],
    },
    { kind: 'catch', good: ['🧀', '🍝'], bad: [], target: 10, seconds: 40, speed: 0.8 },
    { kind: 'speedTap', taps: 25, seconds: 12, label: 'Run, run, run!' },
    { kind: 'match3', pieces: ['🍒', '🍎', '🍇', '🍐'], target: 25, moves: 25 },
    { kind: 'catch', good: ['🧸', '🎮', '🎁'], bad: [], target: 10, seconds: 40, speed: 0.8 },
    {
      kind: 'trivia',
      questions: [
        q('What shape is a football?', ['Round like a ball', 'Square', 'Oval with pointy ends', 'Like a star'], 2),
        q('What sound does a turkey make?', ['Moo', 'Gobble gobble', 'Quack', 'Oink'], 1),
      ],
    },
    { kind: 'memory', symbols: ['🦃', '🏈', '🥧', '🍂', '🌽', '🎁'], seconds: 150 },
    { kind: 'wordSearch', words: ['PIE', 'CORN', 'BALL', 'SHOP', 'YUM'], size: 7, seconds: 240 },
    { kind: 'merge', ladder: ['🍞', '🧈', '🥣', '🍲', '🍽️'], goal: 3, seconds: 180 },
    { kind: 'match3', pieces: ['🥧', '🎂', '🍰', '🧁'], target: 30, moves: 25 },
  ],
  teens: [
    {
      kind: 'trivia',
      questions: [
        q('The 1621 harvest feast we now call the first Thanksgiving lasted about how long?', ['One hour', 'One afternoon', 'Three days', 'Two weeks'], 2),
        q(
          'Squanto (Tisquantum) already spoke English when he met the Pilgrims. Why?',
          ['He learned it from a book', 'He had been kidnapped and taken to Europe', 'He invented it', 'Lucky guess'],
          1,
        ),
      ],
    },
    { kind: 'catch', good: ['🫛', '🧅'], bad: ['🐛'], target: 15, seconds: 30, speed: 1.2 },
    { kind: 'speedTap', taps: 40, seconds: 10, label: 'Sprint!' },
    { kind: 'match3', pieces: ['🍒', '🍊', '🍎', '🍇', '🍐'], target: 40, moves: 20 },
    { kind: 'catch', good: ['🏷️', '🎮', '📱'], bad: ['💸'], target: 15, seconds: 30, speed: 1.3 },
    {
      kind: 'trivia',
      questions: [
        q('Which two NFL teams host a game every Thanksgiving?', ['Packers and Bears', 'Jets and Giants', 'Lions and Cowboys', 'Chiefs and Broncos'], 2),
        q('How many points is a touchdown worth (before the extra point)?', ['3', '6', '7', '10'], 1),
        q('Which president made Thanksgiving a national holiday in 1863?', ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'Teddy Roosevelt'], 2),
      ],
    },
    { kind: 'memory', symbols: ['🦃', '🏈', '🛍️', '🥧', '🍂', '🌽', '🏃', '🍗'], seconds: 90 },
    { kind: 'wordSearch', words: ['FOOTBALL', 'TURKEY', 'GRAVY', 'PILGRIM', 'HARVEST', 'PARADE'], size: 10, seconds: 180 },
    { kind: 'merge', ladder: ['🍞', '🧈', '🥣', '🍲', '🍽️', '👑'], goal: 4, seconds: 150 },
    { kind: 'match3', pieces: ['🥧', '🎂', '🍰', '🧁', '🍪'], target: 50, moves: 22 },
  ],
  adults: [
    {
      kind: 'trivia',
      questions: [
        q('Of the roughly 100 Mayflower passengers, about how many survived the first winter?', ['Almost all', 'About three quarters', 'About half', 'Only five'], 2),
        q(
          'Squanto spoke fluent English when the Pilgrims showed up. Why?',
          ['He studied at Oxford', 'An English captain had kidnapped him and sold him into slavery in Spain', 'He read their brochure', 'He was a very fast learner'],
          1,
        ),
        q('What was almost certainly NOT on the menu at the 1621 feast?', ['Venison', 'Wildfowl', 'Corn', 'Mashed potatoes'], 3),
      ],
    },
    { kind: 'catch', good: ['🫛', '🧅'], bad: ['🐛', '🧦'], target: 20, seconds: 30, speed: 1.6 },
    { kind: 'speedTap', taps: 55, seconds: 10, label: 'Sprint!' },
    { kind: 'match3', pieces: ['🍒', '🍊', '🍎', '🍇', '🍐', '🥝'], target: 50, moves: 18 },
    { kind: 'catch', good: ['🏷️', '📺', '💻'], bad: ['💸', '🧾'], target: 20, seconds: 30, speed: 1.7 },
    {
      kind: 'trivia',
      questions: [
        q('The Detroit Lions have hosted a Thanksgiving game almost every year since…', ['1934', '1955', '1966', '1978'], 0),
        q('Which other team has hosted on Thanksgiving almost every year since 1966?', ['Green Bay Packers', 'Dallas Cowboys', 'New York Giants', 'Chicago Bears'], 1),
        q(
          'In 1939, FDR moved Thanksgiving a week earlier to give stores a longer shopping season. What did critics call it?',
          ['Turkeygate', 'The Early Bird', 'Franksgiving', 'Fall Fiasco'],
          2,
        ),
      ],
    },
    { kind: 'memory', symbols: ['🦃', '🏈', '🛍️', '🥧', '🍂', '🌽', '🏃', '🍗'], seconds: 60 },
    {
      kind: 'wordSearch',
      words: ['CRANBERRY', 'CASSEROLE', 'DOORBUSTER', 'TOUCHDOWN', 'GRATITUDE', 'MAYFLOWER', 'LEFTOVERS'],
      size: 12,
      diagonal: true,
      seconds: 240,
    },
    { kind: 'merge', ladder: ['🍞', '🧈', '🥣', '🍲', '🍽️', '👑'], goal: 5, seconds: 180 },
    { kind: 'match3', pieces: ['🥧', '🎂', '🍰', '🧁', '🍪', '🍩'], target: 60, moves: 20 },
  ],
};

type Beat = { title: string; story: (p: Prize) => string; win: string; lose: string };

const BEATS: Beat[] = [
  {
    title: 'The Empty Plate',
    story: (p) => `Here's ${p.name}. Every dish on the table ran out the door, and it's up to you to fill this plate back up! First, a little Thanksgiving history.`,
    win: "That's right! Your plate is ready. Let's go find some food.",
    lose: 'Close enough. Grab your plate and get moving!',
  },
  {
    title: 'The Runaway Side Dish',
    story: (p) => `There it is, hiding right by the tag: ${p.name}! It wants to come home, but first it needs help gathering the bits that bounced out. Catch them!`,
    win: 'Every last bit is back in the dish. One dish down!',
    lose: 'A few bits got away, but the dish is coming home anyway.',
  },
  {
    title: 'The Turkey Trot',
    story: (p) => `You found ${p.name}, but they just signed up for the neighborhood Turkey Trot and took off running! Sprint to catch them!`,
    win: 'You caught them at the finish line. Onto the plate!',
    lose: 'They beat you to the finish, then waited for you. Onto the plate!',
  },
  {
    title: 'Cranberry Bog',
    story: (p) => `Here's ${p.name}, but the berries are all mixed up with the other fruit. Line them up to sort them out!`,
    win: 'Sorted! The cranberries are ready for the table.',
    lose: 'Most of them made it. Good enough for Grandma!',
  },
  {
    title: 'Black Friday Doorbuster',
    story: (p) => `You found ${p.name}, but the bakery opened early for Black Friday and the deals are flying! Grab the doorbusters and don't waste your money.`,
    win: 'Best deals in town, and the rolls are still warm.',
    lose: "You got trampled a little, but the rolls are yours. It's Thanksgiving!",
  },
  {
    title: 'Thanksgiving Football',
    story: (p) => `There's ${p.name}, glued to the football game on TV. It won't budge until you prove you know your Thanksgiving football.`,
    win: 'Touchdown! The turkey hops onto your plate.',
    lose: 'Flag on the play, but the turkey comes along anyway.',
  },
  {
    title: 'Sweet Potato Shuffle',
    story: (p) => `You found ${p.name} hiding with a pile of holiday cards. Find every matching pair to win them over.`,
    win: 'Found them all! Onto the plate they go.',
    lose: 'They were sneaky, but you caught them in the end.',
  },
  {
    title: 'The Corn Maze',
    story: (p) => `Here's ${p.name}, lost in a maze of letters. Find every hidden word to lead it out.`,
    win: 'Out of the maze and onto your plate!',
    lose: 'The corn found its own way out. Plenty for dinner!',
  },
  {
    title: 'Stuffing Stack',
    story: (p) => `Right by the tag you find ${p.name}. Build it up from bread to a full bowl by merging the pieces together.`,
    win: 'The best stuffing in town. Your plate is almost full!',
    lose: 'Not quite finished, but it smells amazing. Take it!',
  },
  {
    title: 'Boss: The Piecaken',
    story: (p) =>
      `Your plate is full and you're almost home, but standing at the finish is ${p.name}: a pie baked inside a cake, and it does NOT want to be dessert! Beat it by clearing its army of sweets.`,
    win: 'The Piecaken is captured! Dinner is served!',
    lose: 'The Piecaken puts up a fight, then gives up and lets you have a slice.',
  },
];

const AGES: Record<Age, { suffix: string; title: string; theme: string; badge: string; par: number; penalty: number; rules: string[] }> = {
  kids: {
    suffix: 'kids',
    title: 'Turkey Trot: Little Gobblers',
    theme: 'Thanksgiving Turkey Trot',
    badge: 'Ages 10 and under',
    par: 150,
    penalty: 0,
    rules: ['Stay with a grown-up the whole time.', "Losing a challenge doesn't add any time."],
  },
  teens: {
    suffix: 'teens',
    title: 'Turkey Trot: Junior Trotters',
    theme: 'Thanksgiving Turkey Trot',
    badge: 'Ages 11 to 18',
    par: 100,
    penalty: 30,
    rules: ['Look both ways at every street crossing.'],
  },
  adults: {
    suffix: 'adults',
    title: 'Turkey Trot: Grown-Up Gobblers',
    theme: 'Thanksgiving Turkey Trot',
    badge: 'Adults',
    par: 80,
    penalty: 60,
    rules: ['Harder challenges and a tighter clock. Losing a challenge adds a full minute.'],
  },
};

function makeGame(site: Site, age: Age): Game {
  const a = AGES[age];
  const checkpoints: Checkpoint[] = TAGS.map((tag, i) => {
    const special = site.overrides?.[i];
    if (special) return { tag, ...special, clue: site.clues[i] };
    const beat = BEATS[i];
    const prize = PRIZES[age][i];
    return {
      tag,
      title: beat.title,
      prize,
      story: beat.story(prize),
      winText: beat.win,
      loseText: beat.lose,
      clue: site.clues[i],
      miniGame: GAMES[age][i],
    };
  });
  return {
    id: `${site.idPrefix}-${a.suffix}`,
    title: a.title,
    badge: a.badge,
    location: site.location,
    theme: a.theme,
    tagline: 'The Thanksgiving feast ran away! Chase it down before dinner gets cold. 🦃',
    intro: `Every dish on ${site.family} table just ran out the door! The turkey, the rolls, even the Piecaken are loose on the course. Grab a plate and bring dinner home.`,
    startClue: site.startClue,
    ending: 'Your plate is full and the Piecaken has been captured. Happy Thanksgiving! Time to eat!',
    penaltySeconds: a.penalty,
    timed: true,
    parMinutes: a.par,
    starColor: COLOR,
    trailItems: ['🍴', '🍽️', '🥄', '🥤', '🧻', '🔪', '🫖', '🧂'],
    trailName: 'table settings',
    wrongWay: { emoji: '🦃', name: 'Turkey attack', points: -15, sound: 'turkey' },
    spotsId: site.idPrefix,
    presetSpots: site.spots,
    // Coins run in straight lines between tags, so give a little extra room
    // where the street curves away from them.
    coinRadiusM: 12,
    rules: a.rules,
    checkpoints,
  };
}

export function turkeyTrotFor(site: Site): Game[] {
  return [makeGame(site, 'kids'), makeGame(site, 'teens'), makeGame(site, 'adults')];
}

export const PAINTED_HILLS: Site = {
  // Kept as 'turkey-trot' so spots, photos and scores saved before stay put.
  idPrefix: 'turkey-trot',
  location: 'Stanley - Painted Hills 5k',
  family: "the Stanleys'",
  town: 'Bozeman',
  spots: PAINTED_HILLS_SPOTS,
  startClue: 'Your first tag is on the front porch. Tap it to grab your plate!',
  clues: PAINTED_HILLS_CLUES,
};

export const turkeyTrotGames: Game[] = turkeyTrotFor(PAINTED_HILLS);

// A short, simple version for small test loops: 6 tags (Start, 1-4, Finish),
// the classic dishes, medium games, no time penalty, and a relaxed clock.
// Picks the plate, green beans, mashed potatoes, cranberries, turkey and the
// Piecaken from the full course.
const QUICK_STOPS = [0, 1, 2, 3, 5, 9];
const QUICK_TAGS: TagCode[] = ['cp1', 'cp2', 'cp3', 'cp4', 'cp5', 'boss'];

export function quickTurkeyTrot(opts: { id: string; location: string; spotsId: string; startClue: string; clues: string[] }): Game {
  const checkpoints: Checkpoint[] = QUICK_TAGS.map((tag, i) => {
    const stop = QUICK_STOPS[i];
    const beat = BEATS[stop];
    const prize = PRIZES.teens[stop];
    return {
      tag,
      title: beat.title,
      prize,
      story: beat.story(prize),
      winText: beat.win,
      loseText: beat.lose,
      clue: opts.clues[i],
      miniGame: GAMES.teens[stop],
    };
  });
  return {
    id: opts.id,
    title: 'Turkey Trot: Quick Gobble',
    theme: 'Thanksgiving (short and simple)',
    badge: 'All ages',
    location: opts.location,
    tagline: 'A quick Thanksgiving dash. Fill your plate and beat the Piecaken! 🦃',
    intro: 'Every dish on the table just ran out the door! The turkey, the rolls, even the Piecaken are loose on the course. Grab a plate and bring dinner home.',
    startClue: opts.startClue,
    ending: 'Your plate is full and the Piecaken has been captured. Happy Thanksgiving!',
    penaltySeconds: 0,
    timed: true,
    parMinutes: 30,
    starColor: COLOR,
    trailItems: ['🍴', '🍽️', '🥄', '🥤', '🧻', '🔪', '🫖', '🧂'],
    trailName: 'table settings',
    wrongWay: { emoji: '🦃', name: 'Turkey attack', points: -15, sound: 'turkey' },
    spotsId: opts.spotsId,
    checkpoints,
  };
}
