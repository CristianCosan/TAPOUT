import { useLayoutEffect, useRef, type MouseEvent } from 'react';
import { rationsLeft, roundDisplay, type HudElement, type PanelEntry } from '@tapout/core';
import { session, type View } from '../session.ts';

const LOCATIONS = [
  { id: 'camp', label: 'Camp' },
  { id: 'shore', label: 'Shore' },
  { id: 'woods', label: 'Woods' },
] as const;

const BARS = [
  ['health', 'Health'],
  ['hunger', 'Food'],
  ['thirst', 'Water'],
  ['warmth', 'Warmth'],
  ['morale', 'Morale'],
  ['stress', 'Stress'],
] as const;

function Html({ html, className }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: inertHandlers(html) }} />;
}

function hudText(hud: ReadonlyMap<string, HudElement>, id: string): string {
  const el = hud.get(id);
  return el ? el.html || el.text : '';
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

function TopBar({ view }: { view: View }) {
  const { hud } = view;
  return (
    <header className="topbar">
      <div className="logo">
        TAP <span className="slash">/</span> OUT
      </div>
      <div className="pills">
        {['pillDay', 'pillWx', 'pillTemp', 'pillRivals', 'pillWeight'].map((id) => (
          <Html key={id} className="pill" html={hudText(hud, id)} />
        ))}
      </div>
    </header>
  );
}

function Body({ view }: { view: View }) {
  const S = view.state;
  const { hud } = view;
  const energyPct = Math.max(0, Math.min(100, (S.energy / Math.max(1, S.maxEnergy)) * 100));
  return (
    <aside className="body-panel">
      <h3>You</h3>
      <div className="bar-row">
        <span className="bar-label">Energy</span>
        <div className="bar">
          <div className={`bar-fill energy${S.energy / S.maxEnergy < 0.22 ? ' crit' : ''}`} style={{ width: `${energyPct}%` }} />
        </div>
        <span className="bar-val">
          {roundDisplay(S.energy)}/{S.maxEnergy}
        </span>
      </div>
      {BARS.map(([key, label]) => {
        const value = S[key] as number;
        const crit = key === 'stress' ? value > 78 : value < 22;
        return (
          <div className="bar-row" key={key}>
            <span className="bar-label">{label}</span>
            <div className="bar">
              <div className={`bar-fill ${key}${crit ? ' crit' : ''}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
            </div>
            <span className="bar-val">{roundDisplay(value)}</span>
          </div>
        );
      })}
      <div className="chips">
        {['chip-fire', 'chip-shelter', 'chip-wet', 'chip-injury', 'chip-wolf'].map((id) =>
          hud.get(id)?.hidden ? null : <Html key={id} className="chip" html={hudText(hud, id)} />,
        )}
        <Html html={hudText(hud, 'conditionChips')} />
      </div>
      <h3>Eat &amp; drink</h3>
      <div className="eat">
        {[
          ['eatBerriesBtn', 'eatBerries()'],
          ['eatCookedBtn', 'eatCooked()'],
          ['eatSmokedBtn', 'eatSmoked()'],
          ['drinkBtn', 'actDrink()'],
        ].map(([id, handler]) => (
          <button key={id} className="chip-btn" onClick={() => session.click(handler!)} disabled={hud.get(id!)?.disabled}>
            <Html html={hudText(hud, id!)} />
          </button>
        ))}
        {rationsLeft() > 0 && (
          <button className="chip-btn" onClick={() => session.click('eatRation()')}>
            🥫 Ration ({rationsLeft()})
          </button>
        )}
      </div>
      <h3>Stores</h3>
      <div className="stores">
        {[
          ['inv-meat', '🍖 Raw meat'],
          ['inv-arrows', '🏹 Arrows'],
          ['inv-raw', '🪣 Raw water'],
          ['inv-tinder', '🌾 Tinder'],
          ['inv-wood', '🪵 Logs'],
          ['inv-firewood', '🔥 Firewood'],
          ['inv-moss', '🌿 Moss'],
          ['inv-rocks', '🪨 Rocks'],
          ['inv-clay', '🧱 Clay'],
        ].map(([id, label]) => (
          <div className="store" key={id}>
            <span>{label}</span>
            <b>{hudText(hud, id!)}</b>
          </div>
        ))}
      </div>
      <div className="chips">
        <Html html={hudText(hud, 'carryChips')} />
        <Html html={hudText(hud, 'gearChips')} />
      </div>
    </aside>
  );
}

function ActionButton({ entry }: { entry: PanelEntry }) {
  return (
    <button className="act" disabled={!entry.enabled} onClick={() => session.click(entry.onclick)} title={entry.detail}>
      <span className="act-name">{entry.label}</span>
      <span className="act-detail">{entry.detail}</span>
    </button>
  );
}

function Actions({ view }: { view: View }) {
  const S = view.state;
  const { hud } = view;
  const here = view.panel.filter((e) => e.visible && e.loc === S.loc);
  const anywhere = view.panel.filter((e) => e.visible && e.loc === 'all');
  return (
    <main className="actions-panel">
      <nav className="tabs">
        {LOCATIONS.map((loc) => {
          const tab = hud.get(`tab-${loc.id}`);
          const isHere = S.loc === loc.id;
          return (
            <button
              key={loc.id}
              className={`tab${isHere ? ' here' : ''}`}
              disabled={!isHere && tab?.disabled}
              onClick={() => !isHere && session.click(`goTo('${loc.id}')`)}
            >
              <span className="tab-name">{loc.label}</span>
              <span className="tab-detail">{hudText(hud, `tt-${loc.id}`)}</span>
            </button>
          );
        })}
      </nav>
      <p className="signs">{hudText(hud, 'signsLine')}</p>
      <div className="act-grid">
        {here.map((entry) => (
          <ActionButton key={entry.id} entry={entry} />
        ))}
      </div>
      {anywhere.length > 0 && (
        <>
          <h4 className="act-section">Anywhere</h4>
          <div className="act-grid">
            {anywhere.map((entry) => (
              <ActionButton key={entry.id} entry={entry} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function Journal({ view }: { view: View }) {
  const log = view.state.log as Array<{ msg: string; cls: string; t: string }>;
  return (
    <aside className="journal">
      <h3>Journal</h3>
      <div className="journal-list">
        {log.map((line, i) => (
          <div key={`${view.version}-${i}`} className={`ln ${line.cls}`}>
            <span className="t">{line.t}</span>
            <Html html={line.msg} />
          </div>
        ))}
      </div>
    </aside>
  );
}

function BottomBar({ view }: { view: View }) {
  const { hud } = view;
  const early = hud.get('earlyBtn');
  return (
    <footer className="bottombar">
      <button className="sleep" disabled={hud.get('sleepBtn')?.disabled} onClick={() => session.click('actSleep()')}>
        🌙 Sleep · 6 hours
        <span className="sub">{hudText(hud, 'sleep-sub')}</span>
      </button>
      {!early?.hidden && (
        <button className="early" onClick={() => session.click('actTurnInEarly()')}>
          {hudText(hud, 'early-label')}
          <span className="sub">{hudText(hud, 'early-sub')}</span>
        </button>
      )}
      <div className="spacer" />
      <button className="phone" disabled={hud.get('tapBtn')?.disabled} onClick={() => session.click('confirmTapOut()')}>
        📞 Pick up the sat phone…
      </button>
    </footer>
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

export function GameScreen({ view }: { view: View }) {
  if (view.endScreen && !view.modal) return <EndScreen view={view} />;
  return (
    <div className="game">
      <TopBar view={view} />
      <div className="columns">
        <Body view={view} />
        <Actions view={view} />
        <Journal view={view} />
      </div>
      <BottomBar view={view} />
      <Modal view={view} />
    </div>
  );
}
