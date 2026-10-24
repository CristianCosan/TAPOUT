import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THOUGHTS } from '@tapout/content';
import { plainWords } from './audio/thoughts.ts';

const dir = new URL('../public/voice/', import.meta.url);

describe("Dan's thoughts (D-067)", () => {
  it('has one recording for every line, and no stray ones', () => {
    const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8')) as Record<string, unknown>;
    for (const t of THOUGHTS) expect(existsSync(new URL(`${t.id}.ogg`, dir)), t.id).toBe(true);
    expect(Object.keys(manifest).sort()).toEqual(THOUGHTS.map((t) => t.id).sort());
  });

  it('gives every line its own id', () => {
    expect(new Set(THOUGHTS.map((t) => t.id)).size).toBe(THOUGHTS.length);
  });

  it('shows subtitles without the recording marks', () => {
    expect(plainWords('Snow. / ~ It\'s actually snowing. // Mum would love this.')).toBe('Snow. It\'s actually snowing. Mum would love this.');
    for (const t of THOUGHTS) expect(plainWords(t.say)).not.toMatch(/[~/]/);
  });

  it('never gives advice', () => {
    for (const t of THOUGHTS) expect(t.say, t.id).not.toMatch(/\b(you should|you need to|better go|go and|don't forget)\b/i);
  });
});
