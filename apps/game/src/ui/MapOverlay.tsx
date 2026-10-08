import { MAX_SNARES_PER_SPOT } from '@tapout/core';
import { LOCATIONS, MAP_LAKE, MAP_PLACES, MAP_SHORE_SPOTS, MAP_SIZE, MAP_WOODS_SPOTS, type LocationId } from '@tapout/content';
import { session, type View } from '../session.ts';
import { hudText } from './offers.ts';

interface Spot {
  id: string;
  name: string;
  noLuck: number;
}

/**
 * The map (plan §4.5): where you are, where you can walk, and how your trapline and lines stand.
 * Drawn in code. Setting a snare from it calls v12's own `placeSnareAt`, as its spot picker does.
 */
export function MapOverlay({ view, onClose }: { view: View; onClose: () => void }) {
  const S = view.state;
  const here = S.loc as LocationId;
  const snares = S.snareList as Array<{ spotId: string }>;
  const lines = S.lineList as Array<{ spotId: string }>;
  const snareEntry = view.panel.find((e) => e.id === 'a-snare');
  const canSnare = here === 'woods' && !!snareEntry?.visible && snareEntry.enabled;
  const lake = MAP_LAKE.map((p) => `${p.x},${p.y}`).join(' ');

  const walk = (to: LocationId) => {
    onClose();
    session.click(`goTo('${to}')`);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="map-book" onClick={(e) => e.stopPropagation()}>
        <div className="context-head">
          <div>
            <h3>The map</h3>
            <p>
              Snares {snares.length} out · lines {lines.length} out · {S.wireStock ?? 0} wire, {S.lineStock ?? 0} line left
            </p>
          </div>
          <button className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="map-sheet" style={{ width: MAP_SIZE.width, height: MAP_SIZE.height }}>
          <svg width={MAP_SIZE.width} height={MAP_SIZE.height} className="map-svg">
            <rect width={MAP_SIZE.width} height={MAP_SIZE.height} className="map-land" />
            <polygon points={lake} className="map-lake" />
            {(['shore', 'woods'] as const).map((to) => (
              <line key={to} x1={MAP_PLACES.camp.x} y1={MAP_PLACES.camp.y} x2={MAP_PLACES[to].x} y2={MAP_PLACES[to].y} className="map-path" />
            ))}
            <line x1={MAP_PLACES.shore.x} y1={MAP_PLACES.shore.y} x2={MAP_PLACES.woods.x} y2={MAP_PLACES.woods.y} className="map-path" />
            {Object.values(MAP_WOODS_SPOTS).map((p, i) => (
              <line key={i} x1={MAP_PLACES.woods.x} y1={MAP_PLACES.woods.y} x2={p.x} y2={p.y} className="map-trail" />
            ))}
          </svg>
          {(Object.keys(MAP_PLACES) as LocationId[]).map((loc) => {
            const p = MAP_PLACES[loc];
            const enabled = loc !== here && !view.hud.get(`tab-${loc}`)?.disabled;
            return (
              <div key={loc} className={`map-place${loc === here ? ' here' : ''}`} style={{ left: p.x, top: p.y }}>
                <b>{LOCATIONS[loc].label}</b>
                {loc === here ? (
                  <span>You are here</span>
                ) : (
                  <button className="hud-btn" disabled={!enabled} title={hudText(view.hud, `tt-${loc}`)} onClick={() => walk(loc)}>
                    Walk here
                  </button>
                )}
              </div>
            );
          })}
          {(S.shoreSpots as Spot[]).map((sp) => {
            const p = MAP_SHORE_SPOTS[sp.id];
            if (!p) return null;
            const out = lines.filter((l) => l.spotId === sp.id).length;
            return (
              <div key={sp.id} className={`map-spot shore${out ? ' set' : ''}${sp.noLuck >= 3 ? ' dead' : ''}`} style={{ left: p.x, top: p.y }}>
                <i>{out ? '🎣' : '·'}</i>
                <span>{sp.name}</span>
                {sp.noLuck >= 3 && <em>dead for days</em>}
              </div>
            );
          })}
          {(S.woodsSpots as Spot[]).map((sp) => {
            const p = MAP_WOODS_SPOTS[sp.id];
            if (!p) return null;
            const count = snares.filter((s) => s.spotId === sp.id).length;
            return (
              <div key={sp.id} className={`map-spot woods${count ? ' set' : ''}${sp.noLuck >= 3 ? ' dead' : ''}`} style={{ left: p.x, top: p.y }}>
                <i>🪤 {count}/{MAX_SNARES_PER_SPOT}</i>
                <span>{sp.name}</span>
                {sp.noLuck >= 3 && <em>dead for days</em>}
                {canSnare && count < MAX_SNARES_PER_SPOT && (
                  <button className="hud-btn" title={snareEntry?.detail} onClick={() => session.click(`placeSnareAt('${sp.id}')`)}>
                    Set a snare
                  </button>
                )}
                {here === 'woods' && sp.noLuck >= 3 && (
                  <button className="hud-btn" onClick={() => session.click(`exploreNewGrounds('woods','${sp.id}')`)}>
                    Explore new grounds
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
