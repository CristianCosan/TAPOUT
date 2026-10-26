import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONFESSION_CLIPS, INTRO_DROPOFF, INTRO_KITCHEN, INTRO_VOICE, THOUGHTS } from '@tapout/content';
import { plainWords } from './audio/thoughts.ts';

const dir = new URL('../public/voice/', import.meta.url);
const INTRO = [...INTRO_VOICE.opening, ...Object.values(INTRO_VOICE.notes).flat(), ...INTRO_VOICE.dropoff];

describe("Dan's thoughts (D-067)", () => {
  it('has one recording for every line, and no stray ones', () => {
    const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8')) as Record<string, unknown>;
    const ids = [...THOUGHTS, ...CONFESSION_CLIPS, ...INTRO].map((t) => t.id);
    for (const id of ids) expect(existsSync(new URL(`${id}.ogg`, dir)), id).toBe(true);
    expect(Object.keys(manifest).sort()).toEqual(ids.sort());
  });

  it('gives every line its own id', () => {
    const ids = [...THOUGHTS, ...CONFESSION_CLIPS, ...INTRO].map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('shows subtitles without the recording marks', () => {
    expect(plainWords('Snow. / ~ It\'s actually snowing. // Mum would love this.')).toBe('Snow. It\'s actually snowing. Mum would love this.');
    for (const t of THOUGHTS) expect(plainWords(t.say)).not.toMatch(/[~/]/);
  });

  it('never gives advice', () => {
    for (const t of THOUGHTS) expect(t.say, t.id).not.toMatch(/\b(you should|you need to|better go|go and|don't forget)\b/i);
  });

  it('speaks the whole intro: every drop-off line and every note in the kitchen (rc.2)', () => {
    expect(INTRO_VOICE.dropoff).toHaveLength(INTRO_DROPOFF.lines.length);
    INTRO_DROPOFF.lines.forEach((line, i) => expect(INTRO_VOICE.dropoff[i]!.voice, line.text).toBe(line.who === 'Kerry' ? 'kerry' : 'narrator'));
    expect(Object.keys(INTRO_VOICE.notes).sort()).toEqual(Object.keys(INTRO_KITCHEN.notes).sort());
  });
});
