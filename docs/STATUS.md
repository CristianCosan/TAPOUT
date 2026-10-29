# Status

**One Winter (D-114, 3.0.0-ow.1) is the game now.** Sir threw out everything before it on 2026-10-29. It is a single page,
`apps/desktop/one-winter/game.html`, playable in the browser (https://claude.ai/artifact/Db6GhJvze7a9i4JKJdK31T) and,
from this version, as the Windows build: the desktop app's renderer is that page with the fonts bundled
(`apps/desktop/scripts/copy-renderer.cjs`). All numbers sit in one `N` object at the top of the rules section.
Built and approved in four steps the same day: the look and music, three playable days, a full run, then seasons,
unlocks and the Windows build. Everything below this section describes the v12 port and the first-person build,
kept for reference.


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

**Build 0.0.13** adds quiet interface sounds (D-041): a soft tick when something you can use comes into
view, a wooden knock when a panel opens or closes, a low tone for a card, and a paper rustle for the
journal and map. On the Effects volume.

**Build 0.0.14** makes the camp show what you have (D-042): logs stack on the woodpile and split firewood
piles in front, meat hangs on the hook, berries fill the basket, and the materials corner grows stones, moss,
clay and tinder as they come in.

**Build 0.0.15** carries this on (D-042): the smoking rack shows raw strips with a smoulder and smoke while
meat is smoking and dark strips once it is smoked, and a fishing spot shows your rod, line and float only
while your line is set there.

**Build 0.0.16** starts M22 hardening with a crash log (D-043): errors from the game and the desktop shell go
to `crash.log` in the save folder (kept under 256 KB), a renderer crash reloads the window, and if a screen
breaks you get a calm card saying the run is saved, with Restart and Open the save folder.

M20 is done apart from event illustrations (A10/A11), which belonged to the painted-2D plan and are not
planned for the 3D game. M21 (Steam) needs a Steamworks account, which costs money, so it waits for Sir.

**Build 0.0.17** adds Lighter graphics in Settings (D-044): 1280x720 rendering scaled up, 1024 sun shadows
and no fire shadows. In headless software rendering it ran about 60% faster than the full setting.

**Build 0.0.18** adds a soak test, `npm run soak -- --seeds 100` (D-045): whole TAP / OUT runs saved and
reloaded through JSON every 7 decisions, checked for thrown errors, stalls, non-finite numbers and save size.
Its first run found a real bug: after Continue, writing a letter crashed, because the letter heading was a
function in the run's saved cast and JSON dropped it. Fixed (it is a plain string now, and old saves without
it still work), with a test. 60 runs after the fix: no problems, largest state 34 KB.

**Build 0.0.19** adds autumn leaves drifting down around you (D-046): most in the woods, fewer at camp and
the shore, none in winter, snow or storms. A robot playthrough of the real screens (about 450 random clicks
across the three areas with reloads) found no errors.

**Build 0.0.20** adds mist on the lake (D-046): soft banks lying on open water, thickest around dawn, a
little at dusk, thinner in rain, none on ice.

**Build 0.0.21** adds clusters of rust-capped mushrooms on the woods floor in autumn (D-046).

**Build 0.0.22** shows your breath in the cold (D-047): at 2 °C or below a faint cloud forms in front of you
every few seconds, quicker when you run. Read from v12's air temperature.

**Build 0.0.23** adds northern lights (D-048): green and violet curtains rippling low in the northern sky on
the night of v12's aurora awe event, and on about one clear or cold night in four from day 8.

**Build 0.0.24** leaves footprints in the snow (D-048): in winter each step leaves a print, left and right in
turn, the last 200 kept per area.

**Build 0.0.25** adds lightning and thunder to storms (D-049): every 12 to 40 seconds the sky flashes, and
the thunder follows after a gap that says how far away it struck (a crack when close, a long roll when far).
Since something now flashes, Settings has **Reduce flashing**, which softens it to a fifth.

