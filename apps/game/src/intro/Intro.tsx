import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { KIT_POOL } from '@tapout/core';
import { INTRO_DROPOFF, INTRO_KITCHEN, INTRO_VOICE, SHORE, WORLD, type IntroClip, type IntroNote } from '@tapout/content';
import { Kitchen, type KitchenHover } from './Kitchen.ts';
import { floatPlane, producer } from './figures.ts';
import { World, type WorldInput } from '../world/World.ts';
import type { PropState } from '../world/props.ts';
import { plainWords, speakPieces, stopThought } from '../audio/thoughts.ts';

interface KitItem {
  id: string;
  label: string;
  icon: string;
  std: boolean;
  has: string;
  without: string;
  expert?: boolean;
}

const POOL = KIT_POOL as KitItem[];
const PICKS = 10;
const NOTES: Record<string, IntroNote> = INTRO_KITCHEN.notes;
const NOTE_VOICE: Partial<Record<string, IntroClip[]>> = INTRO_VOICE.notes;

/** Says a piece of the intro, cutting off whatever was being said. */
function say(clips: readonly IntroClip[]): void {
  speakPieces(clips.map((c) => c.id), clips.map((c) => plainWords(c.say)).join(' '), 0.35);
}

type Phase = 'opening' | 'kitchen' | 'dropoff' | 'title';

declare global {
  // Lets tests pack and move on without a mouse.
  var __tapoutIntro: { pack: (ids: string[]) => void; zip: () => void; next: () => void } | undefined;
}

/** The night before, then the drop-off (D-033). Skipping falls back to the plain kit list. */
export function Intro({ onBegin, onSkip }: { onBegin: (kit: string[]) => void; onSkip: () => void }) {
  const [phase, setPhase] = useState<Phase>('opening');
  const [kit, setKit] = useState<string[]>([]);

  useEffect(() => {
    if (phase !== 'opening') return;
    const t = window.setTimeout(() => setPhase('kitchen'), 6800);
    return () => window.clearTimeout(t);
  }, [phase]);

  // Whatever is being said stops when the intro ends or is skipped.
  useEffect(() => () => stopThought(), []);

  useEffect(() => {
    if (phase !== 'title') return;
    const t = window.setTimeout(() => onBegin(kit), 3600);
    return () => window.clearTimeout(t);
  }, [phase, kit, onBegin]);

  return (
    <div className="intro">
      {phase === 'opening' && (
        <div className="intro-black">
          {INTRO_KITCHEN.opening.map((line, i) => (
            <p key={i} style={{ animationDelay: `${0.3 + i * 1.3}s` }}>
              {line}
            </p>
          ))}
        </div>
      )}
      {phase === 'kitchen' && (
        <KitchenStage
          onZip={(ids) => {
            setKit(ids);
            setPhase('dropoff');
          }}
        />
      )}
      {phase === 'dropoff' && <DropoffStage onDone={() => setPhase('title')} />}
      {phase === 'title' && (
        <div className="intro-black intro-title">
          <h1>{INTRO_DROPOFF.title}</h1>
          <p>{INTRO_DROPOFF.dayOne}</p>
        </div>
      )}
      {phase !== 'title' && (
        <button className="intro-skip" onClick={phase === 'kitchen' || phase === 'opening' ? onSkip : () => setPhase('title')}>
          {INTRO_DROPOFF.skip}
        </button>
      )}
    </div>
  );
}

