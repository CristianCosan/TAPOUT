// TAP / OUT letters and the call home (plan §8.3, §8.4, M18), behind RULES.letters. Not v12
// code. You can write a letter you will not send, to Mara or to your parents, once a day at
// your pack; it steadies you a little and never costs resolve (the partner rule). The letter
// to your parents is once per run and eases thoughts of home. At the end of a run, before the
// final screen, comes the call home. Words come from content through the run's cast.

import { clamp, pick } from './helpers.ts';
import type { CallHome, HomeLetters, HomeState, HomeThread } from './home.ts';
import { gate, type PanelEntry } from './panel.ts';
import { resolveDelta } from './resolve.ts';
import { RULES } from './rules.ts';
import { log } from './setup.ts';
import { S } from './state.ts';
import { afterAction, spend } from './threads.ts';
import { showFinalStatsScreen } from './endings.ts';
import { showModal, typewriterInto } from './ui.ts';

function words(): HomeThread | null {
  return (S.cast?.home as HomeThread | undefined) ?? null;
}
function letterWords(): HomeLetters | null {
  return RULES.letters ? (words()?.letters ?? null) : null;
}

const wroteToParents = () => (S.letters ?? []).some((l: { trigger: string }) => l.trigger === 'toParents');

/** TAP / OUT's own panel buttons, beside v12's BUTTONS. */
export const LETTER_BUTTONS = [
  { id: 'a-letterPartner', loc: 'camp', onclick: "actWriteLetter('partner')" },
  { id: 'a-letterParents', loc: 'camp', onclick: "actWriteLetter('parents')" },
] as const;

/** The two letter buttons, added to v12's action panel at the pack. */
export function letterPanel(): PanelEntry[] {
  const w = letterWords();
  if (!w) return [];
  const today = S.letterDay === S.day;
  const entry = (id: string, label: string, fn: string, hidden: boolean): PanelEntry => {
    const [ok, sub] = today ? [false, w.today] : gate(1, 0.5, true, '', `−{c}⚡ · 30min · ${w.detail}`);
    return { id, label, onclick: fn, loc: 'camp', visible: !hidden && S.loc === 'camp', enabled: !!ok && !S.over, detail: String(sub) };
  };
  return [
    entry(LETTER_BUTTONS[0].id, w.toPartner, LETTER_BUTTONS[0].onclick, false),
    entry(LETTER_BUTTONS[1].id, w.toParents, LETTER_BUTTONS[1].onclick, wroteToParents()),
  ];
}

function partnerLine(w: HomeLetters): string {
  const p = w.partner;
  const pool = S.hunger < 30 ? p.hungry : S.warmth < 35 ? p.cold : S.morale < 35 ? p.low : S.morale > 65 ? p.good : p.plain;
  const used = new Set((S.letters ?? []).map((l: { text: string }) => l.text));
  const fresh = pool.filter((t) => !used.has(t));
  const all = [...p.plain, ...p.good, ...p.low, ...p.cold, ...p.hungry].filter((t) => !used.has(t));
  return (pick(fresh.length ? fresh : all.length ? all : pool) as string);
}

/** The line before a letter. Saves from builds 0.0.10 to 0.0.17 lost it (it was a function), so it may be missing. */
function heading(w: HomeLetters, to: string): string {
  return typeof w.heading === 'string' ? `${w.heading.replace('{to}', to)} ` : '';
}

export function actWriteLetter(to?: string) {
  const w = letterWords();
  if (!w || S.over || S.letterDay === S.day) return;
  if (to === 'parents' && wroteToParents()) return;
  if (!spend(1, 0.5, false)) return;
  S.letterDay = S.day;
  const notes: string[] = [];
  let text: string;
  if (to === 'parents') {
    const home = S.home as HomeState | undefined;
    text = home && home.stage >= 1 ? w.parents.worried : w.parents.plain;
    if (home) home.pressure = clamp(home.pressure - w.parentsRelief);
    resolveDelta(2, notes);
    S.letters.push({ day: S.day, trigger: 'toParents', text, written: true });
    log(`${heading(w, 'Mum and Dad')}<span class="equote">"${text}"</span>`, 'good');
  } else {
    text = partnerLine(w);
    S.morale = clamp(S.morale + 3);
    resolveDelta(2, notes);
    S.letters.push({ day: S.day, trigger: 'toPartner', text, written: true });
    log(`${heading(w, S.cast.partner)}<span class="equote">"${text}"</span> (+3 morale)`, 'good');
  }
  notes.forEach((n) => log(n, 'event'));
  afterAction('letter');
}

/** The call home, between the ending and the final screen. */
export function showCallHome(kind?: string) {
  const call: CallHome | undefined = RULES.letters ? words()?.callHome : undefined;
  if (!call || S.deathSource === 'violent') {
    showFinalStatsScreen(kind);
    return;
  }
  const home = S.home as HomeState | undefined;
  const parents = (home && home.stage >= 2) || wroteToParents();
  const text = kind === 'win'
    ? call.winParents
    : `${call.partner[(kind as 'tap' | 'med' | 'dead')] ?? call.partner.tap}${parents ? ` ${call.parentsAfter}` : ''}`;
  showModal(`<h3>${call.title}</h3><div class="wsub tw" id="twHome" onclick="skipTypewriter('twHome')"></div><button class="mbtn" onclick="hideModal(); showFinalStatsScreen('${kind}')">Continue</button>`);
  typewriterInto('twHome', text, 16);
}