**Build 0.0.26** makes the ground wet in rain (D-049): darker with a little sheen while it rains, drying
slowly after.

**Build 0.0.27** shows your traps and net (D-042): a strip of red flagging tape on the trapline post for
each snare you have set; the net frame holds a few strands until the gill net is woven, the whole net when
it is home, and nothing while it is set; and a line of yellow floats on the water at the spot where it is set.

**Build 0.0.28** redraws the map as an inked field map (D-050): paper with grain, the lake with ripple
lines, ink trees over the land, a compass, dark-ink paths. Same places and buttons. A draw-call check found
about 260 calls and 160k triangles per area, so no performance work is needed there.

**Build 0.0.29** makes the journal the paper notebook from your pack, to match the map (D-050): ruled
lines, a red margin, pencil-coloured ink, good and bad lines in green and red ink. Same pages and buttons.

**Build 0.0.30** puts rings on open water (D-051): now and then a fish rises, most at dawn and dusk, with a
small plop when it is near you; and in rain the drops dimple the water around you. None on ice.

**Build 0.0.31** adds clouds to the sky (D-052): soft drifting clouds drawn in the sky shader, a few on clear
days, most of the sky when overcast, a low fast lid in storms, lit by the hour and tinted at sunset.

**Build 0.0.32** puts a deer at the woods tree line (D-053): out by day and at dawn and dusk, not at night,
in storms or when the birds go silent. It grazes, lifts its head and watches you inside 15 m, and inside 9 m
it snorts and bounds off with its white tail up. Scenery only; hunting is v12's.

**Build 0.0.33** sends sparks up from a burning fire: a few at a time, glowing orange and fading as they
rise, pushed sideways by the wind in rain and storms.

**Build 0.0.34** makes the treetops move with the wind (a vertex shader on the foliage): a slow sway on calm
days, harder in rain, and a heavy, gusting thrash in storms. Each tree keeps its own rhythm.

**Build 0.0.35** adds shooting stars: on a clear, dark night a meteor streaks across the sky every half
minute to a minute and a half.

**Build 0.0.36** lets frost creep in at the edges of the view in hard cold (D-055): none above -6 °C,
thickest by -24 °C, coming and going over a few seconds.

**Build 0.0.37** makes the frozen lake sing: in winter, near the ice at camp and the shore, a crack runs
across it every 12 to 47 seconds, a sharp tick, a falling "pew" and a low boom (made in code, louder close).

**Build 0.0.38** puts a beaver on the lake at the shore (D-056): now and then in daylight it swims a slow
line along the shore with a V of wake behind it; go down to the water's edge near it and it slaps its tail
(a flat crack with an echo) and dives. Not in winter, storms, or when the birds go silent.

**Build 0.0.39** blows snow low along the ground in winter snow and snowstorms: fine drift racing past
your ankles with the wind, thicker and faster in a storm, easing in and out as the weather turns.

**Build 0.0.40** lays low fog between the trees of the woods in the early morning (thickest around 06:50,
lifting by mid-morning, thin in rain, almost none in storms, none in winter), lit by the hour.

**Build 0.0.41** adds a red squirrel at the edge of the clearing in the woods and at camp: it sits facing
you, flicks its tail and scolds you with a dry rattle every few seconds, and dashes off into the trees if you
come within a few metres. Not in rain, at night, or when the birds go silent.

**Build 0.0.42** adds a woodpecker drumming in the woods by day and an owl that glides across the sky on calm nights, now and then hooting as it goes (D-058). Scenery and sound only.

**Build 0.0.43** adds a red fox in winter that trots across the snow, now and then stops to listen and pounces, and barks and runs if you come close (D-059).

**Build 0.0.44** adds snow sliding off the boughs in winter: now and then a load drops off a tree near you in a soft curtain of powder, with a hiss and a muffled whump.

**Build 0.0.45** adds a snowshoe hare at the edge of the clearing at camp and in the woods: brown in autumn, white in winter, it freezes when you come close and then bolts in a zigzag (D-060).

