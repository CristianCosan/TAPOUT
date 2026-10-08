# Status

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
