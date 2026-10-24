// Writes Dan's thought lines (D-067) as JSON for the voice recorder, scripts/voice/render.py.
// npm run voice:lines -- out.json

import { writeFileSync } from 'node:fs';
import { THOUGHTS } from '@tapout/content';

const out = process.argv[2] ?? 'voice-lines.json';
writeFileSync(out, JSON.stringify(THOUGHTS.map(({ id, say, speed }) => ({ id, say, speed })), null, 1));
console.log(`${THOUGHTS.length} lines -> ${out}`);
