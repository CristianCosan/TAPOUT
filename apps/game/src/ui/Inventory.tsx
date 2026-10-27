// rc.5 (Sir): the backpack (I, or the pack button). What you wear, the tool in your hand, what
// is in the pack and what you are carrying. Putting a garment on or off is a v12-style action
// (a minute); carrying a tool is presentation only, so jobs never wait on it.

import { KIT_POOL, wearing, type Garment } from '@tapout/core';
import { HELD_TOOLS, INVENTORY_TEXT as T } from '@tapout/content';
import { session, type View } from '../session.ts';
import type { Held } from '../world/hands.ts';
import { hudText } from './offers.ts';
import { Glyph, Txt } from './icons.tsx';
import type { GlyphId } from './glyphs.ts';

type KitItem = { id: string; label: string; icon: string };

/** The tools you own, in key order. */
export function ownedTools(view: View): typeof HELD_TOOLS[number][] {
  const kit = view.state.kit as Set<string> | undefined;
  return HELD_TOOLS.filter((t) => kit?.has(t.kit));
}

export function Inventory({ view, held, onHold, onClose }: { view: View; held: Held | null; onHold: (tool: Held | null) => void; onClose: () => void }) {
  const S = view.state;
  const kit = S.kit as Set<string> | undefined;
  const gear = (S.gear ?? {}) as Record<string, number>;
  const items = (KIT_POOL as readonly KitItem[]).filter((k) => kit?.has(k.id));
  const carry = hudText(view.hud, 'carryChips');
  return (
    <div className="overlay" onClick={onClose}>
      <div className="inventory" onClick={(e) => e.stopPropagation()}>
        <header>
          <Glyph id="pack" size={34} />
          <div>
            <h3>{T.title}</h3>
            <span>{T.bagOn}</span>
          </div>
          <button className="hud-btn" onClick={onClose}>{T.close}</button>
        </header>

        <section>
            <h4>{T.wearing}</h4>
            {(['jacket', 'shell'] as Garment[]).map((g) => {
              const on = wearing(g);
              const words = T.garments[g];
              return (
                <div key={g} className={`inv-row${on ? ' on' : ''}`}>
                  <Glyph id={g as GlyphId} size={30} />
                  <div className="inv-what">
                    <b>{words.name}</b>
                    <span>{on ? words.on : words.off}</span>
                  </div>
                  <button className="chip-btn" onClick={() => session.click(`wear('${g}')`)}>
                    {on ? T.on : T.off} · {T.minute}
                  </button>
                </div>
              );
            })}
        </section>

        <section>
          <h4>{T.inHand}</h4>
          <div className="inv-hand">
            <button className={`inv-slot${held === null ? ' on' : ''}`} onClick={() => onHold(null)}>
              <span className="k">0</span>
              {T.handsEmpty}
            </button>
            {ownedTools(view).map((t) => (
              <button key={t.tool} className={`inv-slot${held === t.tool ? ' on' : ''}`} onClick={() => onHold(held === t.tool ? null : t.tool)}>
                <span className="k">{t.key}</span>
                <Glyph id={t.tool as GlyphId} size={26} />
                {t.label}
              </button>
            ))}
          </div>
          <p className="inv-hint">{T.handHint}</p>
        </section>

        <section>
          <h4>{T.pack}</h4>
          <div className="inv-grid">
            {items.map((k) => {
              const worn = gear[k.id];
              return (
                <div key={k.id} className="inv-item">
                  <Txt text={k.icon} />
                  <span>{k.label}</span>
                  {worn !== undefined && <em>{T.condition(worn)}</em>}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h4>{T.carrying}</h4>
          {carry ? <div className="rail-chips" dangerouslySetInnerHTML={{ __html: carry }} /> : <p className="inv-hint">{T.nothing}</p>}
        </section>
      </div>
    </div>
  );
}
