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
  /**
   * rc.3 (Sir): you never learn who tapped out or how many are left. Med checks come from day 14,
   * then every six to eight days; the win is told to you at a med check like any other.
   */
  quietField: boolean;
  /** rc.3: snares, lines and the net need half a day in the water or the wire before a catch. */
  soakTime: boolean;
  /** rc.3: rocks and timber lying about camp can be gathered there, straight onto the stock. */
  campHarvest: boolean;
  /** rc.3: the dugout is dug, then walled and roofed with logs and moss, not dug four times. */
  dugoutStages: boolean;
  /** rc.4 (Sir): the shelter and the dugout are one or the other; starting one closes the other. */
  oneRoute: boolean;
  /** rc.4 (Sir): past the lean-to, each build takes at most one session a day, so camp grows across the run. */
  buildPace: boolean;
  /** rc.4 (Sir): every camp build climbs in named steps (at least five a path), sharing v12's costs. */
  stepBuilds: boolean;
  /** rc.4 (Sir): realistic game time per action; energy and materials stay v12's. */
  realTimes: boolean;
  /** rc.5 (Sir): a thick jacket and a rain shell you put on and take off, a minute each. */
  clothing: boolean;
  /** rc.5 (Sir): a stone stove inside the hut or dugout keeps a banked fire going longer at night. */
  stove: boolean;
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
  quietField: false,
  soakTime: false,
  campHarvest: false,
  dugoutStages: false,
  oneRoute: false,
  buildPace: false,
  stepBuilds: false,
  realTimes: false,
  clothing: false,
  stove: false,
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
