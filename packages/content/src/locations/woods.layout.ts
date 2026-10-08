import { KILL_ACTIONS, PERSONAL_ACTIONS, box, patch, station, type LocationLayout } from './layout.ts';

// Woods (plan §4.4): the near forest. The five trapline spots live on the map, reached from the
// trailhead post; the painting holds what you work by hand.
export const WOODS: LocationLayout = {
  id: 'woods',
  label: 'Woods',
  horizonY: 340,
  stations: [
    station('ridge', 'Ridge lookout', 'High ground: scout, call, or just watch.', 1440, 500, 260, 170, ['a-scout', 'a-call', 'a-sitwatch']),
    station('timber', 'Standing timber', 'Trees to fell and buck into logs.', 760, 600, 280, 400, ['a-wood']),
    station('birch', 'Birch', 'Peeling bark for tinder.', 1060, 600, 110, 380, ['a-tinder']),
    { ...station('animal', 'Animal', 'Something worth a shot.', 1230, 660, 220, 170, ['a-shot']), when: 'hunt' },
    station('trailhead', 'Trailhead post', 'Your trapline: snares at the named spots.', 1620, 780, 90, 230, ['a-snare', 'a-moveSnare', 'a-checkTraps'], { special: ['map'] }),
    station('deadfall', 'Deadfall', 'Dry fallen wood you can gather by hand.', 500, 860, 280, 140, ['a-firewood']),
    station('moss', 'Mossy rocks', 'Moss for insulation and bedding.', 1140, 870, 240, 110, ['a-moss']),
    station('berries', 'Berry bushes', 'Whatever the season has left.', 1420, 900, 300, 150, ['a-forage']),
    { ...station('tracks', 'Game trail', 'Tracks, sounds, a blood trail.', 760, 960, 340, 70, ['a-follow', 'a-trail', 'a-invest']), hotspot: patch(760, 950, 360, 80), when: 'hunt' },
    { ...station('killsite', 'Kill site', 'What is left of the animal.', 1130, 990, 260, 90, KILL_ACTIONS), hotspot: patch(1130, 955, 280, 90), when: 'killSite' },
    station('you', 'You', 'Rest, sit and watch, or anything that needs only you.', 1000, 1000, 1, 1, PERSONAL_ACTIONS),
    { ...station('toCamp', 'Back to camp', 'The trail home.', 240, 980, 140, 160, [], { exitTo: 'camp' }), hotspot: box(240, 990, 160, 200) },
    { ...station('toShore', 'Down to the shore', 'Through the trees to the water.', 280, 600, 120, 180, [], { exitTo: 'shore' }), hotspot: box(280, 620, 140, 220) },
  ],
};
