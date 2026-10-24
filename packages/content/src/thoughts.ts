// Dan's inner voice (D-067): now and then a short spoken thought. Never advice, never a
// consequence, and nothing in the run reads it; it is only him. Each line is heard at most once
// per run. The audio is pre-recorded from these words (tools/voice), one file per id.
//
// How a line is written for the voice:
//   ' / '  a beat, about half a second
//   ' // ' a long beat, about a second
//   '~'    a soft breath in
// Sentences are recorded one at a time so each ends on its own fall; the pauses at commas are
// lengthened after recording. Subtitles show the words without the marks.

export type ThoughtWhen =
  // Moments, the first time they happen in a run.
  | 'arriveShore' | 'arriveWoods' | 'firstNight' | 'frost' | 'snow' | 'storm' | 'finalTwo'
  | 'rivalGone' | 'firstFire' | 'firstFish' | 'firstSnare' | 'firstKill' | 'predator' | 'wavering'
  // The body, when a bar runs low.
  | 'cold' | 'hungry' | 'thirsty' | 'tired' | 'wet'
  // Looking at something (a station id in the world).
  | `look:${string}`
  // A quiet moment.
  | 'quiet';

export interface Thought {
  id: string;
  when: ThoughtWhen;
  say: string;
  /** Only in this place. */
  area?: 'camp' | 'shore' | 'woods';
  /** Only by night (true) or by day (false). */
  night?: boolean;
  /** Only before (false) or after (true) the lake freezes. */
  winter?: boolean;
  /** Only from this day of the run. */
  fromDay?: number;
  /** Only in this weather. */
  weather?: readonly string[];
  /** Only in the first hours after dawn. */
  morning?: boolean;
  /** Recording speed for this line; slower reads heavier. */
  speed?: number;
}

