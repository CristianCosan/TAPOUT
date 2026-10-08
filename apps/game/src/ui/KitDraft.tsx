import { useState } from 'react';
import { KIT_POOL } from '@tapout/core';

interface KitItem {
  id: string;
  label: string;
  icon: string;
  std: boolean;
  has: string;
  without: string;
  expert?: boolean;
}

const POOL = KIT_POOL as KitItem[];
const PICKS = 10;

export function KitDraft(props: { onBegin: (kit: string[]) => void; onBack: () => void }) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set(POOL.filter((k) => k.std).map((k) => k.id)));

  const toggle = (id: string) => {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else if (next.size < PICKS) next.add(id);
      return next;
    });
  };

  return (
    <div className="draft">
      <header className="draft-head">
        <h2>Pack your kit</h2>
        <p>
          Ten items. Everything else stays home. <b className={picked.size === PICKS ? 'ok' : ''}>{picked.size}/{PICKS} picked</b>
        </p>
      </header>
      <div className="draft-grid">
        {POOL.map((item) => {
          const on = picked.has(item.id);
          return (
            <button key={item.id} className={`kit-item${on ? ' on' : ''}${item.expert && !on ? ' expert' : ''}`} onClick={() => toggle(item.id)}>
              <span className="kit-name">
                {item.icon} {item.label}
              </span>
              <span className="kit-desc">{on ? item.has : item.without}</span>
              {item.expert && !on && <span className="kit-warn">Expert draft: going without this is a real handicap</span>}
            </button>
          );
        })}
      </div>
      <footer className="draft-foot">
        <button className="big-btn" onClick={props.onBack}>
          Back
        </button>
        <button className="big-btn primary" disabled={picked.size !== PICKS} onClick={() => props.onBegin([...picked])}>
          Begin · Day 1
        </button>
      </footer>
    </div>
  );
}
