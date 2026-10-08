# M8 change report: the deliberate changes to v12

Every change sits behind a rule flag (D-017). With all flags off the port is still v12, and CI
keeps proving that against the untouched file on every push. The game runs with all flags on.

## What changed

| Change | Flag | Why | Test |
|---|---|---|---|
| The text says "you" everywhere; the radio uses the authored rivals (Ronald Pike, Cassie Moreau…); the prize is $400,000; letters and the partner lines are to Mara; no orcas in a lake (a moose swims the narrows) | `content` | Sir's decisions D-004, D-010, D-011; plan §2.4 | `rules.test.ts`, `tapout-play.test.ts` (reads every line a dozen runs showed) |
| Three comfortable days bring a weather front you are told about, not a surprise soaking | `directorFront` | §2.4: no invisible rubber band | `rules.test.ts` |
| No camera nag and no stress for skipping confessionals | `noCameraNag` | §2.4: no penalty for ignoring a suggestion | `rules.test.ts` |
| No resolve cost for skipping the tree-mark post | `noTreeMarkPenalty` | same | `rules.test.ts` |
| On a medical-check night the medics come before the death verdict | `medCheckBeforeDeath` | §2.12 #1, the v12 balance report's top item | `rules.test.ts` |
| Rations work: 8 uses, +20 hunger each | `rations` | LEG-002 | `rules.test.ts` |
| A poultice dose counts once | `poulticeOnce` | LEG-005 | `rules.test.ts` |
| Ice-fishing catches count as ice fishing, with their own line on the end screen | `iceFishStat` | LEG-008 | `rules.test.ts` |
| The partner's lonely nights cost half and steady you a little (+1 resolve); a forced tap-out names what broke you, never who is waiting | `partnerRule` | §8.3, D-022 | `rules.test.ts`, `tapout-play.test.ts` |
| The clay jug button asks for 3 clay, as the action always did | (display only) | LEG-006 | parity |
| The kit draft says "ten of these 17" | (display only) | LEG-001 | — |
| The fox drawn in by smoking can be shot without a crash | (data) | LEG-015 | parity |

## The new cause-of-loss split

`npm run balance -- --seeds 100 --singles no`: 100 survivor-bot runs, same seeds, up to day 70.

| Rules | Dead | Med pull | Tapped out | of which forced | Won | Still in | Median end day |
|---|---|---|---|---|---|---|---|
| v12 | 70.0% | 29.0% | 0.0% | 0.0% | 1.0% | 0.0% | 14 |
| TAP / OUT (all changes) | 58.0% | 42.0% | 0.0% | 0.0% | 0.0% | 0.0% | 14 |

Only the medics' check moves the split on its own (dead 70% → 59%, pulls 29% → 40%); the other
flags change single seeds, not the distribution. The bot never picks up the phone by choice, so
voluntary tap-outs are not measured here. The bot is weaker than a person: it is a yardstick for
before and after, not the game's real difficulty.

## Not done in M8

- **LEG-007, the 22:00 wake-up** (D-021). Fixing it changes v12's run calendar: early sleepers
  get two nights in a row in v12, and the balance depends on it. A fix cut the median run from
  day 14 to day 9. It returns as a balance pass after Sir has played.
- **LEG-009, silent refusals.** The buttons are disabled with a reason before you can press them,
  so a player never meets one. The command layer (plan §9.2) makes every refusal explicit.
- **LEG-010 beyond "you".** Profile-aware text for future protagonists comes with the narrative
  pass; v1 has one protagonist and every line now addresses you.
- **The parents thread and the girlfriend thread** are narrative milestones (plan §8), not M8.
