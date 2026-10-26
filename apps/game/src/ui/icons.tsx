// Every resource as a small picture drawn in code (rc.2). Hovering one says what it is for.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RESOURCES, RESOURCE_WORDS, type ResourceId } from '@tapout/content';
import { GLYPHS, glyphText, type GlyphId } from './glyphs.ts';

const PICTURES: Record<ResourceId, ReactNode> = {
  wood: (
    <>
      <rect x="3" y="12" width="17" height="6" rx="3" fill="#7a5532" />
      <rect x="5" y="6" width="17" height="6" rx="3" fill="#8a6038" />
      <circle cx="6" cy="15" r="3" fill="#d9b483" stroke="#7a5532" />
      <circle cx="8" cy="9" r="3" fill="#e2bf8e" stroke="#8a6038" />
      <circle cx="8" cy="9" r="1" fill="#b08858" />
    </>
  ),
  firewood: (
    <>
      <path d="M12 3c2 3 5 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 0-8z" fill="#f0a040" />
      <path d="M12 8c1 2 2 3 2 5a2 2 0 0 1-4 0c0-1 1-2 2-5z" fill="#ffd27a" />
      <rect x="3" y="17" width="18" height="3" rx="1.5" fill="#7a5532" transform="rotate(-12 12 18.5)" />
      <rect x="3" y="17" width="18" height="3" rx="1.5" fill="#8a6038" transform="rotate(12 12 18.5)" />
    </>
  ),
  rocks: (
    <>
      <path d="M2 19l3-7 5-2 4 3 1 6z" fill="#8c8a84" />
      <path d="M11 19l2-6 5-3 4 4v5z" fill="#a8a59c" />
      <path d="M5 12l5-2 1 3-6 1z" fill="#b8b5ac" />
    </>
  ),
  moss: (
    <>
      <ellipse cx="12" cy="17" rx="9" ry="4" fill="#3f6a2c" />
      <circle cx="8" cy="14" r="3.5" fill="#5a8a3a" />
      <circle cx="13" cy="12.5" r="4" fill="#6a9a42" />
      <circle cx="17" cy="15" r="3" fill="#4f7d34" />
    </>
  ),
  clay: (
    <>
      <path d="M4 18c0-6 3-10 8-10s8 4 8 10z" fill="#9a8a7a" />
      <path d="M7 15c1-3 3-4 5-4" stroke="#c4b4a2" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <rect x="3" y="18" width="18" height="2.5" rx="1.2" fill="#7a6a5c" />
    </>
  ),
  tinder: (
    <>
      <path d="M4 19c4-2 6-8 7-14M8 20c3-3 5-8 5-13M12 20c2-3 3-7 6-11M15 20c2-2 4-4 6-6" stroke="#c9b27a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <ellipse cx="12" cy="19.5" rx="8" ry="2" fill="#a88e58" />
    </>
  ),
  meat: (
    <>
      <path d="M5 13c0-5 4-8 9-7s6 6 3 9-6 4-9 3-3-2-3-5z" fill="#b8473c" />
      <path d="M8 12c1-2 3-3 5-3" stroke="#e8a090" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <rect x="15" y="15" width="6" height="2.4" rx="1.2" fill="#efe3c8" transform="rotate(40 18 16)" />
    </>
  ),
  arrows: (
    <>
      <path d="M4 20L19 5" stroke="#b08858" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 5l-5 1 4 4z" fill="#a8a59c" />
      <path d="M4 20l1-4 1.5 1.5zM4 20l4-1-1.5-1.5z" fill="#d8d2c4" />
    </>
  ),
  raw: (
    <>
      <path d="M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z" fill="#5a7a6a" />
      <circle cx="10" cy="15" r="1" fill="#3a5244" />
      <circle cx="14" cy="17" r="0.8" fill="#3a5244" />
    </>
  ),
  water: (
    <>
      <path d="M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12z" fill="#5aa0d0" />
      <path d="M9 15a3 3 0 0 0 3 3" stroke="#cfe8f6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </>
  ),
  berries: (
    <>
      <circle cx="9" cy="15" r="3.6" fill="#4a3a8a" />
      <circle cx="15" cy="15.5" r="3.4" fill="#5a4a9a" />
      <circle cx="12" cy="10.5" r="3.2" fill="#3e3078" />
      <path d="M12 7c2-3 5-3 7-2-2 2-4 3-7 2z" fill="#5a8a3a" />
    </>
  ),
  smoked: (
    <>
      <rect x="4" y="8" width="16" height="5" rx="2" fill="#6a3a24" transform="rotate(-8 12 10)" />
      <rect x="5" y="14" width="15" height="5" rx="2" fill="#7a4428" transform="rotate(6 12 16)" />
      <path d="M8 6c0-2 2-2 2-4M14 6c0-2 2-2 2-4" stroke="#9aa0a4" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </>
  ),
  cooked: (
    <>
      <path d="M3 12h18a9 7 0 0 1-18 0z" fill="#7a6a5c" />
      <ellipse cx="12" cy="12" rx="9" ry="2" fill="#c08a4a" />
      <path d="M9 9c0-2 2-2 2-4M14 9c0-2 2-2 2-4" stroke="#c9ccd0" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </>
  ),
};

