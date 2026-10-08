import { useEffect, useState, useSyncExternalStore } from 'react';
import { session } from '../session.ts';
import { GameScreen } from './GameScreen.tsx';
import { KitDraft } from './KitDraft.tsx';
import { TitleScreen } from './TitleScreen.tsx';

type Screen = 'title' | 'draft';

export function App() {
  const view = useSyncExternalStore(session.subscribe, session.getView);
  const [screen, setScreen] = useState<Screen>('title');
  const guide = /^#guide-(camp|shore|woods)$/.exec(window.location.hash)?.[1];

  useEffect(() => {
    if (guide) session.startGuide(guide);
  }, [guide]);

  if (view) return <GameScreen view={view} guide={!!guide} />;
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
      onNewRun={() => setScreen('draft')}
    />
  );
}
