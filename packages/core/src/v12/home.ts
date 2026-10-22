// TAP / OUT's parents / no-contact thread (plan §8.4), behind RULES.homeThread. Not v12 code:
// in v12 mode none of this runs, and no state is created, so parity is untouched.
//
// Each night a severity score is read from v12's own state. Two bad nights in a row open the
// gate; while it is open pressure builds and the thread moves through four stages, one beat at
// a time, at most every couple of days. Stages 2 and 3 wear a little at resolve through v12's
// own resolveDelta. Stage 4 is the Waiver card. The words and numbers come from content
// through the run's cast; a run without them (an old save, a v12 run) has no thread.

import { CARDS } from './cards.ts';
import { clamp, pick } from './helpers.ts';
import { pushModifier, removeModifier } from './modifiers.ts';
import { resolveDelta } from './resolve.ts';
import { rand } from './runtime.ts';
import { RULES } from './rules.ts';
import { sensitivityMul } from './setup.ts';
import { S } from './state.ts';

export interface HomeTuning {
  gateScore: number;
  gateNights: number;
  rise: [number, number];
  catalyst: number;
  decay: number;
  stages: [number, number, number, number];
  beatGap: number;
  drain: [number, number];
  confess: number;
  sit: number;
  accepted: { pressure: number; resolve: number };
  witnessed: { pressure: number; resolve: number };
  cardReturn: number;
  breakScore: number;
  breakNights: number;
}

export interface HomeLines {
  stage1: readonly string[];
  stage2: readonly string[];
  stage3: readonly string[];
  dream3: readonly string[];
  accepted: readonly string[];
  confess: readonly string[];
  condition: { title: string; stage2: string; stage3: string };
  card: { title: string; scene: string; accept: string; acceptText: string; witness: string; witnessText: string; phone: string; later: string; laterText: string };
  forcedTap: string;
}

/** Letters you write yourself (rule letters). */
export interface HomeLetters {
  toPartner: string;
  toParents: string;
  detail: string;
  parentsRelief: number;
  once: string;
  today: string;
  heading: (to: string) => string;
  partner: { hungry: readonly string[]; cold: readonly string[]; low: readonly string[]; good: readonly string[]; plain: readonly string[] };
  parents: { plain: string; worried: string };
}

/** The call home at the end of a run (rule letters). */
export interface CallHome {
  title: string;
  partner: { tap: string; med: string; dead: string };
  winParents: string;
  parentsAfter: string;
}

/** The thread's words and numbers (content's HOME_THREAD). */
export interface HomeThread {
  tuning: HomeTuning;
  lines: HomeLines;
  letters?: HomeLetters;
  callHome?: CallHome;
}

export interface HomeState {
  stage: number;
  pressure: number;
  /** Nights in a row at or above the gate score. */
  gateNights: number;
  /** Nights in a row at or above the break score. */
  breakNights: number;
  lastBeatDay: number;
  seen: string[];
  closure: 'none' | 'accepted' | 'witnessed';
  cardShown: boolean;
  cardDeclinedDay: number;
  cardReturned: boolean;
  zeroMoraleDays: number;
  medWarnings: number;
  hadArc: boolean;
  /** This thread pulled the trigger on a forced tap-out. */
  forced: boolean;
}

const CONDITION_ID = 'thoughtsOfHome';

function content(): HomeThread | null {
  return (S.cast?.home as HomeThread | undefined) ?? null;
}

/** The thread's state, created the first time it is needed (TAP / OUT runs with content only). */
export function homeState(): HomeState | null {
  if (!RULES.homeThread || !content()) return null;
  if (!S.home) {
    const h: HomeState = {
      stage: 0, pressure: 0, gateNights: 0, breakNights: 0, lastBeatDay: -99, seen: [], closure: 'none',
      cardShown: false, cardDeclinedDay: 0, cardReturned: false, zeroMoraleDays: 0,
      medWarnings: S.medWarnings || 0, hadArc: !!S.medicalArc, forced: false,
    };
    S.home = h;
  }
  return S.home as HomeState;
}

