# TAP / OUT

A wilderness survival competition for Windows: one contestant, nine rivals, one shoreline
each, and a winter that does the deciding. Outlast everyone.

This repository is the production build. `legacy/tap-out-v12.html` is the original game and
the behavioural authority; the simulation here is a faithful port of it, verified by tests.

- The plan: `docs/plan/TAP_OUT_MASTER_PRODUCTION_PLAN.md`
- Where the work stands: `docs/STATUS.md`
- Every choice made so far: `docs/DECISIONS.md`
- How to work in this repository: `CLAUDE.md`

## Playing the current build on Windows

Every push builds `TAP-OUT-windows` in GitHub Actions: open the repository's **Actions** tab,
pick the latest green **CI** run, and download the artifact at the bottom. Unzip it and run the
portable `.exe`. The game saves as you play; Continue on the title screen picks up where you
closed it.

## Development

```
npm install
npm run dev        # play in a browser
npm run desktop    # the Electron window
npm run check      # lint, typecheck, tests
```
