// The win, played as a scene (rc.3, D-082). It looks like any other med check: the boat comes
// in, the medic steps off. Then Kerry, and then Mara. When it ends, v12's own ending cards
// pick up at the tour of camp.

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { SHORE, WIN_SCENE, WORLD } from '@tapout/content';
import { medBoat, medic, partner, producer } from './figures.ts';
import { World, type WorldInput } from '../world/World.ts';
import type { PropState } from '../world/props.ts';
import { plainWords, speakPieces, stopThought } from '../audio/thoughts.ts';

const STILL_PROPS: PropState = {
  structure: 0, dugout: false, insulation: 0, bed: false, firepitTier: 0, fireLit: false, rackTier: 0, hugeRack: false,
  cacheTier: 0, chair: false, table: false, day: 1, winter: false, species: '', logs: 0, firewood: 0, meat: 0, berries: 0, rocks: 0, moss: 0, clay: 0, tinder: 0, smoked: 0, smoking: 0, lines: [], snares: 0, netBuilt: false, netSpot: '', exitLabels: {},
};

interface Cast {
  boat: THREE.Group;
  medic: THREE.Group;
  kerry: THREE.Group;
  mara: THREE.Group;
  /** Where each of them ends up standing. */
  beach: THREE.Vector3;
  maraFrom: THREE.Vector3;
  maraTo: THREE.Vector3;
  /** When she stepped into view. */
  maraAt: number | null;
  line: number;
}

export function WinScene({ weather, winter, tempC, onDone }: { weather: string; winter: boolean; tempC: number; onDone: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [line, setLine] = useState(0);
  const cast = useRef<Cast | null>(null);
  const last = WIN_SCENE.lines.length - 1;
  const input: WorldInput = useMemo(
    () => ({
      area: WORLD.shore,
      layout: { ...SHORE, stations: [] },
      hidden: new Set(),
      selected: null,
      hour: WIN_SCENE.hour,
      dawn: 7.2,
      dusk: 17.4,
      // A storm would drown the scene; a check comes on a flyable morning.
      weather: weather === 'storm' ? 'overcast' : weather,
      winter,
      tempC,
      props: { ...STILL_PROPS, winter },
      frozen: false,
    }),
    [weather, winter, tempC],
  );

  useEffect(() => {
    if (!host.current) return;
    const w = new World(host.current);
    w.configure(input, { select: () => undefined, clear: () => undefined, hover: () => undefined, slow: () => undefined });
    w.standAtSpawn();
    const at = w.standing;
    const boat = medBoat();
    // Bow on the stones at the water's edge, off to the left, clear of the two on the beach.
    const beach = new THREE.Vector3(at.x - 3.6, -0.1, (WORLD.shore.shoreZ ?? -2) - 1.6);
    boat.position.set(beach.x - 22, -0.1, beach.z - 40);
    const doc = medic();
    const kerry = producer(false);
    const mara = partner();
    doc.position.set(at.x + 1.4, 0, at.z - 4.6);
    kerry.position.set(at.x + 2.9, 0, at.z - 5.4);
    mara.position.set(beach.x + 1.0, 0, beach.z + 1.8);
    for (const p of [doc, kerry, mara]) {
      p.rotation.y = Math.atan2(at.x - p.position.x, at.z - p.position.z);
      p.visible = false;
    }
    w.addExtra(boat);
    w.addExtra(doc);
    w.addExtra(kerry);
    w.addExtra(mara);
    const maraTo = new THREE.Vector3(at.x - 0.55, 0, at.z - 2.0);
    cast.current = { boat, medic: doc, kerry, mara, beach, maraFrom: mara.position.clone(), maraTo, maraAt: null, line: 0 };
    w.onFrame = (dt) => {
      const c = cast.current;
      if (!c) return;
      // The boat runs in to the beach and stops, bow on the stones.
      const toBeach = c.beach.clone().sub(c.boat.position);
      toBeach.y = 0;
      const d = toBeach.length();
      if (d > 0.05) {
        const step = Math.min(d, Math.max(1.2, d * 0.45) * dt);
        c.boat.position.addScaledVector(toBeach.normalize(), step);
        c.boat.rotation.y = Math.atan2(-toBeach.x, -toBeach.z);
        c.boat.position.y = -0.1 + Math.sin(performance.now() / 300) * 0.02;
      }
      c.medic.visible = c.line >= 1;
      c.kerry.visible = c.line >= WIN_SCENE.kerryFrom;
      c.mara.visible = c.line >= WIN_SCENE.maraFrom;
      if (c.mara.visible) {
        // Up the stones to you, quickly: there in about three seconds, however slow the frames.
        c.maraAt ??= performance.now();
        const k = Math.min(1, (performance.now() - c.maraAt) / 3000);
        const ease = k * k * (3 - 2 * k);
        c.mara.position.lerpVectors(c.maraFrom, c.maraTo, ease);
        c.mara.position.y = k < 1 ? Math.abs(Math.sin(performance.now() / 120)) * 0.05 : 0;
        c.mara.rotation.y = Math.atan2(at.x - c.mara.position.x, at.z - c.mara.position.z);
      }
    };
    return () => {
      w.dispose();
      stopThought();
    };
  }, [input]);

  useEffect(() => {
    if (cast.current) cast.current.line = line;
    const clip = WIN_SCENE.lines[line]?.clip;
    if (clip) speakPieces([clip.id], plainWords(clip.say), 0.35);
  }, [line]);

  const next = () => {
    if (line < last) setLine(line + 1);
    else onDone();
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
    window.addEventListener('keydown', key);
    globalThis.__tapoutIntro = { pack: () => undefined, zip: () => undefined, next: () => latestNext.current() };
    return () => {
      window.removeEventListener('keydown', key);
      globalThis.__tapoutIntro = undefined;
    };
  }, []);

  const l = WIN_SCENE.lines[line]!;
  return (
    <div className="world win-scene" ref={host}>
      <div className="intro-subtitle" onClick={next}>
        {l.who && <b>{WIN_SCENE.names[l.who]}</b>}
        <p className={l.who ? '' : 'seen'}>{l.text}</p>
        <span className="intro-hint">{WIN_SCENE.next} · Space</span>
      </div>
    </div>
  );
}
