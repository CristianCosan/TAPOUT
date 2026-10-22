import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Stage } from './Stage.tsx';
import { App } from './ui/App.tsx';
import { playAction } from './audio/effects.ts';
import { session } from './session.ts';
import './styles.css';

session.onCall(playAction);

const root = document.getElementById('root');
if (!root) throw new Error('missing #root');
createRoot(root).render(
  <StrictMode>
    <Stage>
      <App />
    </Stage>
  </StrictMode>,
);
