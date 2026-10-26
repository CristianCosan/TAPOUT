// The opening (D-033): the night before at home, where packing is the kit choice, then the
// float-plane drop-off where the producer explains the game. Shown, not told: the story comes
// from things you look at and what people say, not from a page of text. Always "you".

import { SHOW } from './show.ts';

export interface IntroNote {
  /** What you are looking at. */
  title: string;
  /** What you read or notice when you click it. */
  text: string;
}

const prize = SHOW.prizeLabel;

export const INTRO_KITCHEN = {
  /** The first lines over the black, before the room fades in. */
  opening: ['The night before.', 'Your kitchen, ten past one in the morning.'],
  /** The line that tells you what to do here, once. */
  task: 'Everything you might take is spread over the table. The show allows ten things. Click an item to pack it.',
  packedLabel: (n: number, of: number) => `Packed ${n} of ${of}`,
  usualTen: 'Pack the usual ten',
  zip: 'Zip the pack',
  unpack: 'Click again to take it out.',
  /** Things in the room that tell you who you are. */
  notes: {
    letter: {
      title: 'The letter',
      text: `${SHOW.name}. "Congratulations, Daniel. You have been selected. Ten contestants, ten lakes, no crew. You film yourself. The last one standing wins ${prize}." You have read it so many times the folds have gone soft.`,
    },
    phone: {
      title: 'Your phone',
      text: 'Mara: "Pack the good socks. You have talked about doing something like this for six years. Go and find out. I\'ll be here." Then, a minute later: "Come home skinny and rich."',
    },
    photo: {
      title: 'The photo on the fridge',
      text: 'You and Mara at the lake two summers ago, sunburnt, laughing at something off camera. You take it down and slide it into the lid of the pack.',
    },
    machine: {
      title: 'The answering machine',
      text: 'One message. Your mother: "Daniel, it\'s Mum. I\'ve put a book about northern birds in the post, don\'t laugh. Your father says keep the axe sharp. Ring us before you go. Ring us when you\'re out."',
    },
    axeTag: {
      title: 'Your father\'s axe',
      text: 'The head is older than you are; the handle is the third one. A tag on the haft in his blocky lineman capitals: KEEP IT SHARP. DON\'T BE A HERO.',
    },
    window: {
      title: 'The window',
      text: 'Your own face in the black glass. Thirty-four. A long list of things you started and let go. You are not going to let go of this one.',
    },
  } satisfies Record<string, IntroNote>,
};

/**
 * What you brought from home, in the lid of the pack. Looking costs no time and changes
 * nothing: they are there to be looked at, never a mechanic (CLAUDE.md, partner rule).
 */
export const KEEPSAKES = {
  photo: {
    title: 'The photo of Mara',
    text: 'The one from the fridge. The corners have gone soft already. She is laughing at something off to the side, and you still cannot remember what it was.',
  },
  axeNote: {
    title: 'Dad\'s tag',
    text: 'You cut it off the axe handle so it would not snag, then could not throw it away. KEEP IT SHARP. DON\'T BE A HERO. His capitals lean to the right, like he is walking into wind.',
  },
  book: {
    title: 'Mum\'s bird book',
    text: 'It came the morning you left, with a library card for a bookmark. A pencil tick next to the gray jay. "Bold and curious. Will take food from the hand."',
  },
} satisfies Record<string, IntroNote>;

export interface DropoffLine {
  /** Who is speaking; empty for what you see. */
  who: string;
  text: string;
}

export const INTRO_DROPOFF = {
  producer: 'Kerry, the producer',
  lines: [
    { who: '', text: 'Dawn. The float plane ticks as its engine cools. The lake is huge and completely still.' },
    { who: 'Kerry', text: 'Right. This is you. Nearest person is twenty kilometres that way, and they are competing too.' },
    { who: 'Kerry', text: 'Ten of you went in this morning. You will not see any of them, and nobody will tell you how they are doing.' },
    { who: 'Kerry', text: 'This is the phone. Press the button and a boat comes for you. The moment you press it, it is over. No take-backs.' },
    { who: 'Kerry', text: 'Medics come out to check you now and then. If they say you are done, you are done.' },
    { who: 'Kerry', text: 'That camera is yours. Talk to it. People at home want to know what it is really like.' },
    { who: 'Kerry', text: `Winter comes fast up here. Last one standing takes ${prize}. Good luck, Dan.` },
    { who: '', text: 'The plane turns into the wind, lifts off the water and is gone. The engine lasts longer than you expect. Then nothing.' },
  ] satisfies DropoffLine[],
  /** The clock for the drop-off scene: just after first light. */
  hour: 7.6,
  dawn: 6.4,
  dusk: 19.4,
  title: SHOW.name,
  dayOne: 'Day 1',
  next: 'Continue',
  skip: 'Skip intro',
};

/**
 * The intro, spoken (rc.2). Recorded per phrase like Dan's thoughts (scripts/voice/render.py),
 * one file per id. Marks: ' / ' a beat, ' // ' a long beat, '~' a breath. Only people talking are
 * voiced (rc.3, D-081): Kerry has her own voice and Mum's message comes through the answering
 * machine. What you see and read stays written.
 */
export type IntroVoice = 'kerry' | 'mum' | 'mara';

export interface IntroClip {
  id: string;
  voice: IntroVoice;
  say: string;
  /** Through a phone line or an answering machine. */
  style?: 'phone';
}

const k = (id: string, say: string): IntroClip => ({ id: `intro-${id}`, voice: 'kerry', say });

export const INTRO_VOICE = {
  notes: {
    machine: [
      { id: 'intro-mum', voice: 'mum', style: 'phone', say: 'Daniel, it\'s Mum. / I\'ve put a book about northern birds in the post. / Don\'t laugh. // Your father says keep the axe sharp. // Ring us before you go. / Ring us when you\'re out.' },
    ],
  } satisfies Partial<Record<keyof typeof INTRO_KITCHEN.notes, IntroClip[]>>,
  /** One per drop-off line, in order; null where nobody is talking. */
  dropoff: [
    null,
    k('kerry-1', 'Right. / This is you. // Nearest person is twenty kilometres that way, / and they are competing too.'),
    k('kerry-2', 'Ten of you went in this morning. / You will not see any of them, // and nobody will tell you / how they are doing.'),
    k('kerry-3', 'This is the phone. / Press the button, / and a boat comes for you. // The moment you press it, / it is over. / No take-backs.'),
    k('kerry-4', 'Medics come out to check you now and then. // If they say you are done, / you are done.'),
    k('kerry-5', 'That camera is yours. / Talk to it. // People at home want to know / what it is really like.'),
    k('kerry-6', 'Winter comes fast up here. // Last one standing takes four hundred thousand dollars. // Good luck, Dan.'),
    null,
  ] satisfies Array<IntroClip | null>,
};
