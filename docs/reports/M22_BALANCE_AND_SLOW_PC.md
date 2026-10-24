# M22: balance pass and slow-PC check (2026-10-24)

No rule changed in this pass. What changed is the measuring.

## The test kit was wrong

`DEFAULT_KIT` in the harness names four items v12 does not know (`knife`, `sleeping`, `tarp`,
`snare`), so every bot run so far, the M8 change report included, played without a sleeping bag
and without snare wire. Parity is unaffected (both sides get the same kit), so the parity kit
stays as it is. `npm run balance` now packs the usual ten by default; `--kit harness` gives the
old one for comparing with M8.

## A careful-player bot

`--persona competent` plays the way a careful first-timer would: drink and eat first, home and a
fire that lasts the night by dusk, the shelter before comforts, the hut before the rack, the net
and insulation, snares and lines checked once a day, spoiled food thrown out, and a bear at the
stores yelled at instead of met with the mace. It is still a weak player (it rarely gets past the
lean-to), so read these numbers as a floor, not the game's difficulty.

200 seeds each, up to day 70, usual-ten kit:

| Bot | Rules | Dead | Med pull | Tapped out | Won | Median end day |
|---|---|---|---|---|---|---|
| careful | v12 | 72.5% | 24.5% | 1.5% | 1.5% | 17 |
| careful | TAP / OUT | 49.0% | 47.0% | 1.5% | 2.5% | 17 |
| survivor | v12 | 70.0% | 29.5% | 0.5% | 0.0% | 13 |
| survivor | TAP / OUT | 59.0% | 38.5% | 2.5% | 0.0% | 13 |

The last rival goes between day 21 and 30, so a win means holding out about three and a half
weeks. v12's own balance report measured a median end of day 19 for its bots, so the careful bot
ends about where v12 expected. TAP / OUT's medical check before a death verdict (plan §2.12 #1)
turns about a quarter of deaths into pulls, as intended.

What ends the careful bot's runs: the body giving out around day 16 to 18 (empty warmth,
hunger and thirst bars together), because a lean-to does not hold heat once the nights turn cold
and the hut takes three long building sessions. Snares feed it well with the real kit (75+ catches
by day 17 in many runs). Card deaths are rare once it stops walking out at bears.

**Verdict:** nothing clearly off in the rules. Hard, the way v12 is hard. The real test is a
human playthrough; if a person who builds the hut early still freezes, the first thing to look
at is the hut's session cost, not anything else.

## Slow PC

Headless Chromium with software rendering, 1280x720 window, worst of four directions per area:

| Graphics | Area | Draw calls | Triangles | Frame (software GPU) |
|---|---|---|---|---|
| High | Camp | 252-270 | 165k | 430 ms |
| High | Shore | 131-136 | 160k | 385 ms |
| High | Woods | 261-279 | 157k | 445 ms |
| Lighter | Camp | 257-270 | 165k | 260 ms |
| Lighter | Shore | 121-135 | 160k | 247 ms |
| Lighter | Woods | 277-290 | 157k | 268 ms |

Frame times here are a CPU pretending to be a graphics chip, so only the ratio means anything:
Lighter graphics costs about 40% less per frame (fewer pixels, smaller shadow map, no fire
shadows, thinner weather). Under 300 draw calls and about 165k triangles (shadow pass included)
is well inside what a five-year-old integrated Intel or AMD chip draws at 30+ frames a second.
The JS heap sits at about 110 MB. The game already offers Lighter graphics on its own if the
first 12 seconds run under 28 frames a second (D-066). No change needed.
