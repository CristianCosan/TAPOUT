// Every resource as a picture, and what it is for when you hover it (rc.2, Sir's first run).
// The pictures are drawn in code (apps/game/src/ui/icons.tsx); these are their names and words.

export type ResourceId =
  | 'wood'
  | 'firewood'
  | 'rocks'
  | 'moss'
  | 'clay'
  | 'tinder'
  | 'meat'
  | 'arrows'
  | 'raw'
  | 'water'
  | 'berries'
  | 'smoked'
  | 'cooked';

export const RESOURCES: Readonly<Record<ResourceId, { name: string; use: string }>> = {
  wood: { name: 'Logs', use: 'building timber: the shelter, the smoking rack, the food cache, a chair and a table. Cut in the woods.' },
  firewood: { name: 'Firewood', use: 'what the fire burns. Scrounged around camp or gathered by hand.' },
  rocks: { name: 'Rocks', use: 'flat stones from the shore: the firepit ring, the rack base, the cache and the last shelter stage.' },
  moss: { name: 'Moss', use: 'stuffing for gaps: the lean-to, insulating the shelter, and a proper bed.' },
  clay: { name: 'Clay', use: 'grey clay from the shore bank: seals the timber shelter, lines the firepit and the cache, makes a jug.' },
  tinder: { name: 'Tinder', use: 'dry stuff that takes a spark. Every new fire needs some.' },
  meat: { name: 'Raw meat', use: 'fresh meat. Cook it, or smoke it on the rack before it spoils.' },
  arrows: { name: 'Arrows', use: 'for the bow. Some break or get lost on a shot.' },
  raw: { name: 'Raw water', use: 'lake water in the pot. Boil it on the fire before you drink it.' },
  water: { name: 'Clean water', use: 'boiled and safe to drink.' },
  berries: { name: 'Berries', use: 'foraged food you can eat straight away. They go off in a few days.' },
  smoked: { name: 'Smoked meat', use: 'meat that keeps. Store it in the cache.' },
  cooked: { name: 'Cooked meal', use: 'a hot meal off the fire.' },
};

/** Words in v12's own lines that name a resource, and which picture they become. */
export const RESOURCE_WORDS: ReadonlyArray<readonly [RegExp, ResourceId]> = [
  [/\bfirewood\b/gi, 'firewood'],
  [/\blogs?\b/gi, 'wood'],
  [/\brocks?\b/gi, 'rocks'],
  [/\bmoss\b/gi, 'moss'],
  [/\bclay\b/gi, 'clay'],
  [/\btinder\b/gi, 'tinder'],
];

/** The build path shown on a camp build (rc.2): what each tier is called. */
export const UPGRADE_TEXT = {
  title: 'Build path',
  built: 'Built',
  sessions: (done: number, of: number) => (of > 1 ? `${done}/${of} sessions` : '1 session'),
  perSession: 'each session',
  names: {
    shelter: ['Tarp on the ground', 'Lean-to', 'Framed hut', 'Timber shelter'],
    firepit: ['Bare fire', 'Stone ring', 'Clay-lined pit'],
    rack: ['No rack', 'Tripod rack', 'Roofed rack'],
    cache: ['No cache', 'Rock-and-timber cache', 'Clay-sealed cache', 'Raised cache'],
  },
} as const;
