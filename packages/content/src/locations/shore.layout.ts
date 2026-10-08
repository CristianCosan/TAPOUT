import { HUNT_ACTIONS, KILL_ACTIONS, PERSONAL_ACTIONS, box, patch, station, type LocationLayout } from './layout.ts';

// Shore (plan §4.3): a long stony shoreline, the lake filling the top half. v12's four fishing
// spots are physical places along the water's edge, left to right.
const LINE_ACTIONS = ['a-lines', 'a-iceLine', 'a-moveLine', 'a-checkShore', 'a-iceFish'] as const;

export const SHORE: LocationLayout = {
  id: 'shore',
  label: 'Shore',
  horizonY: 300,
  water: { top: 300, bottom: 640 },
  stations: [
    { spot: 'point', ...station('point', 'The Point', 'A fishing spot off the rocks.', 420, 660, 150, 130, LINE_ACTIONS), hotspot: patch(420, 610, 220, 110) },
    { spot: 'inlet', ...station('inlet', 'Inlet Mouth', 'A fishing spot where the creek comes in.', 800, 630, 150, 130, LINE_ACTIONS), hotspot: patch(800, 585, 220, 100) },
    { spot: 'bar', ...station('bar', 'Rocky Bar', 'A fishing spot over the gravel bar.', 1180, 660, 150, 130, LINE_ACTIONS), hotspot: patch(1180, 610, 220, 110) },
    { spot: 'channel', ...station('channel', 'Deep Channel', 'A fishing spot over deep water.', 1540, 640, 150, 130, LINE_ACTIONS), hotspot: patch(1540, 590, 220, 110) },
    { ...station('duck', 'Open water', 'Where waterfowl sit when they come in.', 1000, 470, 160, 70, HUNT_ACTIONS), hotspot: patch(1000, 450, 220, 80), when: 'hunt' },
    { ...station('icecache', 'Ice cache', 'A hole in the ice that keeps food frozen and safe.', 640, 720, 160, 80, ['a-iceCache']), hotspot: patch(640, 700, 200, 80), when: 'winter' },
    station('net', 'Net frame', 'Where the gill net is woven and mended.', 430, 860, 200, 150, ['a-net', 'a-deploynet']),
    { ...station('edge', 'Water\'s edge', 'Fill the pot, or drink straight from the stream.', 960, 780, 300, 100, ['a-fetch', 'a-stream']), hotspot: patch(960, 760, 320, 100) },
    station('rocks', 'Rock bar', 'Flat stones for a firepit.', 1410, 850, 260, 120, ['a-rocks']),
    station('clay', 'Clay bank', 'Grey clay under the bank.', 700, 900, 240, 110, ['a-clay']),
    { ...station('killsite', 'Kill site', 'What is left of the animal.', 1180, 960, 260, 90, KILL_ACTIONS), hotspot: patch(1180, 940, 280, 90), when: 'killSite' },
    station('you', 'You', 'Rest, sit and watch, or anything that needs only you.', 1000, 1000, 1, 1, [...PERSONAL_ACTIONS, ...HUNT_ACTIONS]),
    { ...station('toCamp', 'Back to camp', 'The path up to camp.', 240, 980, 140, 160, [], { exitTo: 'camp' }), hotspot: box(240, 990, 160, 200) },
    { ...station('toWoods', 'Into the woods', 'The trail along the shore into the timber.', 1660, 900, 120, 200, [], { exitTo: 'woods' }), hotspot: box(1660, 920, 140, 240) },
  ],
};
