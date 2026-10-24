// What Dan says to the show's camera, spoken (D-068): the out-loud half of the inner voice, the
// only voice out there. v12 builds each confessional from pieces (an opener, how today was, a
// closer, sometimes a word for home); every piece is recorded once and the game plays the pieces
// it finds in the text, in order. `text` is v12's own wording exactly, as the TAP / OUT cast makes
// it (Mara, the fear of failing); `say` is how it is read, with the same marks as thoughts.ts.

import { HOME_THREAD } from './home.ts';

export interface ConfessionClip {
  id: string;
  text: string;
  say: string;
}

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty'];

function words(n: number): string {
  return n < 20 ? ONES[n]! : TENS[Math.floor(n / 10)]! + (n % 10 ? `-${ONES[n % 10]}` : '');
}

/** The longest run v12 allows is well under this. */
const MAX_DAY = 60;

export const CONFESSION_CLIPS: readonly ConfessionClip[] = [
  ...Array.from({ length: MAX_DAY }, (_, i) => ({ id: `c-day-${i + 1}`, text: `Day ${i + 1}.`, say: `Day ${words(i + 1)}.` })),
  { id: 'c-again', text: 'Talking to this thing again.', say: 'Talking to this thing again.' },
  { id: 'c-watch', text: 'Not sure who ever actually watches these back.', say: 'Not sure who ever actually watches these back.' },
  { id: 'c-rolling', text: 'Camera\'s rolling, so - here goes.', say: 'Camera\'s rolling. / So, / here goes.' },
  { id: 'c-hungry', text: 'I\'m hungry in a way that doesn\'t really go away anymore.', say: 'I\'m hungry, / in a way that doesn\'t really go away anymore.' },
  { id: 'c-cold', text: 'Been cold pretty much since I woke up.', say: 'Been cold, pretty much since I woke up.' },
  { id: 'c-good', text: 'Honestly - feeling good today. Don\'t want to jinx it.', say: 'Honestly? / Feeling good today. // Don\'t want to jinx it.' },
  { id: 'c-bad', text: 'Not going to pretend today was fine. It wasn\'t.', say: 'Not going to pretend today was fine. // It wasn\'t.' },
  { id: 'c-wrist', text: 'This wrist is really slowing me down.', say: 'This wrist is really slowing me down.' },
  { id: 'c-ankle', text: 'This ankle is really slowing me down.', say: 'This ankle is really slowing me down.' },
  { id: 'c-kill', text: 'Took an animal today. Still sitting with that.', say: 'Took an animal today. // Still sitting with that.' },
  { id: 'c-marten', text: 'the sassy pine marten is getting bolder. I half-respect it at this point.', say: 'The sassy pine marten is getting bolder. // I half respect it, at this point.' },
  { id: 'c-plain', text: 'Nothing dramatic today. Just the work.', say: 'Nothing dramatic today. / Just the work.' },
  { id: 'c-for', text: 'Doing this for Mara, when it comes down to it.', say: 'Doing this for Mara. / When it comes down to it.' },
  { id: 'c-fear', text: 'Some days failing feels closer than others. Today it was close.', say: 'Some days, failing feels closer than others. // Today it was close.' },
  ...HOME_THREAD.lines.confess.map((text, i) => ({ id: `c-home-${i + 1}`, text, say: text.replace(': ', '. / ').replace('. I ', '. // I ') })),
];

/** The clips a confessional is made of, in the order they are said. Pieces it cannot find are skipped. */
export function confessionClips(text: string): ConfessionClip[] {
  const found: Array<{ at: number; clip: ConfessionClip }> = [];
  for (const clip of [...CONFESSION_CLIPS].sort((a, b) => b.text.length - a.text.length)) {
    const at = text.indexOf(clip.text);
    if (at < 0 || found.some((f) => at < f.at + f.clip.text.length && f.at < at + clip.text.length)) continue;
    found.push({ at, clip });
  }
  return found.sort((a, b) => a.at - b.at).map((f) => f.clip);
}
