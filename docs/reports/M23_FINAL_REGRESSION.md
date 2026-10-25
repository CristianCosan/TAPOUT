# M23: final regression (2026-10-25, build 0.0.61)

Everything passed. No game change was needed.

| Check | What it did | Result |
|---|---|---|
| Parity, large | 300 runs, survivor bot, saved and reloaded every 7 decisions, port against untouched v12 | 300/300 identical, 602,769 decisions, all four endings (dead, med, tap, win) |
| Parity, real kit | 40 survivor + 40 careful-bot runs with the usual ten | 80/80 identical |
| Core soak | 150 whole runs (random, survivor, careful with the usual ten), JSON save/reload every 7 decisions | no errors, no stalls, no NaN, largest save 35 KB |
| Random-click soak | 8 minutes in the real game screen, 312 random clicks over all three areas, 4 page reloads mid-run | no errors |
| A run end to end | real game screen: three nights, reload and Continue after each, then the sat phone to an ending | ending recorded in history, save deleted, title shows only New run; no errors |
| `npm run check` | lint, types, 102 tests | green |

## A gap found and closed

The parity runner's default kit names four items v12 does not know (`knife`, `sleeping`,
`tarp`, `snare`), so until now no parity run or soak ever carried a sleeping bag or snare wire.
Those rules had never been compared against v12. `npm run parity -- --kit std` now plays the
usual ten, the soak rotates in the careful bot with the usual ten, and CI runs a 12-seed parity
sweep with the usual ten on every push.

## Not covered by machines

How it feels to play. That needs a person: one full run, with F8 notes.
