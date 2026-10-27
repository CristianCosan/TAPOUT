import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { CAMP_HARVEST, GAME, ambientTempC, campLeft, dawnHour, duskHour, roundDisplay, upgradePath, type UpgradeId } from '@tapout/core';
import { BUILD_MENU, BUILD_STATIONS, FALL_SCENE, BUILD_TASKS, BUILD_TASK_TEXT, ENERGY_HUD, HUNT_TEXT, HUNT_VOICE, INVENTORY_TEXT, HUNT_TRAIL_LABELS, KEEPSAKES, UPGRADE_TEXT, type ResourceId, LOCATIONS, STAGE, WORLD, type IntroNote, type LocationId, type LocationLayout, type Station } from '@tapout/content';
import { MapOverlay } from './MapOverlay.tsx';
import { hudText, offersFor, specialOffer, type Offer } from './offers.ts';
import { session, type ActionResult, type View } from '../session.ts';
import { TableauHost } from '../scene/TableauHost.tsx';
import type { SceneInput } from '../scene/LocationScene.ts';
import { WorldHost } from '../world/WorldHost.tsx';
import { WinScene } from '../intro/WinScene.tsx';
import type { WorldInput } from '../world/World.ts';
import type { PropState } from '../world/props.ts';
import { useSoundCues } from '../audio/cues.ts';
import { useThoughts } from '../audio/useThoughts.ts';
import { ThoughtSubtitle } from './ThoughtSubtitle.tsx';
import { playFall, playUi } from '../audio/effects.ts';
import { speakPieces } from '../audio/thoughts.ts';
import { SettingsPanel } from './SettingsPanel.tsx';
import { Tips } from './Tips.tsx';
import { NoteBox } from './NoteBox.tsx';
import { Glyph, ResIcon, Tooltip, Txt, WithIcons, resourceTip } from './icons.tsx';
import { glyphHtml, noEmoji, type GlyphId } from './glyphs.ts';
import { BUILD_PICS } from './buildPics.ts';
import { Inventory, ownedTools } from './Inventory.tsx';
import type { Held } from '../world/hands.ts';

const BARS = [
  ['health', 'Health'],
  ['hunger', 'Food'],
  ['thirst', 'Water'],
  ['warmth', 'Warmth'],
  ['morale', 'Morale'],
  ['stress', 'Stress'],
] as const;

const STORES = [
  ['inv-wood', 'wood'],
  ['inv-firewood', 'firewood'],
  ['inv-rocks', 'rocks'],
  ['inv-moss', 'moss'],
  ['inv-clay', 'clay'],
  ['inv-tinder', 'tinder'],
  ['inv-meat', 'meat'],
  ['inv-arrows', 'arrows'],
  ['inv-raw', 'raw'],
] as const satisfies ReadonlyArray<readonly [string, ResourceId]>;

/** What a station shows about your stores when you open it. */
const STATION_STORES: Record<string, ReadonlyArray<readonly [string, ResourceId]>> = {
  woodpile: [['inv-firewood', 'firewood'], ['inv-wood', 'wood']],
  stock: [['inv-rocks', 'rocks'], ['inv-moss', 'moss'], ['inv-clay', 'clay'], ['inv-tinder', 'tinder']],
  food: [['inv-meat', 'meat']],
  water: [['inv-raw', 'raw']],
};

const STOCK_OF: Record<string, string> = { wood: 'inv-wood', moss: 'inv-moss', clay: 'inv-clay', rocks: 'inv-rocks' };

function Html({ html, className }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: inertHandlers(html) }} />;
}

/**
 * v12 writes its modal buttons with inline onclick handlers. Inline script is blocked here, so
 * the attribute is renamed before the HTML is mounted and clicks are routed through the port.
 */
