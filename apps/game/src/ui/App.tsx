import { useEffect, useState, useSyncExternalStore } from 'react';
import { session } from '../session.ts';
import { GameScreen } from './GameScreen.tsx';
import { KitDraft } from './KitDraft.tsx';
import { TitleScreen } from './TitleScreen.tsx';

type Screen = 'title' | 'confirmNew' | 'draft';

export function App() {
  const view = useSyncExternalStore(session.subscribe, session.getView);
  const [screen, setScreen] = useState<Screen>('title');
  const guide = /^#guide-(camp|shore|woods)$/.exec(window.location.hash)?.[1];

  useEffect(() => {
    if (guide) session.startGuide(guide);
  }, [guide]);

  if (view) return <GameScreen view={view} guide={!!guide} />;
  if (screen === 'confirmNew') {
    return (
      <div className="title-card">
        <h2 className="confirm-title">Start a new run?</h2>
        <p className="sub">Your current run ends here. It goes into your past runs as "Left the field".</p>
        <div className="title-buttons">
          <button className="big-btn" onClick={() => setScreen('title')}>
            Keep my run
          </button>
          <button
            className="big-btn primary"
            onClick={() => {
              session.abandonRun();
              setScreen('draft');
            }}
          >
            Start over
          </button>
        </div>
      </div>
    );
  }
  if (screen === 'draft') {
    return (
      <KitDraft
        onBack={() => setScreen('title')}
        onBegin={(kit) => {
          session.newRun(kit);
          setScreen('title');
        }}
      />
    );
  }
  return (
    <TitleScreen
      canContinue={session.hasSave()}
      history={session.history()}
      onContinue={() => session.continueRun()}
      onNewRun={() => setScreen(session.hasSave() ? 'confirmNew' : 'draft')}
    />
  );
}
