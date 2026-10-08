# Decisions

One line each, dated, newest last. Decisions marked **vetoable** were delegated to Claude;
Sir can overturn any of them at any time and they are built so that overturning one is a
content edit, not a code change.

| ID | Date | Decision | Source |
|---|---|---|---|
| D-001 | 2026-10-08 | The master production plan is approved as written; work starts at M0. | Sir |
| D-002 | 2026-10-08 | The three mechanics that punished ignoring a suggestion are removed (camera nag, tree-mark penalty, director soaking). | Sir |
| D-003 | 2026-10-08 | The game is written in second person. It always says "you", never "he". | Sir |
| D-004 | 2026-10-08 | One save per run. It autosaves constantly and Continue resumes exactly where the game was closed. Death ends the run and deletes the save. Copying the save file to cheat is tolerated: no anti-tamper code. | Sir |
| D-005 | 2026-10-08 | The TV-show framing stays, under a fictional show name. The intro is about finally putting his bushcraft to the test and being selected. | Sir, via the plan |
| D-006 | 2026-10-08 | **Vetoable.** The protagonist is Daniel "Dan" Brandt, 34. | Claude |
| D-007 | 2026-10-08 | **Vetoable.** He is 178 cm and starts at 88 kg — the exact body every v8–v12 balance pass was measured on. | Plan §8.1 |
| D-008 | 2026-10-08 | **Vetoable.** His fear is *failing*: going back and admitting the cold won. It reads strongest against v12's existing dawn and dream lines. | Claude |
| D-009 | 2026-10-08 | **Vetoable.** His girlfriend is Mara; she pushed him to apply. His parents are Tomas (66, retired lineman, bad knee, taught him the axe) and Ilse (63, school librarian, still keeps the landline, birthday in late October). | Claude |
| D-010 | 2026-10-08 | **Vetoable.** The show is called HOLDOUT and the prize is $400,000 (v12 said $500,000). | Claude |
| D-011 | 2026-10-08 | **Vetoable.** The nine rivals are Doug Harlan, Birch Calloway, Willem Strand, Ronald Pike, Jordie Lavelle, Cassie Moreau, Cole Brenner, Luke Ostrander and Bree Halvorsen — each one letter or so off its v12 name, with invented surnames and no real-life biography. | Sir's rule, names by Claude |
| D-012 | 2026-10-08 | Music follows the weather (tense in storms, calm when serene), with modest stings for big moments, fear, and stats crossing into danger. | Sir |
| D-013 | 2026-10-08 | Sir does not make art by hand. The art pipeline is Claude's problem; the approach is still being chosen and does not block anything before M9. | Sir |
| D-014 | 2026-10-08 | Milestones run back to back without waiting for "next". Claude stops only for a build Sir should play or a decision only he can make. | Sir, via the coordinator |
| D-015 | 2026-10-08 | Art comes from ChatGPT image generation on Sir's existing plan: no API key, no paid service, now or later. Claude writes ~30–40 prompts, each producing a sheet of several assets on a plain background; Sir pastes them, saves the results and uploads one zip; Claude slices the sheets, removes backgrounds, names, sizes and places every asset. Weather, light, fire, rain, snow, the map and the UI are drawn in code. Supersedes D-013's open question. | Sir |
| D-016 | 2026-10-08 | The v12 port is done by transplant: v12's own functions moved into typed modules, randomness routed through one seeded stream, presentation behind hooks, and equivalence proven by lockstep tests against the untouched file. Rules are then refactored and typed system by system under those tests. See `docs/spec/PORT.md`. | Claude, within plan §1.5 |
| D-017 | 2026-10-08 | Deliberate changes to v12 sit behind rule flags (`packages/core/src/v12/rules.ts`). With every flag off the port is untouched v12, and the parity tests keep running in that mode forever; the game runs with every flag on. Each flag has an intended-difference test. | Claude, within plan §12 |
| D-018 | 2026-10-08 | Camera confessionals: the nudge lines and the stress for days without one are removed outright, not replaced. Events already mark when there is something to say (the camera button glows); confessing still relieves stress, morale and resolve. | Claude, within plan §2.4 |
| D-019 | 2026-10-08 | Director: three comfortable days now announce a weather front ("Something is coming in tomorrow"), and the next day's weather keeps the worse of two rolls. The surprise +35 wetness is gone. The brutal-streak gift is unchanged. | Claude, within plan §2.4 |
| D-020 | 2026-10-08 | On a medical-check night, a crash that would take health to zero ends in a medical pull instead of a death (plan §2.12 #1). On other nights a crash is still a death. Measured: dead 70% → 59% for the survivor bot, medical pulls 29% → 40%. | Claude, within plan §2.12 |
| D-021 | 2026-10-08 | LEG-007 (an early night can wake you at 22:00) is deferred, not fixed. v12's whole run calendar is calibrated with early sleepers getting two nights in a row; fixing it cut the median run from day 14 to day 9 in the harness. It comes back as a balance pass once Sir has played. | Claude |
| D-022 | 2026-10-08 | Forced tap-outs name what broke you (the injury, the cold, hunger, whatever circles camp, or plain attrition), never who is waiting at home. | Claude, within plan §8.3–8.4 |
| D-023 | 2026-10-08 | Rations (LEG-002): 8 uses, each +20 hunger, +1 morale, +4 energy, 160 kcal (two berry handfuls' worth); they never spoil. | Claude, within plan §2.6 |
| D-024 | 2026-10-08 | The orcas awe moment becomes a cow moose swimming the narrows at first light. | Claude, within plan §2.4 |
