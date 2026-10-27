// rc.6 (moreCards, Sir: "where we are with the choice based thing... night events"). Not in v12.
// Ten more choices that turn up at dawn, each once a run. Every option has a cost and a gain;
// none is the right answer. They join v12's own deck and its scheduler.

import { CARDS } from './cards.ts';
import { addMeat, makeSick } from './food.ts';
import { clamp } from './helpers.ts';
import { RULES } from './rules.ts';
import { S } from './state.ts';

const here = () => RULES.moreCards && !S.over && S.loc === 'camp';
const clear = () => S.weather === 'clear' || S.weather === 'overcast';

export const MORE_CARDS: any = {
  nightNoise: {
    id: 'nightNoise', weight: 2, cooldown: 5, oncePerRun: true,
    trigger: () => here() && S.day >= 3,
    scene: 'Something big moves past the shelter in the dark. Branches give under it. Then it stops, close.',
    choices: [
      { label: 'Lie still and wait', tagDeltas: { cautious: 1 }, outcomes: [{ p: 1, text: 'You lie rigid until the grey light. Whatever it was moved on without a sound you heard.', effects: () => { S.stress = clamp(S.stress + 6); } }] },
      { label: 'Bang the pot and shout', tagDeltas: { bold: 1 }, outcomes: [
        { p: 0.6, text: 'A crash, hooves on rock, gone. A moose, by the tracks at dawn. Your heart takes an hour to settle.', effects: () => { S.energy = Math.max(0, S.energy - 4); S.morale = clamp(S.morale + 3); } },
        { p: 0.4, text: 'Nothing answers. That is somehow worse.', effects: () => { S.energy = Math.max(0, S.energy - 4); S.stress = clamp(S.stress + 3); } },
      ] },
      { label: 'Go out with the light', tagDeltas: { bold: 2 }, outcomes: [
        { p: 0.5, text: 'A cow moose, twenty metres off, looks at you a long moment and walks on. You stand there grinning in the cold.', effects: () => { S.warmth = clamp(S.warmth - 5); S.morale = clamp(S.morale + 6); } },
        { p: 0.5, text: 'You see nothing and catch your shin on the woodpile coming back.', effects: () => { S.warmth = clamp(S.warmth - 5); S.health = clamp(S.health - 3); } },
      ] },
    ],
  },
  farLight: {
    id: 'farLight', weight: 1, cooldown: 6, oncePerRun: true,
    trigger: () => here() && S.day >= 6 && clear(),
    scene: 'Before dawn, a light on the far shore. It moves a little, stops, moves again. Nobody is meant to be over there.',
    choices: [
      { label: 'Watch it until it goes', tagDeltas: { cautious: 1 }, outcomes: [{ p: 1, text: 'It goes out at first light. You never find out what it was.', effects: () => { S.stress = clamp(S.stress + 3); S.morale = clamp(S.morale + 2); } }] },
      { label: 'Wave your own torch back', tagDeltas: { tender: 1 }, outcomes: [{ p: 1, text: 'It stops. Then, maybe, it waves back. You will think about that for days.', effects: () => { S.morale = clamp(S.morale + 5); S.stress = clamp(S.stress + 2); } }] },
      { label: 'Roll over and sleep', tagDeltas: { practical: 1 }, outcomes: [{ p: 1, text: 'Not your business. You sleep another hour.', effects: () => { S.energy = Math.min(S.maxEnergy, S.energy + 4); } }] },
    ],
  },
  driftwood: {
    id: 'driftwood', weight: 2, cooldown: 5, oncePerRun: true,
    trigger: () => here() && S.day >= 4,
    scene: 'At first light there is a bleached spar of driftwood on the stones below camp, dry right through.',
    choices: [
      { label: 'Haul it up whole', tagDeltas: { hard: 1 }, outcomes: [{ p: 1, text: 'It takes everything you have to drag it up the slope. Two good logs out of it.', effects: () => { S.energy = Math.max(0, S.energy - 10); S.stock.wood += 2; } }] },
      { label: 'Break it up for firewood', tagDeltas: { practical: 1 }, outcomes: [{ p: 1, text: 'You stamp it into lengths where it lies. Dry wood, the best kind.', effects: () => { S.energy = Math.max(0, S.energy - 5); S.stock.firewood += 4; } }] },
      { label: 'Leave it', tagDeltas: {}, outcomes: [{ p: 1, text: 'You leave it for the lake to take back.', effects: () => {} }] },
    ],
  },
  raven: {
    id: 'raven', weight: 1, cooldown: 6, oncePerRun: true,
    trigger: () => here() && S.day >= 5,
    scene: 'A raven sits on the ridgepole at dawn, talking to you. When you look at it, it flies a little way into the trees and waits.',
    choices: [
      { label: 'Follow it', tagDeltas: { bold: 1 }, outcomes: [
        { p: 0.4, text: 'Half a kilometre in, a wolf kill, mostly eaten. There is still a shoulder worth taking.', effects: (notes: string[]) => { S.energy = Math.max(0, S.energy - 8); addMeat(3, 'scavenge'); notes.push('+3 meat.'); } },
        { p: 0.6, text: 'It leads you in a circle and laughs at you from a spruce.', effects: () => { S.energy = Math.max(0, S.energy - 8); S.morale = clamp(S.morale + 1); } },
      ] },
      { label: 'Throw it a scrap', tagDeltas: { tender: 1 }, outcomes: [{ p: 1, text: 'It takes it and leaves. Somehow it feels like a deal was made.', effects: () => { S.morale = clamp(S.morale + 3); } }] },
      { label: 'Ignore it', tagDeltas: {}, outcomes: [{ p: 1, text: 'It gives up on you eventually.', effects: () => {} }] },
    ],
  },
  lakeGlass: {
    id: 'lakeGlass', weight: 1, cooldown: 6, oncePerRun: true,
    trigger: () => here() && S.day >= 5 && !S.winter && clear(),
    scene: 'First light and no wind at all. The lake is glass, and very, very cold.',
    choices: [
      { label: 'Strip and go in', tagDeltas: { bold: 2 }, outcomes: [{ p: 1, text: 'The cold hits like a wall and you shout without meaning to. Then, on the stones, you feel more alive than you have in weeks.', effects: () => { S.warmth = clamp(S.warmth - 15); S.morale = clamp(S.morale + 8); S.stress = clamp(S.stress - 6); } }] },
      { label: 'Just wash your face', tagDeltas: { cautious: 1 }, outcomes: [{ p: 1, text: 'Enough to wake you. Enough.', effects: () => { S.morale = clamp(S.morale + 2); } }] },
      { label: 'Stay by the fire', tagDeltas: {}, outcomes: [{ p: 1, text: 'You watch the mist come off it instead.', effects: () => {} }] },
    ],
  },
  deadTrout: {
    id: 'deadTrout', weight: 1, cooldown: 6, oncePerRun: true,
    trigger: () => here() && S.day >= 4,
    scene: 'A lake trout lies at the waterline below camp, dead but bright-eyed. Something dropped it, or it just died.',
    choices: [
      { label: 'Take it and cook it', tagDeltas: { practical: 1 }, outcomes: [
        { p: 0.8, text: 'Fresh. A gift from the lake.', effects: (notes: string[]) => { addMeat(2, 'scavenge'); notes.push('+2 meat.'); } },
        { p: 0.2, text: 'It smelled fine. Your stomach disagrees by evening.', effects: (notes: string[]) => { addMeat(2, 'scavenge'); makeSick(1); notes.push('+2 meat, and a sick day.'); } },
      ] },
      { label: 'Leave it for the birds', tagDeltas: { cautious: 1 }, outcomes: [{ p: 1, text: 'Not worth the risk. The gulls are on it within the hour.', effects: () => {} }] },
    ],
  },
  windRoof: {
    id: 'windRoof', weight: 2, cooldown: 4, oncePerRun: true,
    trigger: () => here() && S.structure >= 1 && !S.dugout && (S.weather === 'storm' || S.weather === 'rain'),
    scene: 'The wind is getting under the roof. You hear the boughs lift and drop, lift and drop.',
    choices: [
      { label: 'Get up and weigh it down', tagDeltas: { hard: 1 }, outcomes: [{ p: 1, text: 'Half an hour in the rain, hauling stones up onto it. It holds. You are soaked.', effects: () => { S.energy = Math.max(0, S.energy - 8); S.wet = clamp(S.wet + 25); } }] },
      { label: 'Trust it', tagDeltas: { cautious: 1 }, outcomes: [
        { p: 0.7, text: 'It holds. You knew it would. Mostly.', effects: () => { S.stress = clamp(S.stress + 3); } },
        { p: 0.3, text: 'A gust takes a corner of it. The rain finds you through the gap.', effects: () => { if (!S.chains.roof) S.chains.roof = { day: S.day }; S.wet = clamp(S.wet + 15); } },
      ] },
    ],
  },
  sleepless: {
    id: 'sleepless', weight: 2, cooldown: 5, oncePerRun: true,
    trigger: () => here() && S.stress >= 50,
    scene: 'You cannot sleep. The fire is down to coals and your head will not stop.',
    choices: [
      { label: 'Get up and sit by it', tagDeltas: { tender: 1 }, outcomes: [{ p: 1, text: 'You feed it one stick at a time until the sky goes grey. It helps.', effects: () => { S.energy = Math.max(0, S.energy - 5); S.stress = clamp(S.stress - 8); } }] },
      { label: 'Lie there and wait it out', tagDeltas: { hard: 1 }, outcomes: [{ p: 1, text: 'You count your breaths. You lose count. You start again.', effects: () => { S.stress = clamp(S.stress + 3); } }] },
    ],
  },
  birchSap: {
    id: 'birchSap', weight: 1, cooldown: 6, oncePerRun: true,
    trigger: () => here() && S.day <= 14,
    scene: 'The birch beside camp split in the cold overnight. It is weeping clear, faintly sweet sap.',
    choices: [
      { label: 'Drink it from the bark', tagDeltas: { practical: 1 }, outcomes: [{ p: 1, text: 'Like water that remembers sugar. Your mouth stops feeling like sand.', effects: () => { S.thirst = clamp(S.thirst + 8); S.morale = clamp(S.morale + 2); } }] },
      { label: 'Leave the tree alone', tagDeltas: { tender: 1 }, outcomes: [{ p: 1, text: 'You pack the split with moss. It might live.', effects: () => {} }] },
    ],
  },
  stars: {
    id: 'stars', weight: 1, cooldown: 6, oncePerRun: true,
    trigger: () => here() && S.weather === 'clear' && S.morale < 55,
    scene: 'You wake long before dawn. Through the gap in the roof the sky is thick with stars.',
    choices: [
      { label: 'Go out and look', tagDeltas: { tender: 1 }, outcomes: [{ p: 1, text: 'You stand in the cold until your feet go numb. You have never seen so many.', effects: () => { S.warmth = clamp(S.warmth - 6); S.morale = clamp(S.morale + 6); } }] },
      { label: 'Stay in the warm', tagDeltas: { cautious: 1 }, outcomes: [{ p: 1, text: 'You look at the few you can see from where you lie. That is enough.', effects: () => { S.morale = clamp(S.morale + 1); } }] },
    ],
  },
};

// Joins v12's deck; each trigger is off unless the rule is on, so v12's draws are untouched.
Object.assign(CARDS, MORE_CARDS);
/** For tests: how many of the rc.6 cards are in the deck. */
export function moreCardCount(){ return Object.keys(MORE_CARDS).filter((id) => CARDS[id]).length; }
export function moreCardDeck(){ return MORE_CARDS; }
