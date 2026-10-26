// The words on the energy meter in the middle of the screen (rc.2, Sir's first run).

export const ENERGY_HUD = {
  label: 'Energy',
  /** The rest button sits next to the meter in every place: v12's Rest works anywhere. */
  rest: 'Sit down and rest',
  restKey: 'R',
  /** Shown while you point at an action that costs energy. */
  after: 'after this',
  low: 'Running low. You can sit down and rest anywhere.',
} as const;
