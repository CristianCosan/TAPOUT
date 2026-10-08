# Known legacy bugs and ambiguities

These findings are characterization inputs, not permission to change behavior silently. Each item must receive a preserve/fix/redesign decision and a test before migration.

| ID | Finding | Classification | Intended treatment |
|---|---|---|---|
| LEG-001 | Intro copy says “pick 10 of 16” while `KIT_POOL` contains 17 items. | FIX | Display and validate 10 of 17 from one content definition. |
| LEG-002 | The v12 ration kit item describes eight uses but v12 has no ration state or consumption action. | FIX | Implement eight validated uses through the universal action pipeline; characterize balance separately. |
| LEG-003 | V12 has no durable save/resume system. | REDESIGN | Versioned, validated, atomic IndexedDB save with a previous-valid fallback and lifecycle hooks. |
| LEG-004 | `Math.random()` is used across simulation, presentation, audio, and setup, preventing replay. | REDESIGN | Named seeded RNG streams in core; cosmetic randomness remains outside state resolution. |
| LEG-005 | `actPoultice()` and `applyPoulticeDose()` both call `afterAction('poultice')`, double-counting and double-rendering one dose. | FIX | One command resolution and one structured outcome. |
| LEG-006 | Clay-jug rules disagree: action code consumes/checks 3 clay while render gating says 4 clay. | UNCLEAR | Preserve the canonical tuning value of 3 only after a characterization fixture and balance review. |
| LEG-007 | “Turn in early” promises a longer, harder night, but night resolution always advances exactly six hours; a 16:00 bedtime can wake the player at 22:00. | FIX | Forecast and resolve sleep to an intentional dawn boundary while preserving calibrated depletion. |
| LEG-008 | Active ice-fishing catches are credited to the net statistics bucket. | FIX | Separate fishing source statistics without changing food yield. |
| LEG-009 | Several guard clauses return silently when called outside the render-time disabled state. | FIX | Central validation always returns a user-facing reason. |
| LEG-010 | Many narrative and ending lines hard-code masculine pronouns. V14’s global text replacement is incomplete and unsafe. | FIX | Profile-aware authored variants/token formatting validated by pronoun tests. |
| LEG-011 | UI, state mutation, random resolution, presentation text, and persistence concerns are global and entangled. | REDESIGN | Pure domain state plus command/outcome contracts and adapters. |
| LEG-012 | Meaningful outcomes are often journal strings, so visual presentation must infer game meaning. | REDESIGN | Structured deltas, world changes, presentation cues, and journal entries from the same outcome. |
| LEG-013 | The action list and page body scroll make the scene secondary and hide state at small viewports. | REDESIGN | Fixed mobile shell with scene hotspots, context tray, bottom dock, and internally scrolling sheets. |
| LEG-014 | Audio unlock/mute is not persisted and synthesized timers are not suspended through a platform lifecycle adapter. | REDESIGN | Explicit audio unlock, persisted buses, resume/interruption handling, captions, and optional haptics. |
| LEG-015 | A smoking-visitor fox can enter hunt state although `GAME.fox` is absent from the legacy animal table, creating an unsafe direct-shot path. | FIX | Add a validated fox definition or route the encounter exclusively through its event resolver. |

