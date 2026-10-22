# Status

**First person (D-030). Sir approved the camp look on 0.0.3; build 0.0.4 has his fixes (D-032).** The screens are now small 3D
areas you walk around in first person: Camp, Shore and Woods, built from code shapes. Looking at a
station lights it, clicking opens its v12 actions in the same panel as before. Day, dusk, night,
fire light, rain and snow follow v12's clock and weather; ambient sound is made in code. The v12
core, saves and Windows app are unchanged.

**Build 0.0.5 adds the intro (D-033)** and grass, bushes, ferns, driftwood and a creek.

**Build 0.0.6 (D-034)** adds pebbles along the shorelines, reeds at the inlet, stumps, fallen logs and moss in
the woods, and three keepsakes from home in the pack at camp (the photo of Mara, Dad's tag, Mum's bird book).

**Build 0.0.7 (D-035)** adds birds: ravens turning overhead, geese going south in autumn, a pair of loons
on the lake that dive and call at dusk, chickadees that hop about and scatter when you come close, a jay
that hops, ducks that drift, and bird calls made in code. Scenery only; nothing touches the run.

**Build 0.0.8 (D-036)** is the sound pass, all made in code: one engine with Master, Ambience, Effects and Music
volumes (a Sound button on the top bar), sounds for every action (chopping, fire, water, fishing, building,
hunting, cooking, eating, the flute), a quiet music bed that follows the weather with long silences, stings
for first frost, first snow, the Big Storm, the final two, a kill, awe, a predator, a stat in danger and the
ending, a low drone while resolve is cracking, owls and far wolves at night, birds going silent on v12's
`birdsSilent`, footsteps that crunch in winter, ambience ducked under cards and muffled while you sleep.