function KitchenStage({ onZip }: { onZip: (ids: string[]) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<Kitchen | null>(null);
  const [packed, setPacked] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<KitchenHover | null>(null);
  const [note, setNote] = useState<IntroNote | null>(null);
  const [looking, setLooking] = useState(false);
  const seenAxe = useRef(false);
  const latest = useRef({ packed, setNote });
  latest.current = { packed, setNote };

  useEffect(() => {
    if (!host.current) return;
    const k = new Kitchen(host.current, POOL, {
      hover: setHover,
      looking: setLooking,
      click: (id, kind) => {
        if (kind === 'note') {
          latest.current.setNote(NOTES[id] ?? null);
          return;
        }
        if (id === 'axe' && !seenAxe.current) {
          seenAxe.current = true;
          latest.current.setNote(NOTES.axeTag!);
        }
        setPacked((current) => {
          const next = new Set(current);
          if (next.has(id)) next.delete(id);
          else if (next.size < PICKS) next.add(id);
          return next;
        });
      },
    });
    scene.current = k;
    return () => {
      k.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => {
    scene.current?.setPacked(packed);
  }, [packed]);

  useEffect(() => {
    if (scene.current) scene.current.frozen = note !== null;
    if (note && document.pointerLockElement) document.exitPointerLock();
    // Read aloud while you look at it; putting it down stops the voice.
    const id = note && Object.keys(NOTES).find((key) => NOTES[key] === note);
    if (id && NOTE_VOICE[id]) say(NOTE_VOICE[id]!);
    else stopThought();
  }, [note]);

  const zip = () => {
    if (packed.size === PICKS) onZip([...packed]);
  };
  const latestZip = useRef(zip);
  latestZip.current = zip;
  useEffect(() => {
    globalThis.__tapoutIntro = {
      pack: (ids) => setPacked(new Set(ids.slice(0, PICKS))),
      zip: () => latestZip.current(),
      next: () => undefined,
    };
    return () => {
      globalThis.__tapoutIntro = undefined;
    };
  }, []);

  const item = hover?.kind === 'kit' ? POOL.find((p) => p.id === hover.id) : null;
  const on = item ? packed.has(item.id) : false;

  return (
    <div className="world" ref={host}>
      <div className="intro-task">
        <p>{INTRO_KITCHEN.task}</p>
        <div className="intro-pack-row">
          <b className={packed.size === PICKS ? 'ok' : ''}>{INTRO_KITCHEN.packedLabel(packed.size, PICKS)}</b>
          <button className="hud-btn" onClick={() => setPacked(new Set(POOL.filter((p) => p.std).map((p) => p.id)))}>
            {INTRO_KITCHEN.usualTen}
          </button>
          <button className="big-btn primary" disabled={packed.size !== PICKS} onClick={zip}>
            {INTRO_KITCHEN.zip}
          </button>
        </div>
      </div>
      {looking && !note && <div className={`crosshair${hover ? ' on' : ''}`} />}
      {hover && !note && (
        <div className="look-label intro-hover" style={{ left: hover.x, top: hover.y + 34 }}>
          {item ? (
            <>
              <b>
                {item.icon} {item.label}
              </b>
              <span>{on ? `Packed: ${item.has}` : `Without it: ${item.without}`}</span>
              {on && <em>{INTRO_KITCHEN.unpack}</em>}
            </>
          ) : (
            <>
              <b>{NOTES[hover.id]?.title}</b>
              <span>Click to look</span>
            </>
          )}
        </div>
      )}
      {note && (
        <div className="overlay" onClick={() => setNote(null)}>
          <div className="intro-note" onClick={() => setNote(null)}>
            <h3>{note.title}</h3>
            <p>{note.text}</p>
            <span className="intro-hint">Click to put it down</span>
          </div>
        </div>
      )}
      {!looking && !note && <div className="move-hint">Click anywhere to look around · W A S D to walk · Esc frees the mouse</div>}
    </div>
  );
}

const STILL_PROPS: PropState = {
  structure: 0, dugout: false, insulation: 0, bed: false, firepitTier: 0, fireLit: false, rackTier: 0, hugeRack: false,
  cacheTier: 0, chair: false, table: false, day: 1, winter: false, species: '', logs: 0, firewood: 0, meat: 0, berries: 0, rocks: 0, moss: 0, clay: 0, tinder: 0, smoked: 0, smoking: 0, lines: [], snares: 0, netBuilt: false, netSpot: '', exitLabels: {},
};

function DropoffStage({ onDone }: { onDone: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [line, setLine] = useState(0);
  const leaving = useRef<{ plane: THREE.Group; kerry: THREE.Group; go: boolean; start: number | null } | null>(null);
  const last = INTRO_DROPOFF.lines.length - 1;
  const input: WorldInput = useMemo(
    () => ({
      area: WORLD.shore,
      layout: { ...SHORE, stations: [] },
      hidden: new Set(),
      selected: null,
      hour: INTRO_DROPOFF.hour,
      dawn: INTRO_DROPOFF.dawn,
      dusk: INTRO_DROPOFF.dusk,
      weather: 'clear',
      winter: false,
      props: STILL_PROPS,
      frozen: false,
    }),
    [],
  );

  useEffect(() => {
    if (!host.current) return;
    const w = new World(host.current);
    w.configure(input, { select: () => undefined, clear: () => undefined, hover: () => undefined, looking: () => undefined, slow: () => undefined });
    const plane = floatPlane();
    plane.position.set(5, -0.15, -7);
    plane.rotation.y = Math.PI / 2 + 0.4;
    const kerry = producer();
    const at = w.standing;
    kerry.position.set(at.x + 1.7, 0, at.z - 3.4);
    kerry.rotation.y = Math.atan2(at.x - kerry.position.x, at.z - kerry.position.z);
    w.addExtra(plane);
    w.addExtra(kerry);
    leaving.current = { plane, kerry, go: false, start: null };
    w.onFrame = (dt, t) => {
      const state = leaving.current;
      if (!state?.go) return;
      if (state.start === null) state.start = t;
      const s = t - state.start;
      const prop = plane.getObjectByName('prop');
      if (prop) prop.rotation.z += dt * 40;
      // Taxi out, run across the water, lift and climb away.
      const speed = Math.min(30, 1 + s * s * 1.6);
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(plane.quaternion);
      plane.position.addScaledVector(forward, speed * dt);
      if (s > 4) {
        plane.position.y += (s - 4) * 1.2 * dt;
        plane.rotation.x = Math.min(0.18, (s - 4) * 0.05);
      }
    };
    return () => w.dispose();
  }, [input]);

  const next = () => {
    if (line < last) {
      const n = line + 1;
      setLine(n);
      if (n === last && leaving.current) {
        // Kerry is aboard; the plane goes.
        leaving.current.kerry.visible = false;
        leaving.current.go = true;
      }
    } else onDone();
  };
  const latestNext = useRef(next);
  latestNext.current = next;

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        latestNext.current();
      }
    };
    const click = (e: MouseEvent) => {
      if (document.pointerLockElement && e.button === 0) latestNext.current();
    };
    window.addEventListener('keydown', key);
    window.addEventListener('mousedown', click);
    globalThis.__tapoutIntro = { pack: () => undefined, zip: () => undefined, next: () => latestNext.current() };
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('mousedown', click);
      globalThis.__tapoutIntro = undefined;
    };
  }, []);

  useEffect(() => {
    const clip = INTRO_VOICE.dropoff[line];
    if (clip) say([clip]);
  }, [line]);

  const l = INTRO_DROPOFF.lines[line]!;
  return (
    <div className="world" ref={host}>
      <div className="intro-subtitle" onClick={next}>
        {l.who && <b>{l.who === 'Kerry' ? INTRO_DROPOFF.producer : l.who}</b>}
        <p className={l.who ? '' : 'seen'}>{l.text}</p>
        <span className="intro-hint">{INTRO_DROPOFF.next} · Space</span>
      </div>
    </div>
  );
}
