import { Game } from './types';

// A story inspired by the Cotton Mission settlers who founded St. George in
// 1861. The characters are made up; the history questions are real.
export const pioneerGame: Game = {
  id: 'pioneer',
  title: 'Red Rock Pioneers',
  tagline: 'Survive your first year in 1860s St. George.',
  starColor: '#F5B841',
  penaltySeconds: 30,
  intro:
    'December 1861. Your wagon creaks to a stop below the red cliffs. You and the other families have been sent south to grow cotton in this hot, dry valley. ' +
    'Old Hiram, the wagon master, hands you a worn leather journal. "Five tasks stand between us and a real town," he says. "Find each one, and be quick about it. Winter rains are coming."',
  ending:
    'The water drops away. The ditches held, the stone walls stand, and the first cotton is safe in the barn. Hiram closes the journal and grins. "Welcome home to Dixie."',
  checkpoints: [
    {
      tag: 'cp1',
      title: 'The Red Hills',
      story:
        'You climb the black lava ridge to look over the valley. Hiram quizzes you on what you have heard about this new place. "A settler should know where they stand," he says.',
      winText: 'Hiram nods. "You will do fine here." The first page of the journal is filled.',
      loseText: 'Hiram chuckles. "You will learn." You lose a little time setting up camp.',
      miniGame: {
        kind: 'trivia',
        questions: [
          {
            question: 'In what year did the first settlers arrive to found St. George?',
            answers: ['1847', '1861', '1877', '1896'],
            correctIndex: 1,
          },
          {
            question: 'St. George got the nickname "Dixie" because settlers came here to grow…',
            answers: ['Apples', 'Wheat', 'Cotton', 'Potatoes'],
            correctIndex: 2,
          },
        ],
      },
    },
    {
      tag: 'cp2',
      title: 'The Cotton Field',
      story:
        'The first bolls have burst open and a storm is rolling in. Every bit of cotton left in the field will be ruined. Pick as fast as you can!',
      winText: 'Your sack is full just as the first drops fall.',
      loseText: 'The rain beats you to the last rows. Some of the crop is lost.',
      miniGame: { kind: 'speedTap', taps: 30, seconds: 10, label: 'Tap to pick cotton' },
    },
    {
      tag: 'cp3',
      title: 'The Stone Quarry',
      story:
        'The town needs stone for its buildings. The quarry crew left their tools in a jumble. Match the pairs so work can start before sundown.',
      winText: 'Every tool is back in its place. The stonecutters get to work.',
      loseText: 'The sun sets before the tools are sorted. Work starts late tomorrow.',
      miniGame: { kind: 'memory', symbols: ['⛏️', '🔨', '🪨', '🪵', '🐂', '🌵'], seconds: 60 },
    },
    {
      tag: 'cp4',
      title: 'The Water Ditch',
      story:
        'Nothing grows here without water. The settlers are digging ditches from the river to the fields, and the ditch boss wants to know you understand the land.',
      winText: 'Water trickles down the new ditch toward the fields. The valley turns green.',
      loseText: 'The ditch runs the wrong way and has to be dug again.',
      miniGame: {
        kind: 'trivia',
        questions: [
          {
            question: 'Which river flows past St. George?',
            answers: ['Colorado River', 'Green River', 'Virgin River', 'Snake River'],
            correctIndex: 2,
          },
          {
            question: 'What color is the sandstone the pioneers used for the St. George Tabernacle?',
            answers: ['Red', 'White', 'Gray', 'Black'],
            correctIndex: 0,
          },
        ],
      },
    },
    {
      tag: 'cp5',
      title: 'The Temple Hill',
      story:
        'Years from now a great white temple will stand here. For today, the town gathers to plan it. An old surveyor tests your memory of the town\'s history.',
      winText: 'The surveyor tips his hat. "You know this town better than most."',
      loseText: 'The surveyor sighs and repeats the lesson. Time slips away.',
      miniGame: {
        kind: 'trivia',
        questions: [
          {
            question: 'The St. George Temple was finished and dedicated in what year?',
            answers: ['1862', '1869', '1877', '1900'],
            correctIndex: 2,
          },
          {
            question: 'Which famous church leader kept a winter home in St. George?',
            answers: ['Brigham Young', 'Joseph Smith', 'John Wesley Powell', 'Jacob Hamblin'],
            correctIndex: 0,
          },
        ],
      },
    },
    {
      tag: 'boss',
      title: 'FINAL BOSS: The Great Flood',
      story:
        'January 1862. It has rained for weeks and the river has burst its banks, just like the real Great Flood of 1862. Water is racing toward the new fields and homes. ' +
        'Pile sandbags faster than the water can rise!',
      winText: 'The wall of sandbags holds. The town is saved!',
      loseText: 'The water breaks through, but everyone works together to save what they can.',
      miniGame: { kind: 'speedTap', taps: 60, seconds: 15, label: 'Tap to stack sandbags' },
    },
  ],
};
