import { useState } from 'react';
import { GAME_VERSION, P1, SHOW } from '@tapout/content';
import { CreditsPanel, SettingsPanel } from './SettingsPanel.tsx';
import type { RunRecord } from '../session.ts';

export function TitleScreen(props: { canContinue: boolean; history: RunRecord[]; onContinue: () => void; onNewRun: () => void }) {
  const [open, setOpen] = useState<'settings' | 'credits' | null>(null);
  return (
    <div className="title-card">
      <div className="micro">The Boreal North</div>
      <h1>
        TAP <span className="slash">/</span> OUT
      </h1>
      <p className="sub">
        {SHOW.name} · ten strangers, one shoreline each · {SHOW.prizeLabel}
      </p>
      <div className="title-buttons">
        {props.canContinue && (
          <button className="big-btn primary" onClick={props.onContinue}>
            Continue
          </button>
        )}
        <button className={`big-btn${props.canContinue ? '' : ' primary'}`} onClick={props.onNewRun}>
          New run
        </button>
        <button className="big-btn" onClick={() => setOpen('settings')}>
          Settings
        </button>
        <button className="big-btn" onClick={() => setOpen('credits')}>
          Credits
        </button>
      </div>
      {open === 'settings' && <SettingsPanel onClose={() => setOpen(null)} />}
      {open === 'credits' && <CreditsPanel onClose={() => setOpen(null)} />}
      {props.history.length > 0 && (
        <div className="history">
          <h4>Past runs</h4>
          {props.history.slice(0, 6).map((run) => (
            <div key={run.endedAt} className="history-row">
              <b>{run.title || 'Run over'}</b>
              <span>Day {run.day}</span>
              <span className="cause">{run.cause}</span>
            </div>
          ))}
        </div>
      )}
      <p className="build">
        Build {GAME_VERSION} · early development · you are {P1.fullName}
      </p>
    </div>
  );
}
