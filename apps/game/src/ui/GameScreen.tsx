import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { GAME, ambientTempC, dawnHour, duskHour, roundDisplay } from '@tapout/core';
import { ENERGY_HUD, HUNT_TRAIL_LABELS, KEEPSAKES, LOCATIONS, STAGE, WORLD, type IntroNote, type LocationId, type LocationLayout, type Station } from '@tapout/content';
import { MapOverlay } from './MapOverlay.tsx';
import { hudText, offersFor, specialOffer, type Offer } from './offers.ts';
import { session, type ActionResult, type View } from '../session.ts';
import { TableauHost } from '../scene/TableauHost.tsx';
import type { SceneInput } from '../scene/LocationScene.ts';
import { WorldHost } from '../world/WorldHost.tsx';
import type { WorldInput } from '../world/World.ts';
import type { PropState } from '../world/props.ts';
import { useSoundCues } from '../audio/cues.ts';
import { useThoughts } from '../audio/useThoughts.ts';
import { ThoughtSubtitle } from './ThoughtSubtitle.tsx';
import { playUi } from '../audio/effects.ts';
import { SettingsPanel } from './SettingsPanel.tsx';
import { Tips } from './Tips.tsx';
import { NoteBox } from './NoteBox.tsx';

const BARS = [
  ['health', 'Health'],
  ['hunger', 'Food'],
  ['thirst', 'Water'],
  ['warmth', 'Warmth'],
  ['morale', 'Morale'],
  ['stress', 'Stress'],
] as const;

const STORES = [
  ['inv-meat', 'Raw meat'],
  ['inv-arrows', 'Arrows'],
  ['inv-raw', 'Raw water'],
  ['inv-tinder', 'Tinder'],
  ['inv-wood', 'Logs'],
  ['inv-firewood', 'Firewood'],
  ['inv-moss', 'Moss'],
  ['inv-rocks', 'Rocks'],
  ['inv-clay', 'Clay'],
] as const;

/** What a station shows about your stores when you open it. */
const STATION_STORES: Record<string, ReadonlyArray<readonly [string, string]>> = {
  woodpile: [['inv-firewood', 'Firewood'], ['inv-wood', 'Logs']],
  stock: [['inv-rocks', 'Rocks'], ['inv-moss', 'Moss'], ['inv-clay', 'Clay'], ['inv-tinder', 'Tinder']],
  food: [['inv-meat', 'Raw meat']],
  water: [['inv-raw', 'Raw water']],
};

function Html({ html, className }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: inertHandlers(html) }} />;
}

/**
 * v12 writes its modal buttons with inline onclick handlers. Inline script is blocked here, so
 * the attribute is renamed before the HTML is mounted and clicks are routed through the port.
 */