function inertHandlers(html: string): string {
  // rc.3: and every emoji becomes one of the game's own icons.
  return glyphHtml(html.replace(/\sonclick="/g, ' data-handler="'));
}

function onHandlerClick(event: MouseEvent) {
  const target = (event.target as HTMLElement).closest('[data-handler]');
  if (!target || (target as HTMLButtonElement).disabled) return;
  event.preventDefault();
  session.click(target.getAttribute('data-handler') ?? '');
}

// ---- rails and bars

function TopBar({ view, onBuild, onJournal, onMap, onSound }: { view: View; onBuild: () => void; onJournal: () => void; onMap: () => void; onSound: () => void }) {
  const { hud } = view;
  return (
    <header className="hud-top">
      <div className="logo">
        TAP <span className="slash">/</span> OUT
      </div>
      <div className="pills">
        {['pillDay', 'pillWx', 'pillTemp', 'pillWeight'].map((id) => (
          <Html key={id} className="pill" html={hudText(hud, id)} />
        ))}
      </div>
      <button className="hud-btn" onClick={onBuild} title={`${BUILD_MENU.title} (${BUILD_MENU.key})`}>
        <Glyph id="build" /> {BUILD_MENU.title}
      </button>
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
        <Glyph id="phone" /> Sat phone
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
      <div className="store-grid">
        {STORES.map(([id, res]) => (
          <div className="store-tile" key={id} data-tip={resourceTip(res)}>
            <ResIcon id={res} size={30} />
            <b>{hudText(hud, id)}</b>
          </div>
        ))}
      </div>
      <h4>Eat and drink</h4>
      <div className="eat">
        {(['drink', 'eatBerries', 'eatCooked', 'eatSmoked', 'eatRation'] as const).map((kind) => {
          const offer = specialOffer(kind, hud);
          return offer ? (
            <button key={kind} className="chip-btn" disabled={!offer.enabled} onClick={() => session.click(offer.handler)}>
              <Txt text={offer.label} />
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
        <span>
          <Glyph id="energy" /> {ENERGY_HUD.label}
        </span>
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
          <button className="hud-btn" disabled={!rest.enabled} title={`${noEmoji(rest.detail)} (${ENERGY_HUD.restKey})`} onClick={() => session.click(rest.onclick)}>
            <Glyph id="rest" /> {ENERGY_HUD.rest} <span className="key">{ENERGY_HUD.restKey}</span>
          </button>
        )}
        {bed && (
          <button className="hud-btn" disabled={!bed.enabled} title={noEmoji(bed.detail)} onClick={() => onBed(bed)}>
            <Txt text={bed.label} />
          </button>
        )}
      </div>
      {low && <p className="energy-low">{ENERGY_HUD.low}</p>}
    </div>
  );
}

// ---- the context panel, next to the station you clicked

function ContextPanel({ station, view, onClose, onAct, onBuild, onKeepsake, onCost, beside }: { station: Station; view: View; onClose: () => void; onAct: (offer: Offer) => void; onBuild: (b: BuildStart) => void; onKeepsake: (note: IntroNote) => void; onCost: (cost: number) => void; beside?: boolean }) {
  const all = offersFor(station, view);
  const building = BUILD_STATIONS[station.id];
  const builds = new Set(building ? [...building.paths.map((p) => p.action), ...building.extras] : []);
  const uses = all.filter((o) => !builds.has(o.key));
  const offers = uses;
  const stores = STATION_STORES[station.id] ?? [];
  const xs = station.id === 'you' ? [1000] : station.hotspot.map((p) => p.x);
  const right = Math.max(...xs);
  const left = Math.min(...xs);
  const width = 520;
  // In first person the thing you clicked is in the middle of the view; the panel sits beside it.
  const x = beside ? 1110 : right + 24 + width < 1700 ? right + 24 : Math.max(180, left - 24 - width);
  const y = building
    ? 90
    : beside
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
          {stores.map(([id, res]) => (
            <span key={id}>
              <ResIcon id={res} /> <b>{hudText(view.hud, id)}</b>
            </span>
          ))}
        </div>
      )}
      {BUILD_STATIONS[station.id] && <BuildPanel station={station.id} view={view} onBuild={onBuild} onCost={onCost} />}
      {BUILD_STATIONS[station.id] && uses.length > 0 && (
        <h4 className="use-head">
          <Glyph id="look" /> {UPGRADE_TEXT.use}
        </h4>
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
            <span className="act-name">
              <Txt text={offer.label} />
            </span>
            {offer.detail && (
              <span className="act-detail">
                <WithIcons text={offer.detail} />
              </span>
            )}
          </button>
        ))
      )}
    </div>
  );
}