/** What hovering a resource says: its name, then what it is used for. */
export function resourceTip(id: ResourceId): string {
  return `${RESOURCES[id].name}: ${RESOURCES[id].use}`;
}

/** A resource's picture. Hover it for its name and what it is used for. */
export function ResIcon({ id, size = 22 }: { id: ResourceId; size?: number }) {
  return (
    <svg className="res-icon" width={size} height={size} viewBox="0 0 24 24" data-tip={resourceTip(id)} aria-label={RESOURCES[id].name} role="img">
      {PICTURES[id]}
    </svg>
  );
}

/** One of the game's own icons (rc.3), in place of an emoji. */
export function Glyph({ id, size }: { id: GlyphId; size?: number }) {
  return <svg className="glyph" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" dangerouslySetInnerHTML={{ __html: GLYPHS[id] }} />;
}

/** Text whose emojis are drawn as the game's own icons. */
export function Txt({ text }: { text: string }) {
  return <span dangerouslySetInnerHTML={{ __html: glyphText(text) }} />;
}

/** v12's own words with each resource name swapped for its picture. */
export function WithIcons({ text }: { text: string }) {
  let parts: Array<string | { icon: ResourceId }> = [text];
  for (const [re, id] of RESOURCE_WORDS) {
    parts = parts.flatMap((part) => {
      if (typeof part !== 'string') return [part];
      const bits = part.split(new RegExp(re.source, 'i'));
      return bits.flatMap((b, k) => (k ? [{ icon: id }, b] : [b])).filter((b) => b !== '');
    });
  }
  return (
    <>
      {parts.map((p, i) => (typeof p === 'string' ? <Txt key={i} text={p} /> : <ResIcon key={i} id={p.icon} size={18} />))}
    </>
  );
}

/**
 * One tooltip for the whole screen: anything with a data-tip shows it on hover. The stage is
 * scaled to the window, so positions are measured and divided back to stage pixels.
 */
export function Tooltip({ root }: { root: React.RefObject<HTMLElement | null> }) {
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const last = useRef<Element | null>(null);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const over = (e: MouseEvent) => {
      const target = (e.target as Element).closest?.('[data-tip]');
      if (target === last.current) return;
      last.current = target;
      if (!target) return setTip(null);
      const box = el.getBoundingClientRect();
      const scale = box.width / el.offsetWidth || 1;
      const r = target.getBoundingClientRect();
      setTip({ text: target.getAttribute('data-tip') ?? '', x: (r.left + r.width / 2 - box.left) / scale, y: (r.bottom - box.top) / scale + 8 });
    };
    const out = () => {
      last.current = null;
      setTip(null);
    };
    el.addEventListener('mouseover', over);
    el.addEventListener('mouseleave', out);
    return () => {
      el.removeEventListener('mouseover', over);
      el.removeEventListener('mouseleave', out);
    };
  }, [root]);
  if (!tip) return null;
  const [name, ...rest] = tip.text.split(': ');
  return (
    <div className="tooltip" style={{ left: Math.max(170, Math.min(1920 - 170, tip.x)), top: tip.y }}>
      <b>{name}</b>
      {rest.length > 0 && <> – {rest.join(': ')}</>}
    </div>
  );
}
