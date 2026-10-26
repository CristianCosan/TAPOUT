// The win (rc.3, D-082): nobody tells you the others are gone, so it arrives as one more med
// check. The boat comes in, Kerry steps off, and Mara is with her. Spoken lines are recorded like
// the intro (scripts/voice/render.py); what you see stays written.

import type { IntroClip } from './intro.ts';
import { SHOW } from './show.ts';

export interface WinLine {
  /** Who is talking; empty for what you see. */
  who: '' | 'Kerry' | 'Mara' | 'Medic';
  text: string;
  /** The recording, when someone is talking aloud to you. */
  clip?: IntroClip;
}

const kerry = (id: string, say: string): IntroClip => ({ id: `win-${id}`, voice: 'kerry', say });
const mara = (id: string, say: string): IntroClip => ({ id: `win-${id}`, voice: 'mara', say });

export const WIN_SCENE = {
  names: { Kerry: 'Kerry, the producer', Mara: 'Mara', Medic: 'The medic' },
  lines: [
    { who: '', text: 'First light. An outboard motor, somewhere past the point. The med boat, the way it comes every week or so.' },
    { who: 'Medic', text: 'Morning, Dan. Sit down for me. Pulse, eyes, hands. You know the drill.' },
    { who: '', text: 'Someone else is climbing out behind him. A red parka. Kerry, who has not been out here since the first morning.' },
    { who: 'Kerry', text: 'This one is not a check, Dan. Well, it is. You pass.', clip: kerry('kerry-1', 'This one is not a check, Dan. // Well, / it is. // You pass.') },
    { who: 'Kerry', text: 'The last of the others went home a few days ago. You are the only one left out here. You won.', clip: kerry('kerry-2', 'The last of the others went home / a few days ago. // You are the only one left out here. // You won.') },
    { who: '', text: 'There is a third person in the boat, in a borrowed float coat far too big for her. She is already over the side and running up the stones.' },
    { who: 'Mara', text: 'Hey, you. You look terrible.', clip: mara('mara-1', 'Hey, you. // ~ You look terrible.') },
    { who: 'Mara', text: 'I said come home skinny and rich. You did both.', clip: mara('mara-2', 'I said come home skinny and rich. // You did both.') },
    { who: '', text: 'She holds on for a long time. Neither of you says much. The camera is still running. You let it.' },
    { who: 'Kerry', text: `Take your time. The plane is waiting at the narrows. ${SHOW.prizeLabel}, Dan.`, clip: kerry('kerry-3', 'Take your time. // The plane is waiting at the narrows. // Four hundred thousand dollars, / Dan.') },
  ] satisfies WinLine[],
  /** The line where Mara steps into view. */
  maraFrom: 5,
  /** The line where Kerry steps off the boat. */
  kerryFrom: 2,
  hour: 8.2,
  next: 'Continue',
};

export const WIN_VOICE: IntroClip[] = WIN_SCENE.lines.flatMap((l: WinLine) => (l.clip ? [l.clip] : []));
