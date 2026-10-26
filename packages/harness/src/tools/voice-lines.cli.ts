// Writes Dan's thought lines (D-067), his confessional pieces (D-068) and the spoken intro (rc.2) as JSON for the voice recorder, scripts/voice/render.py.
// npm run voice:lines -- out.json

import { writeFileSync } from 'node:fs';
import { CONFESSION_CLIPS, INTRO_VOICE, THOUGHTS, WIN_VOICE } from '@tapout/content';

const out = process.argv[2] ?? 'voice-lines.json';
const lines = [
  ...THOUGHTS.map(({ id, say, speed }) => ({ id, say, speed })),
  ...CONFESSION_CLIPS.map(({ id, say }) => ({ id, say, style: 'aloud' })),
  ...[...Object.values(INTRO_VOICE.notes).flat(), ...INTRO_VOICE.dropoff.flatMap((c) => (c ? [c] : [])), ...WIN_VOICE].map(({ id, say, voice, style }) => ({ id, say, voice, ...(style ? { style } : {}) })),
];
writeFileSync(out, JSON.stringify(lines, null, 1));
console.log(`${lines.length} lines -> ${out}`);
