import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Stage } from './Stage.tsx';
import { App } from './ui/App.tsx';
import { CrashScreen } from './ui/CrashScreen.tsx';
import { installCrashLog } from './crash.ts';
import { playAction } from './audio/effects.ts';
import { session } from './session.ts';
import { onSettings, settings } from './settings.ts';
import { setRivalNews } from '@tapout/core';
import './styles.css';

installCrashLog();
session.onCall(playAction);
setRivalNews(settings().rivalNews);
onSettings(() => setRivalNews(settings().rivalNews));

const root = document.getElementById('root');
if (!root) throw new Error('missing #root');
createRoot(root).render(
  <StrictMode>
    <Stage>
      <CrashScreen>
        <App />
      </CrashScreen>
    </Stage>
  </StrictMode>,
);