function inertHandlers(html: string): string {
  return html.replace(/\sonclick="/g, ' data-handler="');
}

function onHandlerClick(event: MouseEvent) {
  const target = (event.target as HTMLElement).closest('[data-handler]');
  if (!target || (target as HTMLButtonElement).disabled) return;
  event.preventDefault();
  session.click(target.getAttribute('data-handler') ?? '');
}

// ---- rails and bars

function TopBar({ view, onJournal, onMap, onSound }: { view: View; onJournal: () => void; onMap: () => void; onSound: () => void }) {
  const { hud } = view;
  return (
    <header className="hud-top">
      <div className="logo">
        TAP <span className="slash">/</span> OUT
      </div>
      <div className="pills">
        {['pillDay', 'pillWx', 'pillTemp', 'pillRivals', 'pillWeight'].map((id) => (
          <Html key={id} className="pill" html={hudText(hud, id)} />
        ))}
      </div>
      <button className="hud-btn" onClick={onMap} title="Map (M)">
        Map
      </button>
      <button className="hud-btn" onClick={onJournal} title="Journal (J)">
        Journal
      </button>
      <button className="hud-btn" onClick={onSound} title="Sound, mouse, keys">
        Settings
      </button>
      <button className="hud-btn phone" disabled={hud.get('tapBtn')?.disabled} onClick={() => session.click('confirmTapOut()')}>
        📞 Sat phone
      </button>
    </header>
  );
}

function BodyRail({ view }: { view: View }) {
  const S = view.state;
  const { hud } = view;
  const bar = (key: string, label: string, value: number, max: number, crit: boolean) => (
    <div className="rail-bar" key={key}>
      <div className="rail-bar-head">
        <span>{label}</span>
        <b>{max === 100 ? roundDisplay(value) : `${roundDisplay(value)}/${roundDisplay(max)}`}</b>
      </div>
      <div className="bar">
        <div className={`bar-fill ${key}${crit ? ' crit' : ''}`} style={{ width: `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%` }} />
      </div>
    </div>
  );
  return (
    <aside className="rail rail-left">
      {BARS.map(([key, label]) => {
        const value = S[key] as number;
        return bar(key, label, value, 100, key === 'stress' ? value > 78 : value < 22);
      })}
      <div className="rail-chips">
        {['chip-fire', 'chip-shelter', 'chip-wet', 'chip-injury', 'chip-wolf'].map((id) =>
          hud.get(id)?.hidden ? null : <Html key={id} className="chip" html={hudText(hud, id)} />,
        )}
        <Html html={hudText(hud, 'conditionChips')} />
      </div>
    </aside>
  );
}

function StoresRail({ view }: { view: View }) {
  const { hud } = view;
  return (
    <aside className="rail rail-right">
      <h4>Stores</h4>
      {STORES.map(([id, label]) => (
        <div className="store" key={id}>
          <span>{label}</span>
          <b>{hudText(hud, id)}</b>
        </div>
      ))}
      <h4>Eat and drink</h4>
      <div className="eat">
        {(['drink', 'eatBerries', 'eatCooked', 'eatSmoked', 'eatRation'] as const).map((kind) => {
          const offer = specialOffer(kind, hud);
          return offer ? (
            <button key={kind} className="chip-btn" disabled={!offer.enabled} onClick={() => session.click(offer.handler)}>
              {offer.label}
            </button>
          ) : null;
        })}
      </div>
      <div className="rail-chips">
        <Html html={hudText(hud, 'carryChips')} />
        <Html html={hudText(hud, 'gearChips')} />
      </div>
    </aside>
  );
}

function BottomBar({ view, onJournal }: { view: View; onJournal: () => void }) {
  const log = view.state.log as Array<{ msg: string; cls: string; t: string }>;
  const latest = log.slice(0, 2);
  return (
    <footer className="hud-bottom" onClick={onJournal} title="Open the journal (J)">
      <span className="here">{LOCATIONS[view.state.loc as LocationId].label}</span>
      <span className="signs">{hudText(view.hud, 'signsLine')}</span>
      <div className="latest">
        {latest.map((line, i) => (
          <div key={`${view.version}-${i}`} className={`ln ${line.cls}`}>
            <span className="t">{line.t}</span> <Html html={line.msg} />
          </div>
        ))}
      </div>
    </footer>
  );
}

// ---- energy, in the middle of the screen: the one number every action spends

/** The energy an action would cost, read off its v12 detail line ("−6⚡ · 1h ..."). */
export function energyCost(detail: string): number {
  const m = /−(\d+)⚡/.exec(detail);
  return m ? Number(m[1]) : 0;
}

function EnergyHud({ view, cost, onBed }: { view: View; cost: number; onBed: (offer: Offer) => void }) {
  const S = view.state;
  const max = Math.max(1, S.maxEnergy as number);
  const energy = Math.max(0, S.energy as number);
  const pct = (n: number) => `${Math.max(0, Math.min(100, (n / max) * 100))}%`;
  const after = Math.max(0, energy - cost);
  const low = energy / max < 0.22;
  const rest = view.panel.find((e) => e.id === 'a-rest');
  const sleep = specialOffer('sleep', view.hud);
  const early = specialOffer('turnInEarly', view.hud);
  const bed = sleep?.enabled ? sleep : early;
  return (
    <div className={`energy-hud${low ? ' low' : ''}`}>
      <div className="energy-head">
        <span>⚡ {ENERGY_HUD.label}</span>
        <b>
          {roundDisplay(energy)} <i>/ {roundDisplay(max)}</i>
        </b>
        {cost > 0 && (
          <em>
            → {roundDisplay(after)} {ENERGY_HUD.after}
          </em>
        )}
      </div>
      <div className="energy-bar">
        <div className="energy-fill" style={{ width: pct(cost > 0 ? after : energy) }} />
        {cost > 0 && <div className="energy-spend" style={{ left: pct(after), width: pct(Math.min(cost, energy)) }} />}
      </div>
      <div className="energy-btns">
        {rest?.visible && (
          <button className="hud-btn" disabled={!rest.enabled} title={`${rest.detail} (${ENERGY_HUD.restKey})`} onClick={() => session.click(rest.onclick)}>
            🧘 {ENERGY_HUD.rest} <span className="key">{ENERGY_HUD.restKey}</span>
          </button>
        )}
        {bed && (
          <button className="hud-btn" disabled={!bed.enabled} title={bed.detail} onClick={() => onBed(bed)}>
            {bed.label}
          </button>
        )}
      </div>
      {low && <p className="energy-low">{ENERGY_HUD.low}</p>}
    </div>
  );
}

// ---- the context panel, next to the station you clicked

function ContextPanel({ station, view, onClose, onAct, onKeepsake, onCost, beside }: { station: Station; view: View; onClose: () => void; onAct: (offer: Offer) => void; onKeepsake: (note: IntroNote) => void; onCost: (cost: number) => void; beside?: boolean }) {
  const offers = offersFor(station, view);
  const stores = STATION_STORES[station.id] ?? [];
  const xs = station.id === 'you' ? [1000] : station.hotspot.map((p) => p.x);
  const right = Math.max(...xs);
  const left = Math.min(...xs);
  const width = 520;
  // In first person the thing you clicked is in the middle of the view; the panel sits beside it.
  const x = beside ? 1110 : right + 24 + width < 1700 ? right + 24 : Math.max(180, left - 24 - width);
  const y = beside
    ? Math.max(90, Math.min(STAGE.height - 120 - (110 + offers.length * 78), 200))
    : Math.max(90, Math.min(STAGE.height - 120 - (110 + offers.length * 78), (station.id === 'you' ? 700 : Math.min(...station.hotspot.map((p) => p.y))) - 20));
  return (
    <div className="context" style={{ left: x, top: y, width }} onClick={(e) => e.stopPropagation()}>
      <div className="context-head">
        <div>
          <h3>{station.label}</h3>
          <p>{station.blurb}</p>
        </div>
        <button className="close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      {stores.length > 0 && (
        <div className="context-stores">
          {stores.map(([id, label]) => (
            <span key={id}>
              {label} <b>{hudText(view.hud, id)}</b>
            </span>
          ))}
        </div>
      )}
      {station.id === 'pack' && (
        <div className="keepsakes">
          {Object.values(KEEPSAKES).map((note) => (
            <button key={note.title} className="hud-btn" onClick={() => onKeepsake(note)}>
              {note.title}
            </button>
          ))}
        </div>
      )}
      {offers.length === 0 ? (
        station.id !== 'pack' && <p className="context-empty">Nothing to do here right now.</p>
      ) : (
        offers.map((offer) => (
          <button
            key={offer.key}
            className="context-act"
            disabled={!offer.enabled}
            onClick={() => onAct(offer)}
            onMouseEnter={() => onCost(offer.enabled ? energyCost(offer.detail) : 0)}
            onMouseLeave={() => onCost(0)}
          >
            <span className="act-name">{offer.label}</span>
            {offer.detail && <span className="act-detail">{offer.detail}</span>}
          </button>
        ))
      )}
    </div>
  );
}

