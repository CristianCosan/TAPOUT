import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { P1, SHOW } from '@tapout/content';
import { Stage } from './Stage.tsx';
import './styles.css';

function TitleCard() {
  return (
    <div className="title-card">
      <div className="micro">The Boreal North</div>
      <h1>
        TAP <span className="slash">/</span> OUT
      </h1>
      <p className="sub">
        {SHOW.name} · ten strangers, one shoreline each · {SHOW.prizeLabel}
      </p>
      <p className="build">Build 0 · stage test · {P1.fullName} is packing.</p>
    </div>
  );
}

const root = document.getElementById('root');
if (!root) throw new Error('missing #root');
createRoot(root).render(
  <StrictMode>
    <Stage>
      <TitleCard />
    </Stage>
  </StrictMode>,
);
