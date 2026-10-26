import { describe, expect, it } from 'vitest';
import { KIT_POOL } from '@tapout/core';
import { glyphFor, glyphHtml, glyphText, noEmoji } from './ui/glyphs.ts';

const EMOJI = /\p{Extended_Pictographic}/u;

describe('the game draws its own icons, never emojis (rc.3, D-083)', () => {
  it('has a picture for every kit item', () => {
    for (const k of KIT_POOL as Array<{ id: string; icon: string }>) expect(glyphFor(k.icon), k.id).not.toBeNull();
  });

  it('has a picture for every activity v12 names', () => {
    for (const e of ['⚡', '🔥', '❄️', '💧', '🌧', '⛈', '🌫', '☀️', '🌡', '⚖️', '🏕', '🩹', '🐺', '🪵', '🪨', '🌿', '🧱', '🪤', '🎣', '🕸', '🏹', '🥓', '🫐', '🍲', '🩺', '📞']) {
      expect(glyphFor(e), e).not.toBeNull();
    }
  });

  it('leaves no emoji behind, mapped or not', () => {
    const sample = '☀️ Clear · 🌡 4°C · −6⚡ · 1h · +3-5 logs 🪵 · 🐋 a whale? 🐦‍⬛ raven ✨';
    expect(glyphHtml(sample)).not.toMatch(EMOJI);
    expect(glyphText('<b>🔥 fire</b>')).toContain('&lt;b&gt;');
    expect(noEmoji('🔥  Fire is lit')).toBe('Fire is lit');
  });
});
