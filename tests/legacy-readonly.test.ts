import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// legacy/tap-out-v12.html is the behavioural authority and must never change.
const V12_SHA256 = 'd8f3e362a012cccd3765abb06ce5d97d31da1cd5cfcd88cd4d391c3e3210debb';

describe('legacy source of truth', () => {
  it('is byte-for-byte the v12 file', () => {
    const bytes = readFileSync(new URL('../legacy/tap-out-v12.html', import.meta.url));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(V12_SHA256);
  });
});
