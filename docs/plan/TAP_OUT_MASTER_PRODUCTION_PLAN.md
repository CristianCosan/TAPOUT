# TAP / OUT — MASTER PRODUCTION PLAN

Version 1.0 · 2026-10-07 · Status: **awaiting Sir's approval. Planning only. No code, no assets, no builds until approved.**

Sources read for this plan:

- `legacy/tap-out-v12.html` (6,283 lines; the simulation was read function by function: tuning, kit draft, body/cost engine, worry ledger, person layer, medical arcs, resolve, director, threads, travel, all woods/shore/camp actions, night and dawn, interior voice, card engine, break sequence, endings).
- `BALANCE-REPORT-v12.md` and `BALANCE-CHANGELOG.md` (v8 to v12).
- The React/Phaser/TypeScript rebuild (`packages/*`, `apps/game/*`, tests, docs).
- The historical planning documents (`00`–`06`, `docs/*`), treated as input only.
- The six images in the visual reference zip.

Where a statement is an inference rather than something checked in the files, it says so.

---

## 1. EXECUTIVE VERDICT

### 1.1 What the game should be

TAP / OUT is a run-based wilderness survival competition for Windows: one authored contestant, nine unseen rivals, a lake shore that slides from autumn into a −20 °C winter over roughly 20–30 in-game days. The game is won by outlasting everyone. It is lost by pressing the sat phone, by a medical pull, or by the North.

The finished product keeps **v12's simulation almost exactly** (it is deep, tuned across five balance passes, and is the thing Sir actually enjoyed) and replaces **everything the player touches**: the long button lists and log become three painted, living 16:9 locations where the camp, the shore and the woods show their state, and where the player clicks the things in the world to act on them.

### 1.2 Interaction model (one recommendation)

**Hybrid: a painted diorama with clickable stations, resolved as discrete time blocks, plus a small hand-drawn map.**

- Camp, Shore and Woods are each one fixed 16:9 tableau (no scrolling, no free walking). Every v12 system that has a physical object lives on screen as that object, in its current state.
- Clicking an object opens a compact context panel with its actions, each showing the exact energy, time, finishing hour and requirements before you commit. Executing an action plays a short "beat" (pose change, sound, small effect, clock advancing) and lands a verdict-first result.
- The protagonist is shown as a posed cutout at the station he is working, not as a walking character.
- A hand-drawn map (overlay, not a separate world) handles travel, the five named trapline spots, kill sites, tracks and other temporary discoveries.

Why not the alternatives: see §4.1. In short, v12 is a time-block economy with no movement cost inside a location, which is exactly what the activity-node model expresses; but Sir wants presence and visible camp growth, which is what the side-view location model gives. Walking, pathing and full-body animation would add the most expensive asset class in the project while adding no v12 mechanic.

### 1.3 Technical stack (one recommendation)

**Restructure the existing TypeScript stack (option 2). Do not move engines.**

| Layer | Choice |
|---|---|
| Simulation | Pure, deterministic TypeScript package, a **faithful port of v12** verified against the legacy file by differential tests |
| World rendering | Phaser 3 (WebGL), one scene per location, layered sprites, built-in post-FX for grading |
| UI | React DOM overlay inside a fixed 1920×1080 virtual stage, uniformly scaled and letterboxed |
| Audio | Custom Web Audio director with four buses (Master, Ambience, Effects, Music) |
| Desktop shell | Electron, packaged with electron-builder; Steamworks through steamworks.js |
| Saves | JSON files in `%APPDATA%`, atomic write, rotating backups, versioned migrations, Steam Auto-Cloud |
| Tests | Vitest (core, parity, content), headless balance harness, Playwright for the built game |

This keeps Claude Code in the language it handles best, keeps the whole game testable headless in Node (which is how every v8–v12 balance pass was done), and ships as a normal Windows executable on Steam. The reasoning and the comparison with Godot are in §11.1.

### 1.4 What to salvage from the current rebuild

