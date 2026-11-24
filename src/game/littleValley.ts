import { Site, turkeyTrotFor } from './turkeyTrot';
import { Game } from './types';

// Szabo - Little Valley 5k in St. George, set up 2026-11-24 for Salem's friend
// Jason Szabo. Same Thanksgiving Turkey Trot as Painted Hills, with its own
// spots and clues, and an ice cream stop at the Alumni Creamery.
export const LITTLE_VALLEY: Site = {
  idPrefix: 'szabo-little-valley',
  location: 'Szabo - Little Valley 5k',
  family: "the Szabos'",
  town: 'St. George',
  spots: {
    cp1: { latitude: 37.0491775, longitude: -113.537034 }, // start, 2289 E 3480 S (from the street address)
    cp2: { latitude: 37.049199, longitude: -113.538015 }, // stop sign
    cp3: { latitude: 37.053613, longitude: -113.538149 }, // honey locust tree
    cp4: { latitude: 37.055109, longitude: -113.540902 }, // light pole
    cp5: { latitude: 37.055686, longitude: -113.536538 }, // bench
    cp6: { latitude: 37.055812, longitude: -113.535485 }, // under the pavilion
    cp7: { latitude: 37.056093, longitude: -113.530553 }, // crosswalk sign
    cp8: { latitude: 37.0508219, longitude: -113.5224247 }, // Alumni Creamery door
    cp9: { latitude: 37.049767, longitude: -113.533923 }, // tree in the church parking lot
    boss: { latitude: 37.049262, longitude: -113.536989 }, // metal gate to the backyard
  },
  startClue: "Your first tag is at the start, at the Szabos' house. Tap it to grab your plate!",
  clues: [
    'Head for the stop sign. The tag is on the sign.',
    'Find the honey locust tree nearby. The tag is on the tree.',
    'Look for the light pole. The tag is on it.',
    'Find the bench. The tag is on the bench.',
    'Head under the pavilion. The tag is under there.',
    'Find the crosswalk sign. The tag is attached to it.',
    "Walk to the Alumni Creamery. The tag is near the door. (Hungry? You'll have a choice to make.)",
    'Head to the church parking lot. The tag is on a tree.',
    "Head home! The final boss is waiting at the metal gate to the Szabos' backyard.",
  ],
  overrides: {
    7: {
      title: 'The Alumni Creamery',
      prize: { emoji: '🍦', name: 'a scoop of ice cream' },
      story:
        "The dessert course made a run for it and ended up at the Alumni Creamery. Since you're here, you might think about stopping for a scoop. No pressure, just an option.",
      winText: 'Back on the trail!',
      loseText: 'Back on the trail, with a little less dignity.',
      miniGame: {
        kind: 'choice',
        question: 'Want to stop for ice cream?',
        yesLabel: '🍦 Yes, treat me!',
        noLabel: '✋ No thanks',
        yesText:
          "Yes! Congratulations on treating yourself (and maybe your loved ones), supporting a local business, taking care of your needs, and your rare ability to stop and really enjoy life. You made the right call. The clock is paused, so stay here for 4 minutes and enjoy it.",
        noText:
          "High five! You made the right call. You rejected consumerism. You showed real self-control by not indulging. Your frugality is inspiring. And your poor planning proves you're all business, with no time to waste on trivial things like ice cream.",
        stayMinutes: 4,
        bonus: 60,
      },
    },
  },
};

export const littleValleyGames: Game[] = turkeyTrotFor(LITTLE_VALLEY);
