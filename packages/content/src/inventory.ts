// rc.5 (Sir): the backpack. What you wear, what you carry in hand, what is in the pack.

export const INVENTORY_TEXT = {
  title: 'Backpack',
  key: 'I',
  wearing: 'Wearing',
  inHand: 'In hand',
  pack: 'In the pack',
  carrying: 'Carrying',
  nothing: 'Nothing',
  minute: '1 min',
  on: 'Take off',
  off: 'Put on',
  close: 'Close',
  handsEmpty: 'Empty hands',
  handHint: 'Press 1 to 5 to carry a tool. Jobs pick up the right one themselves.',
  bagOn: 'On your back. Everything you carry goes in it.',
  garments: {
    jacket: { name: 'Thick jacket', on: 'Keeps your warmth in. You sweat in it doing heavy work.', off: 'Tied round your waist. Cooler to work in, colder to stand in.' },
    shell: { name: 'Rain shell', on: 'Keeps most of the rain out. Hot to work in.', off: 'Rolled up in the pack.' },
  },
  condition: (pct: number) => (pct >= 70 ? 'good' : pct >= 30 ? 'worn' : pct > 0 ? 'nearly done' : 'broken'),
} as const;

/** Keys 1-5: the tools you can carry, in key order, and the kit item each needs. */
export const HELD_TOOLS = [
  { key: '1', tool: 'bow', kit: 'bow', label: 'Bow' },
  { key: '2', tool: 'axe', kit: 'axe', label: 'Axe' },
  { key: '3', tool: 'saw', kit: 'saw', label: 'Saw' },
  { key: '4', tool: 'shovel', kit: 'shovel', label: 'Shovel' },
  { key: '5', tool: 'knife', kit: 'knife', label: 'Knife' },
] as const;
