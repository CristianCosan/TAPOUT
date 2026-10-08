# Status

**Phase 1 is done, including M8.** The whole v12 simulation runs in `packages/core`, proven
identical to the untouched v12 file, and the deliberate changes to it are in behind rule flags
(`docs/reports/M8_CHANGES.md`). A plain but complete playable build exists.

**Next:** Phase 2 proper, starting with M9: the real 16:9 location screens with every station
laid out, for Sir to approve before the art prompts are written.

## Done

### M0 — repository and toolchain
- Layout per plan §9.1; `legacy/tap-out-v12.html` pinned by a hash test.
- Seeded RNG; lint forbids `Math.random`, `Date.now`, timers and DOM globals in the core.
- Fixed 1920×1080 stage, uniformly scaled with letterbox or pillarbox.
- Electron shell; CI builds a Windows portable `.exe` and `.zip` as a downloadable artifact.

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

## Not started

M9 onwards: the painted locations, art, audio, narrative pass, Steam.

## Open questions for Sir

- The invented details in `docs/DECISIONS.md` (D-006 to D-011) are open to veto.
