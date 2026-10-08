import { useState, useSyncExternalStore } from 'react';
import { session } from '../session.ts';
import { GameScreen } from './GameScreen.tsx';
import { KitDraft } from './KitDraft.tsx';
import { TitleScreen } from './TitleScreen.tsx';

type Screen = 'title' | 'draft';

export function App() {
  const view = useSyncExternalStore(session.subscribe, session.getView);
  const [screen, setScreen] = useState<Screen>('title');

  if (view) return <GameScreen view={view} />;
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
      onContinue={() => session.continueRun()}
      onNewRun={() => setScreen('draft')}
    />
  );
}
