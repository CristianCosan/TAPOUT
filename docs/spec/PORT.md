# How the v12 port works

## The method

The plan (§1.5, §9.4) asks for a rule-for-rule port of v12, proven equivalent by differential
tests, before any presentation work. The port was done by **transplant**, not by rewriting:

- v12's script was split along its own section headers into modules under
  `packages/core/src/v12/` (`camp.ts`, `night.ts`, `cards.ts`, ...). The function bodies are v12's
  own text. `scripts/transplant-v12.ts` records exactly how; it is not re-run.
- The only mechanical changes: `export`/`import` lines, `Math.random()` → `rand()` from a seeded,
  serialisable stream (`runtime.ts`), and presentation calls routed through `ui.ts`.
- Three hand-written modules hold what an ES module cannot express the way a browser script did:
  `state.ts` (v12's two mutable globals, `S` and `SETTINGS`), `runtime.ts` (the RNG), `ui.ts` (the
  presenter hooks).
- v12's `render()` is not only paint: it finishes due smoking sessions and enforces the morale
  ceiling. Those two rules run in `ui.ts`'s `render()` whether or not anything is drawn.
- v12's action-list logic (which actions exist here, which are enabled, the cost line under each)
  lived inside `render()`. `panel.ts` runs that same code against a recording page and returns it
  as data: `actionPanel()`. The new UI and the bots both read it.

Why transplant: v12 is ~5,500 lines of tightly interleaved rules with the random draws woven
through text picks. Re-deriving each rule by hand risks exactly the drift that sank the Codex
rebuild; moving the code keeps the rules and the order of every random draw intact, and the
differential tests prove it. Types and structure are tightened afterwards, system by system,
with the parity tests as the safety net.

## The proof

`packages/harness` runs the **untouched** `legacy/tap-out-v12.html` in Node (`LEGACY_HARNESS.md`)
next to the port. `runLockstep()` plays both with the same seed, one player decision at a time,
and after every decision compares the entire state object, the number of random draws consumed,
and the modal on screen. A bot makes the decisions from what v12 offers: the action panel, eat and
drink, travel, sleep, and the buttons of whichever modal is open (card choices, raids, panic,
ankle break, endings). The bot has its own random stream, so it cannot disturb the comparison.

```
npm run parity -- --seeds 200 --days 70 --persona survivor   # 'random' explores, 'survivor' plays to live
```

The test suite runs a short version of this on every change.

## Known differences, deliberately kept out of state

- `startGame()`'s rain/snow particle builder spends 144 random draws on decoration before the run
  starts. The harness starts runs through `newGame()` directly, as the port does.
- The shot-introspection modal bakes its callback's source text into the button. The port emits
  the bare `fireShot()` call; the comparison normalises the two.
- v12 in a browser is not deterministic at all: its audio timers draw from `Math.random` in real
  time. The headless harness, with no timers, is the reference.

## What comes next on top of this

- **M8** makes the deliberate changes (agency fixes, the LEG-* defects, the protagonist, rival
  names, the partner rule), each with an intended-difference test replacing parity for that rule.
- Commands with `preview` / `resolve` / `Outcome` (plan §9.2) wrap the v12 functions as the new UI
  needs them, and modal HTML is replaced by structured pending interactions (plan §9.2) as each
  modal is rebuilt.
