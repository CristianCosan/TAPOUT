import { useEffect, useMemo } from 'react';
import { TIPS, TIPS_TEXT } from '@tapout/content';
import { duskHour } from '@tapout/core';
import type { View } from '../session.ts';
import { setSetting, settings, useSettings } from '../settings.ts';

type Tip = (typeof TIPS)[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function due(tip: Tip, S: any): boolean {
  switch (tip.when) {
    case 'start': return true;
    case 'firstAction': return Object.keys(S.acts ?? {}).length > 0;
    case 'away': return S.loc !== 'camp';
    case 'dusk': return S.hour >= duskHour() - 1.5;
    case 'wavering': return S.resolveState && S.resolveState !== 'Steady';
    case 'winter': return !!S.winter;
  }
}

/** One tip at a time, the first unseen one that applies. Dismissing it marks it seen. */
export function Tips({ view, hidden }: { view: View; hidden: boolean }) {
  const s = useSettings();
  const S = view.state;
  // v12 mutates its state in place; the view version marks a change.
  const tip = useMemo(() => (s.tips ? TIPS.find((t) => !s.tipsSeen.includes(t.id) && due(t, S)) : undefined), [s, S, view.version]);
  useEffect(() => {
    if (!tip) return;
    const dismiss = (e: KeyboardEvent) => {
      if (e.key === 'Enter') seen(tip.id);
    };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [tip]);
  if (!tip || hidden) return null;
  return (
    <div className="tip-card">
      <b>{tip.title}</b>
      <p>{tip.text}</p>
      <button className="hud-btn" onClick={() => seen(tip.id)}>
        {TIPS_TEXT.dismiss}
      </button>
    </div>
  );
}

function seen(id: string): void {
  setSetting('tipsSeen', [...new Set([...settings().tipsSeen, id])]);
}