// ---- the result card: what the last action did

const RESULT_LABELS: Record<string, string> = {
  energy: 'Energy',
  health: 'Health',
  hunger: 'Food',
  thirst: 'Water',
  warmth: 'Warmth',
  morale: 'Morale',
  stress: 'Stress',
  water: 'Clean water',
  ...Object.fromEntries(STORES),
};

function duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
}

function ResultCard({ result }: { result: ActionResult }) {
  const tags = [...Object.entries(result.stores), ...Object.entries(result.bars)].map(([key, d]) => {
    // Stress going up is bad, everything else going up is good.
    const good = key === 'stress' ? d < 0 : d > 0;
    return (
      <span key={key} className={`tag ${good ? 'up' : 'down'}`}>
        {d > 0 ? '+' : '−'}
        {Math.abs(d)} {RESULT_LABELS[key] ?? key}
      </span>
    );
  });
  return (
    <div
      className="result-card"
      key={result.id}
      onClick={() => session.dismissResult()}
      // It fades by itself after a few seconds; hovering holds it.
      onAnimationEnd={(e) => e.animationName === 'result-out' && session.dismissResult()}
      title="Click to put this away"
    >
      {result.minutes > 0 && <span className="result-time">{duration(result.minutes)}</span>}
      {result.lines.slice(-3).map((line, i) => (
        <div key={i} className={`ln ${line.cls}`}>
          <Html html={line.msg} />
        </div>
      ))}
      {tags.length > 0 && <div className="tags">{tags}</div>}
    </div>
  );
}