**Build 0.0.9 (D-037)** adds the parents / no-contact thread (plan §8.4, rule flag `homeThread`): after several
very hard nights in a row, thoughts of home surface one stage at a time (your mum's birthday, the form you
signed, your dad's age), a "Thoughts of home" condition wears a little at resolve from stage 2, talking to the
camera or a quiet sit eases it, and stage 4 is the Waiver card (accept it, say it to the camera, pick up the
phone, or not now). Measured with `npm run home:rarity`: in 200 long survivor runs stage 1 34.5%, stage 3 5.5%,
the card 2%, a thread-caused forced tap-out 0.5%; random-play runs almost never. Parity unchanged.

**Build 0.0.10 (D-038)** finishes the M18 narrative pieces (rule flag `letters`): at your pack you can write a
letter you will not send, to Mara (once a day, +3 morale, a little resolve, never a cost) or to Mum and Dad
(once per run; it eases thoughts of home). Every ending except a violent death now passes through the call
home: Mara picks up after a tap-out, a medical pull or the hospital; your parents too if you wrote to them or
the thread reached stage 2; after a win you ring your dad from the boat. Your letters appear in the epilogue.

**Build 0.0.11 (D-039)** starts M20: a Settings screen (from the title screen, and the Settings button in the
game) with the four volumes, mouse speed, invert up and down, head bob, rival names on the radio, full
screen, and the list of keys; and a Credits screen. Remembered on the computer.

**Build 0.0.12** adds tips for a first run (D-040): seven short notes on how things work (your body, looking
and using, time, other places, night, resolve, winter), each shown once when it applies, dismissed with a click
or Enter, switchable in Settings. Facts only; no advice and nothing happens if you ignore them.

**Next:** more M20 polish.

## First person — build 0.0.3
- `packages/content/src/locations/world.ts`: where every station stands in its area, in metres,
  plus walking speed, eye height and reach. A test proves every station but "you" is placed.
- `apps/game/src/world/World.ts`: the Three.js world. Pointer-lock mouse look, W A S D, Shift to
  run, collision with stations, hover by crosshair (or by mouse when the pointer is free), click to
  open, walk away to close. Sky shader, sun and moon, stars, fog, fire light and smoke, rain, snow,
  a lake that freezes in winter. Props follow the run (shelter tiers, firepit tiers, rack, cache,
  chair and table, the tally post's notches, the animal you spotted).
- `apps/game/src/world/props.ts`: every station as low-poly shapes. `sound.ts`: wind, rain, fire
  crackle, lake and footsteps from shaped noise.
- Tab (or the You button) opens the things that need only you. The layout guides (`#guide-camp`)
  still use the old Phaser screen.
- `globalThis.__tapoutWorld.lookAt(id)` aims you at a station for robot play and screenshots.

**Phase 1 is done, including M8.** The whole v12 simulation runs in `packages/core`, proven
identical to the untouched v12 file, and the deliberate changes to it are in behind rule flags
(`docs/reports/M8_CHANGES.md`). A plain but complete playable build exists.

**M9 is built and waiting on Sir:** Camp, Shore and Woods are real 16:9 screens (Phaser) with
every v12 action placed on a clickable spot, a context panel, rails for body and stores, and a
paged journal. Placeholder shapes stand in for the art. The three layout guides
(`docs/layouts/`) need Sir's OK before the art prompts are written against them.

**Next:** the full art prompt pack once the layouts are approved; meanwhile M10 onwards.

## Done

### M0 — repository and toolchain
- Layout per plan §9.1; `legacy/tap-out-v12.html` pinned by a hash test.
- Seeded RNG; lint forbids `Math.random`, `Date.now`, timers and DOM globals in the core.
- Fixed 1920×1080 stage, uniformly scaled with letterbox or pillarbox.
- Electron shell; CI builds one Windows portable `.exe` (TAP-OUT-<version>) as a downloadable artifact.

### M1 — legacy harness
- v12 runs unmodified in Node (`docs/spec/LEGACY_HARNESS.md`); `docs/spec/LEGACY_INDEX.md`.

### M2–M6 — the port (done together, by transplant: `docs/spec/PORT.md`)
- All of v12's rules in `packages/core/src/v12/`: clock, weather, temperature, body, cost engine,
  travel, camp economy, builds, fire, food, water, fishing, trapping, hunting, kill sites, night
  and dawn pipeline, raids, worry ledger, resolve, promises, vows, breakdowns, panic, cards,
  medical arcs, the ankle break, threads, interior voice, endings.
- `actionPanel()` / `hudRecord()`: v12's own action availability and HUD text, as data.
- **Proof:** `npm run parity` plays the port and the untouched v12 side by side, decision by
  decision, comparing the full state, the random-draw count and the modal on screen.
  200 survivor runs, 374,829 decisions, every ending class including a win: **all identical**.
  80 exploring runs: all identical. CI repeats a 40-run sweep on every push.
- Save and resume: `snapshotRun()` / `restoreRun()`. Lockstep runs that save and reload
  through JSON every 7 decisions stay identical, so a resumed run continues exactly.

### Early playable (ahead of M10/M13, plain screens)
- `apps/game`: title (Continue / New run), the kit draft, the game screen (body, eat and drink,
  stores, Camp/Shore/Woods with every v12 action and its cost line, journal, sleep, sat phone),
  every v12 modal (cards, raids, panic, breaks, endings), and the end screen.
- One save per run: autosaved after every click, Continue resumes exactly, a finished run's save
  is deleted (D-004). Stored in the browser/Electron local storage until M13 moves it to files.
- Robot-played in a real browser through complete runs to their endings with no errors.

### M8 — deliberate v12 changes
- Rule flags in `packages/core/src/v12/rules.ts`; parity keeps running with all of them off.
- "You" everywhere, the authored cast, the agency fixes, the medics' check before the death
  verdict, rations, the poultice, ice-fishing stats, the partner rule. One test per change.
- `npm run balance` compares outcomes under v12's rules and TAP / OUT's on the same seeds.
- Change report: `docs/reports/M8_CHANGES.md`. LEG-007 is deferred (D-021).

### M9 — location screens (awaiting layout approval)
- `packages/content/src/locations/`: one layout per location; a test proves every v12 action
  has exactly one station, hotspots stay in the safe area and exits connect the three places.
- `apps/game/src/scene/LocationScene.ts`: the Phaser tableau, depth-sorted, hover, selection,
  night darkening, F3 debug overlay. `#guide-camp` (and shore, woods) shows the layout guide.
- Robot-played through a full run by clicking the canvas and the context panel: no errors.

### M10 — camp playable with the mouse
- What a station offers lives in `apps/game/src/ui/offers.ts`; `offers.test.ts` plays four whole
  runs through those offers only, checking at every step that each action v12 shows has a station.
- Result card after each action: time taken, the new journal lines, and what moved (stores, body).
- Clicks on panels no longer fall through to the station underneath.

### M11 — travel, map, trapline, hunting
- Map overlay (M or the Map button; the trailhead post opens it too): the three places with
  walking, the four fishing spots with your lines, the five trapline spots with snare counts and
  "Set a snare" while you are in the woods, dead spots with "Explore new grounds".
- Each fishing spot sets its line right there. Travel fades in with the place name; arrival news
  shows on the result card. The animal and game-trail stations take the name of what you found.

### M12 — night, dawn, endings (waiting on Sir's playtest)
- Sleep and turning in early open a night preview: weather, temperature, fire, shelter, wet.
  Facts only, no advice. The night passes behind a dark curtain, then v12's dawn report.
- Cards, panic, the wolverine, the sat phone and all endings are v12's own modals, unchanged.
- Past runs (ending, day, cause) on the title screen; a test plays a tap-out to the end screen
  and checks it is recorded once and the save is gone.
- Build 0.0.2 is the grey-box playtest build. Interaction design locks after Sir plays it.
- Known: an early bedtime can wake you at 22:00 (LEG-007, deferred in D-021).

### M13 — saves to files
- Desktop: one JSON file per key under `%APPDATA%\TAP OUT` (`apps/desktop/store.cjs`), atomic
  write by temp file and rename; the browser build keeps localStorage behind the same API.
- `apps/game/src/saves.ts`: envelope with checksum, three rotating backups, a dawn copy, recovery
  in that order with a plain message; build 0.0.2 saves are read and rewrapped.
- New Run with a run going asks first and archives it as "Left the field".
- Tests: save suite (round trip, truncation, bad checksum, all-backups-bad, clear), desktop file
  store, 0.0.2 migration. The settings screen moved to M20 (D-028).

## Not started

M14 onwards: the painted locations, art, audio, narrative pass, Steam.

## Open questions for Sir

- The invented details in `docs/DECISIONS.md` (D-006 to D-011) are open to veto.
