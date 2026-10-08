# Status

**Current milestone:** M1 — legacy harness and legacy index. **Done.**
**Next:** M2 — port the core foundations (state, clock, photoperiod, temperature, weather, body,
the cost engine, travel) with parity tests against the legacy harness.

## Done

- Repository laid out as plan §9.1: `packages/core`, `packages/content`, `packages/harness`,
  `apps/game`, `apps/desktop`, `docs/`.
- `legacy/tap-out-v12.html` committed and pinned by a hash test, so it cannot drift.
- Seeded xorshift RNG in the core, with resume-from-save and range tests. It is the same
  generator the M1 legacy harness will substitute for `Math.random`.
- The v1 protagonist, the show and the nine rivals as typed content (all vetoable).
- Fixed 1920×1080 virtual stage: uniform scale, letterbox or pillarbox, never reflow.
  Verified at 1600×900 (exact fill), 1280×1024 (bars top and bottom) and 2560×1080
  (bars left and right).
- Electron shell opening that stage, with F11 fullscreen and a sandboxed preload.
- `npm run check` (lint, typecheck, 10 tests) green; lint forbids `Math.random`, `Date.now`,
  timers and DOM globals inside the core.

### M1

- `legacy/tap-out-v12.html` runs unmodified in Node: its script is evaluated in a VM context
  with a DOM stub and a seeded `Math.random`. See `docs/spec/LEGACY_HARNESS.md`.
- `playDays()` drives scripted runs, recording a snapshot after every call and returning the
  replayable call list the port will be driven through from M2.
- Determinism proven: the same seed gives byte-identical snapshot streams; different seeds
  diverge.
- `docs/spec/LEGACY_INDEX.md` generated: 29 sections, 432 top-level definitions, each with its
  line range and the module that will own it.
- `npm run legacy:run -- --days 3 --seed demo` prints a scripted run.

## Not started

Everything from M2 on. No v12 rule has been ported yet.

## Open questions for Sir

- The invented details in `docs/DECISIONS.md` (D-006 to D-011) are open to veto.
- The art approach is still being decided in the project chat. It changes nothing before M9.