// ---- the night: what you are going to bed with

/** Facts about the night ahead, straight from the HUD. No advice: you decide whether to sleep. */
function NightPreview({ view, offer, onSleep, onCancel }: { view: View; offer: Offer; onSleep: () => void; onCancel: () => void }) {
  const { hud } = view;
  const facts = ['pillWx', 'pillTemp', 'chip-fire', 'chip-shelter', 'chip-wet', 'chip-injury'].filter((id) => !hud.get(id)?.hidden && hudText(hud, id));
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="night-preview" onClick={(e) => e.stopPropagation()}>
        <h3>{offer.label}</h3>
        {offer.detail && <p>{offer.detail}</p>}
        <div className="night-facts">
          {facts.map((id) => (
            <Html key={id} className="chip" html={hudText(hud, id)} />
          ))}
        </div>
        <div className="night-buttons">
          <button className="big-btn primary" onClick={onSleep}>
            Sleep
          </button>
          <button className="big-btn" onClick={onCancel}>
            Not yet
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- journal, modal, end screen

const PAGE = 12;

function Journal({ view, onClose }: { view: View; onClose: () => void }) {
  const log = view.state.log as Array<{ msg: string; cls: string; t: string }>;
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(log.length / PAGE));
  const lines = log.slice(page * PAGE, page * PAGE + PAGE);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="journal-book" onClick={(e) => e.stopPropagation()}>
        <div className="context-head">
          <h3>Journal</h3>
          <button className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="journal-page">
          {lines.map((line, i) => (
            <div key={`${view.version}-${page}-${i}`} className={`ln ${line.cls}`}>
              <span className="t">{line.t}</span>
              <Html html={line.msg} />
            </div>
          ))}
        </div>
        <div className="journal-nav">
          <button className="hud-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>
            ← Newer
          </button>
          <span>
            Page {page + 1} of {pages}
          </span>
          <button className="hud-btn" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>
            Older →
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ view }: { view: View }) {
  const ref = useRef<HTMLDivElement>(null);
  // v12 often writes into a modal after showing it (typewriter lines, check results).
  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;
    for (const [id, el] of view.elements) {
      const node = box.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
      if (!node) continue;
      if (el.innerHTML !== undefined) node.innerHTML = inertHandlers(el.innerHTML);
      else if (el.textContent !== undefined) node.textContent = el.textContent;
    }
  });
  if (!view.modal) return null;
  return (
    <div className="overlay">
      <div className="modal" ref={ref} onClick={onHandlerClick} dangerouslySetInnerHTML={{ __html: inertHandlers(view.modal) }} />
    </div>
  );
}