/** The severity score from v12's own state (plan §8.4 table). */
export function homeSeverity(): number {
  const h = S.home as HomeState | undefined;
  let score = ({ Wavering: 1, Cracking: 2, Breaking: 3 } as Record<string, number>)[S.resolveState] ?? 0;
  if (S.morale < 25) score += 1;
  if (S.stress > 75) score += 1;
  const worries = Object.values(S.conditions ?? {}).filter((c) => (c as { active?: boolean }).active).length;
  if (worries >= 2) score += 1;
  if ((h?.zeroMoraleDays ?? 0) >= 2) score += 1;
  return score;
}

export function homeGateOpen(): boolean {
  const h = S.home as HomeState | undefined;
  const c = content();
  return !!h && !!c && h.gateNights >= c.tuning.gateNights;
}

/** A line not yet shown this run from a pool, or null when all are used. */
function fresh(pool: readonly string[], key: string): string | null {
  const h = S.home as HomeState;
  const unseen = pool.map((text, i) => ({ text, id: `${key}${i}` })).filter((l) => !h.seen.includes(l.id));
  if (!unseen.length) return null;
  const line = pick(unseen) as { text: string; id: string };
  h.seen.push(line.id);
  return line.text;
}

function condition(stage: number): void {
  const c = content()!;
  if (stage >= 3) pushModifier(CONDITION_ID, c.lines.condition.title, c.lines.condition.stage3, 'neg');
  else if (stage === 2) pushModifier(CONDITION_ID, c.lines.condition.title, c.lines.condition.stage2, 'neg');
  else removeModifier(CONDITION_ID);
}

/** The nightly step, run at dawn from finishNight before the breaking point is checked. */
export function homeThreadTick(notes: string[]): void {
  const h = homeState();
  if (!h || S.over) return;
  const { tuning: t, lines } = content()!;

  h.zeroMoraleDays = S.morale <= 0 ? h.zeroMoraleDays + 1 : 0;
  const score = homeSeverity();
  h.gateNights = score >= t.gateScore ? h.gateNights + 1 : 0;
  h.breakNights = score >= t.breakScore ? h.breakNights + 1 : 0;
  const open = h.gateNights >= t.gateNights;

  // One-time pushes: a rival going home for family, a medical warning, your own arc.
  let push = 0;
  if (S._rivalTappedTonight && (S.rivalOrder ?? []).some((r: { day: number; reason: string }) => r.day === S.day && /family/.test(r.reason))) push += t.catalyst;
  if ((S.medWarnings || 0) > h.medWarnings) push += t.catalyst;
  h.medWarnings = S.medWarnings || 0;
  if (S.medicalArc && !h.hadArc) push += t.catalyst;
  h.hadArc = !!S.medicalArc;

  if (open) h.pressure = clamp(h.pressure + (t.rise[0] + rand() * (t.rise[1] - t.rise[0])) * sensitivityMul() + push);
  else h.pressure = clamp(h.pressure - t.decay + push);

  if (open && h.stage >= 2) resolveDelta(-(h.stage >= 3 ? t.drain[1] : t.drain[0]), notes);

  // Beats: one stage at a time, never back, at most every few days, only while the gate is open.
  const cap = h.closure === 'accepted' ? 3 : 4;
  const due = S.day - h.lastBeatDay >= t.beatGap;
  if (open && due && h.stage < cap && h.pressure >= t.stages[h.stage]!) {
    h.stage += 1;
    h.lastBeatDay = S.day;
    if (h.stage === 1) {
      const line = fresh(lines.stage1, 's1');
      if (line) notes.push(`🏠 ${line}`);
    } else if (h.stage === 2) {
      const line = fresh(lines.stage2, 's2');
      if (line) notes.push(`🏠 ${line}`);
    } else if (h.stage === 3) {
      const dream = rand() < 0.35 ? fresh(lines.dream3, 'd3') : null;
      const line = dream ?? fresh(lines.stage3, 's3');
      if (line) notes.push(dream ? `<i>💤 ${line}</i>` : `🏠 ${line}`);
    }
  } else if (h.closure !== 'none' && open && due && rand() < 0.4) {
    // After the card: quiet lines, no weight.
    const line = fresh(lines.accepted, 'a');
    if (line) {
      h.lastBeatDay = S.day;
      notes.push(`🏠 ${line}`);
    }
  }
  if (h.closure === 'none' || h.stage < 2) condition(open ? h.stage : 0);
  else removeModifier(CONDITION_ID);

  // The only forced tap-out this thread can cause.
  if (h.stage >= 4 && h.cardShown && h.closure === 'none' && h.breakNights >= t.breakNights && !S.forcedTapoutPending) {
    h.forced = true;
    S.forcedTapoutPending = true;
  }
}

