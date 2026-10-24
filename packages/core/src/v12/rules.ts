// Which deliberate changes to v12 are switched on (plan §2.4, §2.12, §8.3; M8).
//
// v12 mode (every flag off) is the untouched v12 game: the parity tests run in it, forever, so
// every system a change does not touch stays proven identical to the original. TAP / OUT mode
// (every flag on) is the game the player gets. Each flag has its own intended-difference test.

export interface RuleSet {
  /** Player-facing text: second person throughout, the authored cast, show and rival names, no orcas. */
  content: boolean;
  /** Director: three comfortable days bring a visible weather front, not an unexplained soaking. */
  directorFront: boolean;
  /** Camera confessionals: no nudge lines and no stress for days without one. */
  noCameraNag: boolean;
  /** Tree-mark post: no resolve cost for skipping it. */
  noTreeMarkPenalty: boolean;
  /** On a medical-check night the medics' check runs before the overnight death verdict. */
  medCheckBeforeDeath: boolean;
  /** LEG-002: drafted rations are eight real uses. */
  rations: boolean;
  /** LEG-005: one poultice dose resolves once. */
  poulticeOnce: boolean;
  /** LEG-008: active ice-fishing catches count as ice fishing, not as the net. */
  iceFishStat: boolean;
  /** §8.3: partner-tagged moments cannot hurt resolve or be the reason for a tap-out. */
  partnerRule: boolean;
  /** Arriving at camp unloads your pack into camp stock: dropping it off cost nothing anyway. */
  autoUnload: boolean;
  /** Numbers in the text are whole: max energy reads 162, never 161.6166666. */
  wholeNumbers: boolean;
  /** §8.4: the parents / no-contact thread and its Waiver card. */
  homeThread: boolean;
  /** M18: letters you write yourself, and the call home at the end of a run. */
  letters: boolean;
}

export const V12_RULES: Readonly<RuleSet> = Object.freeze({
  content: false,
  directorFront: false,
  noCameraNag: false,
  noTreeMarkPenalty: false,
  medCheckBeforeDeath: false,
  rations: false,
  poulticeOnce: false,
  iceFishStat: false,
  partnerRule: false,
  autoUnload: false,
  wholeNumbers: false,
  homeThread: false,
  letters: false,
});

export const TAPOUT_RULES: Readonly<RuleSet> = Object.freeze(
  Object.fromEntries(Object.keys(V12_RULES).map((key) => [key, true])) as unknown as RuleSet,
);

export let RULES: Readonly<RuleSet> = V12_RULES;

export function setRules(next: Readonly<RuleSet>): void {
  RULES = next;
}

/** v12's line in v12 mode, TAP / OUT's line otherwise. */
export function say<T>(v12: T, tapout: T): T {
  return RULES.content ? tapout : v12;
}
