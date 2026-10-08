import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Stage } from './Stage.tsx';
import { App } from './ui/App.tsx';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('missing #root');
createRoot(root).render(
  <StrictMode>
    <Stage>
      <App />
    </Stage>
  </StrictMode>,
);
