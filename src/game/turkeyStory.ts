import { Scene } from './types';

// The Turkey Trot story: Chef Gobbleton, a grumpy turkey chef, is racing you
// for the runaway feast. At a few stops you choose to be kind to him or to beat
// him, which changes what he says next and how the story ends. One scene per
// stop (0 = Start, 9 = the Piecaken at the Finish), in three age versions.

export type StoryAge = 'kids' | 'teens' | 'adults';

export const CHEF = { emoji: '🦃', name: 'Chef Gobbleton' };

const pick = (kind: [string, string], bold: [string, string]) => [
  { label: kind[0], reply: kind[1], path: 'kind' },
  { label: bold[0], reply: bold[1], path: 'bold' },
];

export const SCENES: Record<StoryAge, Scene[]> = {
  kids: [
    {
      text: `Uh oh! A turkey in a tall chef hat just waddled by. That's Chef Gobbleton, the grumpiest cook in town. "That runaway feast is MINE," he squawks. "I'll catch every dish before you do!" The race is on!`,
    },
    {
      text: 'Chef Gobbleton is stuck in a bush, his hat tangled in the branches. "Hmph. I don\'t need any help," he grumbles.',
      choices: pick(
        ['🤝 Help him out', 'You untangle his hat. He turns bright red. "Th-thanks," he mumbles, and waddles off a little less grumpy.'],
        ['🏃 Zoom past him', 'You zip right by! "Hey! No fair!" he squawks, flapping his wings. You\'re in the lead!'],
      ),
    },
    {
      text: 'You spot feathers on the path. Chef Gobbleton was here!',
      ifPath: {
        kind: 'He left you a note: "Thanks for the help. Still racing you though!"',
        bold: 'He left you a note: "You got lucky. I\'m coming for you!"',
      },
    },
    {
      text: 'Chef Gobbleton is sitting on the curb, rubbing his tummy. "I\'m so hungry I can\'t run," he sighs.',
      choices: pick(
        ['🥨 Share a snack', 'You share a pretend snack. He gobbles it up and does a happy little dance!'],
        ['🎯 Race ahead', 'You dash ahead while he rests. He jumps up and yells, "Not again!"'],
      ),
    },
    {
      text: "Look! Chef Gobbleton's tall hat is sitting right by the tag.",
      ifPath: {
        kind: "Inside it is a drawing of you and him holding hands. Aww.",
        bold: 'Inside it is a sign that says "Next time I WIN!" with an angry turkey face.',
      },
    },
    {
      text: 'Chef Gobbleton has a big net and is tiptoeing toward the next dish!',
      choices: pick(
        ['🗣️ Ask to work together', '"Together?" He thinks really hard. "Okay. But I get the drumstick!" You shake on it.'],
        ['🫣 Sneak around him', 'You tiptoe right past his net. He spins around and catches... a leaf. Ha!'],
      ),
    },
    {
      text: 'You hear a gobble in the distance.',
      ifPath: {
        kind: '"Partner! Wait up!" Chef Gobbleton calls, waving his wooden spoon.',
        bold: '"You can\'t hide from me!" Chef Gobbleton yells from behind a mailbox.',
      },
    },
    {
      text: 'Chef Gobbleton is stirring a pretend pot all by himself. He looks a teeny bit lonely.',
    },
    {
      text: 'Almost home! Chef Gobbleton is waiting by the tag, tapping his foot. "The Piecaken is the best part. So who gets it?"',
      choices: pick(
        ['🍰 We share it!', 'His eyes get big and wobbly. "Nobody ever shares with me."'],
        ['🏁 Race you for it!', '"You\'re ON!" he squawks, and off you both go!'],
      ),
    },
    {
      text: 'The Piecaken is at the finish, and so is Chef Gobbleton!',
      ifPath: {
        kind: "He's holding the door open for you.",
        bold: "He's running as fast as his little turkey legs can go!",
      },
    },
  ],

  teens: [
    {
      text: `A turkey in a chef's coat skids up on a scooter. "Name's Chef Gobbleton. That runaway feast? It's going in my pop-up restaurant. Try to keep up." And he's gone.`,
    },
    {
      text: 'Chef Gobbleton is filming himself for his cooking channel. "Smash that like button, gobblers!"',
      choices: pick(
        ['📱 Hype up his video', 'You give him a big thumbs up on camera. He\'s actually touched. "Okay, okay. You\'re cool."'],
        ['🎬 Photobomb it', 'You photobomb with your goofiest face. The video goes viral. He is NOT happy.'],
      ),
    },
    {
      text: "His scooter is parked here, but there's no sign of the Chef.",
      ifPath: {
        kind: 'There\'s a sticky note on it: "Subscribed to YOU now. Still gonna win though."',
        bold: 'There\'s a sticky note on it: "Viral for the wrong reasons. You\'ll pay for this."',
      },
    },
    {
      text: "Chef Gobbleton's scooter has a flat tire. He's pretending he meant to stop.",
      choices: pick(
        ['🔧 Help fix the tire', 'You help patch it up. He mutters, "I totally had that." He did not.'],
        ['💨 Take the shortcut', 'You cut through and leave him behind. In the distance: furious gobbling.'],
      ),
    },
    {
      text: "Chef Gobbleton's secret recipe card is stuck by the tag.",
      ifPath: {
        kind: 'On the back it says: "For my rival. Don\'t tell anyone the secret is butter."',
        bold: 'On the back it says: "Nice try. This is a fake recipe."',
      },
    },
    {
      text: 'Chef Gobbleton has an offer. "Help me catch the next dish and I\'ll give you a cut of the pop-up profits."',
      choices: pick(
        ['🤝 Team up', 'You shake on it. His wing handshake is weirdly firm.'],
        ['🙅 Go solo', '"Your loss," he says, adjusting his chef hat dramatically.'],
      ),
    },
    {
      text: 'Gobbling echoes down the street.',
      ifPath: {
        kind: '"Partner! I saved you a spot in line!"',
        bold: '"You may be fast, but I have a scooter!"',
      },
    },
    {
      text: 'Chef Gobbleton is staring off into the distance. "My grandma made the best Thanksgiving. I just want to cook like her."',
    },
    {
      text: 'The finish is close, and Chef Gobbleton is blocking the path. "The Piecaken is the star of my pop-up. Final offer: let me have it."',
      choices: pick(
        ['🍰 Split it', '"Split it?" He blinks. "That\'s... actually what Grandma would do."'],
        ['🏁 Winner takes all', '"Then it\'s a race!" He revs his scooter. It makes a sad little beep.'],
      ),
    },
    {
      text: 'The Piecaken is waiting at the finish. So is your rival.',
      ifPath: {
        kind: "He's cheering you on.",
        bold: "He's revving his scooter.",
      },
    },
  ],

  adults: [
    {
      text: `A turkey in a stained chef's coat steps out of the bushes holding a clipboard. "Chef Gobbleton. Professional caterer. That runaway feast was MY catering order, and I am not issuing refunds." He leaves at a brisk, offended waddle.`,
    },
    {
      text: 'Chef Gobbleton is on the phone with his insurance company. "No, the turkey is fine. I AM the turkey."',
      choices: pick(
        ['☕ Bring him a coffee', 'You hand him a coffee. He looks at you like nobody has been nice to him since 2019.'],
        ['📋 Swipe his clipboard', "You lift his clipboard. It's a list of everyone who ever doubted him. You're on it now."],
      ),
    },
    {
      text: "His catering cart is abandoned here.",
      ifPath: {
        kind: 'There\'s a note: "Thank you for the coffee. Still suing the gravy."',
        bold: 'There\'s a note: "I know you have my clipboard. I have copies."',
      },
    },
    {
      text: 'Chef Gobbleton is wrestling a folding table that refuses to unfold. The table is winning.',
      choices: pick(
        ['🪑 Help with the table', 'Together you defeat the table. He wipes away a tear. "It\'s been a hard season."'],
        ['🚶 Keep walking', 'You walk on. Behind you, the sound of a turkey losing to furniture.'],
      ),
    },
    {
      text: 'His catering menu is pinned up by the tag. It is very ambitious for a bird.',
      ifPath: {
        kind: 'Someone has written your name next to "Guest of Honor."',
        bold: 'Someone has written your name next to "Banned for Life."',
      },
    },
    {
      text: 'Chef Gobbleton proposes a merger. "You do the running, I do the cooking, and we split the glory 70/30. My favor."',
      choices: pick(
        ['🤝 Accept the merger', 'You sign. Your lawyer is a squirrel. It holds up in court anyway.'],
        ['📉 Hostile takeover', 'You counter with 100/0. He respects it. He hates it, but he respects it.'],
      ),
    },
    {
      text: 'A distant, bitter gobble.',
      ifPath: {
        kind: '"Business partner! I drafted us a mission statement!"',
        bold: '"You can\'t outrun the catering industry!"',
      },
    },
    {
      text: 'Chef Gobbleton is sitting on a curb. "You know what nobody asks the turkey on Thanksgiving? How he\'s doing."',
    },
    {
      text: 'The finish is in sight. Chef Gobbleton waits with his arms crossed. "The Piecaken is the centerpiece. I need this."',
      choices: pick(
        ['🍰 Give him the credit', '"You\'d... put my name on it?" He is visibly moved. Or it\'s allergies.'],
        ['🏁 It\'s mine', '"Fine. May the best bird win," he says, though only one of you is a bird.'],
      ),
    },
    {
      text: 'The Piecaken waits at the finish. So does a very determined caterer.',
      ifPath: {
        kind: "He's holding a serving tray, ready to plate it with you.",
        bold: "He's stretching his hamstrings. Do turkeys have hamstrings? Apparently.",
      },
    },
  ],
};

