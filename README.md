# TAP / OUT

A wilderness survival competition for Windows: one contestant, nine rivals, one shoreline
each, and a winter that does the deciding. Outlast everyone.

This repository is the production build. `legacy/tap-out-v12.html` is the original game and
the behavioural authority; the simulation here is a faithful port of it, verified by tests.

- The plan: `docs/plan/TAP_OUT_MASTER_PRODUCTION_PLAN.md`
- Where the work stands: `docs/STATUS.md`
- Every choice made so far: `docs/DECISIONS.md`
- How to work in this repository: `CLAUDE.md`

```
npm install
npm run dev        # play in a browser
npm run desktop    # the Electron window
npm run check      # lint, typecheck, tests
```