**Build 0.0.46** hangs icicles from the lean-to's front pole and the timber shelter's eaves in winter.

**Build 0.0.47** gives the moon its phases over the run (a crescent the first evening, full near day 11), with brighter moonlight and a soft glow as it fills (D-061). `preview()` also takes `day`.

**Build 0.0.48** lays a glittering moon path on the open lake on moonlit nights, brighter as the moon fills.

**Build 0.0.49** makes the campfire smoke lean with the wind and stay low in storms, and leaves a thin smouldering wisp for a couple of minutes after the fire goes out (D-062).

**Build 0.0.50** leaves glowing coals in the ash after the fire goes out, pulsing and fading over a couple of minutes.

**Build 0.0.51** adds the sound of rain on the shelter roof when you stand under or beside it: a taut patter on the tarp, softer on boughs or logs (D-063).

**Build 0.0.52** adds puddles that fill in the low spots of each clearing in rain and dry up after.

**Build 0.0.53** is a hardening pass. Lighter graphics now also halves rain and snow, thins the blowing ground drift to a third, and drops the morning ground fog. The core soak (100 runs, about 120k decisions) and the random-click UI soak both came back clean. The only console line was a missing favicon request, now silenced.

**Build 0.0.54** makes the show's camera at camp turn slowly to keep you in frame, with its red light blinking (D-064).

0.0.55 (2026-10-23): a bald eagle circles over the lake on clear days at the shore, dives for a fish with a splash ring, and climbs away (D-065).

0.0.56 (2026-10-24): low-end hardening. If the game stutters in its first seconds on full graphics, it offers Lighter graphics once; the player decides (D-066).

0.0.57 (2026-10-24): Dan's inner voice, spoken (D-067). 73 recorded thoughts for moments, the body, things you look at and quiet times, rare by design; a Voice volume and optional subtitles. Re-record with `npm run voice:lines` and `scripts/voice/render.py`.

0.0.58 (2026-10-24): inner voice paced in game days (every 4-5, or 2-3 when low), 16 low-day lines, and every talk to the camera spoken (D-068).

M23 started (2026-10-24): store page draft and six screenshots in docs/store (D-069). Still to make: capsule and header images, optional trailer, price.

Balance pass and slow-PC check (D-070, docs/reports/M22_BALANCE_AND_SLOW_PC.md): no rule changes; balance runs now use the real kit; a careful-player bot (`--persona competent`) lasts a median of 17 days; every area stays under 300 draw calls.

**Build 0.0.59** has its own icon (D-071) on the .exe, window, taskbar and tab, plus an itch.io cover image in docs/store.

**Build 0.0.60** adds playtest notes (D-072): F8 to jot something down mid-run, Settings to copy them all.

**Build 0.0.61** is the M23 legal pass (D-073): open-source licences in Credits, a name check, a safer cover tagline, and 'Raw chill' instead of 'Cold snap' on mild days.

Final regression (docs/reports/M23_FINAL_REGRESSION.md): all green on 0.0.61; parity and soak now also cover the usual-ten kit, and CI runs a usual-ten parity sweep.

A release job in CI puts every build merged into main on the GitHub release page for its version (tag v<version>), which, unlike build artifacts, never expires.

**1.0.0-rc.1** (D-074) is the release candidate: merged into main and tagged; the download lives on the GitHub release page. M23 is done up to the plan's STOP: launching, and where, is Sir's decision.

**1.0.0-rc.2** answers Sir's first five minutes on rc.1 (D-075 to D-080). Energy rules were never changed (parity proves it); what had drifted was the screen: Rest sat behind Tab and turning in only worked at the shelter. Energy is now the big meter in the middle with Rest (R) and turn-in beside it in every place. Camp sits uphill in the trees above the shore with logs and rocks about; camp builds show their whole build path; every resource has a picture with hover words; every action shows a short first-person motion; and the intro is spoken (narrator, Kerry, Mum), with Dan saying why he chose the camp spot.