function EndScreen({ view }: { view: View }) {
  const el = (id: string) => view.elements.get(id);
  return (
    <div className="end-screen">
      <h1 className={el('endTitle')?.classes.has('gold') ? 'gold' : ''}>{el('endTitle')?.textContent}</h1>
      <p className="end-day">Day {el('endDay')?.textContent}</p>
      <p className="end-cause">{el('endCause')?.textContent}</p>
      <div className="end-body">
        <div className="end-epilogue" dangerouslySetInnerHTML={{ __html: inertHandlers(el('endEpilogue')?.innerHTML ?? '') }} />
        <div className="end-stats" dangerouslySetInnerHTML={{ __html: inertHandlers(el('endStats')?.innerHTML ?? '') }} />
      </div>
      <button className="big-btn primary" onClick={() => session.leaveRun()}>
        Back to the title
      </button>
    </div>
  );
}

// ---- the screen

/** Stations whose name follows the run: the animal you spotted, the trail you are on. */
function liveLayout(layout: LocationLayout, S: View['state']): LocationLayout {
  const hunt = S.hunt as { state: string; species?: string; wounded?: boolean } | undefined;
  if (!hunt || hunt.state === 'none') return layout;
  const animal = hunt.species ? (GAME[hunt.species]?.label as string | undefined) : undefined;
  const trail = HUNT_TRAIL_LABELS[hunt.state === 'trailing' && hunt.wounded ? 'trailingWounded' : hunt.state];
  return {
    ...layout,
    stations: layout.stations.map((st) => {
      if (st.id === 'animal' && animal) return { ...st, label: animal[0]!.toUpperCase() + animal.slice(1) };
      if (st.id === 'tracks' && trail) return { ...st, label: trail };
      return st;
    }),
  };
}

/** What the signposts at each exit say. */
/** Scenery: northern lights on some clear nights from day 8, and on the night of v12's aurora awe. */
function auroraTonight(S: { day: number; weather: string; aweSeen?: string[]; aweLastDay?: number }): boolean {
  if (S.aweSeen?.includes('aurora') && S.aweLastDay === S.day) return true;
  if (S.day < 8 || (S.weather !== 'clear' && S.weather !== 'cold')) return false;
  return (Math.imul(S.day, 2654435761) >>> 0) % 4 === 0;
}

const EXIT_SIGNS: Record<string, string> = { toShore: 'SHORE', toWoods: 'WOODS', toCamp: 'CAMP', trailhead: 'TRAPLINE' };

function darkness(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  const dusk = duskHour();
  const dawn = dawnHour();
  if (h >= dawn + 1 && h <= dusk - 1) return 0;
  if (h > dusk - 1 && h < dusk + 1) return (h - (dusk - 1)) / 2;
  if (h > dawn - 1 && h < dawn + 1) return 1 - (h - (dawn - 1)) / 2;
  return 1;
}

