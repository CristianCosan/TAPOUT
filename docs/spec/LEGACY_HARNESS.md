# Running v12 headless

`packages/harness` runs `legacy/tap-out-v12.html` unmodified inside Node. The file's single
`<script>` is evaluated in a VM context holding a DOM stub and a seeded `Math.random`, so the
game behaves exactly as it does in a browser while every random draw is reproducible. The HTML
is never patched; a hash test pins it.

```ts
const game = loadLegacyGame({ seed: 'parity-1' });
game.call('actFirewood');
game.state.energy;              // the live S object
game.read('TUNING.energy.startArrival');
game.snapshot();                // comparable structural copy of S
```

```
npm run legacy:run -- --days 3 --seed demo   # a printed summary of a scripted run
npm run legacy:index                          # regenerate docs/spec/LEGACY_INDEX.md
```

## What the stub does and does not do

- Every element accepts whatever the game writes to it; only `value`, `innerHTML`,
  `textContent` and classes are read back. v12 reads game state from `S`, never from the page.
- Timers are never fired. v12 uses them only for fire crackle, bird chirps and the typewriter.
- There is no `AudioContext`, so `audioInit()` gives up quietly, as it does in a browser with
  audio blocked.
- `window.onerror` is installed by the game as its own airbag; in Node an exception simply
  throws, which is what the harness wants.

## Scripts

`playDays(options, days)` fills each day from a fixed rotation of camp actions and sleeps at
16:00, recording a snapshot after every call and returning the exact call list. That list is
the replayable script: from M2 the port is driven through the same calls and the two snapshot
streams are compared step by step.

Refused actions stay in the script on purpose. v12 often refuses silently (LEG-009), and the
port has to refuse the same ones.

## Legacy behaviour the harness makes visible

- **LEG-007.** A night always advances exactly six hours, so sleeping at 16:19 wakes you at
  22:19 and the day can roll over twice in a row. The harness reproduces it; the fix is
  scheduled for M8, with an intended-difference test.
