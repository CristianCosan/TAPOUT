import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { dawnHour, duskHour, roundDisplay } from '@tapout/core';
import { LOCATIONS, STAGE, type LocationId, type Station } from '@tapout/content';
import { hudText, offersFor, specialOffer, type Offer } from './offers.ts';
import { session, type ActionResult, type View } from '../session.ts';
import { TableauHost } from '../scene/TableauHost.tsx';
import type { SceneInput } from '../scene/LocationScene.ts';

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

function TopBar({ view, onJournal }: { view: View; onJournal: () => void }) {
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
      <button className="hud-btn" onClick={onJournal} title="Journal (J)">
        Journal
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
        <b>{max === 100 ? roundDisplay(value) : `${roundDisplay(value)}/${max}`}</b>
      </div>
      <div className="bar">
        <div className={`bar-fill ${key}${crit ? ' crit' : ''}`} style={{ width: `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%` }} />
      </div>
    </div>
  );
  return (
    <aside className="rail rail-left">
      {bar('energy', 'Energy', S.energy, S.maxEnergy, S.energy / S.maxEnergy < 0.22)}
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

// ---- the context panel, next to the station you clicked

function ContextPanel({ station, view, onClose, onAct }: { station: Station; view: View; onClose: () => void; onAct: (offer: Offer) => void }) {
  const offers = offersFor(station, view);
  const stores = STATION_STORES[station.id] ?? [];
  const xs = station.id === 'you' ? [1000] : station.hotspot.map((p) => p.x);
  const right = Math.max(...xs);
  const left = Math.min(...xs);
  const width = 520;
  const x = right + 24 + width < 1700 ? right + 24 : Math.max(180, left - 24 - width);
  const y = Math.max(90, Math.min(STAGE.height - 120 - (110 + offers.length * 78), (station.id === 'you' ? 700 : Math.min(...station.hotspot.map((p) => p.y))) - 20));
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
      {offers.length === 0 ? (
        <p className="context-empty">Nothing to do here right now.</p>
      ) : (
        offers.map((offer) => (
          <button key={offer.key} className="context-act" disabled={!offer.enabled} onClick={() => onAct(offer)}>
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
    <div className="result-card" key={result.id} onClick={() => session.dismissResult()} title="Click to put this away">
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
  const layout = LOCATIONS[loc];
  const [selected, setSelected] = useState<string | null>(null);
  const [standAt, setStandAt] = useState<Record<string, string>>({});
  const [labels, setLabels] = useState(false);
  const [debug, setDebug] = useState(!!guide);
  const [journal, setJournal] = useState(false);

  // A new location starts with nothing open.
  useEffect(() => setSelected(null), [loc]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        setLabels(true);
      } else if (e.key === 'Escape') {
        setSelected(null);
        setJournal(false);
      } else if (e.key === 'j' || e.key === 'J') setJournal((open) => !open);
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

  if (view.endScreen && !view.modal) return <EndScreen view={view} />;
  const station = selected ? layout.stations.find((s) => s.id === selected) : null;

  const act = (offer: Offer) => {
    if (station && !station.exitTo && station.id !== 'you') setStandAt((at) => ({ ...at, [loc]: station.id }));
    if (station?.exitTo) setSelected(null);
    session.click(offer.handler);
  };

  return (
    <div className="game2">
      <TableauHost input={input} events={events} />
      {!guide && (
        <>
          <TopBar view={view} onJournal={() => setJournal(true)} />
          <BodyRail view={view} />
          <StoresRail view={view} />
          <BottomBar view={view} onJournal={() => setJournal(true)} />
          {station && <ContextPanel station={station} view={view} onClose={() => setSelected(null)} onAct={act} />}
          {view.result && !view.modal && <ResultCard result={view.result} />}
          {journal && <Journal view={view} onClose={() => setJournal(false)} />}
          <Modal view={view} />
        </>
      )}
    </div>
  );
}
