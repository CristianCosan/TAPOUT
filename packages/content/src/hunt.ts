// rc.5 (Sir): hunting you can see. Dan says it aloud when he finds sign, the trail lies on the
// ground for you to follow, and the shot is drawn and loosed by hand. The odds are v12's.

export interface HuntLine {
  id: string;
  say: string;
}

const lines = (key: string, says: string[]): HuntLine[] => says.map((say, i) => ({ id: `h-${key}-${i}`, say }));

/** Spoken when a hunt changes state, one version picked at random. */
export const HUNT_VOICE: Record<'tracks' | 'hot' | 'spotted' | 'lost' | 'hit' | 'miss', HuntLine[]> = {
  tracks: lines('tracks', [
    'Tracks. / ~ A day old, maybe less.',
    'Hang on. // Prints. Heading up the ridge.',
    'Something came through here. / Not long ago.',
    'There. In the mud. // Big ones.',
  ]),
  hot: lines('hot', [
    'The grass is still flat. / ~ It was right here.',
    'Steam off the droppings. // It is close. Really close.',
    'Fresh. / So fresh. // Quiet now.',
  ]),
  spotted: lines('spotted', [
    'There. // Don\'t move.',
    '~ Oh. / There you are.',
    'Easy. / Easy. // It hasn\'t seen me.',
    'Right there in the willows.',
  ]),
  lost: lines('lost', [
    'Gone. / ~ The ground just stops telling me anything.',
    'Lost it. // Stony ground.',
    'Nothing. / It\'s gone.',
  ]),
  hit: lines('hit', [
    '~ Got it. // Got it.',
    'That was a good arrow.',
  ]),
  miss: lines('miss', [
    'No. / No no no.',
    '~ Too high. // It\'s off.',
  ]),
};

export const HUNT_TEXT = {
  trail: 'The trail',
  follow: 'Follow it',
  aimTitle: 'Draw',
  aimHint: 'Breathe out. Click to loose.',
  aimCancel: 'Lower the bow',
  noBow: 'Without the bow there is no shot.',
} as const;
