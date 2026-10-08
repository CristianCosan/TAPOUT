# Legacy system inventory

Source: `legacy/tap-out-v12.html` (SHA-256 recorded in
`docs/baseline-manifest.json`). The archived file remains untouched.

Classification vocabulary:

- **PRESERVE** — retain the rule and tune only with evidence.
- **FIX** — retain intent while correcting a contradiction or broken path.
- **REDESIGN** — preserve the simulation role through the new action/UI contract.
- **UNCLEAR** — add characterization evidence before changing behavior.

## Runtime shape and dependencies

V12 is one HTML document containing CSS, DOM layout, content, mutable global
state (`S`), simulation rules, rendering, event orchestration, audio, and debug
harnesses. UI callbacks call global functions which mutate `S`; rendering logic
also decides action availability. Randomness uses `Math.random()` through both
helpers and direct calls, so a run cannot be replayed exactly. These are
**REDESIGN** architecture concerns, not permission to delete mechanics.

The new owners are recorded in `docs/migration-map.md`.

## Starting profile and kit

Profile: name, height, sex/profile grammar, starting body weight, waiting
relationship, and fear. The typed profile and correct pronoun formatting are
**FIX** targets.

Kit pool (17): axe, saw, pot, backpack, ferro rod, bow, fishing line, snare wire,
mace, multitool, gill net, knife, shovel, rations, salt, tarp, soap. Kit draft and
ownership gates are **PRESERVE**. Rations appear in the v12 draft but have no
durable gameplay implementation, so their quantity and consumption are a
documented **FIX**.

## State domains

| Domain | Legacy state and behavior | Class |
| --- | --- | --- |
| Clock/world | day, hour, location, daylight, weather, winter descent, zero-cross day, first frost, large storm, travel, signs, visits | PRESERVE |
| Body | health, energy/ceiling, hunger, thirst, warmth, wetness, morale, stress, resolve, weight, calories, exposure, shivering | PRESERVE |
| Medical | injury, sickness, severe ankle salvage clock, medical arcs, long-running conditions | PRESERVE |
| Food/water | raw meat/berries queues, smoked food, meals, smoking sessions, raw/clean water, spoilage, waste, jug, ice cache | PRESERVE |
| Materials | logs, firewood, moss, rocks, clay, tinder, hide, carried vs camp stocks, carry limits | PRESERVE |
| Gear | axe/boots/ferro durability, arrows, line/wire stocks, kit ownership, break/repair chains | PRESERVE |
| Camp | fire, four shelters, build progress, three insulation levels, dugout, firepit/rack/cache tiers, huge rack, utility/comfort builds, storm damage | PRESERVE |
| Fishing | named shore spots, persistent lines, pressure/no-luck, net, damage, ice line, active ice fishing, fish sizes | PRESERVE |
| Trapping | named woods spots, persistent snares, pressure, stale checks, movement, stock use, scavenger damage | PRESERVE |
| Hunting | pressure, tracks/hot/spotted states, shot/trail, arrows, kill site, field work, portable load, hauling, lost/resighted animal | PRESERVE |
| Animals | hare, fat hare, squirrel, grouse, fat grouse, duck, beaver, wolverine, deer, moose; fish; wolves, birds, marten, bear/grizzly, scavengers | PRESERVE |
| Night | fire/exposure checks, quiet resolution, raids, predator pressure, condition changes, dawn notes | PRESERVE / REDESIGN presentation |
| Narrative | backstory, dawn writing, dreams, confessionals, awe, semantic letters, explicit promises/vows, threads, tags, recurring animals | PRESERVE |
| Competition | nine rivals, randomized tap schedule, final two, voluntary/forced tap-out, collapse/death, statistics and epilogue | PRESERVE |
| Persistence | none outside the live page | FIX |
| Audio | Web Audio synthesis/ambience tied to page lifecycle | REDESIGN behind adapter |
| UI | desktop-like top strip, stage, long action panels, modal/event overlays, journal log | REDESIGN mobile shell |

## Weather, time, and locations

Weather states: clear, overcast, rain, cold, snow, storm. Seasonal states include
pre-freeze, first frost, zero crossing, winter, multi-day major storm, daylight,
dusk/darkness, and night. Locations: camp, shore, woods, plus persistent named
shore/woods spots and journey transitions. The hard night cap, injury/weather
travel modifiers, and visit-driven state are **PRESERVE**; explicit travel previews
and arrival presentation are **REDESIGN**.

## Resources, food, and tools

- Stored/carry resources: logs, firewood, moss, rocks, clay, tinder, hide.
- Food/water: raw meat batches, berry batches, smoked portions, cooked meal,
  clean water, raw water, rations, calories and spoilage records.
- Gear/durability: axe, boots, ferro rod, arrows, line stock, wire stock; pot,
  saw, bag, bow, net, knife, shovel, salt, tarp, soap, mace, multitool gates.
- Fish result classes: small, medium, big, huge, humongous.

