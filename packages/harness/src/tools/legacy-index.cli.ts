import { fileURLToPath } from 'node:url';
import { writeLegacyIndex } from './legacy-index.ts';

const target = fileURLToPath(new URL('../../../../docs/spec/LEGACY_INDEX.md', import.meta.url));
const count = writeLegacyIndex(target);
process.stdout.write(`LEGACY_INDEX.md written: ${count} definitions\n`);