**1.0.0-rc.3** answers Sir's rc.2 run (D-081 to D-087). You never learn who is left; medics come from day 14 every six to eight days, and the win arrives as a med check that becomes a scene with Kerry and Mara. Traps need 12 hours before a catch. Camp has fallen timber and loose stones to gather. The dugout is dug, then walled and roofed. Build panels show routes and stages apart from uses. No emojis: every icon is the game's own. Only people talking are voiced; Dan is faster. Test mode in Settings. Signposts walk straight; cards restyled; smaller energy meter; birds sit still.

**1.0.0-rc.5** carries on from rc.4 with Sir's other asks (D-095 to D-099). A thick jacket and a rain shell you change in a minute, with real effects on warmth, rain and sweat. A backpack screen (I, or the pack button) with clothes, the tool in hand (keys 1 to 5), the kit and its condition, and what you carry. Hunting in the world: a hoof-print trail you can follow, which walks you to the animal, Dan speaking at each turn of the hunt, and the shot drawn and loosed by hand at v12's odds. A stone stove that keeps a night fire going. Smaller side strips. Balance (100 competent runs): 86% dead, 13% medical pull, median day 17 (rc.4: 89% dead, day 16).

**1.0.0-rc.6** is Sir's yes to the rc.6 list (D-100 to D-105). A night that would kill you brings the medics instead. The second tarp goes over every shelter stage and warms it. After day 20 Dan thinks of new upgrades: a reflector wall, bark shingles, a snow wall. Ten more choice events at camp. In winter the lake ice thickens day by day; you can check it, and thin ice is slow and can drop you through; before winter, storm days make the shore rocks slick. Falls get a short scene. The stove dries clothes faster. Balance (100 competent runs): 13% dead, 85% medical pull, median day 16.

**1.0.0-rc.7** (D-106, D-107): in winter the frozen lake is walkable from the shore, and the ice looks and sounds like its thickness, with the day's test hole. The reflector wall, bark shingles and snow wall are drawn in camp. The lean-to and hut roofs now lie along their frames. Presentation only; no rule changes.

Store page refreshed for rc.7 (docs/store/STORE_PAGE.md): the text no longer mentions radio news about rivals or deer wandering the woods (both gone since rc.3), and now covers step-by-step builds, hunting by sign, clothes and the backpack, the winter ice and the medics. Ten new screenshots and a new cover.

**1.0.0-rc.4** answers Sir's rc.3 notes on building (D-088 to D-092). Shelter or dugout, one per run, and the other route disappears once one is started. The main build takes days (one sitting a day). Every build climbs in named steps (shelter 10, dugout 5, firepit 5, rack 5, cache 7) at v12's total costs. Each build panel puts the main build on top in a gold frame: a picture of what it is now, the steps, then the next one; the bed and other builds sit below. A build menu (B) starts everything; the rack, cache and chair and table appear only once started. Each step is three or four small jobs with hands motions and a spoken line from Dan (three or four versions), and you can stop and carry on later. Actions take realistic time (D-093). Logs and stones you can see in camp, stones on the shore and trees and mossy rocks in the woods are all pickable, and camp's run out as you use them. The dugout shows its pit, spoil and walls under a flat tarp; a shelter tier under way grows beside the old one. No deer wander about.

**Next:** Sir's play of rc.6 and his notes.

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

**1.0.0-rc.8** (D-108 to D-112): every build job has its own time, energy and materials, spent when you click it, with a progress line and stop-and-carry-on kept in the save; Sir's times for fire, friction fire, foraging, tinder, snares, tracks, carving, logs and travel; daytime collapse ends in the medics; the earth dugout rebuilt as a pit house and the other shelters given proper thatch, boards, gables, door and chimney. A table of every action time and build job, read from the game, is made by `npm run table`. Essentials are buildable by about day 18 (shelter route) or day 9 (dugout route).