/** After the morning's cards are drawn: the Waiver card, when it is due. */
export function homeCardTick(): void {
  const h = homeState();
  if (!h || S.over || h.stage < 4 || h.closure !== 'none' || S._pendingCard) return;
  const t = content()!.tuning;
  const back = h.cardShown && !h.cardReturned && h.cardDeclinedDay > 0 && S.day - h.cardDeclinedDay >= t.cardReturn;
  if (h.cardShown && !back) return;
  if (back) h.cardReturned = true;
  h.cardShown = true;
  S._pendingCard = waiverCard();
}

function waiverCard() {
  const { tuning: t, lines } = content()!;
  const c = lines.card;
  const h = () => S.home as HomeState;
  return {
    id: 'waiver',
    title: c.title,
    scene: c.scene,
    choices: [
      {
        label: c.accept,
        tagDeltas: { hard: 1, humble: 1 },
        outcomes: [{ p: 1, text: c.acceptText, effects: (notes: string[]) => { h().closure = 'accepted'; h().pressure = t.accepted.pressure; h().stage = Math.min(h().stage, 3); resolveDelta(t.accepted.resolve, notes); removeModifier(CONDITION_ID); } }],
      },
      {
        label: c.witness,
        tagDeltas: { tender: 1 },
        outcomes: [{ p: 1, text: c.witnessText, effects: (notes: string[]) => { h().closure = 'witnessed'; h().pressure = clamp(h().pressure - t.witnessed.pressure); resolveDelta(t.witnessed.resolve, notes); removeModifier(CONDITION_ID); } }],
      },
      { label: c.phone, tagDeltas: {}, outcomes: [{ p: 1, next: 'satPhone' }] },
      { label: c.later, tagDeltas: {}, outcomes: [{ p: 1, text: c.laterText, effects: () => { h().cardDeclinedDay = S.day; } }] },
    ],
  };
}

// The card engine finds cards by id; this one is never drawn at random (no trigger).
Object.defineProperty(CARDS, 'waiver', {
  enumerable: false,
  get: () => (content() ? waiverCard() : undefined),
});

/** Talking to the camera while the thread is live: a line for them, and some of it eases. */
export function homeConfess(): string | null {
  const h = homeState();
  if (!h || h.stage < 1 || h.pressure <= 0) return null;
  const { tuning: t, lines } = content()!;
  h.pressure = clamp(h.pressure - t.confess);
  return pick(lines.confess) as string;
}

/** A quiet sit eases it a little. */
export function homeSit(): void {
  const h = homeState();
  if (!h || h.stage < 1) return;
  h.pressure = clamp(h.pressure - content()!.tuning.sit);
}

/** How a forced tap-out names it, when this thread is behind it or far enough along. */
export function homeTapCause(): string | null {
  const h = S.home as HomeState | undefined;
  const c = content();
  if (!RULES.homeThread || !h || !c) return null;
  return h.forced || h.stage >= 3 ? c.lines.forcedTap : null;
}
