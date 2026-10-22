// The parents / no-contact thread (plan §8.4). Before you went in you signed the production's
// form choosing not to be contacted, even in a family emergency. Most runs never touch this.
// When things get very hard for several nights it can start to surface, slowly, and at the end
// of it is the Waiver card. Plain and concrete: the form, the landline, Dad's knee. No crying
// scenes, no exclamation marks. Always "you". Never about Mara (the partner rule).

import type { HomeThread } from '@tapout/core';

export const HOME_THREAD: Required<HomeThread> = {
  tuning: {
    gateScore: 4,
    gateNights: 3,
    rise: [8, 14],
    catalyst: 10,
    decay: 10,
    stages: [35, 55, 75, 90],
    beatGap: 2,
    drain: [0.2, 0.4],
    confess: 12,
    sit: 4,
    accepted: { pressure: 30, resolve: 6 },
    witnessed: { pressure: 40, resolve: 4 },
    cardReturn: 3,
    breakScore: 4,
    breakNights: 2,
  },
  lines: {
    stage1: [
      "Your mother's birthday is this week, or near it. You'll miss it. That's fine. You told her you would.",
      "You think of your dad's truck in the drive, the dent in the tailgate that never got fixed. Then the thought goes, the way they do out here.",
      "The landline at your parents' place has a ring you could pick out of a hundred. No reason to think of it. You do anyway.",
    ],
    stage2: [
      'The form comes back to you. Contact in a family emergency: a box, and you ticked No. You signed it on the hood of the car, quickly, to be done with it.',
      'No contact means no contact, the producer said. Not even if something happens at home. You said fine. You remember how easy it was to say.',
      'You try to remember whether you read that page or only signed it. You signed it. That part you remember.',
    ],
    stage3: [
      'Your dad is sixty-six. You do the arithmetic without wanting to. The knee, the basement stairs, that ladder up to the gutters every autumn.',
      "In the summer your mum mentioned Dad's cough, the way she mentions things, in passing, so it does not count. It counts now.",
    ],
    dream3: ['You dream the landline is ringing in your parents\' hallway and nobody is home to answer it. It rings all night.'],
    accepted: [
      'You think of the road out to your parents\' place and let it be just a road. You chose this. They know you did.',
      'Your mum will be at the library about now, stamping returns. Good. That is where she should be.',
    ],
    confess: [
      'And if Mum and Dad ever see this: I am fine. I think about you. I signed the form so you would not worry, and I know you are worrying anyway.',
      'Dad, stay off the ladder. That is the whole message.',
    ],
    condition: {
      title: '🏠 Thoughts of home',
      stage2:
        'The no-contact form keeps coming back to you. While things stay this hard it wears a little at your resolve each night. Talking to the camera or a quiet sit eases it; steadier days ease it most.',
      stage3:
        'You keep doing the arithmetic on your parents\' ages. While things stay this hard it wears at your resolve each night. Talking to the camera or a quiet sit eases it; steadier days ease it most.',
    },
    card: {
      title: 'The waiver',
      scene:
        'You signed away the call. If something happened at home, you would not hear about it until you walked out of here. Tonight that is the only thing you can think about.',
      accept: 'I chose this. They know I chose it.',
      acceptText: 'Verdict: you said it out loud to nobody. It was true when you signed it and it is true now. It sits easier.',
      witness: 'Say it to the camera, for them.',
      witnessText: 'Verdict: you tell the lens about the knee, the ladder, the landline. If they ever watch it, they will know you were thinking of them.',
      phone: "I need to know they're okay.",
      later: 'Not now.',
      laterText: 'You put it down for tonight. It will still be there.',
    },
    forcedTap: 'your parents, and the form you signed so quickly, and the call you made sure nobody could make',
  },
  letters: {
    toPartner: '✉️ Write to Mara',
    toParents: '✉️ Write to Mum and Dad',
    detail: 'A letter you will not send. It helps to write it anyway.',
    /** Writing to your parents eases thoughts of home by this much (once per run). */
    parentsRelief: 25,
    once: 'written',
    today: 'you wrote today',
    heading: (to: string) => `✉️ You write to ${to}, on the back of a page from the notebook. You will not send it.`,
    partner: {
      hungry: [
        'Dear Mara. I think about your kitchen more than I should. The good pan, the window over the sink. Save me a plate of anything. Anything at all.',
        'Mara. I am thinner than you have ever seen me. You would laugh, then you would feed me. Both sound good from here.',
      ],
      cold: [
        'Mara. It is cold enough now that I sleep in everything I own. I keep thinking of your feet on my legs in January and how I used to complain. I take it back.',
        'Dear Mara. The fire went out twice last night. I lay there thinking about the radiator under our window. I am fine. I just wanted to tell someone about the radiator.',
      ],
      low: [
        'Mara. Some days are harder than I said they would be. You told me to go and find out. I am finding out. I am still here.',
        'Dear Mara. Not a good day. I am writing so that the day has one good thing in it, which is this.',
      ],
      good: [
        'Mara. There was a moose in the narrows this morning and nobody to tell. So I am telling you. You would have loved it.',
        'Dear Mara. A good day, for once. I wanted you to have a letter from one of those too.',
      ],
      plain: [
        'Dear Mara. Nothing big today. Wood, water, the usual. I miss the small things most, like arguing over the radio in the car.',
        'Mara. I talk to you in my head while I work. You are better company than the camera. Do not tell the camera.',
      ],
    },
    parents: {
      plain: 'Mum, Dad. I am fine. It is beautiful here and very cold. Dad, the axe is sharp. Mum, I saw the gray jay from your book. I will ring you the day I am out.',
      worried:
        'Mum, Dad. I signed a form before I came that said nobody could reach me, even if something happened at home. I did it so you would not worry about me worrying. I think about you every day. Dad, stay off the ladder. I will ring the day I am out.',
    },
  },
  callHome: {
    title: 'The call home',
    partner: {
      tap: 'The crew hands you a phone in the boat. Mara picks up on the second ring. "Are you okay?" You say yes, and then you say it properly. She is quiet for a moment. "Come home," she says. "I have been saving you a plate."',
      med: 'They let you call from the clinic. Mara picks up before it rings. "They told me," she says. "I don\'t care. I don\'t care at all. You\'re coming home."',
      dead: 'When you can hold a phone again, the nurse dials it for you. Mara is crying and laughing at once. "You idiot," she says. "You absolute idiot. Stay there. I am getting in the car."',
    },
    winParents: 'From the boat you ask to use the sat phone one last time. The landline rings in your parents\' hallway, the ring you could pick out of a hundred. Your dad answers. "It\'s me," you say. "I won." There is a long pause. "Well," comes the answer, and the voice on the line does something it has never done. "Well. Come home, then."',
    parentsAfter: 'Then you ring the landline. Your mum picks up on the first ring, as if she has been sitting next to it for a month. Maybe she has. "Hello, love," she says. "Your father is right here."',
  },
};