The legacy clay-jug subtitle/action-cost contradiction and other known defects are
listed in `docs/known-legacy-bugs.md` and treated as **FIX**.

## Structures and upgrade paths

| Object | Legacy path |
| --- | --- |
| Shelter | tarp on ground → lean-to → framed hut → timber shelter |
| Dugout | separate excavated shelter branch with work progress |
| Insulation | three moss-insulation levels |
| Fire | open fire → stone firepit → clay-lined firepit |
| Smoking rack | basic rack → covered rack; huge-rack branch |
| Cache | basic → reinforced → elevated cache |
| Cold storage | ice cache after winter |
| Food utilities | clay jug, berry picker, camp snares |
| Comfort | chair, table, bed, flute/instrument |
| Field systems | net, lines, snares and their persistent placements |

All paths are **PRESERVE** mechanically and **REDESIGN** as schema-validated,
inspectable content. Every tier must be visible before it is built.

## Player actions

The canonical IDs below map every visible v12 action family. Modal placement and
target-selection helpers map to the same command with parameters rather than
becoming duplicate commands.

### Camp and body

`fire.light`, `fire.addFuel`, `fire.frictionLight`, `water.boil`, `food.cookMeal`,
`food.smoke`, `food.smokeHuge`, `food.eatMeal`, `food.eatSmoked`,
`food.eatBerries`, `food.eatSpoiled`, `water.drink`, `camp.gatherFirewood`,
`inventory.dropOff`, `camp.buildShelter`, `camp.buildDugout`,
`camp.addInsulation`, `camp.buildFirepit`, `camp.buildRack`,
`camp.buildHugeRack`, `camp.buildCache`, `camp.buildJug`,
`camp.buildBerryPicker`, `camp.buildSnares`, `gear.sharpenAxe`,
`gear.maintainFerro`, `gear.haftAxe`, `gear.repairBoots`, `camp.patchRoof`,
`medical.applyPoultice`, `camp.buildInstrument`, `camp.playMusic`,
`narrative.confess`, `narrative.markTree`, `animal.feedJay`, `camp.buildChair`,
`camp.buildTable`, `camp.buildBed`, `body.wash`, `body.rest`, `body.sitWatch`,
`night.turnInEarly`, `night.sleep`, `run.tapOut`.

### Shore

`fishing.setLine`, `fishing.moveLine`, `fishing.checkLine`,
`fishing.setIceLine`, `fishing.iceFish`, `camp.buildIceCache`,
`fishing.buildNet`, `fishing.deployNet`, `fishing.checkNet`,
`water.fetch`, `gather.rocks`, `gather.clay`, `water.drinkStream`.

### Woods and hunting

`gather.forage`, `gather.tinder`, `trapping.setSnare`, `trapping.moveSnare`,
`trapping.checkSnare`, `hunting.scout`, `hunting.follow`, `hunting.shoot`,
`hunting.trackBlood`, `hunting.fieldDress`, `hunting.haul`,
`world.investigate`, `gather.logs`, `gather.firewood`, `gather.moss`,
`hunting.mooseCall`.

Travel between camp, shore, and woods is `travel.go`; line, net, snare, hunting,
event, and ending choices are typed command parameters. Every canonical command
will share preview/validation/resolution formulas.

## Event cards and conditions

Card IDs found in v12: `wolverineAtCache`, `fox`, `brokenTooth`, `stormPush`,
`bloodTrailDusk`, `tripleTriage`, `limpAtCheck`, `commitmentQuestion`,
`almostCantTakeIt`, `warningTremor`, `heyBear`, and `panicAttack`.

Long conditions include bear dread, raider siege, rot streak, wet bedding, cold
snap, soaked through, a cold, night fright, tooth deterioration, and moldy stock.
These and medical-arc/event choice paths are **PRESERVE**. Major event resolution
is **REDESIGN** into structured outcomes; no result may be journal-only.

## Narrative, rivals, and endings

Preserve explicit player-created promise/vow state, first-kill memory, tree-mark
thread, debt letter, confessionals, dreams, awe, lowest moment, recurring bird and
marten continuity, predator fixation, semantic personality tags, rival exits,
final-two announcement, voluntary tap-out, forced resolve collapse, physical
collapse/death, statistics, camp summary, and behavior-driven epilogue.

The v14 dawn-intention/agenda overlay is not a narrative system and is rejected.
See `docs/v14-delta-classification.md`.

## Known contradictions and accidental behavior

The baseline defect register is `docs/known-legacy-bugs.md`. It includes the kit
count mismatch, missing ration behavior, non-replayable RNG, double poultice
post-action processing, jug cost contradiction, early-sleep duration mismatch,
ice-fish stat attribution, silent validation guards, hard-coded pronouns,
render/simulation entanglement, log-only outcomes, scroll-heavy UI, audio lifecycle
issues, and unsafe direct animal lookup. Each fix must receive a regression test.
