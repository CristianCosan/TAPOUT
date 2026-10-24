// Playtest notes (F8): a one-line note saved with where the run is, to copy into a chat later.

export const PLAYTEST_TEXT = {
  boxTitle: 'Note for the developer',
  placeholder: 'What bugs you, what you love, what confused you…',
  hint: 'Enter saves · Esc cancels',
  saved: 'Note saved. Settings › Playtest notes to copy them all.',
  failed: 'That note could not be saved.',
  section: 'Playtest notes',
  sectionHint: (n: number) => (n === 0 ? 'Press F8 any time in a run to jot something down.' : `${n} note${n === 1 ? '' : 's'}. Press F8 in a run to add another.`),
  copy: 'Copy all notes',
  copied: 'Copied. Paste them into the chat.',
  copyFailed: 'Could not copy. Press Ctrl+A, Ctrl+C in the box below.',
  clear: 'Clear notes',
  clearConfirm: 'Delete all notes? Click again to confirm.',
  header: (n: number, version: string) => `TAP / OUT playtest notes (${n}, build ${version})`,
  menu: 'outside a run',
  where: (r: { day: number; hour: number; loc: string; weather: string; tempC: number }) =>
    `Day ${r.day}, ${String(Math.floor(r.hour)).padStart(2, '0')}:${String(Math.round((r.hour % 1) * 60)).padStart(2, '0')}, ${r.loc}, ${r.weather}, ${r.tempC} °C`,
  body: (b: Record<string, number>, shelter: number, rivals: number) =>
    `health ${b.health}, food ${b.food}, water ${b.water}, warmth ${b.warmth}, energy ${b.energy}, morale ${b.morale}; shelter stage ${shelter}; ${rivals} rivals left`,
} as const;
