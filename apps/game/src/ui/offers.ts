// What each station offers right now, read from v12's own action panel and HUD record.
// Presentation only: availability, labels and costs all come from the core.

import { rationsLeft, type HudElement, type PanelEntry } from '@tapout/core';
import { LOCATIONS, type SpecialAction, type Station } from '@tapout/content';
import type { View } from '../session.ts';

export function hudText(hud: ReadonlyMap<string, HudElement>, id: string): string {
  const el = hud.get(id);
  return el ? el.html || el.text : '';
}

// ---- what a station offers right now

export interface Offer {
  key: string;
  label: string;
  detail: string;
  enabled: boolean;
  handler: string;
}

export function specialOffer(kind: SpecialAction, hud: ReadonlyMap<string, HudElement>): Offer | null {
  // v12's chips read "🍲 3 · eat"; out of context a name says more.
  const chip = (id: string, handler: string, name: string): Offer => ({
    key: kind,
    label: `${name} (${(hudText(hud, id).replace(/<[^>]+>/g, '').match(/\d+/) ?? ['0'])[0]})`,
    detail: '',
    enabled: !hud.get(id)?.disabled,
    handler,
  });
  switch (kind) {
    case 'sleep':
      return { key: kind, label: '🌙 Sleep · 6 hours', detail: hudText(hud, 'sleep-sub'), enabled: !hud.get('sleepBtn')?.disabled, handler: 'actSleep()' };
    case 'turnInEarly':
      return hud.get('earlyBtn')?.hidden
        ? null
        : { key: kind, label: hudText(hud, 'early-label'), detail: hudText(hud, 'early-sub'), enabled: true, handler: 'actTurnInEarly()' };
    case 'drink':
      return chip('drinkBtn', 'actDrink()', '💧 Drink clean water');
    case 'eatBerries':
      return chip('eatBerriesBtn', 'eatBerries()', '🫐 Eat berries');
    case 'eatCooked':
      return chip('eatCookedBtn', 'eatCooked()', '🍲 Eat a cooked meal');
    case 'eatSmoked':
      return chip('eatSmokedBtn', 'eatSmoked()', '🥩 Eat smoked meat');
    case 'eatRation': {
      const left = rationsLeft();
      return left > 0 ? { key: kind, label: `🥫 Eat a ration (${left} left)`, detail: '+20 hunger', enabled: true, handler: 'eatRation()' } : null;
    }
  }
}

export function offersFor(station: Station, view: View): Offer[] {
  const { hud } = view;
  if (station.exitTo) {
    const to = station.exitTo;
    return [{ key: `go-${to}`, label: `Walk to ${LOCATIONS[to].label}`, detail: hudText(hud, `tt-${to}`), enabled: !hud.get(`tab-${to}`)?.disabled, handler: `goTo('${to}')` }];
  }
  const panel = new Map(view.panel.map((e) => [e.id, e]));
  const offers: Offer[] = [];
  for (const id of station.actions) {
    const entry: PanelEntry | undefined = panel.get(id);
    if (!entry || !entry.visible) continue;
    offers.push({ key: id, label: entry.label, detail: entry.detail, enabled: entry.enabled, handler: entry.onclick });
  }
  for (const kind of station.special ?? []) {
    const offer = specialOffer(kind, hud);
    if (offer) offers.push(offer);
  }
  return offers;
}