export const ENDINGS: Record<StoryAge, Record<string, string>> = {
  kids: {
    kind: "Chef Gobbleton isn't grumpy anymore! He joins your family for dinner, wears his tall hat, and makes everyone laugh. Best Thanksgiving ever! 🦃❤️",
    bold: 'You beat Chef Gobbleton to every dish! He huffs and puffs... then you give him a slice of Piecaken anyway. He smiles. "Rematch next year!" 🦃🏆',
    tie: "You and Chef Gobbleton raced, laughed, and helped each other. Now you're best frenemies. He's coming to dinner, and he's bringing the gravy. 🦃🍽️",
  },
  teens: {
    kind: 'Chef Gobbleton opens his pop-up with you as co-owner. The menu says "Grandma\'s recipes, with a little help from a friend." Five stars. 🦃⭐',
    bold: 'You beat Chef Gobbleton fair and square. His video "I LOST TO A KID" gets a million views. He sends you a thank-you note anyway. 🦃🏆',
    tie: 'Rivals? Friends? Somewhere in between. Chef Gobbleton saves you a seat at his pop-up every Thanksgiving. Free gravy for life. 🦃🍽️',
  },
  adults: {
    kind: 'Chef Gobbleton is now a guest at your table instead of on it, which he considers a major career win. He brings a five-course gravy flight. 🦃🥂',
    bold: 'You beat Chef Gobbleton to every dish. He files a formal complaint with the Thanksgiving Board, which does not exist. You send him leftovers. He eats them. 🦃🏆',
    tie: 'You and Chef Gobbleton agree to a truce, a catering contract, and absolutely no more running. It is the healthiest relationship at the table. 🦃🍽️',
  },
};
