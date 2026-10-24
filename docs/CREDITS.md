# Credits and licences

Every third-party asset or library that ships in the game, with its source and licence.
Assets must be CC0 or free for commercial use with no payment (D-031).

## Libraries

| What | Source | Licence |
|---|---|---|
| three.js (3D rendering) | https://threejs.org | MIT |
| React, React DOM | https://react.dev | MIT |
| Phaser (layout-guide screens only) | https://phaser.io | MIT |
| Electron (Windows shell) | https://www.electronjs.org | MIT |

## Models, textures, sounds

None. As of build 0.0.3 every model, sign and sound is generated in code
(`apps/game/src/world/`).

## Voice

Dan's spoken thoughts (D-067, from build 0.0.57) are recorded with tools that run on the build
machine; only the finished recordings (`apps/game/public/voice/*.ogg`) ship with the game.

| What | Source | Licence |
|---|---|---|
| Kokoro-82M voice model, voice `am_michael` | https://huggingface.co/hexgrad/Kokoro-82M | Apache-2.0 |
| kokoro-onnx (runs the model) | https://github.com/thewh1teagle/kokoro-onnx | MIT |
| espeak-ng (turns words into sounds for the model; build machine only, not shipped) | https://github.com/espeak-ng/espeak-ng | GPL-3.0 |