export function GameScreen({ view, guide }: { view: View; guide?: boolean }) {
  const S = view.state;
  const loc = S.loc as LocationId;
  // v12 mutates its state in place; the view version marks a change.
  const layout = useMemo(() => liveLayout(LOCATIONS[loc], S), [loc, S, view.version]);
  const [selected, setSelected] = useState<string | null>(null);
  const [standAt, setStandAt] = useState<Record<string, string>>({});
  const [labels, setLabels] = useState(false);
  const [debug, setDebug] = useState(!!guide);
  const [journal, setJournal] = useState(false);
  const [map, setMap] = useState(false);
  const [night, setNight] = useState<Offer | null>(null);
  const [keepsake, setKeepsake] = useState<IntroNote | null>(null);
  const [sound, setSound] = useState(false);
  const [cost, setCost] = useState(0);
  // A new day starts behind a curtain: the night passes, then the dawn report.
  const [curtain, setCurtain] = useState<number | null>(null);
  const lastDay = useRef<number>(S.day);
  useEffect(() => {
    if (S.day > lastDay.current) setCurtain(S.day);
    lastDay.current = S.day;
  }, [S.day]);

  // Quiet interface sounds: a panel opening or closing, a card arriving, the journal.
  const wasOpen = useRef(false);
  useEffect(() => {
    const open = selected !== null;
    if (open !== wasOpen.current) playUi(open ? 'open' : 'close');
    wasOpen.current = open;
  }, [selected]);
  useEffect(() => {
    if (view.modal) playUi('card');
  }, [view.modal]);
  useEffect(() => {
    if (journal || map) playUi('page');
  }, [journal, map]);

  // A new location starts with nothing open.
  useEffect(() => setSelected(null), [loc]);
  useEffect(() => setCost(0), [selected, view.version]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Typing a note is not a shortcut.
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'Alt') {
        e.preventDefault();
        setLabels(true);
      } else if (e.key === 'Escape') {
        setSelected(null);
        setKeepsake(null);
        setSound(false);
        setJournal(false);
        setMap(false);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setSelected((current) => (current === 'you' ? null : 'you'));
      } else if (e.key === 'r' || e.key === 'R') {
        const rest = session.getView()?.panel.find((p) => p.id === 'a-rest');
        if (rest?.visible && rest.enabled && !session.getView()?.modal) session.click(rest.onclick);
      } else if (e.key === 'j' || e.key === 'J') setJournal((open) => !open);
      else if (e.key === 'm' || e.key === 'M') setMap((open) => !open);
      else if (e.key === 'F3') {
        e.preventDefault();
        setDebug((on) => !on);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setLabels(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const { hidden, idle } = useMemo(() => {
    const hiddenIds = new Set<string>();
    const idleIds = new Set<string>();
    for (const station of layout.stations) {
      const offers = offersFor(station, view);
      // Conditional stations exist only while v12 offers something there.
      if (station.when && offers.length === 0 && !guide) hiddenIds.add(station.id);
      if (!offers.some((o) => o.enabled)) idleIds.add(station.id);
    }
    return { hidden: hiddenIds, idle: idleIds };
  }, [layout, view, guide]);

  const input: SceneInput = useMemo(
    () => ({ layout, hidden, idle, standAt: standAt[loc] ?? 'you', selected, dark: guide ? 0 : darkness(S.hour) * 0.85, labels: labels || !!guide, debug }),
    [layout, hidden, idle, standAt, loc, selected, S.hour, labels, guide, debug],
  );
  const select = useCallback((id: string) => {
    session.dismissResult();
    setSelected((current) => (current === id ? null : id));
  }, []);
  const events = useMemo(() => ({ select }), [select]);
  const worldEvents = useMemo(() => ({ select: (id: string) => setSelected(id), clear: () => setSelected(null) }), []);

  const props: PropState = useMemo(() => {
    const hunt = S.hunt as { state: string; species?: string } | undefined;
    return {
      structure: S.structure,
      dugout: !!S.dugout,
      insulation: S.insulation,
      bed: !!S.bed,
      firepitTier: S.firepitTier,
      fireLit: S.fireH > 0,
      rackTier: S.rackTier,
      hugeRack: !!S.hugeRack,
      cacheTier: S.cacheTier,
      chair: !!S.chair,
      table: !!S.table,
      day: S.day,
      winter: !!S.winter,
      species: hunt && hunt.state !== 'none' ? (hunt.species ?? '') : '',
      logs: Math.floor(S.stock?.wood ?? 0),
      firewood: Math.floor(S.stock?.firewood ?? 0),
      meat: Math.ceil((S.meatQ ?? []).reduce((a: number, e: { n: number }) => a + e.n, 0)),
      berries: Math.ceil((S.berryQ ?? []).reduce((a: number, e: { n: number }) => a + e.n, 0)),
      rocks: Math.floor(S.stock?.rocks ?? 0),
      moss: S.stock?.moss ?? 0,
      clay: Math.floor(S.stock?.clay ?? 0),
      tinder: S.tinder ?? 0,
      smoked: Math.floor(S.smoked ?? 0),
      lines: (S.lineList ?? []).map((l: { spotId: string }) => l.spotId),
      snares: (S.snareList ?? []).length,
      netBuilt: !!S.net?.built,
      netSpot: S.net?.spot ?? '',
      smoking: (S.smokingSession?.n ?? 0) + (S.hugeSmokingSession?.n ?? 0),
      exitLabels: EXIT_SIGNS,
    };
    // v12 mutates its state in place; the view version marks a change.
  }, [S, view.version]);
  const frozen = !!(view.modal || journal || map || night || keepsake || sound || curtain !== null);
  useSoundCues(view, curtain !== null);
  useThoughts(view, !frozen && !view.endScreen && !guide);
  const worldInput: WorldInput = useMemo(
    () => ({
      area: WORLD[loc],
      layout,
      hidden,
      selected,
      hour: S.hour,
      dawn: dawnHour(),
      dusk: duskHour(),
      weather: S.weather,
      winter: !!S.winter,
      tempC: ambientTempC(),
      props,
      frozen,
      birdsSilent: !!S.birdsSilent,
      aurora: auroraTonight(S),
    }),
    [loc, layout, hidden, selected, S.hour, S.weather, S.winter, S.day, props, frozen, S.birdsSilent],
  );

  if (view.endScreen && !view.modal) return <EndScreen view={view} />;
  const station = selected ? layout.stations.find((s) => s.id === selected) : null;

  const act = (offer: Offer) => {
    if ((offer.key === 'sleep' || offer.key === 'turnInEarly') && offer.enabled) {
      setSelected(null);
      setNight(offer);
      return;
    }
    if (offer.ui === 'map') {
      setSelected(null);
      setMap(true);
      return;
    }
    if (station && !station.exitTo && station.id !== 'you') setStandAt((at) => ({ ...at, [loc]: station.id }));
    // Back to looking around once you have done something.
    setSelected(null);
    session.click(offer.handler);
  };

  return (
    <div className="game2">
      {guide ? <TableauHost input={input} events={events} /> : <WorldHost input={worldInput} events={worldEvents} />}
      {!guide && (
        <>
          <div className="travel-fade" key={loc}>
            {layout.label}
          </div>
          <TopBar view={view} onJournal={() => setJournal(true)} onMap={() => setMap(true)} onSound={() => setSound(true)} />
          <BodyRail view={view} />
          {!frozen && <EnergyHud view={view} cost={station ? cost : 0} onBed={setNight} />}
          <StoresRail view={view} />
          <BottomBar view={view} onJournal={() => setJournal(true)} />
          <button className="you-btn" onClick={() => setSelected(selected === 'you' ? null : 'you')} title="Things only you need (Tab)">
            You
          </button>
          {station && <ContextPanel station={station} view={view} onClose={() => setSelected(null)} onAct={act} onKeepsake={(note) => {
            setSelected(null);
            setKeepsake(note);
          }} onCost={setCost} beside />}
          {keepsake && (
            <div className="overlay" onClick={() => setKeepsake(null)}>
              <div className="intro-note">
                <h3>{keepsake.title}</h3>
                <p>{keepsake.text}</p>
                <span className="intro-hint">Click to put it away</span>
              </div>
            </div>
          )}
          {view.result && !view.modal && <ResultCard result={view.result} />}
          {night && (
            <NightPreview
              view={view}
              offer={night}
              onCancel={() => setNight(null)}
              onSleep={() => {
                setNight(null);
                session.click(night.handler);
              }}
            />
          )}
          {curtain !== null && (
            <div className="night-curtain" key={curtain} onAnimationEnd={() => setCurtain(null)} />
          )}
          <Tips view={view} hidden={frozen || !!station} />
          <ThoughtSubtitle />
          <NoteBox />
          {sound && <SettingsPanel onClose={() => setSound(false)} />}
          {map && <MapOverlay view={view} onClose={() => setMap(false)} />}
          {journal && <Journal view={view} onClose={() => setJournal(false)} />}
          <Modal view={view} />
        </>
      )}
    </div>
  );
}
