# M23: legal checks (2026-10-24)

A practical check before a public upload, not legal advice.

## Open-source licences: fixed

The game bundles six libraries: three, react, react-dom, scheduler, phaser and eventemitter3,
all MIT. MIT asks for its notice to ship with every copy, and until now it did not.
`npm run notices` writes their licence texts to `apps/game/src/legal/licences.txt`, Credits >
Open-source licences shows them in the game, and a test fails if a shipped library is missing or
its version changes without a rerun. The Windows build also carries Electron's own
`LICENSE.electron.txt` and `LICENSES.chromium.html`, which electron-builder adds.

The voice was recorded with Kokoro-82M (Apache-2.0). Only its recordings ship, not the model,
and the credits name it. Every model, texture, sound and the icon is made by this project, so
there are no third-party art licences (docs/CREDITS.md).

## Names

- **TAP / OUT.** "TapouT" is a long-standing MMA clothing brand, and there is a 2002 Xbox game
  called *UFC: Tapout* plus a small itch.io game called *tapout*. Ours is written with a slash
  and is a survival game, not a fighting game or clothing. The risk looks low but not zero. If
  you ever pay for Steam, a quick trademark search in the "video games" class is worth doing
  first; renaming before launch is cheap, after launch it is not.
- **HOLDOUT** (the show inside the game). Searching turned up a novel called *The Holdout*,
  but no TV show with that name. Fine.
- **The tagline.** The cover said "Outlast nine strangers". *Outlast* is both a Netflix survival
  show and a well-known horror game, so the cover now says "Nine rivals, one cold lake, and
  the North."
- **Rivals.** Their first names sound like real survival-show contestants (your call, 2026-10-08),
  but they have invented surnames, no real biographies, and nothing is said about the real
  people. Keep it that way.

## Store disclosures

The store page already discloses AI use (code and words written with Claude, voice made with
Kokoro, nothing generated while you play). Steam requires this, and itch.io asks for it.

## Still yours to decide

Whether to do a paid trademark check, and the final name, before any paid store.
