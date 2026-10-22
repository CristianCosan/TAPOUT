// The parents / no-contact thread (plan §8.4). Before you went in you signed the production's
// form choosing not to be contacted, even in a family emergency. Most runs never touch this.
// When things get very hard for several nights it can start to surface, slowly, and at the end
// of it is the Waiver card. Plain and concrete: the form, the landline, Dad's knee. No crying
// scenes, no exclamation marks. Always "you". Never about Mara (the partner rule).

import type { HomeThread } from '@tapout/core';

export const HOME_THREAD: HomeThread = {
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
};