The rebuild is scaffolding plus one action (`camp.gatherFirewood`). Its rules are not a v12 port: it invents numbers (for example hunger `ceil(hours*1.3)` against v12's 1.4/h) and it is portrait/mobile-first. Salvage is therefore small and specific:

| Keep (as code or as pattern) | Discard |
|---|---|
| `packages/core/src/rng.ts` (seeded xorshift, hashing) | `simulation.ts`, `initial-state.ts`, `upgrades.ts` rules (invented, not v12) |
| The preview → validate → resolve → outcome command pattern | `CampScene.ts` (programmer-art graphics) |
| The primary/backup save idea and envelope parsing concept | IndexedDB storage, Capacitor, Android scripts |
| Workspace split (core / content / harness / app), TS + ESLint config | `styles.css` and the mobile sheet shell |
| `docs/known-legacy-bugs.md` and the system inventories (as reference) | Zustand store as written (rebuild it around the new core) |
| The v14 rejection list and its policy test idea | All portrait screenshots and visual baselines |

The visual references are useful for mood and for the survivor's look; they are not usable as production art (see §6.1).

### 1.5 The single most important process decision

Port v12 **first, headless, with parity tests**, before any presentation work. Every earlier attempt failed by building presentation on a simulation that did not yet exist. Nothing in the new UI is allowed to call a rule that is not already ported and proven equivalent to v12 (or deliberately changed and recorded).

---

## 2. COMPLETE V12 SYSTEM AUDIT

Verdict key:

- **KEEP** — preserve the rule and its numbers; port 1:1.
- **PRESENT** — keep the rule; change only how it is shown.
- **CHANGE** — keep the intent; the rule itself needs a deliberate change (each one gets a test and a harness re-run).
- **REMOVE** — drop it.

### 2.1 Run structure and competition

| System | What v12 actually does | Verdict | Notes |
|---|---|---|---|
| Run length (`RUN_SCALE=28`) | Calendar compressed; median end day 19 in the harness; last rival leaves between day 21 and 30 | KEEP | The compressed run suits a commercial game: a full run is an evening or two |
| Kit draft | Pick 10 of 17 (UI says "of 16", a bug); 10 standard + 7 optional; each item gates actions | KEEP + fix count | Excellent replay lever; it is also the natural difficulty setting |
| Rivals | 9 rivals; 8 tap days rolled 2–20, last one 21–30; contextual reasons; radio news; +4 morale per exit | KEEP + CHANGE names | Rival first names (Dub, Roland, Jordan, Callie, Clay, Britt…) look like real contestants of a real TV survival show. Inferred, not verified; replace with original names before release |
| Final two | Announcement, music sting, dawn lines | KEEP | |
| Win | Last rival taps → win ceremony | KEEP | |
| Voluntary tap-out | Sat phone, two-step confirmation, typewriter text | KEEP / PRESENT | Phone becomes a HUD object that warms and pulses with low resolve, as in v12 |
| Forced tap-outs | Resolve collapse cinematic; failed vow deadline; medical-arc crisis with one-button phone | KEEP + CHANGE text | Forced tap-out text currently names "who's waiting"; must name what actually broke him (§8.4) |
| Medical pulls | Check every 4 days; severe = health <15, weight loss ≥27 %, BMI ≤17.5; also nightly BMI/weight pull; no pull before day 5 | KEEP + CHANGE order | The hard-death check runs before the med-pull safety net in the same night. Balance report names this the top fix (§2.12) |
| Death | Health ≤0; collapse vs violent (HEY BEAR mace failure) | KEEP | |
| Endings | Four classes, each a multi-step sequence; "why" and "last look" choices; epilogue built from run history | KEEP / PRESENT | One of v12's best features; deserves illustrated presentation |
| Statistics | Totals for food, catches, kills, fires, injuries, storms, raids, etc.; result card PNG; summary; JSON export | KEEP / PRESENT | Result card becomes an in-game screen; JSON export moves to a debug/feedback menu |
| Run recorder | Optional event log and daily snapshots | KEEP (debug) | Becomes the replay log and bug-report attachment |
| Prize and show framing | $500,000 prize, helicopter, med team | CHANGE (decision) | The premise is fine; the exact prize figure and the rival names make it read as a specific real show. Decision §17 |

### 2.2 Time, daylight, weather, temperature

| System | v12 | Verdict | Notes |
|---|---|---|---|
| Clock | Day starts 06:00; actions cost hours; night hard cap 30 (06:00 next day) | KEEP | |
| Photoperiod | Dusk moves from 21:30 toward 16:45; dawn drifts 06:00→08:30 | KEEP / PRESENT | Drives the lighting grade and the "daylight left" HUD bar |
| Night economics | After 21:00 physical work ×1.3 time, +1.5 stress/h (0.75 with fire at camp), ×2 injury chance; past-midnight energy debt | KEEP | |
| Temperature "Descent" | Deterministic curve: 12–16 °C day 1, ≤5 °C by day 11, zero-cross day Z in [12,18], −20 °C floor, −20…−12 oscillation | KEEP | Drives ground state art (§6) |
| Weather | clear / overcast / rain / cold snap / snow / storm, rolled daily from day-banded tables; precipitation type derived from temperature | KEEP | Each state has warmth drain, fire chance, wetness gain, slip chance |
| First frost | Fires on the first real ≤0 °C day | KEEP / PRESENT | Ceremony becomes an in-scene moment |
| Winter onset | First snow after Z: lines cleared, travel ×1.5 time, actions ×1.25 energy, first-snow ceremony, "snow hush" audio | KEEP / PRESENT | |
| Big Storm | Rolled day 10–15, two days; triple-triage card the day before | KEEP | |
| Birds go silent | Foreshadows predators, frost and storms | KEEP / PRESENT | Pure audio tell in the new game; excellent |

### 2.3 Body

| System | v12 | Verdict | Notes |
|---|---|---|---|
| Health | 0–100, drained by zero hunger/thirst/warmth; overnight penalties; recovery when warm/fed/dry; **health ceiling** falls with kg lost and an isolation toll after day 10 | KEEP | The ceiling is invisible in v12; show it as a marker on the bar |
| Energy | Ceiling schedule (180 days 1–5, tapering to 120 by day 8, falling with the run), modified by meals, morale, stress, warmth, weight loss; dawn energy = ceiling × condition factor | KEEP / PRESENT | Show ceiling vs current; this is the main daily budget |
| Energy debt and late rise | Overspending borrows up to 6, trimmed off tomorrow; low intake or debt makes you sleep in 2–3 h | KEEP | |
| Hunger / thirst | Day and night depletion rates; zero adds stress and drains health | KEEP | |
| Warmth | Camp vs outdoor drain; tiered outdoor exposure (2/4/6 per hour), ×2 rain, ×1.5 post-freeze; fire restores; soaked cap 70 | KEEP | |
| Wetness, exposure, Soaked Through | Rain/cold hours accumulate exposure; ≥3.5 → Soaked Through until 3 h drying at fire | KEEP / PRESENT | Visible as a condition chip and as a damp tint on the character |
| Shivering | Any cold/wet tag: ×1.5 time, ×2 energy; clears after 3.5 fire-rest hours | KEEP / PRESENT | Character switches to the "cold" idle pose |
| Calories and weight | kcal burn by activity and season; 3,800 kcal per kg; weight, BMI, loss % | KEEP / PRESENT | |
| Sensitivity ramp | All stress/morale deltas ×1.0→×1.5 by day 25 | KEEP | |
| Slips and injuries | Weather-based slip: sprained ankle, wrist, fall into the lake | KEEP / PRESENT | |
| Rest | Two efficient rests per day, efficiency decays over the run; comfort items add | KEEP | |
| Sit and watch | Small morale; sometimes reveals fish, fresh sign or tomorrow's weather | KEEP / PRESENT | One of the best "presence" actions; give it a visual reward (camera eases out a little) |

### 2.4 Psychology

| System | v12 | Verdict | Notes |
|---|---|---|---|
| Morale | Many sources; drifts toward 57; capped by active worry conditions | KEEP | |
| Stress | Night work, cold, hunger, predators, spoilage, empty checks | KEEP | |
| Resolve | Hidden 0–100 will to stay: Steady / Wavering / Cracking / Breaking; each first crack lowers the cap by 5 (min 40); adrenaline save once | KEEP / PRESENT | Stays hidden; expressed through the phone glow, dawn voice and scene mood (as v12 does) |
| Worry ledger | Bear Dread, Raider Siege, Rot Streak, Wet Bedding, Cold Snap (+ Night Fright, A Cold, Moldy Stock, Teeth): morale ceilings, nightly resolve drain 0.28 per condition | KEEP / PRESENT | Shown as condition chips with teaching tooltips (v12 §9 already wrote these) |
| Promises | When wavering/cracking, the character spontaneously swears ("If I'm still meatless by day N…"); broken = −10…20 resolve, kept = +5 | KEEP | This is the character's psychology, not an agenda. Keep exactly |
| Vows at morale zero | After 2 days at morale 0, a vow card; failing the deadline forces the phone | KEEP | |
| Breakdown events | Morale zero for 2+ days: coax / allow / push choices, each tagging temperament | KEEP | |
| Panic attack | Stress 100: four sequential choices (breathe, ground, name what's real, one small task) | KEEP / PRESENT | |
| Warning tremor, commitment question, "almost can't take it" | Low-state cards | KEEP | |
| Temperament tags | 8 axes from choices; traits (handy, stubborn, prideful, brooding, haunted, spiritual…) emerge from tag thresholds and alter rules | KEEP | Correctly emergent, not chosen |
| Director (comfort index) | 3 comfortable days in a row → forced +35 wetness "something always finds the gap"; 3 brutal days → 50 % chance of a gift | **CHANGE** | The gift side stays. The forced soaking is an invisible rubber band that punishes competent play with an unexplained effect. Replace it with environmental pressure the player can see coming (raise the weight of a bad-weather roll or an event card) |
| Loneliness nights | 15–30 % nightly chance: −10…16 morale, −8 energy | KEEP + CHANGE text | Some lines are about missing someone at home; route these through the girlfriend thread rules (§8.3) |
| Camera confessionals | Talking to the camera relieves stress/morale/resolve; after 3 days without, +2 stress per day plus a nudge line | **CHANGE** | The nudge-plus-penalty is a mild "you ignored a suggestion" punishment. Keep the relief; replace the penalty with an internal "unspoken weight" that grows from events (not from not clicking), and drop the nudge text |
| Tree-mark post | Daily ritual: +1 resolve; skipping while wavering costs −1 resolve with a reproach | **CHANGE** | Keep the ritual and its streak reward; remove the skip penalty for the same reason |
| Letters never sent | Up to 3, triggered by terror, awe, hunger; +resolve | KEEP + CHANGE recipient | Addressed to the girlfriend in v1 (§8.3) |
| First-kill vow thread | A vow over the first kill; kept after 8 days = +5 resolve; scavenged first kill = −6 | KEEP | |
| `debtLetter` thread | Listed in state, never implemented | REMOVE (dead) | Its slot is where the parents/no-contact thread lives |
| Awe events | Aurora, starfall, loon calls, storm sunrise, snow silence, orcas: +14 morale, +8 resolve | KEEP / PRESENT + fix | Most become in-scene sky moments. **Orcas in a freshwater lake is a continuity error**; replace (for example a moose swimming the narrows at dawn) |
| Dawn voice, dreams, daily monologue, descent beats | Large authored pools keyed by phase, flags, shelter state, backstory | KEEP + CHANGE keys | Backstory keys become protagonist-authored content (§8) |
| Sensory lines | Location/weather/time pools | KEEP / PRESENT | Become hover flavour and arrival notes |

### 2.5 Medical

| System | v12 | Verdict | Notes |
|---|---|---|---|
| Medical arcs | Spider bite, infected cut, giardia, food poisoning (fixable with willow poultice doses) and broken ankle (unfixable); onset → declared → treatment → escalation → crisis → phone or med pull | KEEP / PRESENT | |
| Poultice | Dose counting | KEEP + FIX | Double `afterAction` bug (LEG-005) |
| Broken ankle break sequence | Ankle ×3.5 travel/wood, ×3.0 physical, ×1.1 cooking; if any of warmth/thirst/hunger hits 0 → salvage clock (2 days to get that stat to 35) or inevitability path | KEEP | Bot measured 100 % run-end vs 70–90 % target; likely bot capability. Re-measure with a smarter persona before tuning |
| Sickness from bad water | Stream drinking 20 % (soap 12 %) giardia | KEEP | |
| Teeth and monotony | Smoked-only days advance tooth tiers; chipped tooth chain; brokenTooth card | KEEP | |
| Frostbite | Failed boots in cold: warmth loss, 5 % −6 health per trip | KEEP | |

### 2.6 Kit, gear, durability

| System | v12 | Verdict | Notes |
|---|---|---|---|
| 17 kit items | Axe, saw, pot, sleeping bag, ferro rod, bow (9 arrows), line (12), wire (40), mace, multitool, gill net, knife, shovel, rations (8), salt, tarp, soap | KEEP | Each drafted item is visible as a prop in camp |
| Rations | Draft text promises 8 uses / +20 hunger; **no implementation in v12** | FIX | Implement as described, then measure |
| Axe | Durability, dull penalty, handle break (+wrist risk), sharpen, haft new handle | KEEP / PRESENT | Visible on the chopping stump |
| Ferro rod | Wear, maintenance; without ferro → friction fire | KEEP | |
| Boots | Wear per trip, failure chain, hide repair | KEEP | |
| Arrows | 9; recovery odds on hits/misses/carving | KEEP / PRESENT | |
| Line and wire stock | Finite; worry thresholds | KEEP | |

### 2.7 Resources, carrying, gathering

| System | v12 | Verdict | Notes |
|---|---|---|---|
| Logs vs firewood split | Logs need axe/saw/shovel and are building material; firewood is hand-gatherable and burns | KEEP | Two visibly different piles in camp |
| Carry rules | Carry one material type at a time; caps logs 6, rocks 5, moss 6, clay 6; drop off at camp | KEEP / PRESENT | Shown on the pack; the "one type" rule needs a clear refusal message |
| Camp deadfall | 40–47 firewood near camp, then it runs out | KEEP / PRESENT | The woodpile area visibly thins |
| Forage | Fail chance rises with local depletion, winter penalty; berry picker | KEEP | |
| Tinder, moss, rocks, clay, hide | As v12 | KEEP | |

### 2.8 Camp building

| System | v12 | Verdict | Notes |
|---|---|---|---|
| Shelter ladder | Tarp on ground → lean-to → framed hut → timber shelter; multi-session builds | KEEP / PRESENT | Primary visible progression |
| Dugout | Shovel-only alternative shelter; storm-resistant | KEEP / PRESENT | |
| Insulation | 3 moss levels; can work loose overnight | KEEP | |
| Firepit | Open ring → stone → clay-lined: fire cap 8/12/16 h, stoke 2/3/4 | KEEP / PRESENT | |
| Smoking rack | Basic, covered; huge rack (cap 12) runs in parallel; 12-h sessions consume firewood + tinder | KEEP / PRESENT | |
| Cache | Basic → reinforced → elevated; raid multipliers; camp snares after first raid; ice cache (winter) stops raids | KEEP / PRESENT | |
| Utilities and comforts | Clay jug (doubles water), berry picker, chair, table, bough bed, flute + music, wash (soap) | KEEP | Clay jug cost contradiction 3 vs 4 (LEG-006): use 3 |
| Storm and predator damage | Roof tears, half-built progress lost, racks wrecked, grizzly wipes cache and smokers | KEEP / PRESENT | Visible damage decals and debris |

### 2.9 Fire, food, water

| System | v12 | Verdict | Notes |
|---|---|---|---|
| Fire | Light (ferro + tinder + firewood, weather chance), stoke, friction fallback, burn hours, banked overnight, 3 a.m. stoke in deep winter | KEEP / PRESENT | Most-touched object in the game |
| Water | Fetch raw (pot), boil, drink; stream drinking risk; capacity 4 (+4 jug) | KEEP | |
| Meat and berries | FIFO batches with ages; meat spoils in 24 h (84 h below zero); berries 72 h; cooked meal 12 h | KEEP / PRESENT | Spoilage timer visible on the meat hook |
| Cooking | Pot meal: 2 meat + 2 water | KEEP | |
| Smoking | Shelf life 108 h (×3 with salt); mold warnings and partial loss | KEEP | |
| Eating spoiled | Confirm; sting; food-poisoning arc risk | KEEP | |
| Waste events | >10 lb discarded in a day | KEEP | |
| Shot introspection | Warm-weather big game: "a lot of meat starting to die… worth it?" | KEEP | Good, it is information not an agenda |

### 2.10 Fishing, trapping, hunting

| System | v12 | Verdict | Notes |
|---|---|---|---|
| Named spots | 5 woods spots, 4 shore spots, quality shuffled per run, seed floor | KEEP / PRESENT | Shore spots become physical places in the shore tableau; woods spots live on the trapline map |
| Spot pressure, no-luck, pity, renaming, "explore new grounds" | As v12 | KEEP / PRESENT | Renamed spots appear on the map |
| Lines | Max 3, one per spot; storm loss; cleared at winter | KEEP / PRESENT | |
| Gill net | Weave 5 sessions or draft ready-made; storm damage or total loss; ×1.3 catch | KEEP / PRESENT | |
| Ice line and active ice fishing | Winter only; 2-h jigging | KEEP + FIX | Ice-fishing catches credited to the net stat (LEG-008) |
| Snares | Max 10 total, 2 per spot; days-since-check math; spoiled-on-arrival in warmth; post-snow rate rule; scavenger tear-outs | KEEP / PRESENT | |
| Hunting chain | Scout → tracks/hot → follow → spotted → (introspection) → shot → trailing → blood trail → kill site; small-game quick shots | KEEP / PRESENT | Biggest presentation upgrade: animals appear in the scene |
| Hunt pressure | Kills raise it; decays daily | KEEP | |
| Kill site, carving, hauling | Carve (knife faster), +hide, 12-lb loads, round trips, overnight scavenging, first-kill vow | KEEP / PRESENT | |
| Lost animal resighting | The one that got away, with a mark, may reappear after 8 days | KEEP / PRESENT | |
| Moose call | Builds a lure value that can produce tracks overnight | KEEP | |
| Catch-rate gap | Measured 0.98/day vs ~2.0 target since v10 | CHANGE (measure first) | Decide after the port with a capable persona (§12) |

### 2.11 Animals and night threats

| System | v12 | Verdict | Notes |
|---|---|---|---|
| Game table | Hare, fat hare, squirrel, grouse, fat grouse, duck, beaver, wolverine, deer, moose (+ fox via smoking visitor) | KEEP + FIX | Fox has no game definition (LEG-015) |
| Fish sizes | Small to humongous (1–5 meat) | KEEP | |
| Night predators | Rolled "close" or "tracks"; walls (shelter ≥2) halve the fear | KEEP / PRESENT | |
| Raids | Marten or wolverine by stored food, cache tier, camp snares; first-raid threshold; wake-and-shoot choice | KEEP / PRESENT | |
| Wolverine at the cache | Multi-beat card with face-roll | KEEP / PRESENT | |
| HEY BEAR | Stay in / yell / mace (25 % violent death on fail) | KEEP / PRESENT | |
| Grizzly devastation | Rare: cache + smokers wiped | KEEP / PRESENT | |
| Smoking visitors | Fox, wolverine, marten, wolf, grizzly drawn by smoke | KEEP / PRESENT | |
| Recurring characters | The sassy pine marten (escalating, humour pool), Roger the raven, Betty the gray jay (feed to stage 4 → permanent positive modifier) | KEEP / PRESENT | These are the game's supporting cast; they must be drawn |
| Wolves howling | 16 %/night | KEEP / PRESENT | Pure audio |

### 2.12 Engine-level defects to fix during the port

From the balance report, the known-bugs register and this read:

1. Hard-death check precedes the med-pull safety net (top balance item; `dead` 38.5 % vs ≤30 % target). Fix by making the night an explicitly ordered pipeline with a "near-critical" check before the zero check.
2. 164 `Math.random()` calls; no replay. Replace with the seeded RNG (parity mode, §9.4).
3. "Turn in early" always sleeps exactly 6 h, so 16:00 bedtime wakes at 22:00 (LEG-007).
4. Kit count text, rations, poultice double-count, jug cost, ice-fish stat, fox definition, silent guard returns (LEG-001/002/005/006/008/009/015).
5. Several `pick()` calls evaluated once at load time (the HEY BEAR bug class). The port makes every text choice a resolution-time pick.

### 2.13 Systems Sir's list did not mention (all present in v12)

Kit draft · logs/firewood split and the one-type carry rule · energy ceiling schedule, energy debt and late rise · health ceiling and isolation toll · sensitivity ramp · morale homeostasis · the worry ledger and its morale ceilings · temperament tags and emergent traits · promises and vows · breakdown choices · teeth/monotony · waste events · spot quality, pressure, pity, renaming, new grounds · forage depletion · hunt pressure · moose call lure · arrow recovery · shot introspection · ice cache · camp snares · smoking visitors · the marten, the raven and the gray jay · lost-animal resighting · awe events · descent beats · dawn voice, dreams, daily monologue · camera confessionals · tree-mark post · unsent letters · first-kill vow · Big Storm and triple triage · first frost and first snow ceremonies · birds-go-silent foreshadowing · med-check warnings and the limp-at-check card · ending "why" and "last look" choices · built epilogue · run recorder · seed floors · rest efficiency decline · sit and watch · flute and music · soap/wash · overhang night away from camp · night time multiplier, hard cap and debt · storm damage to lines, net, roof and build progress · boot failure and frostbite · axe handle break · insulation working loose.

### 2.14 Removed outright

- Player customization (name, height, sex, body type, "who's waiting", "fear"): replaced by the authored protagonist (§8).
- All v14 "Masterwork" additions: dawn intention, "What matters now", ranked moves, compliance rewards and penalties. A source-policy test keeps them out.
- The "talk to the camera" nag and the tree-mark skip penalty (§2.4).
- The director's forced-soaking rubber band (§2.4).
- Emoji as UI icons.

---

## 3. CORE GAME LOOP

### 3.1 Moment to moment

1. **Read the world.** The tableau shows the truth: fire height, woodpile size, meat on the rack, smoke rising, a damp tint on the character, the sky, the light. The HUD shows numbers for what the world can't show precisely.
2. **Hover an object.** It outlines; a tooltip names it and its state ("Smoking rack · 6 portions · done at 19:40").
3. **Click it.** A context panel opens beside the object with every action the object offers. Each action shows energy, duration, the hour it would finish, requirements (met/unmet with the reason), and risks in plain words.
4. **Commit.** The action plays a beat of 0.8–2.0 s: the protagonist cutout switches to the matching pose at that station, the clock visibly advances, the sound plays, a small effect fires (chips, splash, smoke).
5. **Verdict.** A verdict-first result appears at the object ("Caught. A big fish on the line. +3 meat."), resources fly to the stores rail, and the world updates (the fish appears on the hook, the line resets).

Zero-cost, frequent actions (stoke the fire, drink, eat) skip the beat and resolve instantly with a small animation. Only genuinely risky or irreversible choices ask for confirmation (eat spoiled meat, shoot a big animal in warm weather, the sat phone, night travel).

### 3.2 An action

Every action is the same transaction in the core:

`validate → preview (exact cost/time/finish hour/risks) → resolve (seeded) → outcome (state deltas + world changes + presentation cues + journal entry)`

Preview and resolution use the same functions, so the panel can never promise something the rules won't do.

### 3.3 A day

- **Dawn.** The dawn report (categorised: Body, Camp, Field, Mind, Radio) replaces v12's long night modal. It reports what happened; it never tells the player what to do.
- **Daylight.** The player spends a shrinking energy budget across camp work and trips. Pressures come from the world: the meat timer, the forecast sky, the dwindling deadfall, the empty water pot, the line that hasn't been checked in two days, the energy ceiling, the dusk hour on the HUD.
- **Dusk.** The light shifts; the "daylight left" bar runs out; work after 21:00 costs more and frightens more.
- **Bedtime.** Clicking the shelter offers Sleep (from 16:00) or Turn in early. The night preview states plainly what the night looks like (fire hours vs night length, current warmth outlook, stored-food scent, weather). It is information only.

### 3.4 A night

The camp darkens to its night grade. The night pipeline resolves in a fixed, documented order (§9.3). Interactive interruptions (a wolverine at the cache, HEY BEAR, waking to a sound with the bow nearby) are illustrated cards over the night scene. Passive events become quiet beats: wolves on the audio bed, the fire collapsing, rain on the tarp. Aftermath is visible at dawn: debris by the cache, the torn roof, missing meat.

### 3.5 The full run

| Phase | Days (typical) | What creates pressure |
|---|---|---|
| Arrival | 1–5 | 180 energy, mild weather; the race to a lean-to, a firepit and a food system before the loan is called in |
| Crash | 6–11 | Energy ceiling drops to 120 and keeps falling; first raids; the temperature heads for 5 °C; meat spoils fast |
| Descent | ~11–Z | First frost; Big Storm; medical checks start to bite; rivals start leaving |
| Winter | Z onward | Snow, ice, lines gone, ice fishing, travel ×1.5; −20 °C floor; weight loss and BMI pulls; resolve thins |
| Endgame | 21–30 | Final two; every night counts; the last rival's exit is the win |

---

## 4. WORLD AND INTERACTION ARCHITECTURE

### 4.1 The three models compared against v12

| Criterion | A. Activity / map nodes | B. Physical side-view location | C. Hybrid diorama (recommended) |
|---|---|---|---|
| Fit to v12's time-block economy | Exact | Adds walking time v12 doesn't model | Exact |
| Fit to persistent named spots (9) | Good (nodes) | Awkward (needs space or sub-scenes) | Shore spots physical, woods spots on map |
| Visible camp growth | Weak | Strong | Strong |
| Sense of presence | Weak | Strong | Strong enough (posed protagonist, living scene) |
| Animation cost | Very low | Very high (walk cycles, turnarounds, every action animated) | Low (poses + effects) |
| Asset combinatorics | Low | High | Controlled (layers, §6) |
| UI clarity of costs | Strong | Weaker (actions buried in objects) | Strong (context panel) |
| Risk for a solo non-programmer | Low | High | Medium-low |

**Verdict: C.** Sir's intuition is right, with three corrections:

1. **No walking.** The protagonist appears at the station he is working. Travel is a short fade with footsteps and arrival notes, not a walk.
2. **Woods spots are on the map, not in the woods painting.** Five far-apart trapline spots can't share one tableau without making it unreadable. The woods tableau shows the near forest (deadfall, timber, moss, forage, the ridge), and the trailhead post opens the trapline map.
3. **No separate shelter interior in v1.** v12 has no interior mechanics. The shelter is a clickable exterior object; nights play over the darkened exterior. An interior vignette is a post-beta option (§17).

### 4.2 Camp tableau

One 16:9 painting of the clearing on the lake shore. Stations (each a fixed anchor with depth band and hotspot polygon):

| Station | Shows | Actions |
|---|---|---|
| Shelter | Tier 0–3 or dugout; work-in-progress frame; roof damage; moss insulation | Sleep, turn in early, rest, build/upgrade, dig dugout, insulate, patch roof, bough bed |
| Firepit | Tier; fire size (animated), embers, cold ash, snow in the ring | Light, stoke, friction fire, boil, cook, eat cooked meal |
| Pot / jug | Raw vs clean water; jug when built | Drink, boil (from fire), fire a clay jug |
| Woodpile | Firewood stack (3 heights), log pile (3 heights), camp deadfall thinning at the treeline | Scrounge firewood nearby, (logs are added via drop-off) |
| Material stock | Rocks, moss, clay piles (2 heights each), tinder bundle, hides | Inspect; drop-off target |
| Pack | The oversized pack by the path; load visible | Drop off |
| Smoking rack(s) | Tier; meat strips when loaded; smoke when running; wreckage | Build/upgrade, smoke, huge rack build/smoke |
| Meat hook | Fresh meat with a spoilage tag; berries basket | Eat berries, discard spoiled, inspect timers |
| Cache | Tier; camp snares ring; raid debris | Build/upgrade, set camp snares, eat smoked |
| Chopping stump | Axe state (sharp/dull/broken handle/absent), saw, shovel | Sharpen, haft handle, maintain ferro, repair boots, craft poultice, carve flute/berry picker |
| Comforts | Chair, table (with flute), wash basin | Build chair/table, play music, wash |
| Camera tripod | Always present | Talk to the camera |
| Tally post | Procedural tally marks for every marked day | Mark the day |
| Gray jay | Appears from day 3; perch moves closer as she trusts you | Feed the jay |
| Raven | Roger on the dead snag | (flavour hover) |
| Exits | Path to shore, path to woods | Travel |

### 4.3 Shore tableau

Wide shoreline painting with the four named spots placed physically along it (The Point, Inlet Mouth, Rocky Bar, Deep Channel).

| Station | Shows | Actions |
|---|---|---|
| Line stakes ×4 | None / set / "something's on" twitch | Set, move, check |
| Gill net | Weaving frame on the bank; deployed floats at a spot; torn | Weave, deploy/move, check, repair |
| Water's edge | | Fetch water, drink from stream |
| Rock bar, clay bank | Part of the painting | Gather rocks, dig clay |
| Ice (winter) | Ice holes with lines; active fishing hole; ice cache | Set ice line, fish the hole, cut ice cache |
| Waterfowl | Duck on the water when spotted | Shoot |
| Kill site (if here) | Carcass state | Carve, haul |
| Exit | Path to camp | Travel |

### 4.4 Woods tableau

| Station | Shows | Actions |
|---|---|---|
| Deadfall | | Gather firewood |
| Standing timber | Stumps accumulate over the run | Fell and buck logs (needs axe/saw/shovel) |
| Mossy rocks, birch | | Gather moss, gather tinder |
| Berry bushes | Depletion visible | Forage |
| Ridge lookout | | Scout, moose call, sit and watch |
| Tracks / blood trail | Decal on the trail when the hunt state is tracks/hot/trailing | Follow the tracks, follow the blood trail |
| Spotted animal | The animal cutout at a mid-distance anchor | Take the shot |
| Treeline sound | Highlight when "something crashing in the timber" | Head toward the sounds |
| Kill site | Carcass, carved bundle | Carve, haul |
| Trailhead post | Snare count | Opens the trapline map (set/move/check snares per named spot, explore new grounds) |
| Exit | Path to camp | Travel |

### 4.5 Travel and the map

- Travel is triggered from an exit on the tableau or from the map. It resolves v12's `goTo` (time, energy, slips, boot wear, theft while away, dark-return stress), plays a 1–1.5 s transition, and opens **arrival notes**: a small stacked panel in the corner with that location's news (torn snares, stale lines, tracks), not a blocking modal.
- The map is a hand-drawn overlay (keyboard `M`) with: Camp, Shore (4 spots with line/net states), Woods (5 trapline spots with snare counts and renamed names), the active kill site, the last tracks direction, the lost animal's last sighting. It is information plus travel; there are no extra locations in v1.

### 4.6 What stays as panels

- Context panel per object (the primary action surface).
- Stores rail and Body panel (exact numbers, timers, conditions).
- Trapline map and spot pickers.
- Build inspector (every tier visible before it exists, with requirements and effects).
- Event cards, panic sequence, wolverine face-roll, ending sequences.
- Journal, settings, sat phone.

Eating and drinking are reachable both from their objects and from the stores rail, because hunting for the pot when starving is not a fun kind of pressure.

---

## 5. 16:9 UI / UX

### 5.1 Hard rules

1. Everything is authored in a **1920×1080 virtual stage** that scales uniformly to the window and letterboxes. There is no responsive web layout and no page scrolling anywhere.
2. Panels that hold more than fits are **paged** (journal) or **tabbed** (build inspector), never scrolled.
3. Web behaviour is off: no text selection, context menu, browser zoom, drag-and-drop, reload, or devtools in release.
4. Every panel is reachable by mouse; common ones also by key. Esc always closes the top layer.
5. No UI element ever ranks, recommends or assigns the player's next action.

### 5.2 Screen layout at 1920×1080

```
┌───────────────────────────────────────────────────────────────────────────┐
│ DAY 9 · 14:20 · ☁ 3°C · daylight ▓▓▓▓░░ 21:05     Rivals 6   📞  ☰  ✎ J   │ top bar 64px
├────┬──────────────────────────────────────────────────────────────┬──────┤
│Body│                                                              │Stores│
│rail│                    LOCATION TABLEAU                          │ rail │
│160 │                    (Phaser, full bleed)                      │ 200  │
│ px │                                    ┌───────────────┐         │  px  │
│    │                                    │ context panel │         │      │
│cond│                                    │ (by object)   │         │      │
│chips                                   └───────────────┘         │      │
├────┴──────────────────────────────────────────────────────────────┴──────┤
│ Pack: logs 4/6   ·   Arrival notes / toasts                    Map  Camp │ bottom 72px
└───────────────────────────────────────────────────────────────────────────┘
```

The rails are semi-transparent over the painting edges; both rails can be collapsed to icons (`Tab`) for a clean view.

### 5.3 Components

| Component | Content | Notes |
|---|---|---|
| Top bar | Day, clock, weather icon, °C, daylight-left bar with dusk time, rivals left, sat phone (glows/pulses with resolve state as v12), menu, journal | |
| Body rail | Health (with ceiling marker), Energy (current/ceiling), Hunger, Thirst, Warmth (with soaked cap marker), Morale, Stress; condition chips below | Click → Body panel with weight, BMI, loss %, injuries, arcs, all conditions with teaching tooltips (v12 §9 text) |
| Stores rail | Food (fresh meat + nearest spoil timer, smoked + mold timer, berries, cooked meal), water (clean/raw/capacity), firewood, logs, rocks, moss, clay, tinder, hide, arrows, line/wire stock, rations | Each row clickable for eat/drink where relevant |
| Pack | Carry type and count; haul load | The "one material at a time" rule shown here |
| Context panel | Object name and state line; up to 6 action rows (label, ⚡ cost, duration, finishes at hh:mm, unmet requirements in red with reason, risk line) | More than 6 → tabs ("Use", "Build", "Repair") |
| Build inspector | Current tier art, next tiers with requirements, effects, sessions left (pips) | Opened from any structure |
| Outcome | Small result tag at the object for routine work; result card with art for catches, kills, raids, injuries, milestones | Verdict-first text from v12 |
| Event card | Illustration, scene text, 2–4 choices | Choices never show odds; they show costs only when certain (e.g. "−1 arrow") |
| Dawn report | Up to five category cards, each a few lines | Click through or Space |
| Journal | Book with tabs: Today, Log (paged), People & animals (marten, raven, jay, lost animal, rivals), Camera (confessionals), Letters | |
| Map | §4.5 | |
| Settings | Master/Ambience/Effects/Music, display mode, resolution, text speed, rival news on/off, reduce flashing, show hotspot labels | |
| Main menu | Continue, New Run (kit draft), Run history, Settings, Quit | |

### 5.4 Discoverability without a tutorial agenda

- Hold `Alt` to label every interactable in the scene.
- First-time hover on each object shows one teaching line (v12 already wrote teaching tooltips).
- Unmet requirements always say why ("Needs 5 logs · you have 3 in camp, 2 in your pack").
- No quest log, no objectives, no checklists.

### 5.5 Keys

`Esc` close/menu · `Space` continue · `J` journal · `M` map · `B` body · `Tab` collapse rails · `Alt` labels · `1/2/3` travel to Camp/Shore/Woods (with the same preview as the exit) · `F11` fullscreen.

---

## 6. ART AND RENDERING ARCHITECTURE

### 6.1 Honest read of the current references

- **Mood and range: good.** The sets prove the world can be beautiful, grey, wet, snowy, warm at dusk and cold at night.
- **Style: drifting toward realistic concept art**, not the "simplified painterly, graphic, slightly anime-sharp" target. The survivor sheet and the backpack are dense, noisy, photoreal-adjacent renders. That level of detail is exactly what AI tools can't hold consistent across 16 poses, 25 animals and 60 props.
- **Composition: unusable for the game.** The plates are portrait, first-person, with a path receding to a centre vanishing point. Stations need a broad, readable ground plane seen from a consistent elevated side view.
- **Lighting: baked in.** The "sunny" plates have strong directional sun shafts. Baked directional light fights runtime time-of-day grading and makes props (painted under other light) look pasted on.
- **The tarp reference is the right kind of asset**: one object, isolated, neutral light, readable silhouette. The hard-edged dirt patch under it is the wrong part.

### 6.2 Style rules for every asset (the "style bible" summary)

1. Elevated side view, camera about 15° above horizontal, horizon in the upper third; one consistent perspective per location.
2. Soft, top-down, neutral ambient light; no cast shadows; no sun direction. Time of day is added at runtime.
3. Big shapes, few values per object, a dark ink-like accent on silhouette edges, restrained texture. Detail density decreases with distance.
4. Limited palette per location (camp: warm earth/moss; shore: slate/stone/cold water; woods: deep green/umber).
5. Props are painted at their final on-screen scale ×1.33, isolated on transparency, with no ground patch (contact shadows are generated at runtime).
6. The protagonist is simplified from the reference sheet: same face, hair, beard, jacket, pack and boots, far less surface noise.

### 6.3 The layer stack (per location, back to front)

| # | Layer | Source | Changes with |
|---|---|---|---|
| 0 | Sky | Shared sky plates (opaque) | Time of day, weather, awe events |
| 1 | Far atmosphere | Procedural gradient/fog | Weather, time |
| 2 | Location plate | Painted, sky area transparent | Ground state (bare / snow); day vs night version |
| 3 | Frost overlay | Painted transparent rime | Frost phase only |
| 4 | Ground decals | Tracks, blood trail, ash, raid debris | Game state |
| 5 | Contact shadows | Procedural soft ellipses per anchor | Always |
| 6 | Structures and props | Transparent sprites at anchors, depth-sorted by anchor Y | Tier/state; snow by shader or variant |
| 7 | Animals and protagonist | Transparent pose cutouts at anchors | State |
| 8 | Foreground occluder | Painted transparent strip (grass, rocks, branches) | Ground state |
| 9 | Local light | Additive fire glow, ember flicker | Fire size, night |
| 10 | Weather particles | Rain, snow, storm streaks, mist | Weather |
| 11 | Global grade | Colour-matrix grade + vignette | Time of day, weather, temperature, resolve mood |
| 12 | Hover outline, labels | Shader outline on sprite alpha | Interaction |
| 13 | React UI | DOM | — |

### 6.4 How each variation is produced without combinatorial explosion

| Variation | Technique | Assets needed |
|---|---|---|
| Time of day (dawn, day, dusk, night) | Day plate + night plate per ground state; dusk/dawn = day plate under a warm grade with the dusk sky; night = night plate + cool grade + fire light | 2 plates per ground state per location |
| Weather (clear, overcast, rain, cold, snow, storm) | Sky plate + grade (flatter, cooler, darker) + particles + optional wet-sheen overlay | Shared skies, particles |
| Season (bare, frost, snow cover) | Bare plate, frost overlay on bare plate, snow plate | 2 plates + 1 overlay per location |
| Structure tiers | One sprite per tier at the same anchor and footprint | One per tier |
| Structure state (loaded, smoking, damaged, in progress) | Small overlays and effects on top of the tier sprite | Overlays, shared where possible |
| Snow on structures | **Plan A:** "snow rim" shader (pixels with transparency above them blend toward a snow texture). **Plan B (if A looks cheap in the art test):** painted snow variants for shelters, caches, racks and firepits only | A: 0 assets; B: ~22 |
| Night on props | The global grade darkens; the fire light brightens nearby props | 0 |
| Character in weather | Grade + a damp desaturation when soaked + the "cold" pose when shivering | 0 extra |
| Character activity | 16 pose cutouts, reused across all locations by anchor scale | 16 |

The rule that makes this work: **nothing in a sprite depends on weather, time, or another sprite's state.**

### 6.5 Protagonist: stills or animation

**Recommendation: posed stills with procedural life. No frame-by-frame sprite sheets.**

- 16 transparent pose cutouts: `idle`, `idle_cold`, `idle_injured`, `sit_fire`, `crouch_work`, `chop`, `carry`, `haul_heavy`, `build`, `kneel_water`, `fish_line`, `ice_fish`, `bow_draw`, `look_out`, `camera_talk`, `play_flute`.
- Life comes from code: a slow breathing scale on idle, a small effort bob during an action, a crossfade between poses, a shiver jitter when cold, breath fog particles below 0 °C.
- Each action declares which pose, which station anchor, which sound and which effect. One pose serves many actions (crouch_work covers snares, carving, forage, moss, tinder, poultice, checks).
- Full animation would multiply the protagonist cost by ~10 and is the asset class most likely to break visual consistency. Stills are also what holds a painterly style together.

Limited frame animation is used only where it clearly pays: the fire (one 12–16-frame loop, scaled per firepit), bird hops (2 frames), and the line-stake twitch (tween).

### 6.6 Animals, catches, results

- **Alive animals:** one alert pose each for deer, moose, beaver, wolverine, hare, grouse, squirrel, duck, fox; two poses for the recurring cast (marten, gray jay ×3 trust stages, raven); silhouettes for wolf and bear/grizzly (they live at the edge of the firelight, which suits silhouettes and saves detail).
- **Carcasses:** deer, moose, beaver, wolverine; one generic "carved bundle" (quarters + hide) for the carved state.
- **Catches:** a small set of "in hand / on the line" cutouts for result cards: hare, grouse, squirrel, duck, fish small / big / humongous (medium and huge are scaled). Fat hare and fat grouse reuse the base art at 110 % with a different label.
- **Event and ending illustrations:** about 20 vignettes for the cards and ending sequences, painted as full-width cinematic panels.

### 6.7 Shadows and blending

- Contact shadows are runtime ellipses (soft, multiply, size from the manifest), so they always match.
- No baked cast shadows anywhere.
- Props get a subtle shared "ambient occlusion" darkening at their base, painted into every prop the same way.
- A per-location ground tint is multiplied onto props' lower 15 % so they sit in the plate's colour.

### 6.8 Resolutions and formats

| Thing | Master (kept in `art-source/`, never shipped) | Shipped |
|---|---|---|
| Location plates, skies | 3840×2160 PNG | 2560×1440 WebP (q≈90) |
| Foreground occluders, frost overlays | 3840×2160 PNG with alpha | 2560×1440 WebP with alpha |
| Props, structures, characters, animals | 2× on-screen size PNG | 1.33× on-screen size PNG, packed into atlases at build time |
| Event illustrations | 3840×1600 | 2560×1066 WebP |
| UI icons | 256×256 PNG | Atlased at 64 and 128 |

All transparent assets are straight (un-premultiplied) alpha PNGs with clean edges and no halo; background removal is done at master size and checked against black and white.

### 6.9 Naming and manifests

File names are machine names; the manifest carries everything else.

```
assets/
  plates/camp/camp_bare_day.webp
  plates/camp/camp_bare_night.webp
  plates/camp/camp_snow_day.webp
  plates/camp/camp_frost_overlay.webp
  plates/camp/camp_fg_bare.webp
  skies/sky_day_clear.webp
  structures/shelter/shelter_t1.png
  structures/shelter/shelter_wip.png
  props/camp/woodpile_firewood_l2.png
  characters/p1/p1_pose_chop.png
  animals/deer_alert.png
  fx/fire_loop.png  (+ fire_loop.json)
  vignettes/card_hey_bear.webp
  ui/icons/...
```

`content/assets.manifest.ts` (typed) lists every asset with: id, file, family, pivot, nominal scale, depth bias, contact shadow size, snow mode (`shader` / `variant:<id>` / `none`), light response (`lit` / `emissive`). Location layouts (`content/locations/camp.layout.ts`) hold anchors, depth bands, hotspot polygons and which slots exist, so art never encodes positions. A validation test fails the build if a manifest entry points to a missing file or an unused file sits in `assets/`.

### 6.10 Realistic asset count (v1)

| Family | Count |
|---|---|
| Location plates (3 locations × bare/snow × day/night) | 12 |
| Frost overlays, foreground occluders (bare/snow) | 9 |
| Sky plates (day clear, day overcast, storm, dusk, dawn, night clear, night overcast, aurora) | 8 |
| Camp structures (shelter ×4, dugout, WIP, damage, insulation ×3, firepit ×3, racks ×3, cache ×3, camp snares, ice cache, wreck/debris ×2) | 25 |
| Camp props and stock levels (woodpile, logs, rocks, moss, clay, tinder, hides, pot, jug, berry picker, chair, table, bed, flute, camera, tally post, basin, pack, stump/axe ×3, bow, saw, shovel, meat hook, berry basket) | 36 |
| Shore/woods props (line stake ×2, ice hole ×2, net ×3, trailhead post, stumps, track decals ×3, blood decals ×2) | 15 |
| Protagonist poses | 16 |
| Animals alive, carcasses, catches | 37 |
| FX textures and loops | 12 |
| Event and ending illustrations | 20 |
| UI icons, frames, cursors, map, key art, logo | ~110 |
| Steam store images | ~10 |
| **Total** | **~310 files**, of which ~50 are large paintings |
| Plan B snow variants (only if the shader fails) | +22 |

That is a finishable number for one person working with image tools, provided the order in §13 is followed.

---

## 7. AUDIO ARCHITECTURE

### 7.1 Principles

- The soundscape carries most of the mood; music is rare and earned.
- Every sound the core can cause is an **event** (`fire.lit`, `catch.fish.big`, `night.wolves`), never a hard-coded file. The audio director maps events to sounds through a data table.
- Ambience is a **mix of layers driven by state**, not one track per situation.

### 7.2 Buses (all four have volume sliders; Master scales all)

```
Master
 ├─ Ambience   (beds, weather, wind, fire bed, random one-shots)
 ├─ Effects    (actions, events, wildlife reactions, UI clicks at low level)
 └─ Music      (stingers and cues)
```

Ducking: event cards and ending sequences duck Ambience by ~6 dB; music cues duck Ambience by ~3 dB. Being "inside" (sleeping, night sequence) applies a low-pass filter and −6 dB to all outdoor layers.

### 7.3 Ambience layers

| Layer | Variants | Driven by |
|---|---|---|
| Location bed | Camp, Shore, Woods × day / night (6 loops) | Location, hour |
| Season colour | Autumn insects and birds (day), winter near-silence (crisp air tone) | Temperature phase |
| Dusk chorus | Per location (3) | Hour around dusk |
| Wind | Light, strong, storm (3), plus a high "cold wind" tone | Weather, temperature |
| Rain | On canopy (woods), on water (shore), on tarp/roof (camp, changes with shelter tier: tarp, wood) (4) + heavy storm rain | Weather, location, shelter tier |
| Snow | Snowfall hush (a filtered bed, not a sound of falling snow), blizzard | Weather |
| Water | Lap on stones (shore), creek trickle (woods), ice creaks and groans (winter shore) | Location, winter |
| Fire | Small / medium / large crackle loops, cross-faded by fire hours and pit tier | Fire state, location = camp |
| Snow hush (v12) | Two days after first snow, beds drop and birds stop | v12 rule |

Random one-shots are scheduled by an emitter with cooldowns and no-repeat: woodpecker, chickadee, squirrel scold, raven call, gray jay, loon (dusk, shore), heron, distant wolves (night), owl, branch creak, tree crack in deep cold, ice boom, fish jump. Birds stop when v12's `birdsSilent` is true: the game's best audio tell.

### 7.4 Effects (with variant counts)

| Group | Sounds (variants) |
|---|---|
| Footsteps | Dirt, gravel shore, forest duff, snow crunch (4 each) — used in travel transitions and pose changes |
| Clothing/pack | Jacket rustle (3), pack set down (2), pack shoulder (2), load drop logs/rocks/moss/clay (4) |
| Wood | Axe chop (5), axe into stump (2), saw (2), log drop (3), branch snap/firewood gather (4), split (3) |
| Tools | Whetstone (2), ferro strike (3), knife work (3), multitool (2), lashing rope (3), shovel dig (3) |
| Building | Hammering/lashing session (3), frame creak (2), moss packing (2), stone set (3), clay slap (2), structure complete (1) |
| Fire | Ferro catch (2), friction drill (2), friction fail (1), stoke log (3), flare up (2), fire hiss in rain (2), collapse to embers (1) |
| Water | Fill pot (2), boil (1 loop), pour/drink (3), stream scoop (2), splash (3), fall into lake (1) |
| Fishing | Bait/set line (2), line twitch (2), pull empty (2), fish flop small/big (3), net drag (2), ice auger/chop (3), ice jig (loop) |
| Trapping | Set snare (2), check empty (2), catch found (2), snare torn (1) |
| Hunting | Bow draw (2), release (3), hit (2), miss into brush/water/snow (3 each), animal bolt (3), blood-trail rustle (2), moose call (1), carving (3), haul strain (2) |
| Cooking/eating | Sizzle (2), stir (2), eat (3), chew smoked/hard (2), drink (3) |
| Wildlife reactions | Marten chitter (3), wolverine growl (2), fox bark (2), bear huff/woof (3), grizzly roar (1), wolf howl close (2), jay call (2), raven (3) |
| Damage | Tarp tear (1), roof drip (loop), structure crash (2), cache torn open (2) |
| Body | Shiver breath (2), pain grunt (3), panic heartbeat (loop), cough (2) |
| Radio | Base-camp radio squelch + voice-free chatter (3) |
| UI | Hover tick, click, panel open/close, journal page turn (3), card appear, error/refusal, confirm (all very quiet) |

About 150 effect files including variants.

### 7.5 Music

Sparse cues only, roughly 12: main theme (title only), first night, first kill, first frost, first snow, Big Storm, an awe cue, final two, low-resolve undercurrent (a drone that fades in only during Cracking/Breaking), and four ending cues (win, tap, med, death). Silence is the default.

### 7.6 Technical

- OGG Vorbis 48 kHz; loops cut on zero crossings with loop points in metadata; one-shots trimmed and normalised.
- Loudness targets: ambience beds around −28 LUFS integrated, effects peaking around −6 dBFS, music −20 LUFS.
- The director preloads the current location's beds and a shared effects set; everything else streams.
- Audio unlock and focus loss: pause on window minimise (setting), resume on focus.
- Licensing: every sound file is listed in `audio/CREDITS.md` with its source and licence. Steam requires disclosure of AI-generated content; that applies to sound and music too.

---

## 8. CHARACTER AND NARRATIVE ARCHITECTURE

### 8.1 The v1 protagonist

| Field | Value |
|---|---|
| Name | **DECISION NEEDED** (v12's placeholder default is "Jack"; nothing in v12 commits to it) |
| Height / starting weight | **DECISION NEEDED.** Recommendation: 178 cm / 88 kg, because every balance pass from v8 to v12 was measured on exactly those defaults and the BMI and weight-loss pulls are tuned to them |
| Sex / pronouns | Man, he/him (from Sir's brief) |
| Who's waiting | His girlfriend (supports him being there) and his living parents |
| His fear | **DECISION NEEDED** (v12 offers the dark, injury, failing, going home empty-handed; each changes dawn lines) |
| Narrative voice | v12 is mostly second person ("you"), with a few third-person slips. Keep second person (decision confirmable in §17) |

The kit draft remains the player's only setup choice.

### 8.2 Architecture for three authored protagonists later

Everything protagonist-specific is data in one definition file:

```
ProtagonistDefinition
  id, displayName, pronouns
  body: heightCm, startWeightKg
  physiology: multipliers on energy ceiling, warmth drain, kcal burn, carry caps (all 1.0 for P1)
  skills: multipliers on fishing, trapping, shot accuracy, build speed, fire lighting (all 1.0 for P1)
  temperament: starting tag biases (all 0 for P1)
  fear: one fear key
  relationships: [{ id, role, name, threads[] }]
  personalThreads: [thread ids]
  contentPack: narrative pools filtered to this person (dawn, dreams, monologue, letters, confessional fragments, ending lines)
  artSet: pose set id and portrait
```

- v12 lines tagged by "who's waiting" and "fear" become lines tagged by **relationship role** and **fear key**. P1 uses partner + parent + his fear. The kid/nobody lines are archived for future protagonists.
- Personal threads run on one generic **thread engine** (gate → pressure → stages → beats → decision card → closures → optional forced outcome). The first-kill vow, the girlfriend thread and the parents thread are all expressed in it, so a future protagonist is a content task, not a code task.
- v1 ships one definition and no selection screen. The New Run flow is built so a selection step can be inserted before the kit draft.

### 8.3 The girlfriend thread: longing that never breaks him

Purpose: give the longing texture and warmth, and make it a reason he stays.

- She appears in: partner dawn lines, the unsent letters (she is their recipient), confessional fragments, a share of the loneliness nights, the commitment-question card ("For them"), and the endings (she answers the call home).
- Longing beats may cost a little morale, but each is written as bittersweet and most carry a small resolve gain ("She'd tell you to stay. She did tell you.").
- **Hard rule, enforced in code:** any event tagged `relationship:partner` cannot drain resolve, cannot create a promise or vow, cannot be the trigger of any forced phone moment, and can never be named as the reason for a tap-out. A content test scans every forced-tap path for partner tags; the balance harness reports partner-attributed tap-outs and must report zero.
- The v12 forced-tap cinematic currently says "You think of {who}". It is rewritten so the text names what actually broke him (§8.4).

### 8.4 The parents / no-contact thread

**Backstory (authored):** before going in, he signed the production's form choosing not to be contacted, even in a family emergency. He did it quickly and didn't think about it much. His parents are getting older.

**Design goals:** rare, gradual, state-dependent, earned, never repeated, never melodramatic, and woven into v12's resolve system rather than beside it.

**State:** `noContact = { stage 0–4, pressure 0–100, gateNights, lastBeatDay, beatsSeen[], closure: none | accepted | witnessed }`

**The gate (when the thread can move at all).** Each night the core computes a psychological severity score from v12's own state:

| Signal | Points |
|---|---|
| Resolve state Wavering / Cracking / Breaking | 1 / 2 / 3 |
| Morale below 25 | +1 |
| Stress above 75 | +1 |
| Two or more worry conditions active | +1 |
| Morale at zero for 2+ days | +1 |

The gate is open only when the score is **≥3 on two consecutive nights**. In practice that means at least Cracking resolve plus one more bad signal, or Wavering plus two. A stable streak closes it.

**Pressure.** While the gate is open, pressure rises by about 8–14 per night (× v12's sensitivity ramp). One-time catalysts add about +10 each: a rival leaving for a family reason on the radio, a medical-check warning, his own medical arc being declared, a home dream. While the gate is closed, pressure decays by about 10 per night. Stages never go backwards; pressure can.

**Stages and beats.**

| Stage | Pressure | What the player sees |
|---|---|---|
| 0 | — | Nothing. Most runs end here |
| 1 | 20 | A passing, plain thought in the dawn report's Mind section (his mother's birthday he'll miss; it's fine, he knew) |
| 2 | 45 | The form comes back to him: the box he ticked, how fast he signed it. A "Thoughts of home" condition appears with a tooltip |
| 3 | 70 | It starts doing math: his father's age, a cough he mentioned in the summer. It may come as a dream. Condition worsens |
| 4 | 90 | The Waiver card (once per run) |

At most one beat every two days; each stage has two or three authored variants; a variant is never shown twice in a run, and across runs unseen variants are preferred (stored in the player profile, not the save).

**Mechanical weight.** Stage 2 adds 0.2 to the nightly resolve drain while the gate is open; stage 3 adds 0.4. Nothing else. The thread is never a minigame.

**Player agency.** The player can work the thread like any other condition: talking to the camera about it (a parents fragment appears when the thread is active) lowers pressure; writing the unsent letter to his parents lowers it more (once per run); sitting and watching lowers it a little; and anything that improves survival closes the gate.

**The Waiver card (stage 4).**

| Choice | Result |
|---|---|
| "I chose this. They know I chose it." | Closure *accepted*: pressure to 30, thread capped at stage 3 for the rest of the run, +6 resolve, tags hard + humble; later beats become quiet acceptance lines |
| "Say it to the camera, for them." | Closure *witnessed*: −40 pressure, +4 resolve, tag tender |
| "I need to know they're okay." | Opens the normal sat-phone flow. The player can still put it down |
| "Not now." | No change; the card may return once after three days if still at stage 4 |

**The only automatic tap-out this thread can cause:** stage 4, no closure, and a severity score of 4 or more (for example Breaking resolve plus one more bad signal) on two consecutive nights. Then the forced-tap cinematic plays with the parents narration.

**Relation to v12's other forced tap-outs.** v12's generic resolve collapse (resolve 0 after two promise warnings, once the adrenaline save is spent), the failed vow deadline and the medical-arc crisis all remain. Their narration now names the dominant cause: cold, hunger, fear, the injury, or, if this thread is at stage 3 or more, his parents. Never the girlfriend.

**Rarity targets (checked by the balance harness, tunable):** stage 1 reached in 15–30 % of runs; stage 3 in ≤8 %; the Waiver card in ≤4 %; thread-caused forced tap-outs ≤1.5 % of all runs.

**Writing rules for this thread:** about 30 lines total; plain and concrete (the form, the landline, his dad's knee); verdict-first; no crying scenes, no music swell, no exclamation marks.

### 8.5 How the existing v12 psychology stays intact

Resolve, its states and caps, the worry ledger, promises, vows, breakdown choices, the panic sequence, temperament tags and traits, letters, confessionals, the tree-mark ritual, dawn voice, dreams and endings are all ported as they are, with only the three agency fixes in §2.4. The two new threads plug into resolve through the same `resolveDelta` path v12 already uses.

---

## 9. SIMULATION AND DATA ARCHITECTURE

### 9.1 Packages

```
packages/core       Pure TypeScript. No DOM, no Phaser, no Electron, no Date.now.
  state/            Typed state schema (plain JSON), initial state, protagonist application
  rng/              Seeded RNG (salvaged), draw counter
  systems/          clock, temperature, weather, body, cost (eCost/eTime/spend), travel,
                    fire, water, food, materials, carry, build, gear, fishing, trapping,
                    hunting, killSite, animals, raids, medical, psyche (morale, stress,
                    resolve, worry ledger, promises, vows, breakdowns, tags), threads,
                    narrative selection, cards, rivals, endings, stats
  commands/         One module per command: validate, preview, resolve
  pipelines/        night.ts and dawn.ts as explicit ordered phase lists
  outcome/          StateDelta, WorldChange, PresentationCue, JournalEntry, PendingInteraction
packages/content    v12 TUNING, kit, animals, structures and costs, cards, narrative pools,
                    protagonist P1, location layouts, asset manifest, audio event map, strings
packages/harness    Legacy runner, parity runner, persona bots, balance CLI, report writer
apps/game           Vite build: Phaser world, React UI, visual director, audio director, save client
apps/desktop        Electron main and preload: window, file saves, settings, Steamworks
```

### 9.2 The command pipeline

- UI and world clicks dispatch `{ id, params }` only.
- `preview(state, cmd)` returns cost, duration, finishing hour, requirements with reasons, risk notes. `resolve(state, cmd, rng)` returns the next state plus an `Outcome`.
- `Outcome` carries what the presentation needs: stat and resource deltas, world changes (which sprite state changed), cues (`pose: chop @ woods.timber`, `sfx: axe.chop`, `fx: chips`), journal entries as text keys with parameters, and any **pending interaction** (a card, the panic sequence, a raid wake-up choice).
- A pending interaction blocks further commands until answered and is saved with the run, so a crash mid-card resumes on the card.

### 9.3 The night as an explicit ordered pipeline

v12's `actSleep` → `nightlyRaid` → `finishNight` is ported as a named list of phases (sleep setup, away-from-camp, depletion, fire and warmth, deep-winter stoke, overnight penalties, **near-critical medical check (new position)**, lowest moment, death check, ankle break queue, dread drain, morale/stress, loneliness, wolves, predators, grizzly and raids, rack and smoke losses, kill-site scavengers, snare tear-outs, interactive raid, day rollover, late rise, sickness, catch streaks, monotony/teeth, waste, weight/BMI, energy ceiling, decays, weather/frost/storm/winter, predator roll and silent birds, awe/snow/descent beats, moose lure, snare breakage, storm damage, mold, rivals, med check, recovery, worry ledger, callbacks and recurring cast, medical arcs, monologue, morale drift, dawn energy, director, threads, ankle salvage, promises, vows, breaking point, morning event, lost animal, cards, breakdowns, dawn line and dream, dawn report). Reordering becomes a one-line change with a test, which is exactly what the `dead` vs `med` fix needs.

### 9.4 Determinism and the parity method

- **Parity mode:** the port uses one RNG stream and consumes draws in exactly v12's order, including text picks. The harness runs the untouched v12 file in Node (DOM stub, `Math.random` replaced by the same seeded generator) and the port side by side on scripted command sequences, comparing state after every command and every night.
- When a system is deliberately changed (§2.12, §2.4), its parity test is replaced by a recorded "intended difference" test.
- Cosmetic randomness in presentation (which footstep variant plays) uses a separate unsaved generator so it can never change the simulation.

### 9.5 Content as typed data

- Tuning, costs, tables and card definitions are TypeScript data files, checked by the compiler. Card effects are small typed functions next to their card.
- Every player-visible string has an id. v12's wording is kept verbatim except where §2 says otherwise.
- Content tests: card outcome probabilities sum to 1; every text id exists; every command has a preview; every structure tier has an asset; every asset in the manifest exists; no forbidden v14 phrases; partner-tagged events never sit on a forced-tap path.

### 9.6 Ownership boundaries

The core owns rules. Content owns numbers, words and layouts. The game app owns presentation. The desktop shell owns files and Steam. No rule lives in a React component or a Phaser scene.

---

## 10. SAVE AND PERSISTENCE

### 10.1 Model

- **One active run** (Continue) plus **run history** (completed runs' stats and epilogues). New Run while a run is active asks for confirmation and archives the abandoned run as "left the field".
- **Autosave after every resolved command and at every dawn.** There is no manual save in a run.
- Whether the player may restart from the last dawn is a taste decision (§17). Recommendation: no (strict single run, like the show), with backups used only for corruption recovery.

### 10.2 Files (Windows)

```
%APPDATA%\TAP OUT\
  settings.json                 display, audio, text speed, toggles
  profile.json                  run history, seen narrative variants, achievements cache
  saves\
    run.json                    current run (envelope)
    run.bak1.json … run.bak3.json   rotating previous good saves
    run.dawn.json               last dawn checkpoint
  logs\                         rotating crash/error logs (no personal data)
```

The game shows this folder in Settings ("Open save folder").

### 10.3 Envelope and integrity

```
{ format: "tapout-save", schemaVersion: 7, gameVersion: "1.0.3",
  savedAt: "<real timestamp>", runId, day, hour, protagonistId,
  checksum: "sha256 of state", state: { ... }, rngState, pending: {...} | null,
  commandLog: [last N commands] }
```

- **Atomic write:** write `run.tmp`, flush to disk, rename over `run.json` (rename is atomic on NTFS); the previous `run.json` rotates into the backups first.
- **On load:** parse → check format → verify checksum → run migrations → validate the schema (Zod). If anything fails, try `bak1`, `bak2`, `bak3`, then `dawn`, and tell the player plainly which one was restored.
- **Never overwrite a good save with a bad one:** the state is validated before writing.

### 10.4 Versioned migrations

Each schema change ships a pure function `migrate_6_to_7(state)` and a fixture save from the old version. CI loads every fixture through the full chain. Removing a field requires a migration, never a silent default.

### 10.5 Steam Cloud

Use **Steam Auto-Cloud** pointed at `%APPDATA%\TAP OUT\saves` and `profile.json` (configured on Steamworks, no code). Saves are small JSON files (well under 1 MB), which suits it. Conflict resolution is handled by the Steam client; the envelope's `savedAt` and `day` make the choice readable.

---

## 11. WINDOWS / STEAM ARCHITECTURE

### 11.1 Stack comparison

| Criterion | 1. Keep React+Phaser as is, package it | 2. Restructure the TS stack (recommended) | 3. Move to Godot 4 |
|---|---|---|---|
| Development complexity | Low now, high later (mobile shell, invented rules) | Medium | Medium-high (new language, editor-centric) |
| Fit for a 2D diorama with layers | Good | Good | Very good |
| Claude Code effectiveness | High | **High**: TypeScript, text-only project, everything inspectable | Medium: GDScript is fine, but scenes and resources are editor files; much work needs the editor by hand |
| Port of v12 | Must still be done | **Can be verified line by line against the legacy JS** in the same runtime | Full translation to GDScript; no differential test against the original |
| Data-driven content | Good | Good | Good |
| Audio | Web Audio: fully capable | Same | Built-in buses: excellent |
| Saves | IndexedDB (wrong for desktop) | Files via Electron | Files, built in |
| Headless testing and balance harness | Partial | **Excellent** (Node, same code) | Possible, slower to set up |
| Performance | Fine | Fine (static scenes, few sprites) | Excellent |
| Steam distribution | Electron + steamworks.js | Same | GodotSteam, export templates |
| Maintenance by a non-programmer | Fragile | Good, if the rules in CLAUDE.md are kept | Requires learning the editor |
| Migration cost and risk | Lowest now, highest overall | Medium | Highest |

**Verdict: option 2.** The decisive factor is the v12 port: the source of truth is JavaScript, and only a JavaScript/TypeScript runtime lets every ported system be proven equal to the original automatically. Godot would be a fine engine for a fresh design; for this project it means translating 6,000 lines by hand with no proof. Electron's ~150 MB size is irrelevant on Steam.

### 11.2 Desktop shell

- **Electron** (bundled Chromium, so rendering and audio are identical on every Windows machine). Tauri was considered and rejected: it relies on the system WebView, and the Steam overlay works poorly with it.
- Main process owns: the window, display modes, file I/O for saves and settings, crash logging, Steamworks. Renderer has no Node access; a typed preload bridge exposes only the needed calls.
- Release hardening: devtools off, no navigation, no remote content, context isolation on, sandbox on, single-instance lock, Ctrl+R/F5/zoom disabled.

### 11.3 Display

- Modes: Windowed, Borderless fullscreen (default), Fullscreen.
- Window sizes offered: 1280×720, 1600×900, 1920×1080, 2560×1440, 3840×2160 (only those that fit the monitor).
- The stage is always 16:9 at 1920×1080 virtual; other aspect ratios (16:10, ultrawide, Steam Deck 1280×800) are letterboxed with a dark painted frame.
- The game pauses its clock-free animations and lowers audio when minimised (setting).

### 11.4 Build and packaging

- `npm run build` → Vite production build of `apps/game` → electron-builder `win` target, x64, **directory output** (Steam installs a folder; no installer needed).
- Version stamped from `package.json` into the title screen and save envelope.
- SteamPipe upload with `steamcmd` and a checked-in `app_build.vdf` / `depot_build.vdf`; branches: `default`, `beta`, `internal`.
- Code signing is optional for Steam distribution; consider it later if SmartScreen warnings appear for any direct download.

### 11.5 Steamworks features for v1

| Feature | v1 | Notes |
|---|---|---|
| Steam Cloud | Yes | Auto-Cloud (§10.5) |
| Achievements | Yes, ~20 | Driven by core outcome events (first kill, timber shelter, Betty lands on your hand, survive to winter, win, win with no bow…) |
| Overlay | Yes | steamworks.js Electron overlay support; test early (M21) |
| Rich presence | Optional | "Day 14 · Winter" |
| Controller | No in v1 | Mouse-first design; Steam Input could map later |
| Steam Deck | Verify, don't target | Letterboxed 16:9 should run under Proton; test once in beta |

### 11.6 Legal and store requirements to plan for

- Steam's AI-generated content disclosure (pre-generated art and audio must be disclosed on the store page).
- Every image and sound tool's terms must allow commercial use; keep receipts in `art-source/LICENSES.md` and `audio/CREDITS.md`.
- Remove anything that reads as a specific real show (rival names, exact prize) and check the title for trademark conflicts before the store page goes up.

---

## 12. TESTING AND QA

| Layer | What | When it runs |
|---|---|---|
| Unit | Each core system's formulas | Every change |
| **Parity** | Port vs untouched v12 on scripted command sequences, state compared after every command and night, many seeds | Every core change until M8; then for unchanged systems forever |
| Intended differences | Each deliberate v12 change has a test proving the new behaviour | Every change |
| Content validation | §9.5 checks, manifest checks, forbidden-phrase policy, partner-tag rule | Every change |
| Balance harness | Persona bots (greedy, balanced, passive, plus a new "competent" persona that manages winter and the ankle salvage clock), 60 seeds × persona, max day 70; v12's metrics (cause-of-loss split, card budget, warmth pinned, week-1 completion, catch rate, ankle cohort) plus new thread rarity and partner-attribution metrics | On demand, before each STOP that touches rules; summary report only |
| Save | Round-trip, corruption of each kind (truncated, wrong checksum, wrong version, invalid field), backup fallback, migrations from every fixture | Every change to state or saves |
| Soak | 500 headless full runs: no exceptions, no stuck pending states, no hour past the cap, no NaN | Before beta and RC |
| UI end-to-end | Playwright on the built game: new run, kit draft, every hotspot reachable, one action per command family, night, dawn, all four endings via debug seeds | Per milestone from M10 |
| Visual | Screenshots at 1920×1080 and 1280×720 for fixed debug states, compared to approved baselines | From M14 |
| Performance | Frame time on a target low-end machine (integrated graphics), memory after 50 travels, load time | Beta and RC |
| Manual | A short checklist per milestone for Sir to play (§14), plus full-run playtests at beta | Each STOP |

Debug tools (dev builds only): seed entry, jump to day/state presets (first night, winter, broken ankle, Waiver card, each ending), reveal hidden values (resolve, thread pressure), force weather/time, and a "copy bug report" button that bundles the save and command log.

---

## 13. ASSET PRODUCTION PLAN

### 13.1 The three rules that prevent another wasted batch

1. **No asset is generated until its slot exists in the running game as a grey box.** The game itself exports a layout guide per location (horizon line, ground grid, every anchor's footprint and a human-height marker at each depth band). Plates are painted to that guide; props are painted to their footprint.
2. **Every asset family gets a small in-engine test before its full batch.** One or two members of a family go into the game, are seen under every time of day and weather, and Sir approves them, before the rest of the family is made.
3. **Never paint what the engine adds.** No weather, no time of day, no sun direction, no cast shadows, no ground patches, no snow on bare-ground assets, no characters in plates, no structures in plates.

### 13.2 Order of production (each step has a STOP)

| Step | What is made | Gate before the next step |
|---|---|---|
| A0 | Nothing generated. The game exports grey-box layout guides for Camp, Shore, Woods (M9) | Sir approves the layouts by playing the grey-box game |
| A1 | **Style calibration:** the lean-to, the protagonist idle pose and a 1/3 crop of the camp plate, each in 2–3 style strengths (from "simplified painterly" to "graphic/comic"). Throwaway | Sir picks one; Claude writes `art/STYLE_BIBLE.md` with the exact prompts, palette swatches, edge rules and a reference board |
| A2 | **Camp proof slice:** camp bare day + night plates, foreground occluder, 4 skies (day clear, overcast, dusk, night clear), shelter T0 and T1, firepit T0, fire loop, woodpile at 3 heights, protagonist `idle`, `sit_fire`, `chop`, rain and snow particles | In-engine review across all times and weathers; snow-rim shader judged (Plan A vs B). **This is the main art STOP** |
| A3 | Rest of camp (bare): all structure tiers and states, all props, the gray jay and raven | Camp looks complete in autumn |
| A4 | Camp winter: snow day/night plates, snow occluder, frost overlay, Plan B variants only if needed | Camp complete through the season |
| A5 | Protagonist: remaining 13 poses | All actions show the right pose at every station |
| A6 | Shore: 4 plates, frost overlay, 2 occluders, shore props (stakes, ice holes, net states, ice cache) | Shore complete |
| A7 | Woods: same structure, woods props and decals | Woods complete |
| A8 | Animals: alive poses, recurring cast, silhouettes, carcasses, catch cutouts | Every hunt, catch and raid shows its animal |
| A9 | Remaining FX (smoke, splash, chips, breath fog, sun shafts, mist) | — |
| A10 | Event and ending illustrations (~20) | All cards and endings illustrated |
| A11 | UI icons, panel frames, map, cursors (placeholders from M10 until here) | UI pass complete |
| A12 | Key art, logo, Steam capsules, screenshots, trailer capture | Store page ready |

Sound runs in parallel, also gated:

| Step | What | When |
|---|---|---|
| S1 | Camp slice: day and night beds, light wind, rain on tarp, medium fire loop, ~10 effects (chop, gather, stoke, ferro, drink, eat, dirt footsteps, pack drop, UI click, page turn) | With A2; judged together |
| S2 | All location beds, weather layers, water, fire sizes, winter beds | With A4–A7 |
| S3 | Action effects by domain as each location lands | With A5–A7 |
| S4 | Wildlife, predators, events, damage, body, radio | With A8, A10 |
| S5 | Music cues | Last, once the full game plays end to end with ambience |

### 13.3 Family sheet

| Family | Why it exists | Transparent | Variants | Weather-independent | How it layers | Generate at |
|---|---|---|---|---|---|---|
| Location plate | The place itself; stations sit on its ground plane | Sky area only | Bare/snow × day/night (4 per location) | Yes; neutral soft light | Layer 2, under everything placed | A2 (camp bare), A4, A6, A7 |
| Sky | Time, weather, awe events | No | 8 shared | It *is* the weather | Layer 0 behind the plate | A2 (4), A4 (rest) |
| Frost overlay | First-frost phase without new plates | Yes | 1 per location | Yes | Layer 3 over the bare plate | A4, A6, A7 |
| Foreground occluder | Depth: grass and branches in front of the character | Yes | Bare/snow per location | Yes | Layer 8 | A2, A4, A6, A7 |
| Structure tier | Visible progression | Yes | One per tier; all tiers of one structure share one footprint | Yes; snow by shader (Plan B: +1 snow variant) | Layer 6 at its anchor | A2 (2), A3 |
| Structure state overlay | Loaded rack, roof damage, WIP frame, insulation | Yes | One per state, shared where possible | Yes | On top of the tier sprite | A3 |
| Stock pile | Shows quantities without numbers | Yes | 2–3 heights | Yes (shader snow) | Layer 6 | A2 (woodpile), A3 |
| Kit props | Drafted items visible in camp | Yes | 1 (axe: 3 states) | Yes | Layer 6 | A3 |
| Protagonist pose | Presence and action feedback | Yes | 16 | Yes (grade + damp tint + cold pose do the rest) | Layer 7 at the station's character anchor | A1 (test), A2 (3), A5 (13) |
| Animal alive | Hunt targets, raids, cast | Yes | 1 pose (cast: 2–3) | Yes | Layer 7 at animal anchors | A3 (jay, raven), A8 |
| Silhouette predator | Wolves, bear at the firelight edge | Yes | 2 each | Yes | Layer 7, darkened | A8 |
| Carcass and catch | Kill sites, result cards | Yes | Per species; carved bundle shared | Yes | Layer 6 / result card | A8 |
| Decals | Tracks, blood, ash, debris | Yes | 1–3 each | Yes (snow shader on debris) | Layer 4 | A3, A7 |
| FX textures | Fire, smoke, rain, snow, splash, chips, mist | Yes | Fire: one loop | — | Layers 9–10 | A2 (fire, rain, snow), A9 |
| Event illustration | Cards and endings | No | 1 each | Painted for its moment (exception: these may carry their own lighting) | Card UI | A10 |
| UI icon | Stats, resources, kit, conditions | Yes | 1 each | — | React UI | A11 |
| Store art | Steam page | No | Steam's required sizes | — | — | A12 |

### 13.4 How to generate so the pieces fit

- **Plates:** use the exported layout guide as the composition reference (image-to-image or structure guidance). Generate the place **empty**. Then mask the sky to transparency and paint out anything that sits where an anchor is.
- **Structure tiers:** generate tier 1 isolated on flat mid-grey in the layout's perspective; make each later tier by **editing the previous tier's image** so footprint and perspective stay identical.
- **Poses:** use the approved idle pose plus a rough pose sketch as references; keep face, beard, jacket, pack and boots identical; reject any pose whose silhouette height differs from the guide by more than 3 %.
- **Edges:** remove backgrounds at master resolution; check every cutout over black and over white for halos before it enters `assets/`.
- **Naming:** follow §6.9 exactly; anything not in the manifest is not in the game.
- **Never batch beyond the current step.** If a step's test fails, fix the method (prompt, guide, scale), not the quantity.

---

## 14. DEVELOPMENT MILESTONES

Each milestone is sized for one focused Claude Code session (sometimes two). Each ends at an explicit **STOP**: Claude reports, updates `docs/STATUS.md`, and waits for Sir. "Visible acceptance" is what Sir checks himself.

### Phase 1: the port (headless, no presentation)

**M0 — Repository reset and toolchain**
- Scope: new repository layout (§9.1); salvage `rng.ts`, lint/TS config; remove Capacitor and mobile shell; Electron opens a blank 1920×1080 letterboxed stage; CLAUDE.md and `docs/` skeleton (§15.3); git initialised with the v12 file under `legacy/` (read-only by rule).
- Inputs: this plan, the current repository.
- Tests: `npm test`, `npm run lint`, `npm run typecheck`, app launches.
- Visible acceptance: double-clicking the dev launcher opens a dark 16:9 window that stays 16:9 when resized.
- STOP.

**M1 — Legacy harness and legacy index**
- Scope: run untouched `tap-out-v12.html` in Node with a DOM stub and seeded `Math.random`; drive it by function calls; record per-command state snapshots; write `docs/spec/LEGACY_INDEX.md` (every v12 function → line range → target module).
- Tests: the same seed and command script produce identical snapshots twice.
- Visible acceptance: a printed summary of one scripted 3-day legacy run.
- STOP.

**M2 — Core foundations port**
- Scope: state schema, initial state with P1 placeholder profile, clock, photoperiod, temperature curve, weather, body ticking, `eCost`/`eTime`/`spend`/`spendOrDebt`, slips, travel (without events).
- Tests: parity on clock/weather/body for 50 seeds × scripted days.
- Visible acceptance: parity report "all green" for foundations.
- STOP.

**M3 — Camp economy port**
- Scope: fire, water, food queues, spoilage, cooking, eating, smoking, materials and carry, drop-off, all builds and tiers, gear and repairs, comforts, rest, sit-and-watch, wash.
- Tests: parity per command family.
- STOP.

**M4 — Night and dawn port**
- Scope: the full night pipeline (§9.3) in v12 order (no fixes yet), raids including the wake-up choice as a pending interaction, worry ledger, weight/BMI, med checks, rivals, energy ceiling, late rise, storm damage, mold.
- Tests: parity across 100 seeded nights per persona.
- Recommended model: Opus (§15).
- STOP.

**M5 — Shore and woods port**
- Scope: lines, net, ice line, ice fishing, ice cache, snares and spots, pressure/pity/renaming/new grounds, forage, tinder, moss, logs, firewood, scout, follow, shot (including introspection), trail, kill site, carve, haul, investigate, moose call.
- Tests: parity.
- STOP.

**M6 — Psyche, cards, medical, narrative selection, endings logic**
- Scope: resolve, promises, vows, breakdowns, panic sequence, tags/traits, director, threads (first-kill vow), all 12 cards and the wolverine face-roll, medical arcs, ankle break and salvage, awe/descent/dawn/dreams/monologue/letters/confessionals selection (text ids), ending state and epilogue data.
- Tests: parity; full headless runs to every ending class.
- Recommended model: Opus.
- STOP.

**M7 — Balance harness and parity report**
- Scope: persona bots (including the new competent persona), 180-run sweeps on both legacy and port, side-by-side metrics report.
- Visible acceptance: `reports/parity-balance.md` shows the port's distributions match v12's within noise.
- **STOP: Sir confirms "the port is v12".**

**M8 — Deliberate v12 fixes**
- Scope: §2.12 defects; §2.4 agency fixes (camera nag, tree-mark penalty, director soaking); rations; protagonist profile in place of customization (with Sir's decisions or placeholders); original rival names; orcas replacement; forced-tap narration by dominant cause; partner-tag rule.
- Tests: an intended-difference test per change; harness re-run with before/after metrics.
- Visible acceptance: a one-page change report with the new cause-of-loss split.
- STOP.

### Phase 2: the grey-box game (complete, ugly, playable)

**M9 — Stage, scenes and layout guides**
- Scope: virtual stage scaling, Phaser host, layer stack (§6.3) with placeholder shapes, location layouts with every anchor and hotspot for Camp, Shore, Woods, hover outlines, `Alt` labels, debug overlay; export layout-guide PNGs.
- Visible acceptance: three grey-box locations where every station is hoverable and named.
- **STOP: Sir approves layouts. Art step A0 is done; A1 may begin.**

**M10 — UI shell and Camp playable**
- Scope: top bar, body rail and panel, stores rail, pack, context panel with live previews, outcome tags and result cards (placeholder art), journal, main menu, kit draft screen.
- Tests: Playwright: every camp command reachable and resolvable.
- Visible acceptance: a full camp day can be played with the mouse only.
- STOP.

**M11 — Travel, Shore, Woods, map, trapline**
- Scope: exits, travel transition, arrival notes, map overlay, shore spot stations, trapline map, hunting in-scene states (tracks, spotted animal, blood trail, kill site).
- Visible acceptance: every v12 action is reachable in the grey-box game.
- STOP.

**M12 — Night, dawn, cards, endings, tap-out**
- Scope: sleep flow with night preview, night presentation, pending-interaction cards, panic sequence, wolverine face-roll, dawn report, sat phone, all four ending sequences, run history.
- Visible acceptance: complete runs to every ending in the grey-box game (debug presets help).
- **STOP: grey-box playtest. Sir plays at least two full runs. Interaction design is locked here.**

**M13 — Saves and settings**
- Scope: Electron file saves (§10), backups, migrations scaffold, corruption recovery, Continue/New Run, settings file and screen (audio sliders wired to silent buses for now, display modes, resolutions).
- Tests: §12 save suite.
- Visible acceptance: quit mid-run (even mid-card), relaunch, Continue resumes exactly; a deliberately corrupted save recovers from backup with a clear message.
- STOP.

### Phase 3: art, sound, narrative

**M14 — Rendering features with the camp art slice**
- Scope: sky/plate/occluder loading from the manifest, time-of-day and weather grading, particles, fire loop and light, contact shadows, snow-rim shader, pose system, action beats; integrate art step A2.
- Visible acceptance: the camp slice looks right at dawn, noon, dusk, night, rain, storm, snow.
- **STOP: art direction lock (Plan A or B for snow).**

**M15 — Audio director with the sound slice**
- Scope: buses, ambience layer mixer, emitter scheduler, event→sound map, ducking, inside filter; integrate S1.
- Visible acceptance: sitting in camp through a day and a night sounds alive; sliders work.
- **STOP: audio direction lock.**

**M16 — Camp art complete** (A3, A4, A5) — STOP.

**M17 — Shore, Woods and animals art** (A6, A7, A8, A9) — STOP.

**M18 — Narrative pass**
- Scope: P1 content pack, girlfriend thread, parents/no-contact thread (core + content + tests), Waiver card, rewritten forced-tap narration, letters, endings' call-home.
- Tests: thread unit tests; harness rarity metrics (§8.4); partner-attribution = 0.
- Visible acceptance: debug presets show each stage beat and the Waiver card; a full run reads naturally.
- STOP.

**M19 — Sound complete** (S2–S5) — STOP.

**M20 — Feel and polish**
- Scope: event illustrations (A10), UI art (A11), transitions, hover and click feel, teaching tooltips, accessibility options (reduce flashing, text speed), credits screen.
- STOP.

### Phase 4: release

**M21 — Steam integration** — steamworks.js init, achievements, overlay test, Auto-Cloud config, SteamPipe scripts, `beta` branch upload. STOP.

**M22 — Beta hardening** — soak tests, performance on low-end hardware, crash logging, full balance pass with the competent persona, external playtest build. STOP.

**M23 — Release candidate** — store assets (A12), AI disclosure text, legal checks, final regression, RC build on the `default` branch (unreleased). **STOP: Sir decides to launch.**

---

## 15. CLAUDE CODE EXECUTION STRATEGY FOR A $20 PRO USER

### 15.1 Model and effort per kind of work

Pro usage is limited per rolling window and per week, and Opus draws on it several times faster than Sonnet. Check which models your plan offers in Claude Code with `/model`; if Opus isn't offered, use Sonnet at high effort for the Opus rows.

| Work | Model | Effort | Plan Mode |
|---|---|---|---|
| M1 legacy harness, M4 night port, M6 psyche and cards, M8 fixes that move balance, M13 saves and migrations, M21 Steam, any bug that survived two attempts | Opus | High (xhigh only for a stuck parity mismatch) | Yes |
| M2, M3, M5 ports, M9 stage and layers, M14 rendering, M15 audio director, M18 thread engine | Sonnet | High | Yes |
| UI panels, wiring content, manifest entries, art and sound integration, journal text, settings | Sonnet | Medium | Only when the task touches more than one package |
| Renames, copy edits, adding a sound to the event map, updating a manifest | Sonnet | Low | No |

### 15.2 Session discipline

- **One milestone per fresh session.** Start each one with: "Read `CLAUDE.md`, `docs/STATUS.md` and `docs/spec/<the relevant spec>` only. Enter Plan Mode and propose the plan for M<n>." Approve the plan, then let it work.
- **Never ask a session to read the whole legacy file.** `docs/spec/LEGACY_INDEX.md` (from M1) gives line ranges; a session reads only the functions it is porting.
- **Use `/clear` between unrelated tasks** inside a milestone; use `/compact` only when a long task must continue.
- **Don't have Claude look at images** unless that is the task (each image costs a lot of context). You judge art; Claude wires it through the manifest.
- **Keep command output short.** Tests and the harness print summaries; full reports go to files.
- **Stop at STOP.** A session that finishes early ends; it does not start the next milestone.
- **No parallel sessions, no subagent fan-out.** One thread of work at a time, as you asked.

### 15.3 What belongs in `CLAUDE.md` (kept under ~150 lines)

1. One paragraph: what TAP / OUT is; v12 is the behavioural authority.
2. Hard rules: never edit `legacy/` or `art-source/`; no new dependency without asking; no rule logic in UI or scenes; every rule change needs a parity or intended-difference test; never add agendas, recommendations, rankings or compliance consequences (with the forbidden phrase list); partner-tagged events never cause tap-outs.
3. Commands: install, dev, test, parity, harness (summary mode), build, package.
4. Where things live (§9.1) and the docs map below.
5. The milestone protocol: Plan Mode first; finish with tests green; update `docs/STATUS.md`; stop.
6. Style: TypeScript strict, small modules, text via ids, numbers only in content.

### 15.4 Spec files that prevent rereading

```
docs/
  STATUS.md                 current milestone, what's done, the next step, open questions (≤1 page)
  DECISIONS.md              dated, one line each (Sir's choices and why)
  spec/
    00_INDEX.md             which spec covers what
    LEGACY_INDEX.md         v12 function → line range → target module
    body.md, fire-food.md, build.md, fishing-trapping.md, hunting.md,
    night-pipeline.md, psyche.md, threads.md, cards.md, endings.md,
    ui.md, rendering.md, audio.md, saves.md, steam.md
  art/STYLE_BIBLE.md        prompts, palette, edge and scale rules
  reports/                  harness and parity outputs (generated)
```

Each domain spec is short: the rules in plain words, the tuning keys, the v12 line refs, and any deliberate changes. A session reads one or two of these instead of the codebase.

### 15.5 Project memory

Keep project memory for things that stay true and would otherwise be re-asked: Sir's decisions (§17), the agency rule, the partner rule, the current milestone, where the plan lives. Code facts belong in the repository docs, not memory.

### 15.6 Spending the budget where it matters

- The ports (M2–M6) and their parity tests are where quality is decided; give them the best model and patience.
- UI and art wiring are many small, cheap tasks; do them on Sonnet at medium.
- Run the full 180-run harness only at milestone STOPs that touch rules; use 20-seed smoke runs while iterating.
- When a session goes in circles twice on the same bug, stop it, write down what was tried in `STATUS.md`, and start a fresh Opus session on just that bug.

---

## 16. DEFINITION OF DONE

### Feature complete
- Every v12 system in §2 is ported, with parity or intended-difference tests passing.
- Every action is reachable in the world UI; every card, ending and thread stage can be reached (debug presets).
- Saves, settings, run history work; corruption recovery works.
- Placeholder art and sound are allowed only where a final asset is still scheduled.

### Beta
- All final art and sound in; no placeholders.
- 500-run soak: zero exceptions, zero stuck states.
- Balance report within targets (or each miss written down with a reason), including thread rarity and zero partner-attributed tap-outs.
- 60 fps at 1920×1080 on an integrated-graphics laptop; location switch under 1.5 s.
- At least five external players have each finished a full run; their reports triaged.

### Release candidate
- No known crash, data-loss or progression-blocking bug.
- Save migration from every beta save version passes.
- Steam achievements, overlay and Cloud verified on a clean Windows machine.
- All credits, licences and the AI disclosure written.

### Steam ready
- Store page complete (capsules, screenshots, trailer, description, tags, system requirements, AI disclosure).
- Build on the `default` branch passes Valve's review checklist; price and release date set.
- A rollback build exists on a branch.

---

## 17. DECISIONS SIR STILL NEEDS TO MAKE

Only taste-dependent choices are listed; everything else above is a recommendation Claude will execute unless Sir overrides it.

| # | Decision | Recommendation |
|---|---|---|
| 1 | The protagonist's name | Sir's choice (v12's "Jack" is only a placeholder) |
| 2 | His height and starting weight | 178 cm / 88 kg, to keep v12's balance |
| 3 | His one fear (dark, injury, failing, going home empty-handed, or a new one) | Sir's choice |
| 4 | The girlfriend's name, and a few true details about his parents (names, ages, one thing about each) | Sir's choice; this is what makes the no-contact thread specific instead of generic |
| 5 | Narrative voice: second person ("you") or third person ("he") | Second person, as v12 mostly is |
| 6 | Art style strength after the A1 calibration test | Pick by eye from the test |
| 7 | Save philosophy: strict single run, or allow "restart from last dawn" | Strict single run |
| 8 | The show's framing: prize amount, whether the show has a name, the nine rivals' names | Change the $500,000 figure and the names; keep the format |
| 9 | Music direction (sparse acoustic, ambient drone, or both) and source (composer, licensed, AI) | Sparse acoustic with drones, from a composer or a licensed library |
| 10 | Shelter interior vignette after beta (yes / no) | No for v1 |
| 11 | Final title and Steam page name | Keep "TAP / OUT" if the trademark check is clean |

---

*End of plan. Nothing in this document has been implemented. On approval, work begins at M0.*
