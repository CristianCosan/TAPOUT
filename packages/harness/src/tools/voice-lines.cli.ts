// Writes Dan's thought lines (D-067) and his confessional pieces (D-068) as JSON for the voice recorder, scripts/voice/render.py.
// npm run voice:lines -- out.json

import { writeFileSync } from 'node:fs';
import { CONFESSION_CLIPS, THOUGHTS } from '@tapout/content';

const out = process.argv[2] ?? 'voice-lines.json';
const lines = [
  ...THOUGHTS.map(({ id, say, speed }) => ({ id, say, speed })),
  ...CONFESSION_CLIPS.map(({ id, say }) => ({ id, say, style: 'aloud' })),
];
writeFileSync(out, JSON.stringify(lines, null, 1));
console.log(`${lines.length} lines -> ${out}`);
