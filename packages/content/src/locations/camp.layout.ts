import { HUNT_ACTIONS, KILL_ACTIONS, PERSONAL_ACTIONS, box, patch, station, type LocationLayout } from './layout.ts';

// Camp (plan §4.2): a clearing on the lake shore, the lake behind it, timber on both sides.
// The fire is the centre of the picture; the shelter sits back-left, food and stores right.
export const CAMP: LocationLayout = {
  id: 'camp',
  label: 'Camp',
  horizonY: 330,
  water: { top: 330, bottom: 470 },
  stations: [
    station('raven', 'Dead snag', 'Roger sits up there most mornings.', 1590, 520, 70, 300, [], { stand: { x: 1590, y: 540 } }),
    station('jay', 'Spruce perch', 'Where the gray jay waits for scraps.', 1450, 560, 90, 130, ['a-feedjay'], { when: 'jay' }),
    station('shelter', 'Shelter', 'Your bed for the night, whatever state it is in.', 560, 650, 440, 300,
      ['a-shelter', 'a-dugout', 'a-insulate', 'a-patchRoof', 'a-bed', 'a-rest'], { special: ['sleep', 'turnInEarly'], stand: { x: 820, y: 670 } }),
    station('cache', 'Food cache', 'Keeps stored food from the things that come at night.', 1300, 610, 200, 280, ['a-cache', 'a-campSnares'], { special: ['eatSmoked'] }),
    station('rack', 'Smoking rack', 'Meat in, smoke for twelve hours, food that keeps.', 1060, 620, 240, 230, ['a-rack', 'a-smoke', 'a-hugeRack', 'a-smokeHuge']),
    station('post', 'Tally post', 'One notch for every day out here.', 360, 720, 50, 210, ['a-treemark'], { stand: { x: 420, y: 730 } }),
    station('camera', 'Camera', 'The show\'s camera on its tripod.', 230, 790, 90, 200, ['a-confess'], { stand: { x: 290, y: 800 } }),
    {
      ...station('fire', 'Firepit', 'Fire, boiling, cooking.', 930, 820, 280, 130, ['a-fire', 'a-firenoferro', 'a-friction', 'a-firepit', 'a-boil', 'a-cook'], { special: ['eatCooked'] }),
      hotspot: patch(930, 780, 300, 150),
    },
    station('comforts', 'Chair and table', 'Somewhere to sit that isn\'t the ground.', 1200, 820, 240, 150, ['a-chair', 'a-table', 'a-flute', 'a-wash']),
    station('stump', 'Chopping stump', 'Tools: the axe, the ferro rod, boots, carving.', 700, 870, 170, 120,
      ['a-sharpenAxe', 'a-haftAxe', 'a-maintainFerro', 'a-repairBoots', 'a-picker', 'a-poultice']),
    station('woodpile', 'Woodpile', 'Firewood for burning, logs for building.', 1490, 800, 270, 170, ['a-woodCamp']),
    station('water', 'Pot and water', 'Raw water in, clean water out.', 830, 960, 130, 100, ['a-jug'], { special: ['drink'] }),
    station('food', 'Meat hook', 'Fresh meat and berries, and how long they have.', 1380, 975, 150, 170, [], { special: ['eatBerries', 'eatRation'] }),
    station('stock', 'Materials', 'Rocks, moss, clay and tinder.', 1590, 960, 210, 110, []),
    station('pack', 'Your pack', 'Whatever you carried back. One kind of load at a time.', 450, 960, 150, 170, ['a-dropoff']),
    { ...station('killsite', 'Kill site', 'What is left of the animal.', 1110, 990, 260, 90, KILL_ACTIONS), hotspot: patch(1110, 955, 280, 90), when: 'killSite' },
    station('you', 'You', 'Rest, sit and watch, or anything that needs only you.', 1000, 1000, 1, 1, [...PERSONAL_ACTIONS, ...HUNT_ACTIONS]),
    { ...station('toShore', 'Down to the shore', 'The path to the water.', 230, 560, 120, 160, [], { exitTo: 'shore' }), hotspot: box(230, 580, 140, 200) },
    { ...station('toWoods', 'Into the woods', 'The trail into the timber.', 1680, 680, 110, 200, [], { exitTo: 'woods' }), hotspot: box(1670, 700, 130, 240) },
  ],
};
