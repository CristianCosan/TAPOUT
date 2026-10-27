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

/**
 * The build panels (rc.2, rc.4). The main build sits on top: what it is now, as a picture with a
 * line on what it does for you, then its steps. Everything else built at the same spot goes below.
 */
export const UPGRADE_TEXT = {
  use: 'Use',
  build: 'Build',
  also: 'Also here',
  or: 'or',
  built: 'Built',
  done: 'Finished. Nothing more to build on it.',
  needsShovel: 'Needs the shovel, which you did not pack.',
  settling: 'Worked on today. It can go on tomorrow.',
  underWay: (name: string) => `${name}, going up`,
  mainChoose: 'Main build · pick one for this run',
  mainNow: (what: string) => `Main build · your ${what} now`,
  chooseNote: 'Starting one makes the other disappear.',
  toStart: 'to start',
  start: { shelter: 'Start the shelter', dugout: 'Start digging' },
  stepOf: (n: number, of: number, name: string) => `Next · step ${n} of ${of} · ${name}`,
  becomes: (n: number, name: string) => `After step ${n} it becomes: ${name}.`,
  resume: (name: string) => `Carry on: ${name.charAt(0).toLowerCase()}${name.slice(1)}`,
  go: (name: string) => `Start: ${name.charAt(0).toLowerCase()}${name.slice(1)}`,
  noun: { shelter: 'shelter', dugout: 'dugout', firepit: 'firepit', rack: 'rack', cache: 'cache' },
  names: {
    shelter: ['Tarp on the ground', 'Lean-to', 'Framed hut', 'Timber shelter'],
    dugout: ['Tarp on the ground', 'Dug pit', 'Walled pit', 'Earth dugout'],
    firepit: ['A fire on the ground', 'Stone ring', 'Clay-lined pit'],
    rack: ['No rack yet', 'Tripod rack', 'Roofed rack'],
    cache: ['No cache yet', 'Rock-and-timber cache', 'Clay-sealed cache', 'Raised cache'],
  },
  /** What each tier does for you, shown under its picture. */
  about: {
    shelter: [
      'What you have tonight. It keeps the worst of the rain off.',
      'Rain off, wind off one side. A fire in front warms you through the night.',
      'Closed on three sides with a bough roof. It holds heat far better.',
      'Log walls and a sod roof. Warm and dry, and it will take a storm.',
    ],
    dugout: [
      'What you have tonight. It keeps the worst of the rain off.',
      'Out of the wind, below the frost line. The tarp is stretched over it on four stakes.',
      'Log walls hold the soil back. The tarp is still the roof.',
      'Dug deep, roofed and banked with soil. The warmest bed there is, and storms barely touch it.',
    ],
    firepit: ['A fire on bare ground. It burns fast.', 'The stones hold the heat: fires burn longer and hotter.', 'Clay holds the heat longer still. Every stoke goes further.'],
    rack: ['Fresh meat spoils within a day or two.', 'Holds 6 lbs of meat over the smoke.', 'Sheds rain and is harder to raid. Holds 6 lbs.'],
    cache: ['Food lies where animals can reach it.', 'Rock and timber, the lid weighted with stone.', 'Every seam sealed with clay. Nothing smells its way in.', 'Up on a platform, out of reach of anything on four legs.'],
  },
  /** Every step along each path, in order. */
  steps: {
    shelter: ['Posts and ridge pole', 'Poles and boughs', 'The A-frame', 'Wall poles', 'Bough thatch', 'Base logs', 'Walls to the waist', 'Walls to head height', 'Roof beams', 'Sod roof and a door'],
    dugout: ['Cut the sod', 'Dig the pit', 'Deepen and square it', 'Log walls', 'Roof and sod over'],
    firepit: ['Dig a fire bowl', 'Ring of stones', 'Dig clay and wet it', 'Line the pit', 'Fire it hard'],
    rack: ['Cut straight poles', 'Lash the tripod', 'Drying rails', 'Stone base', 'Bark roof'],
    cache: ['Gather flat stones', 'Timber box and stone lid', 'Mix the clay', 'Seal every seam', 'Cut the platform posts', 'Raise the platform', 'Lift the cache up'],
  },
  /** The two ways to a warm bed, side by side until you pick one. */
  routes: {
    shelter: { title: 'Shelter', hint: '10 steps above ground: lean-to, framed hut, timber shelter.' },
    dugout: { title: 'Earth dugout', hint: '5 steps into the ground. The warmest bed, and storms barely touch it.' },
    firepit: { title: 'Firepit', hint: '' },
    rack: { title: 'Smoking rack', hint: '' },
    cache: { title: 'Food cache', hint: '' },
  },
  /** Things built at a spot that are not open yet, and why, so they show from the start. */
  locked: {
    'a-hugeRack': { name: 'Second, huge rack', why: 'Once the tripod rack stands.' },
  } as Record<string, { name: string; why: string }>,
} as const;

/** rc.4: the build menu (B). Nothing stands in camp until you start it; Dan picks the spot. */
export const BUILD_MENU = {
  title: 'Build',
  key: 'B',
  note: 'Nothing stands in camp until you start it. Pick one and Dan puts it in a sensible spot.',
  notCamp: 'You build at camp. Head back there to start something.',
  main: 'Main build',
  camp: 'Camp builds',
  make: 'Things to make',
  open: 'Open',
  start: 'Start',
  made: 'Made',
  builds: [
    { id: 'firepit', action: 'a-firepit', station: 'fire', name: 'Firepit' },
    { id: 'rack', action: 'a-rack', station: 'rack', name: 'Smoking rack' },
    { id: 'cache', action: 'a-cache', station: 'cache', name: 'Food cache' },
  ],
  things: ['a-picker', 'a-chair', 'a-table', 'a-jug', 'a-flute'],
} as const;

/**
 * rc.3: which panel entries build something, per station; the rest are uses. Paths are shown as
 * stages with their build button inside; extras are one-off builds.
 */
export const BUILD_STATIONS: Readonly<Record<string, { paths: ReadonlyArray<{ id: 'shelter' | 'dugout' | 'firepit' | 'rack' | 'cache'; action: string }>; extras: readonly string[] }>> = {
  shelter: { paths: [{ id: 'shelter', action: 'a-shelter' }, { id: 'dugout', action: 'a-dugout' }], extras: ['a-bed', 'a-insulate'] },
  fire: { paths: [{ id: 'firepit', action: 'a-firepit' }], extras: [] },
  rack: { paths: [{ id: 'rack', action: 'a-rack' }], extras: ['a-hugeRack'] },
  cache: { paths: [{ id: 'cache', action: 'a-cache' }], extras: [] },
  comforts: { paths: [], extras: ['a-chair', 'a-table'] },
  water: { paths: [], extras: ['a-jug'] },
  stump: { paths: [], extras: ['a-picker'] },
};
