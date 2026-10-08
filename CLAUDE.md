# TAP / OUT

A run-based wilderness survival competition for Windows. One authored contestant on a
northern lake shore, nine unseen rivals, autumn sliding into a −20 °C winter over roughly
20–30 in-game days. You win by outlasting everyone. You lose by pressing the sat phone, by
a medical pull, or by the North.

`legacy/tap-out-v12.html` is the **behavioural authority**. The simulation is a faithful
port of it, proven equivalent by differential tests. Everything the player touches is new.

The full plan is `docs/plan/TAP_OUT_MASTER_PRODUCTION_PLAN.md`. Current state is
`docs/STATUS.md`. Every taste decision is dated in `docs/DECISIONS.md`.

## Hard rules

- Never edit `legacy/` or `docs/reference/`. A test pins the v12 file's hash.
- No rule logic in React components, Phaser scenes or the Electron shell. The core owns
  rules; content owns numbers and words; the app owns presentation.
- The core is pure: no DOM, no `Math.random`, no `Date.now`, no timers. Lint enforces this.
- Every rule change needs a parity test or a recorded intended-difference test.
- **Never** add a mandatory agenda, daily intention, "what matters now" judgement, ranked
  recommendations, or any consequence for ignoring a suggestion. The environment creates
  pressure; the player decides. Suggestions are dismissible and mechanically neutral.
- Events tagged `relationship:partner` can never drain resolve, create a promise or vow,
  or be the cause of a tap-out.
- Player-visible text lives behind ids in `@tapout/content`. Numbers live in content, not
  in core modules.

## Commands

```
npm install
npm run dev          # the game in a browser at :5173
npm run build        # bundle apps/game
npm run desktop      # build, then open the Electron window
npm run package:win  # Windows portable .exe + zip into apps/desktop/release
npm run check        # lint + typecheck + tests (run before every commit)
```

## Layout

```
legacy/            v12, read-only, the behavioural authority
packages/core      pure deterministic simulation (rng today; systems from M2)
packages/content   tuning, protagonist, show, strings
packages/harness   legacy runner, parity runner, balance bots (M1, M7)
apps/game          Vite + React + Phaser renderer on a fixed 1920x1080 stage
apps/desktop       Electron shell: window, file saves, Steam (M13, M21)
docs/              plan, status, decisions, specs, reference
```

## Milestone protocol

One milestone at a time, in the order of plan §14. A milestone ends with `npm run check`
green, `docs/STATUS.md` updated, and a commit.