/**
 * What can be built here (rc.4, Sir's layout). The main build sits on top in its own frame: what
 * it is now, as a picture with what it does for you, then its steps and the next one. At the
 * shelter you first pick the shelter or the dugout, and the other goes away. Everything else built
 * here goes below. Facts only, no advice.
 */
function BuildPanel({ station, view, onBuild, onCost }: { station: string; view: View; onBuild: (b: BuildStart) => void; onCost: (cost: number) => void }) {
  const spec = BUILD_STATIONS[station];
  if (!spec) return null;
  const panel = new Map(view.panel.map((e) => [e.id, e]));
  const extras = spec.extras.map((id) => panel.get(id)).filter((e): e is NonNullable<typeof e> => !!e && e.visible);
  const locked = spec.extras.filter((id) => !panel.get(id)?.visible && UPGRADE_TEXT.locked[id]);
  if (spec.paths.length === 0 && extras.length === 0) return null;
  const routes = spec.paths.map((p) => ({ ...p, path: upgradePath(p.id) })).filter((r) => !r.path.closed);
  const have = (m: string) => Number(hudText(view.hud, STOCK_OF[m]!)) || 0;
  const hover = (entry?: { enabled: boolean; detail: string }) => ({
    onMouseEnter: () => onCost(entry?.enabled ? energyCost(entry.detail) : 0),
    onMouseLeave: () => onCost(0),
  });
  const needs = (n: Partial<Record<string, number>>, showHave: boolean) =>
    Object.entries(n).map(([m, k]) => (
      <span key={m} className={`build-need${showHave && have(m) < (k ?? 0) ? ' short' : ''}`}>
        <ResIcon id={m as ResourceId} size={17} />
        {showHave ? `${have(m)}/${k}` : k}
      </span>
    ));
  // A build with nothing finished yet but its first steps done shows what is going up, faded.
  const state = (id: UpgradeId, tier: number, underWay = false) => (
    <div className="bstate">
      <div className={`bpic${underWay ? ' under-way' : ''}`} dangerouslySetInnerHTML={{ __html: BUILD_PICS[id]![underWay ? tier + 1 : tier] ?? '' }} />
      <b>{underWay ? UPGRADE_TEXT.underWay(UPGRADE_TEXT.names[id][tier + 1]!) : UPGRADE_TEXT.names[id][tier]}</b>
      <p>{UPGRADE_TEXT.about[id][tier]}</p>
    </div>
  );
  // The shelter spot before either way is started: the tarp, and the choice.
  const choosing = routes.length > 1 && routes.every((r) => r.path.done === 0);

  let main: ReactNode = null;
  if (choosing) {
    main = (
      <div className="main-build">
        <div className="mb-label">{UPGRADE_TEXT.mainChoose}</div>
        {state('shelter', 0)}
        <div className="route-choice">
          {routes.map(({ id, action, path }) => {
            const entry = panel.get(action);
            const first = path.steps[0]!;
            const open = !!entry?.visible;
            return (
              <button key={id} className="route-card" disabled={!open || !entry?.enabled} onClick={() => entry && onBuild({ key: `${id}.1`, name: UPGRADE_TEXT.steps[id][0]!, entry, hours: first.hours })} {...hover(entry)}>
                <span className="bpic small" dangerouslySetInnerHTML={{ __html: BUILD_PICS[id]![id === 'dugout' ? 3 : 1] ?? '' }} />
                <b>{UPGRADE_TEXT.routes[id].title}</b>
                <small>{UPGRADE_TEXT.routes[id].hint}</small>
                {open ? (
                  <span className="route-start">
                    {Object.keys(first.needs).length ? needs(first.needs, true) : null}
                    <em>{entry?.enabled ? UPGRADE_TEXT.start[id as 'shelter' | 'dugout'] : noEmoji(entry?.detail ?? '')}</em>
                  </span>
                ) : (
                  <span className="route-start">
                    <Glyph id="shovel" size={16} /> <em>{UPGRADE_TEXT.needsShovel}</em>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mb-note">{UPGRADE_TEXT.chooseNote}</p>
      </div>
    );
  } else if (routes[0]) {
    const { id, action, path } = routes[0];
    const entry = panel.get(action);
    const next = path.steps.find((st) => st.state === 'next');
    const tiers = UPGRADE_TEXT.names[id];
    const stepNames = UPGRADE_TEXT.steps[id];
    const milestones = tiers.slice(1).map((name, i) => ({ name, n: path.steps.filter((st) => st.tier === i + 1).length, have: path.current >= i + 1 }));
    const lastOfTier = next ? path.steps.filter((st) => st.tier === next.tier).pop()! : null;
    main = (
      <div className="main-build">
        <div className="mb-label">{UPGRADE_TEXT.mainNow(UPGRADE_TEXT.noun[id])}</div>
        {state(id, path.current, path.current === 0 && path.done > 0 && id !== 'shelter' && id !== 'dugout')}
        <div className="bstrip">
          {path.steps.map((st) => (
            <i key={st.step} className={`${st.state}${st.within === st.of ? ' mile' : ''}`} title={stepNames[st.step - 1]}>
              {st.step}
            </i>
          ))}
        </div>
        <div className="bmiles">
          {milestones.map((m) => (
            <span key={m.name} style={{ flex: m.n }} className={m.have ? 'have' : ''}>
              {m.name}
            </span>
          ))}
        </div>
        {next ? (
          <div className="bnext">
            <big>{UPGRADE_TEXT.stepOf(next.step, path.steps.length, stepNames[next.step - 1] ?? '')}</big>
            <div className="stage-cost">
              {needs(next.needs, true)}
              <span>
                <Glyph id="energy" size={16} /> {next.energy}
              </span>
              <span>
                <Glyph id="time" size={16} /> {duration(Math.round(next.hours * 60))}
              </span>
            </div>
            {entry?.visible && (
              <button className="build-btn" disabled={!entry.enabled} onClick={() => onBuild({ key: `${id}.${next.step}`, name: stepNames[next.step - 1] ?? '', entry, hours: next.hours })} {...hover(entry)}>
                <Glyph id="build" /> <span>{jobsDone()[`${id}.${next.step}`] ? UPGRADE_TEXT.resume(stepNames[next.step - 1] ?? '') : UPGRADE_TEXT.go(stepNames[next.step - 1] ?? '')}</span>
                {!entry.enabled && entry.detail && !path.settling && <em>{noEmoji(entry.detail)}</em>}
              </button>
            )}
            {path.settling ? <p className="mb-note">{UPGRADE_TEXT.settling}</p> : lastOfTier && <p className="mb-note">{UPGRADE_TEXT.becomes(lastOfTier.step, tiers[next.tier]!)}</p>}
          </div>
        ) : (
          <p className="mb-note">{UPGRADE_TEXT.done}</p>
        )}
      </div>
    );
  }
  return (
    <section className="build-panel">
      {main}
      {(extras.length > 0 || locked.length > 0) && (
        <div className="build-extras">
          {main && <div className="mb-label quiet">{UPGRADE_TEXT.also}</div>}
          {extras.map((entry) => (
            <div key={entry.id} className={`bsub${entry.enabled ? '' : ' off'}`}>
              <span className="bsub-name">
                <Txt text={entry.label} />
              </span>
              {entry.enabled && (
                <button className="bsub-go" onClick={() => onBuild({ key: entry.id === 'a-insulate' ? `a-insulate.${(view.state.insulation ?? 0) + 1}` : entry.id, name: noEmoji(entry.label), entry })} {...hover(entry)}>
                  <Glyph id="build" size={15} /> {UPGRADE_TEXT.build}
                </button>
              )}
              {entry.detail && (
                <small>
                  <WithIcons text={entry.detail} />
                </small>
              )}
            </div>
          ))}
          {locked.map((id) => (
            <div key={id} className="bsub off">
              <span className="bsub-name">{UPGRADE_TEXT.locked[id]!.name}</span>
              <small>{UPGRADE_TEXT.locked[id]!.why}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** A build step about to start (rc.4): which jobs to show, and the v12 button that does it. */
interface BuildStart {
  key: string;
  name: string;
  entry: { id: string; label: string; detail: string; enabled: boolean; onclick: string };
  hours?: number;
}

/** Jobs done on build steps you stopped partway through (per player, this computer). */
function jobsDone(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem('tapout.buildJobs') ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}
function saveJobs(jobs: Record<string, number>): void {
  try {
    localStorage.setItem('tapout.buildJobs', JSON.stringify(jobs));
  } catch {
    // Without storage a stopped step simply starts over.
  }
}

/**
 * rc.4: the small jobs of one build step, one click each with a hands motion. Dan says one of his
 * lines for the step partway through. Nothing is spent until the last job runs the v12 action.
 */
function BuildTaskCard({ task, onStop, onDone }: { task: BuildStart; onStop: () => void; onDone: () => void }) {
  const spec = BUILD_TASKS[task.key]!;
  // You can stop anywhere and pick up from the same job later.
  const [done, setDoneState] = useState(() => jobsDone()[task.key] ?? 0);
  const setDone = (n: number) => {
    setDoneState(n);
    saveJobs({ ...jobsDone(), [task.key]: n });
  };
  // Which line, and on which job he says it.
  const [pick] = useState(() => ({ line: Math.floor(Math.random() * spec.say.length), at: Math.max(1, Math.floor(spec.jobs.length / 2)) }));
  const said = done >= pick.at;
  const per = task.hours ? duration(Math.max(5, Math.round((task.hours * 60) / spec.jobs.length / 5) * 5)) : '';
  const click = () => {
    const next = done + 1;
    if (next >= spec.jobs.length) {
      const { [task.key]: _finished, ...rest } = jobsDone();
      saveJobs(rest);
      onDone();
      return;
    }
    session.gesture(spec.motion);
    if (next === pick.at) speakPieces([`b-${task.key}-${pick.line}`], spec.say[pick.line]!, 0);
    setDone(next);
  };
  return (
    <div className="build-task">
      <h3>{BUILD_TASK_TEXT.title(task.name)}</h3>
      <ol>
        {spec.jobs.map((job, i) => (
          <li key={job} className={i < done ? 'ok' : i === done ? 'now' : ''}>
            {i < done ? <Glyph id="star" size={15} /> : <Glyph id="build" size={15} />} {job}
          </li>
        ))}
      </ol>
      {said && <p className="build-say">{spec.say[pick.line]}</p>}
      <button className="build-btn" onClick={click}>
        <Glyph id="build" /> <span>{per ? BUILD_TASK_TEXT.next(spec.jobs[done]!, per) : spec.jobs[done]}</span>
      </button>
      <div className="build-task-foot">
        <button className="hud-btn" onClick={onStop}>
          {BUILD_TASK_TEXT.stop}
        </button>
        <small>{BUILD_TASK_TEXT.note}</small>
      </div>
    </div>
  );
}

/** rc.4: whether a build that is not there until started has been started. */
function started(what: 'rack' | 'cache' | 'comforts', view: View): boolean {
  const S = view.state;
  if (what === 'comforts') return !!S.chair || !!S.table;
  return upgradePath(what).done > 0 || (what === 'rack' && !!S.hugeRack);
}

/** rc.4: the build menu (B). Everything you can build, with what it takes; starting one puts it up. */
function BuildMenu({ view, onClose, onOpen, onBuild }: { view: View; onClose: () => void; onOpen: (station: string) => void; onBuild: (b: BuildStart) => void }) {
  const panel = new Map(view.panel.map((e) => [e.id, e]));
  const atCamp = view.state.loc === 'camp';
  const shelter = upgradePath('shelter');
  const dugout = upgradePath('dugout');
  const bed = dugout.done > 0 ? { id: 'dugout' as const, path: dugout } : { id: 'shelter' as const, path: shelter };
  const row = (key: string, icon: GlyphId, name: string, line: string, button: ReactNode) => (
    <div key={key} className="bsub">
      <span className="bsub-name">
        <Glyph id={icon} size={18} /> {name}
      </span>
      {button}
      <small>{line}</small>
    </div>
  );
  const go = (label: string, onClick: () => void, enabled = true) => (
    <button className="bsub-go" disabled={!enabled || !atCamp} onClick={onClick}>
      {label}
    </button>
  );
  return (
    <div className="overlay" onClick={onClose}>
      <div className="build-menu" onClick={(e) => e.stopPropagation()}>
        <h3>
          {BUILD_MENU.title} <small>{BUILD_MENU.key}</small>
        </h3>
        <p className="mb-note">{atCamp ? BUILD_MENU.note : BUILD_MENU.notCamp}</p>
        <div className="mb-label">{BUILD_MENU.main}</div>
        {row('main', 'shelter', UPGRADE_TEXT.names[bed.id][bed.path.current]!, UPGRADE_TEXT.about[bed.id][bed.path.current]!, go(BUILD_MENU.open, () => onOpen('shelter')))}
        <div className="mb-label quiet">{BUILD_MENU.camp}</div>
        {BUILD_MENU.builds.map((b) => {
          const path = upgradePath(b.id);
          const entry = panel.get(b.action);
          const first = path.done === 0;
          const next = path.steps.find((st) => st.state === 'next');
          const line = next ? `${path.steps.length} steps. ${first ? '' : `${UPGRADE_TEXT.names[b.id][path.current]}, step ${next.step} next.`}` : UPGRADE_TEXT.done;
          return row(
            b.id,
            b.id,
            b.name,
            line,
            first && entry
              ? go(BUILD_MENU.start, () => onBuild({ key: `${b.id}.1`, name: UPGRADE_TEXT.steps[b.id][0]!, entry, hours: next?.hours }), entry.enabled)
              : go(BUILD_MENU.open, () => onOpen(b.station)),
          );
        })}
        <div className="mb-label quiet">{BUILD_MENU.make}</div>
        {BUILD_MENU.things.map((id) => {
          const entry = panel.get(id);
          if (!entry?.visible) return null;
          return (
            <div key={id} className={`bsub${entry.enabled ? '' : ' off'}`}>
              <span className="bsub-name">
                <Txt text={entry.label} />
              </span>
              {entry.enabled && go(BUILD_MENU.start, () => onBuild({ key: id, name: noEmoji(entry.label), entry }))}
              {entry.detail && (
                <small>
                  <WithIcons text={entry.detail} />
                </small>
              )}
            </div>
          );
        })}
      </div>
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
};
const RESULT_ICONS: Record<string, ResourceId> = Object.fromEntries(STORES);

/** rc.5: drawing the bow. The ring sways with your breath and steadies; any click looses. */
function AimCard({ onLoose, onCancel }: { onLoose: () => void; onCancel: () => void }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      setT((performance.now() - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', key);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', key);
    };
  }, []);
  const settle = Math.max(0.15, 1 - t / 2.2);
  const x = Math.sin(t * 1.7) * 26 * settle;
  const y = Math.sin(t * 2.3 + 1) * 18 * settle;
  return (
    <div className="aim" onClick={onLoose}>
      <div className="aim-ring" style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${0.6 + settle * 0.6})` }} />
      <div className="aim-text">
        <b>{HUNT_TEXT.aimTitle}</b>
        <span>{HUNT_TEXT.aimHint}</span>
        <button className="hud-btn" onClick={(e) => { e.stopPropagation(); onCancel(); }}>{HUNT_TEXT.aimCancel}</button>
      </div>
    </div>
  );
}

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
        {Math.abs(d)} {RESULT_ICONS[key] ? <ResIcon id={RESULT_ICONS[key]!} size={18} /> : (RESULT_LABELS[key] ?? key)}
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
        <h3>
          <Txt text={offer.label} />
        </h3>
        {offer.detail && (
          <p>
            <WithIcons text={offer.detail} />
          </p>
        )}
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
  const [build, setBuild] = useState(false);
  const [task, setTask] = useState<BuildStart | null>(null);
  const [map, setMap] = useState(false);
  const [night, setNight] = useState<Offer | null>(null);
  const [keepsake, setKeepsake] = useState<IntroNote | null>(null);
  const [sound, setSound] = useState(false);
  const [inventory, setInventory] = useState(false);
  const [held, setHeld] = useState<Held | null>(null);
  const [aim, setAim] = useState<Offer | null>(null);
  const [walkTo, setWalkTo] = useState<{ id: string; n: number } | undefined>(undefined);
  // rc.5: Dan says it when the hunt changes, and following a trail to the animal walks you there.
  const huntWas = useRef<string>((S.hunt?.state as string) ?? 'none');
  useEffect(() => {
    const now = (S.hunt?.state as string) ?? 'none';
    const was = huntWas.current;
    huntWas.current = now;
    if (now === was) return;
    const latest = ((S.log as Array<{ msg: string }>)[0]?.msg ?? '').toLowerCase();
    const say = (kind: keyof typeof HUNT_VOICE) => {
      const pick = HUNT_VOICE[kind][Math.floor(Math.random() * HUNT_VOICE[kind].length)]!;
      speakPieces([pick.id], pick.say, 0);
    };
    if (was === 'spotted') say(latest.includes('missed') ? 'miss' : 'hit');
    else if (now === 'tracks') say('tracks');
    else if (now === 'hot') say('hot');
    else if (now === 'spotted') {
      say('spotted');
      if (S.loc === 'woods') setWalkTo((w) => ({ id: 'animal', n: (w?.n ?? 0) + 1 }));
    } else if (now === 'none' && !S.killSite && (latest.includes('lost') || latest.includes('gone'))) say('lost');
  }, [view.version]);
  const [cost, setCost] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  // A new day starts behind a curtain: the night passes, then the dawn report.
  const [curtain, setCurtain] = useState<number | null>(null);
  const [winSeen, setWinSeen] = useState(false);
  const lastDay = useRef<number>(S.day);
  useEffect(() => {
    if (S.day > lastDay.current) setCurtain(S.day);
    lastDay.current = S.day;
  }, [S.day]);
  // rc.6: going through the ice or off a wet rock gets a short scene of its own.
  const [fall, setFall] = useState<{ kind: 'ice' | 'rocks'; n: number } | null>(null);
  const fellSeen = useRef<number>((S.fell?.n as number) ?? 0);
  useEffect(() => {
    const fell = S.fell as { kind: 'ice' | 'rocks'; n: number } | undefined;
    if (!fell || fell.n <= fellSeen.current) return;
    fellSeen.current = fell.n;
    setSelected(null);
    setFall({ kind: fell.kind, n: fell.n });
    playFall(fell.kind);
  }, [view.version]);

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
  // rc.3: a signpost walks you straight there. Only when the walk is not possible does its panel
  // open, to say why.
  useEffect(() => {
    const exit = selected ? layout.stations.find((st) => st.id === selected && st.exitTo) : undefined;
    if (!exit) return;
    const walk = offersFor(exit, view)[0];
    if (!walk?.enabled || view.modal) return;
    setSelected(null);
    session.click(walk.handler);
  }, [selected]);

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
        setBuild(false);
        setInventory(false);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setSelected((current) => (current === 'you' ? null : 'you'));
      } else if (e.key === 'r' || e.key === 'R') {
        const rest = session.getView()?.panel.find((p) => p.id === 'a-rest');
        if (rest?.visible && rest.enabled && !session.getView()?.modal) session.click(rest.onclick);
      } else if (e.key === 'b' || e.key === 'B') setBuild((open) => !open);
      else if (e.key === 'j' || e.key === 'J') setJournal((open) => !open);
      else if (e.key === 'm' || e.key === 'M') setMap((open) => !open);
      else if (e.key === 'i' || e.key === 'I') setInventory((open) => !open);
      else if (/^[0-5]$/.test(e.key)) {
        // rc.5: carry a tool between jobs; the same key again empties your hands.
        const v = session.getView();
        const tool = e.key === '0' || !v ? undefined : ownedTools(v).find((t) => t.key === e.key);
        if (e.key === '0' || tool) setHeld((now) => (!tool || now === tool.tool ? null : tool.tool));
      } else if (e.key === 'F3') {
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
      // rc.4: a build is not there until you start it.
      if (station.built && !guide && !started(station.built, view)) hiddenIds.add(station.id);
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
      // The picture reads 1-2 as digging and 3 as walled, whatever the number of steps.
      dugoutProg: ((d) => (d.current >= 2 ? 3 : Math.min(2, d.done)))(upgradePath('dugout')),
      buildProg: S.buildProg ?? 0,
      campLogs: campLeft('logs') / CAMP_HARVEST.logs,
      campRocks: campLeft('rocks') / CAMP_HARVEST.rocks,
      buildNeed: upgradePath('shelter').steps.find((st) => st.state === 'next')?.of ?? 1,
      insulation: S.insulation,
      bed: !!S.bed,
      stove: !!S.stove,
      secondTarp: !!(S.kit as Set<string> | undefined)?.has('tarp'),
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
      huntState: hunt?.state ?? 'none',
      wounded: !!(hunt as { wounded?: boolean } | undefined)?.wounded,
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
  const frozen = !!(view.modal || journal || map || night || keepsake || sound || inventory || aim || fall || curtain !== null);
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
      held: aim ? 'bow' : held,
      walkTo,
    }),
    [loc, layout, hidden, selected, S.hour, S.weather, S.winter, S.day, props, frozen, S.birdsSilent, held, aim, walkTo],
  );

  // rc.3: the win is a scene first; v12's cards wait underneath until it ends.
  if (S.over && S.winAtMedCheck && !winSeen) return <WinScene weather={S.weather} winter={!!S.winter} tempC={ambientTempC()} onDone={() => setWinSeen(true)} />;
  if (view.endScreen && !view.modal) return <EndScreen view={view} />;
  const station = selected ? layout.stations.find((s) => s.id === selected) : null;

  // rc.4: a build is a few small jobs first; the step itself happens with the last one.
  const startBuild = (b: BuildStart) => {
    setSelected(null);
    setBuild(false);
    if (BUILD_TASKS[b.key]) setTask(b);
    else session.click(b.entry.onclick);
  };

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
    // rc.5: the shot is drawn by hand first. The odds stay v12's.
    if (offer.handler.startsWith('actShot') && offer.enabled) {
      setSelected(null);
      setAim(offer);
      return;
    }
    if (station && !station.exitTo && station.id !== 'you') setStandAt((at) => ({ ...at, [loc]: station.id }));
    // Back to looking around once you have done something.
    setSelected(null);
    session.click(offer.handler);
  };

  return (
    <div className="game2" ref={root}>
      {guide ? <TableauHost input={input} events={events} /> : <WorldHost input={worldInput} events={worldEvents} />}
      {!guide && (
        <>
          <div className="travel-fade" key={loc}>
            {layout.label}
          </div>
          <TopBar view={view} onBuild={() => setBuild(true)} onJournal={() => setJournal(true)} onMap={() => setMap(true)} onSound={() => setSound(true)} />
          <BodyRail view={view} />
          {!frozen && <EnergyHud view={view} cost={station ? cost : 0} onBed={setNight} />}
          <StoresRail view={view} />
          <BottomBar view={view} onJournal={() => setJournal(true)} />
          <button className="you-btn" onClick={() => setSelected(selected === 'you' ? null : 'you')} title="Things only you need (Tab)">
            You
          </button>
          <button className="pack-btn" onClick={() => setInventory(true)} title={`${INVENTORY_TEXT.title} (${INVENTORY_TEXT.key})`}>
            <Glyph id="pack" size={40} />
          </button>
          {aim && (
            <AimCard
              onLoose={() => {
                const offer = aim;
                setAim(null);
                session.click(offer.handler);
              }}
              onCancel={() => setAim(null)}
            />
          )}
          {inventory && <Inventory view={view} held={held} onHold={setHeld} onClose={() => setInventory(false)} />}
          {station && <ContextPanel station={station} view={view} onClose={() => setSelected(null)} onAct={act} onBuild={startBuild} onKeepsake={(note) => {
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
          {fall && (
            <div className="fall-scene" key={fall.n} onAnimationEnd={() => setFall(null)}>
              <h2>{FALL_SCENE[fall.kind].title}</h2>
              <p>{FALL_SCENE[fall.kind].line}</p>
              <p className="after">{FALL_SCENE[fall.kind].after}</p>
            </div>
          )}
          <Tips view={view} hidden={frozen || !!station} />
          <ThoughtSubtitle />
          <NoteBox />
          {sound && <SettingsPanel onClose={() => setSound(false)} />}
          {map && <MapOverlay view={view} onClose={() => setMap(false)} />}
          {journal && <Journal view={view} onClose={() => setJournal(false)} />}
          {build && (
            <BuildMenu
              view={view}
              onClose={() => setBuild(false)}
              onOpen={(id) => {
                setBuild(false);
                setSelected(id);
              }}
              onBuild={startBuild}
            />
          )}
          {task && (
            <BuildTaskCard
              key={task.key}
              task={task}
              onStop={() => setTask(null)}
              onDone={() => {
                setTask(null);
                session.click(task.entry.onclick);
              }}
            />
          )}
          <Modal view={view} />
          <Tooltip root={root} />
        </>
      )}
    </div>
  );
}
