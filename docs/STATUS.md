# Status

**Current milestone:** M0 — repository reset and toolchain. **Done.**
**Next:** M1 — run the untouched v12 file headless in Node and write `docs/spec/LEGACY_INDEX.md`.

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

## Not started

Everything from M1 on. No v12 rule has been ported yet.

## Open questions for Sir

- The invented details in `docs/DECISIONS.md` (D-006 to D-011) are open to veto.
- The art approach is still being decided in the project chat. It changes nothing before M9.