export const THOUGHTS: readonly Thought[] = [
  // ---- moments
  { id: 'shore-1', when: 'arriveShore', say: 'So this is the lake. / Bigger than it looked from the plane.' },
  { id: 'shore-2', when: 'arriveShore', say: 'Water\'s flat as glass. // Somewhere out there, nine other people are staring at it too.' },
  { id: 'woods-1', when: 'arriveWoods', say: '~ Smells like rain in here. / Even when it isn\'t.' },
  { id: 'woods-2', when: 'arriveWoods', say: 'Every tree looks the same. // Good thing I\'m not lost. / Yet.' },
  { id: 'night1-1', when: 'firstNight', say: 'First night done. // I didn\'t sleep much. / But I\'m still here.' },
  { id: 'night1-2', when: 'firstNight', say: 'Morning. / ~ Okay. / That\'s one.' },
  { id: 'frost-1', when: 'frost', say: 'Frost on the tarp. // So it starts.', speed: 0.84 },
  { id: 'frost-2', when: 'frost', say: 'My breath is hanging in the air. / Summer\'s gone, and it isn\'t coming back for me.' },
  { id: 'snow-1', when: 'snow', say: 'Snow. / ~ It\'s actually snowing. // Mum would love this. / From inside, with tea.' },
  { id: 'snow-2', when: 'snow', say: 'Everything\'s gone quiet under the snow. / Even me.', speed: 0.85 },
  { id: 'storm-1', when: 'storm', say: 'Listen to that wind. // Just hold, tarp. / Please, just hold.' },
  { id: 'storm-2', when: 'storm', say: 'The whole forest is moving. / ~ I\'ve never felt this small.' },
  { id: 'two-1', when: 'finalTwo', say: 'Two of us left. // Somebody out there is thinking about me, right now. / Same as I am about them.' },
  { id: 'two-2', when: 'finalTwo', say: 'Just two. // Don\'t think about the money. / Don\'t think about the money.' },
  { id: 'gone-1', when: 'rivalGone', say: 'Another one\'s gone home. // Hot shower. / Real bed. // Good for them. / I mean it. / Mostly.' },
  { id: 'gone-2', when: 'rivalGone', say: 'One less. // It doesn\'t feel like winning. / It feels like lights going out, one house at a time.' },
  { id: 'gone-3', when: 'rivalGone', say: 'Somebody tapped. // I wonder what finally did it.' },
  { id: 'fire-1', when: 'firstFire', say: 'Fire. / ~ Okay. / Okay, I can do this.' },
  { id: 'fire-2', when: 'firstFire', say: 'Look at that. // Dad would have had it going in half the time. / But it\'s mine.' },
  { id: 'fish-1', when: 'firstFish', say: 'A fish! // Ha. / Sorry, buddy. / I needed you more.' },
  { id: 'fish-2', when: 'firstFish', say: 'Dinner. / Actual dinner. // I could cry.' },
  { id: 'snare-1', when: 'firstSnare', say: 'Something walked into my snare. // I feel good about that, / and a little bit sick.' },
  { id: 'kill-1', when: 'firstKill', say: '~ It\'s done. // Thank you. / I won\'t waste any of it.', speed: 0.84 },
  { id: 'pred-1', when: 'predator', say: 'Something big came through here. // I\'m not going to think about how big.' },
  { id: 'pred-2', when: 'predator', say: 'Those tracks are fresh. // I\'m not alone out here. / I never was.' },
  { id: 'waver-1', when: 'wavering', say: 'What am I doing here? // No. / I know what I\'m doing here.' },
  { id: 'waver-2', when: 'wavering', say: 'The phone is right there. // It\'s just a button. / That\'s the problem.' },

  // ---- the body
  { id: 'cold-1', when: 'cold', say: 'Can\'t feel my fingers. / ~ Come on.' },
  { id: 'cold-2', when: 'cold', say: 'I\'m so cold, it\'s hard to think straight.' },
  { id: 'cold-3', when: 'cold', say: 'My teeth won\'t stop going.' },
  { id: 'hungry-1', when: 'hungry', say: 'My stomach is eating itself.' },
  { id: 'hungry-2', when: 'hungry', say: 'I keep thinking about Mum\'s pancakes. // That\'s not helping.' },
  { id: 'hungry-3', when: 'hungry', say: 'Hungry. / The kind that makes you stupid.' },
  { id: 'thirst-1', when: 'thirsty', say: 'My mouth is like sandpaper.' },
  { id: 'thirst-2', when: 'thirsty', say: 'Thirsty. // A lake full of water, and I\'m thirsty.' },
  { id: 'tired-1', when: 'tired', say: 'Everything weighs twice as much today.' },
  { id: 'tired-2', when: 'tired', say: 'I could sleep standing up.' },
  { id: 'wet-1', when: 'wet', say: 'Soaked through. // Nothing out here ever really dries.' },
  { id: 'wet-2', when: 'wet', say: 'Wet socks. / There\'s no misery like it.' },

  // ---- looking at things
  { id: 'pack-1', when: 'look:pack', say: 'Mara\'s photo. // She\'s laughing at something I said. / I don\'t even remember what.' },
  { id: 'pack-2', when: 'look:pack', say: 'Dad\'s tag. // He never said much. / He didn\'t have to.' },
  { id: 'pack-3', when: 'look:pack', say: 'Mum\'s bird book. // She marked the loons. / A little pencil tick. / She knew I\'d see them.' },
  { id: 'cam-1', when: 'look:camera', say: 'Hi, Kerry. // Yes, I\'m talking to myself. / Get used to it.' },
  { id: 'cam-2', when: 'look:camera', say: 'Somebody is going to watch this on a couch. // Eating chips. / Warm.' },
  { id: 'fireL-1', when: 'look:fire', night: true, say: 'I could watch this all night. / I probably will.' },
  { id: 'fireL-2', when: 'look:fire', night: true, say: '~ The fire\'s the only thing out here that talks back.' },
  { id: 'water-1', when: 'look:water', say: 'Cold, clear, and endless. // I should be scared of it. / I\'m not. / Yet.' },
  { id: 'shelter-1', when: 'look:shelter', say: 'Home sweet home. // Mum would cry if she saw it. / Not the good kind.' },
  { id: 'ridge-1', when: 'look:ridge', say: 'You can see the whole lake from up here. / ~ It doesn\'t care about me at all. // Weirdly, that helps.' },
  { id: 'point-1', when: 'look:point', say: 'If I squint, that could be a cabin over there. / With a hot tub.' },
  { id: 'raven-1', when: 'look:raven', say: 'Hey, raven. // You\'ve been watching me for days. / What\'s the verdict?' },
  { id: 'jay-1', when: 'look:jay', say: 'That jay is a thief. / And honestly? / Respect.' },

  // ---- quiet moments
  { id: 'q-sit', when: 'quiet', night: false, say: 'Funny. / At home I can\'t sit still for five minutes. // Out here, I\'ve got nothing but minutes.' },
  { id: 'q-day', when: 'quiet', fromDay: 4, say: 'What day is it? // Doesn\'t matter. / Day something.' },
  { id: 'q-mara', when: 'quiet', say: 'I keep having whole conversations with Mara in my head. // She\'s winning most of them.' },
  { id: 'q-finish', when: 'quiet', say: 'Dad always said I never finish anything. // Watch me.', speed: 0.86 },
  { id: 'q-money', when: 'quiet', fromDay: 6, say: 'Four hundred thousand dollars. // I used to think about what I\'d buy. / Now I think about bread.' },
  { id: 'q-stars', when: 'quiet', night: true, weather: ['clear', 'cold'], say: 'So many stars. // I didn\'t know there were this many. / Nobody told me.' },
  { id: 'q-noise', when: 'quiet', night: true, say: 'Something\'s moving out there. // It\'s probably nothing. / It\'s probably nothing.' },
  { id: 'q-minus', when: 'quiet', winter: true, night: true, say: 'Minus twenty, they said. // They undersold it.' },
  { id: 'q-groan', when: 'quiet', winter: true, say: 'The lake is freezing. / You can hear it groan at night, like it\'s hurting.' },
  { id: 'q-white', when: 'quiet', winter: true, night: false, say: 'Everything\'s white. / Everything\'s quiet. // I\'m starting to like it. / And that scares me.' },
  { id: 'q-mist', when: 'quiet', morning: true, area: 'shore', winter: false, say: 'Mist on the lake. // Okay. / This part, I\'ll miss.' },
  { id: 'q-ten', when: 'quiet', fromDay: 10, say: 'Ten days. // I\'ve never done anything for ten days straight. / Except worry.' },
  { id: 'q-twenty', when: 'quiet', fromDay: 20, say: 'Twenty days. // I don\'t recognise my own hands anymore.', speed: 0.85 },
  { id: 'q-night', when: 'quiet', night: true, say: 'Mara\'s probably asleep by now. // Goodnight. / Don\'t steal the blanket.' },
  { id: 'q-trees', when: 'quiet', say: 'Thirty-four years old, / talking to trees. // Mum would be so proud.' },
  { id: 'q-rain', when: 'quiet', weather: ['rain', 'storm'], say: 'Rain on the tarp. // When I was a kid, I loved this sound. / I still do. / Don\'t tell anyone.' },
  { id: 'q-loons', when: 'quiet', area: 'shore', winter: false, say: 'The loons are at it again. // Arguing, / or in love. / Hard to tell with loons.' },
  { id: 'q-heart', when: 'quiet', area: 'woods', say: 'It\'s so quiet in here, I can hear my own heartbeat.' },
  { id: 'q-leaves', when: 'quiet', winter: false, say: 'The leaves are turning. // Everything\'s getting ready for winter. / Me too, I hope.' },
  { id: 'q-plane', when: 'quiet', fromDay: 5, say: 'I\'ve stopped listening for the plane. // That\'s either good, / or very bad.' },
  { id: 'q-why', when: 'quiet', fromDay: 3, say: 'If I went home now, / I\'d have to tell everyone why. // I don\'t even know why.' },
];

/** How often he speaks, in real seconds (the "rare" choice, D-067). */
export const THOUGHT_TIMING = {
  /** Nothing in the first stretch of a session. */
  firstDelay: 90,
  /** Between a quiet, body or looking thought and the one before it. */
  gap: 600,
  /** Between any two thoughts, moments included. */
  minGap: 60,
  /** A moment that cannot be said yet waits this long, then is dropped. */
  holdMoment: 90,
  /** Once the gap has passed, how often a quiet moment is considered, and the chance it speaks. */
  quietEvery: 20,
  quietChance: 0.3,
  /** A body bar at or below this counts as running low. */
  low: 25,
  /** Wetness at or above this counts as soaked. */
  wet: 60,
  /** Energy below this share of the most you can have counts as worn out. */
  tired: 0.2,
  /** How far the rest of the sound dips while he speaks, 0 to 1. */
  duck: 0.45,
} as const;

export const THOUGHT_TEXT = {
  subtitles: { label: 'Subtitles for his thoughts', hint: 'Show the words when Dan thinks out loud' },
} as const;
