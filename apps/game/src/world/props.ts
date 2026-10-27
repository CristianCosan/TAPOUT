// Every station as a low-poly thing built from code shapes. No image files: wood, stone,
// canvas and meat are colours on flat-shaded shapes. A prop is rebuilt when what it shows
// changes (the shelter goes up a tier, the cache gets a platform).

import * as THREE from 'three';
import { mat, mesh, pole, rough, seeded, signTexture, v } from './kit.ts';

/** What the props show of the run. Read from v12's state by the screen, never changed here. */
export interface PropState {
  structure: number;
  dugout: boolean;
  /** rc.4: dugout sessions done (1-2 the pit, 3 the walls), so each stage shows. */
  dugoutProg?: number;
  /** rc.4: sessions done towards the next shelter tier, and how many it needs. */
  buildProg?: number;
  buildNeed?: number;
  insulation: number;
  bed: boolean;
  firepitTier: number;
  fireLit: boolean;
  rackTier: number;
  hugeRack: boolean;
  cacheTier: number;
  chair: boolean;
  table: boolean;
  day: number;
  winter: boolean;
  /** The animal you spotted, if any (v12's species id). */
  species: string;
  /** What lies in camp: logs and firewood on the pile, meat and berries at the hook, materials. */
  logs: number;
  firewood: number;
  meat: number;
  berries: number;
  rocks: number;
  moss: number;
  clay: number;
  tinder: number;
  /** Smoked portions in store, and portions on the rack smoking now. */
  smoked: number;
  smoking: number;
  /** Fishing spots where your line is set. */
  lines: readonly string[];
  /** Snares set on the trapline; whether the gill net is built, and where it is set. */
  snares: number;
  netBuilt: boolean;
  netSpot: string;
  /** Labels for the exits, by station id. */
  exitLabels: Readonly<Record<string, string>>;
}

// ---- palette

const C = {
  bark: 0x5b4330,
  wood: 0x8a6a48,
  woodLight: 0xb08d63,
  woodDark: 0x4a3626,
  cut: 0xc9a77a,
  stone: 0x7c7a74,
  stoneDark: 0x5e5c58,
  ash: 0x3a3633,
  tarp: 0x3f6a5a,
  tarpBlue: 0x35587a,
  canvas: 0xa89a78,
  bough: 0x2f4a30,
  moss: 0x58783a,
  clay: 0x8e8270,
  meat: 0x8c2f2a,
  metal: 0x3b3e42,
  pack: 0xa2462e,
  black: 0x18191b,
  bag: 0x9a5a2a,
  berry: 0x5a2350,
  snow: 0xe8eef2,
  fur: 0x6b4f36,
  water: 0x2a4652,
  ice: 0xbfd3dc,
  rope: 0xb9a888,
};

/** Two sloping sheets meeting at a ridge: a tarp tent, open at both ends. */
function tent(halfWidth: number, height: number, front: number, back: number): THREE.BufferGeometry {
  const p = [
    [-halfWidth, 0, front], [0, height, front], [0, height, back], [-halfWidth, 0, back],
    [halfWidth, 0, front], [0, height, front], [0, height, back], [halfWidth, 0, back],
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(p.flat(), 3));
  geo.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6]);
  geo.computeVertexNormals();
  return geo;
}

const stoneGeo = (r: number, seed: number) => rough(new THREE.DodecahedronGeometry(r, 0), r * 0.35, seed);

function stoneRing(g: THREE.Group, radius: number, count: number, size: number, color: number, seed: number) {
  const rnd = seeded(seed);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + rnd() * 0.2;
    const s = size * (0.8 + rnd() * 0.5);
    g.add(mesh(stoneGeo(s, seed + i), mat(color), Math.cos(a) * radius, s * 0.45, Math.sin(a) * radius, rnd(), rnd() * 3, rnd()));
  }
}

function log(g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, r: number, color = C.bark) {
  const m = pole(a, b, r, mat(color), 7);
  g.add(m);
  return m;
}

// ---- camp

function fire(s: PropState): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CircleGeometry(0.75, 10), mat(C.ash), 0, 0.02, 0, -Math.PI / 2));
  if (s.firepitTier >= 2) g.add(mesh(new THREE.TorusGeometry(0.72, 0.12, 4, 14), mat(C.clay), 0, 0.08, 0, -Math.PI / 2));
  stoneRing(g, s.firepitTier >= 1 ? 0.85 : 0.9, s.firepitTier >= 1 ? 14 : 8, s.firepitTier >= 1 ? 0.2 : 0.17, C.stone, 3);
  // A teepee of sticks, charred when lit.
  const wood = s.fireLit ? 0x2a211b : C.bark;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    log(g, v(Math.cos(a) * 0.5, 0.05, Math.sin(a) * 0.5), v(Math.cos(a) * 0.06, 0.6, Math.sin(a) * 0.06), 0.045, wood);
  }
  if (s.fireLit) {
    const flames = new THREE.Group();
    flames.name = 'flames';
    const cols = [0xff6a1a, 0xff9a2a, 0xffd36a];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const r = i === 0 ? 0 : 0.18;
      const h = i === 0 ? 0.95 : 0.55;
      const f = new THREE.Mesh(
        new THREE.ConeGeometry(i === 0 ? 0.22 : 0.13, h, 5),
        new THREE.MeshBasicMaterial({ color: cols[i % 3], transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      f.position.set(Math.cos(a) * r, h / 2 + 0.05, Math.sin(a) * r);
      f.userData.base = h;
      f.userData.phase = i * 1.7;
      flames.add(f);
    }
    g.add(flames);
    g.add(mesh(new THREE.CircleGeometry(0.45, 8), new THREE.MeshBasicMaterial({ color: 0xff5a10 }), 0, 0.03, 0, -Math.PI / 2));
  } else {
    // Coals in the ash, dark until the screen says a fire has just gone out; then they glow and fade.
    const embers = new THREE.Group();
    embers.name = 'embers';
    const rnd = seeded(12);
    for (let i = 0; i < 11; i++) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * 0.38;
      const e = new THREE.Mesh(
        rough(new THREE.IcosahedronGeometry(0.035 + rnd() * 0.03, 0), 0.01, i),
        new THREE.MeshBasicMaterial({ color: i % 3 ? 0xff4a10 : 0xff8a2a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      e.position.set(Math.cos(a) * r, 0.04, Math.sin(a) * r);
      e.userData.phase = rnd() * 6;
      embers.add(e);
    }
    g.add(embers);
  }
  return g;
}

function water(): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(stoneGeo(0.32, 7), mat(C.stoneDark), 0, 0.12, 0, 0, 0, 0));
  const pot = mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.22, 10, 1, true), mat(C.metal, { metal: 0.6, rough: 0.5 }), 0, 0.42, 0);
  (pot.material as THREE.Material).side = THREE.DoubleSide;
  g.add(pot);
  g.add(mesh(new THREE.CircleGeometry(0.16, 10), mat(C.water, { rough: 0.2 }), 0, 0.48, 0, -Math.PI / 2));
  g.add(mesh(new THREE.TorusGeometry(0.17, 0.012, 4, 12, Math.PI), mat(C.metal, { metal: 0.6 }), 0, 0.53, 0));
  // A water bottle beside it.
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 8), mat(0x4a6e86, { rough: 0.4 }), 0.35, 0.12, 0.12));
  return g;
}

/** A row of icicles hanging from a drip edge, from a to b, longest where the melt runs off. */
function icicles(g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, seed: number) {
  const rnd = seeded(seed);
  const n = Math.round(a.distanceTo(b) * 7);
  const ice = mat(0xd4e8f0, { rough: 0.15, metal: 0.1 });
  for (let i = 0; i < n; i++) {
    if (rnd() < 0.3) continue;
    const p = a.clone().lerp(b, (i + rnd() * 0.6) / n);
    const len = 0.06 + rnd() * rnd() * 0.42;
    g.add(mesh(new THREE.ConeGeometry(0.012 + len * 0.06, len, 4), ice, p.x, p.y - len / 2, p.z, Math.PI, rnd() * 3, 0));
  }
}

function shelter(s: PropState): THREE.Group {
  const g = new THREE.Group();
  // Bedding on the ground, whatever the tier.
  const bedding = s.bed || s.insulation > 0;
  g.add(mesh(new THREE.BoxGeometry(0.8, 0.12, 2.0), mat(bedding ? C.bough : 0x5a5040), 0, 0.06, -0.1));
  g.add(mesh(rough(new THREE.CapsuleGeometry(0.28, 1.3, 3, 6), 0.03), mat(C.bag), 0, 0.22, -0.1, Math.PI / 2, 0, 0));

  if (s.dugout) {
    g.add(mesh(rough(new THREE.SphereGeometry(1.8, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0.25, 5), mat(s.winter ? C.snow : 0x5a4a36), 0, 0, -0.6));
    g.add(mesh(new THREE.BoxGeometry(0.9, 1.0, 0.4), mat(C.black), 0, 0.5, 1.05));
    return g;
  }
  const dug = s.dugoutProg ?? 0;
  if (dug > 0) {
    // rc.4: the dugout as it stands: a pit with its spoil heaped beside it, then log walls round
    // the rim. Until the roof, the tarp is stretched flat over it on four stakes.
    const earth = mat(s.winter ? C.snow : 0x5a4a36);
    g.add(mesh(new THREE.BoxGeometry(2.6, 0.04, 3.0), mat(0x2a2016), 0, 0.02, -0.2));
    for (const [x, z, r] of [[-2.0, 0.2, 0.55], [-1.9, -1.2, 0.5], [2.0, -0.6, 0.45]] as const) {
      g.add(mesh(rough(new THREE.SphereGeometry(r * (0.6 + dug * 0.25), 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0.15, x * 3), earth, x, 0, z));
    }
    if (dug >= 3) {
      for (let i = 0; i < 3; i++) {
        const y = 0.1 + i * 0.2;
        log(g, v(-1.4, y, 1.3), v(1.4, y, 1.3), 0.1);
        log(g, v(-1.4, y, -1.7), v(1.4, y, -1.7), 0.1);
        log(g, v(-1.4, y, 1.3), v(-1.4, y, -1.7), 0.1);
        log(g, v(1.4, y, 1.3), v(1.4, y, -1.7), 0.1);
      }
    }
    const top = dug >= 3 ? 0.75 : 0.55;
    for (const x of [-1.3, 1.3]) for (const z of [1.2, -1.6]) log(g, v(x, 0, z), v(x, top, z), 0.03, C.wood);
    const sheet = mesh(new THREE.BoxGeometry(2.8, 0.02, 3.1), mat(C.tarp, { key: 'ds' }), 0, top, -0.2, 0.04, 0, 0);
    g.add(sheet);
    return g;
  }

  switch (s.structure) {
    case 0: {
      // A tarp over a ridge line strung low between two sticks.
      log(g, v(0, 0, 1.15), v(0, 1.0, 1.15), 0.03, C.wood);
      log(g, v(0, 0, -1.35), v(0, 1.0, -1.35), 0.03, C.wood);
      const tarp = new THREE.Mesh(tent(0.85, 0.95, 1.1, -1.3), mat(C.tarp, { key: 'ds' }));
      (tarp.material as THREE.Material).side = THREE.DoubleSide;
      tarp.castShadow = true;
      tarp.receiveShadow = true;
      g.add(tarp);
      for (const x of [-0.9, 0.9]) for (const z of [1.0, -1.15]) g.add(mesh(new THREE.ConeGeometry(0.02, 0.2, 4), mat(C.wood), x, 0.05, z, Math.PI, 0, 0));
      break;
    }
    case 1: {
      // Lean-to: a ridge pole on two forked posts, poles laid back to the ground, boughs on top.
      log(g, v(-1.4, 0, 0.6), v(-1.4, 1.7, 0.6), 0.06);
      log(g, v(1.4, 0, 0.6), v(1.4, 1.7, 0.6), 0.06);
      log(g, v(-1.7, 1.65, 0.6), v(1.7, 1.65, 0.6), 0.06);
      for (let i = 0; i < 8; i++) {
        const x = -1.3 + i * 0.37;
        log(g, v(x, 1.7, 0.6), v(x, 0, -1.4), 0.04, C.wood);
      }
      const roof = mesh(rough(new THREE.BoxGeometry(3.0, 0.16, 2.7, 4, 1, 4), 0.12, 2), mat(s.winter ? C.snow : C.bough), 0, 0.92, -0.4, 0.88, 0, 0);
      g.add(roof);
      if (s.winter) icicles(g, v(-1.45, 1.6, 0.66), v(1.45, 1.6, 0.66), 31);
      break;
    }
    case 2: {
      // Framed hut: an A-frame with walls of poles and a bough roof.
      for (const z of [1.2, -1.4]) {
        log(g, v(-1.4, 0, z), v(0, 2.1, z), 0.07);
        log(g, v(1.4, 0, z), v(0, 2.1, z), 0.07);
      }
      log(g, v(0, 2.1, 1.5), v(0, 2.1, -1.7), 0.07);
      for (const side of [-1, 1]) {
        const r = mesh(rough(new THREE.BoxGeometry(0.18, 2.55, 3.0, 1, 4, 4), 0.1, side + 4), mat(s.winter ? C.snow : C.bough), side * 0.72, 1.05, -0.1, 0, 0, side * -0.59);
        g.add(r);
      }
      g.add(mesh(new THREE.BoxGeometry(2.4, 1.6, 0.12), mat(C.woodDark), 0, 0.7, -1.45, 0, 0, 0));
      break;
    }
    default: {
      // Timber shelter: a small log cabin with a doorway towards the fire.
      const w = 3.2;
      const d = 2.8;
      for (let i = 0; i < 6; i++) {
        const y = 0.12 + i * 0.24;
        log(g, v(-w / 2 - 0.15, y, -d / 2), v(w / 2 + 0.15, y, -d / 2), 0.12);
        log(g, v(-w / 2, y + 0.12, -d / 2 - 0.15), v(-w / 2, y + 0.12, d / 2 + 0.15), 0.12);
        log(g, v(w / 2, y + 0.12, -d / 2 - 0.15), v(w / 2, y + 0.12, d / 2 + 0.15), 0.12);
        if (i > 3) log(g, v(-w / 2 - 0.15, y, d / 2), v(w / 2 + 0.15, y, d / 2), 0.12);
        else {
          log(g, v(-w / 2 - 0.15, y, d / 2), v(-0.5, y, d / 2), 0.12);
          log(g, v(0.5, y, d / 2), v(w / 2 + 0.15, y, d / 2), 0.12);
        }
      }
      for (const side of [-1, 1]) {
        g.add(mesh(new THREE.BoxGeometry(2.1, 0.12, d + 0.8), mat(s.winter ? C.snow : C.woodDark), side * 0.92, 2.0, 0, 0, 0, side * -0.5));
        if (s.winter) icicles(g, v(side * 1.85, 1.46, -d / 2 - 0.35), v(side * 1.85, 1.46, d / 2 + 0.35), 40 + side);
      }
      break;
    }
  }
  if ((s.buildProg ?? 0) > 0 && s.structure < 3) workSite(g, s);
  if (s.insulation > 0 && s.structure > 0 && !s.winter) {
    const rnd = seeded(8);
    for (let i = 0; i < s.insulation * 4; i++) g.add(mesh(rough(new THREE.SphereGeometry(0.22, 5, 3), 0.08, i), mat(C.moss), -1.2 + rnd() * 2.4, 0.15, -1.3 + rnd() * 0.3));
  }
  return g;
}

// rc.4: the next tier going up beside the old one, a piece at a time, so the camp shows how far
// along it is. Each session adds its share of the frame.
function workSite(g: THREE.Group, s: PropState) {
  const pieces: [THREE.Vector3, THREE.Vector3, number][] = [];
  const ox = 3.4;
  if (s.structure === 0) {
    pieces.push([v(ox - 1.2, 0, 0.6), v(ox - 1.2, 1.7, 0.6), 0.06], [v(ox + 1.2, 0, 0.6), v(ox + 1.2, 1.7, 0.6), 0.06], [v(ox - 1.5, 1.65, 0.6), v(ox + 1.5, 1.65, 0.6), 0.06]);
    for (let i = 0; i < 6; i++) pieces.push([v(ox - 1.1 + i * 0.44, 1.7, 0.6), v(ox - 1.1 + i * 0.44, 0, -1.4), 0.04]);
  } else if (s.structure === 1) {
    for (const z of [1.2, 0, -1.4]) pieces.push([v(ox - 1.4, 0, z), v(ox, 2.1, z), 0.07], [v(ox + 1.4, 0, z), v(ox, 2.1, z), 0.07]);
    pieces.push([v(ox, 2.1, 1.5), v(ox, 2.1, -1.7), 0.07]);
  } else {
    for (let i = 0; i < 6; i++) {
      const y = 0.12 + i * 0.24;
      pieces.push([v(ox - 1.6, y, -1.4), v(ox + 1.6, y, -1.4), 0.12], [v(ox - 1.6, y + 0.12, -1.55), v(ox - 1.6, y + 0.12, 1.55), 0.12], [v(ox + 1.6, y + 0.12, -1.55), v(ox + 1.6, y + 0.12, 1.55), 0.12]);
    }
  }
  const k = Math.min(1, (s.buildProg ?? 0) / Math.max(1, s.buildNeed ?? 1));
  const n = Math.max(1, Math.round(pieces.length * k));
  for (const [a, b, r] of pieces.slice(0, n)) log(g, a, b, r);
  // The cut logs still waiting to go up.
  for (let i = 0; i < Math.max(0, 4 - Math.round(k * 4)); i++) log(g, v(ox - 0.9, 0.1 + (i % 2) * 0.18, 2.2 + Math.floor(i / 2) * 0.2), v(ox + 0.9, 0.1 + (i % 2) * 0.18, 2.2 + Math.floor(i / 2) * 0.2), 0.09);
}

function pack(): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(rough(new THREE.BoxGeometry(0.42, 0.62, 0.26, 2, 2, 2), 0.04, 3), mat(C.pack), 0, 0.31, 0, -0.2, 0, 0));
  g.add(mesh(new THREE.BoxGeometry(0.36, 0.22, 0.12), mat(0x7e3522), 0, 0.22, 0.17, -0.2, 0, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.48, 8), mat(0x2f4a5a), 0, 0.68, -0.02, 0, 0, Math.PI / 2));
  return g;
}

function rack(s: PropState): THREE.Group {
  const g = new THREE.Group();
  if (s.rackTier <= 0 && !s.hugeRack) {
    // Not built: poles leaning on a tree stump, waiting.
    g.add(mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.5, 7), mat(C.bark), 0, 0.25, 0));
    for (let i = 0; i < 4; i++) log(g, v(-0.6 + i * 0.35, 0, 0.8), v(-0.1 + i * 0.08, 1.4, 0.05), 0.03, C.wood);
    return g;
  }
  const w = s.hugeRack ? 2.6 : 1.6;
  const h = s.rackTier >= 2 || s.hugeRack ? 1.9 : 1.5;
  for (const x of [-w / 2, w / 2]) {
    log(g, v(x, 0, -0.5), v(x, h, -0.5), 0.05);
    log(g, v(x, 0, 0.5), v(x, h, 0.5), 0.05);
    log(g, v(x, h - 0.05, -0.6), v(x, h - 0.05, 0.6), 0.04);
  }
  for (let i = 0; i < (s.rackTier >= 2 ? 5 : 3); i++) {
    const z = -0.4 + (i * 0.8) / Math.max(1, (s.rackTier >= 2 ? 5 : 3) - 1);
    log(g, v(-w / 2 - 0.1, h * 0.75, z), v(w / 2 + 0.1, h * 0.75, z), 0.025, C.wood);
  }
  log(g, v(-w / 2 - 0.1, h, 0), v(w / 2 + 0.1, h, 0), 0.04);
  // Strips on the rails: raw red while they smoke, dark once smoked (up to 10 shown).
  const bars = s.rackTier >= 2 ? 5 : 3;
  const raw = Math.min(10, s.smoking);
  const strips = Math.min(10, raw + s.smoked);
  for (let i = 0; i < strips; i++) {
    const z = -0.4 + ((i % bars) * 0.8) / Math.max(1, bars - 1);
    const x = -w / 2 + 0.25 + (Math.floor(i / bars) + 0.5) * ((w - 0.5) / Math.ceil(10 / bars)) + (i % 2) * 0.12;
    g.add(mesh(new THREE.BoxGeometry(0.08, 0.35, 0.03), mat(i < raw ? C.meat : 0x5a2a22), x, h * 0.75 - 0.2, z));
  }
  if (raw > 0) {
    // A smoulder under the rack and a haze of smoke.
    g.add(mesh(new THREE.CircleGeometry(0.3, 8), new THREE.MeshBasicMaterial({ color: 0xc24a14 }), 0, 0.03, 0, -Math.PI / 2));
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.35 + i * 0.12, 7, 5), new THREE.MeshBasicMaterial({ color: 0xb8b8b4, transparent: true, opacity: 0.22 - i * 0.05, depthWrite: false }));
      puff.position.set(0.05 * i, 0.5 + i * 0.55, 0.05 * i);
      g.add(puff);
    }
  }
  if (s.rackTier >= 2 || s.hugeRack) {
    const roof = mesh(new THREE.PlaneGeometry(w + 0.6, 1.5), mat(C.tarpBlue, { key: 'ds' }), 0, h + 0.18, 0, -Math.PI / 2 + 0.15, 0, 0);
    (roof.material as THREE.Material).side = THREE.DoubleSide;
    g.add(roof);
  }
  return g;
}

function cache(s: PropState): THREE.Group {
  const g = new THREE.Group();
  if (s.cacheTier <= 0) {
    // A cleared spot and a few stones: where the cache will go.
    stoneRing(g, 0.6, 6, 0.16, C.stone, 12);
    g.add(mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), mat(C.bag), 0, 0.15, 0));
    return g;
  }
  const lift = s.cacheTier >= 3 ? 1.6 : 0;
  if (lift) {
    for (const [x, z] of [[-0.6, -0.5], [0.6, -0.5], [-0.6, 0.5], [0.6, 0.5]] as const) log(g, v(x, 0, z), v(x, lift + 0.1, z), 0.08);
    g.add(mesh(new THREE.BoxGeometry(1.6, 0.1, 1.3), mat(C.wood), 0, lift, 0));
    for (let i = 0; i < 5; i++) log(g, v(0.85, i * 0.33, 0.9), v(0.85, i * 0.33, 0.6), 0.03, C.wood);
    log(g, v(0.85, 0, 0.9), v(0.85, lift, 0.9), 0.035, C.wood);
  }
  const body = mesh(rough(new THREE.BoxGeometry(1.2, 0.8, 1.0, 3, 2, 3), 0.08, 4), mat(C.stone), 0, lift + 0.4, 0);
  g.add(body);
  for (let i = 0; i < 3; i++) log(g, v(-0.65, lift + 0.85, -0.35 + i * 0.35), v(0.65, lift + 0.85, -0.35 + i * 0.35), 0.07);
  g.add(mesh(stoneGeo(0.22, 5), mat(C.stoneDark), 0.1, lift + 1.05, 0));
  if (s.cacheTier >= 2) g.add(mesh(new THREE.BoxGeometry(1.24, 0.06, 1.04), mat(C.clay), 0, lift + 0.78, 0));
  return g;
}

function post(s: PropState): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.1, 7), mat(C.wood), 0, 1.05, 0));
  for (let i = 0; i < Math.min(s.day, 40); i++) {
    const row = i % 20;
    const col = Math.floor(i / 20);
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.018, 0.02), mat(C.cut), 0, 0.45 + row * 0.07, 0.1 + col * 0.0, 0, col * 0.6, 0));
  }
  return g;
}

function camera(): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    log(g, v(Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45), v(0, 1.35, 0), 0.02, C.metal);
  }
  // The head turns on the tripod (the screen eases it round to keep you in frame); the tally light blinks while it records.
  const head = new THREE.Group();
  head.name = 'cam-head';
  head.position.set(0, 1.5, 0);
  head.add(mesh(new THREE.BoxGeometry(0.22, 0.24, 0.42), mat(C.black, { rough: 0.5 })));
  head.add(mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.18, 10), mat(C.black, { rough: 0.3, metal: 0.4 }), 0, 0, 0.28, Math.PI / 2, 0, 0));
  const tally = mesh(new THREE.SphereGeometry(0.02, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff2020 }), 0.08, 0.14, 0.2);
  tally.name = 'tally';
  head.add(tally);
  g.add(head);
  g.add(mesh(new THREE.BoxGeometry(0.3, 0.2, 0.24), mat(0x2a2c2e), 0.05, 0.12, 0.05));
  return g;
}

function comforts(s: PropState): THREE.Group {
  const g = new THREE.Group();
  if (s.chair) {
    g.add(mesh(new THREE.BoxGeometry(0.55, 0.08, 0.5), mat(C.wood), -0.5, 0.45, 0));
    for (const [x, z] of [[-0.72, -0.2], [-0.28, -0.2], [-0.72, 0.2], [-0.28, 0.2]] as const) log(g, v(x, 0, z), v(x, 0.45, z), 0.03);
    g.add(mesh(new THREE.BoxGeometry(0.55, 0.5, 0.06), mat(C.wood), -0.5, 0.72, -0.24, -0.15, 0, 0));
  } else {
    g.add(mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.45, 8), mat(C.bark), -0.5, 0.22, 0));
    g.add(mesh(new THREE.CircleGeometry(0.24, 8), mat(C.cut), -0.5, 0.451, 0, -Math.PI / 2));
  }
  if (s.table) {
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.07, 0.6), mat(C.woodLight), 0.45, 0.72, 0));
    for (const [x, z] of [[0.08, -0.22], [0.82, -0.22], [0.08, 0.22], [0.82, 0.22]] as const) log(g, v(x, 0, z), v(x, 0.72, z), 0.035);
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), mat(C.metal, { metal: 0.5 }), 0.4, 0.8, 0.05));
  }
  return g;
}

function stump(): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(rough(new THREE.CylinderGeometry(0.34, 0.42, 0.55, 9), 0.04, 2), mat(C.bark), 0, 0.27, 0));
  g.add(mesh(new THREE.CircleGeometry(0.33, 9), mat(C.cut), 0, 0.551, 0, -Math.PI / 2));
  // The axe, bitten into the top.
  const axe = new THREE.Group();
  axe.add(mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.75, 6), mat(C.woodLight), 0, 0.37, 0));
  axe.add(mesh(new THREE.BoxGeometry(0.05, 0.12, 0.2), mat(C.metal, { metal: 0.7, rough: 0.4 }), 0, 0.02, 0.06));
  axe.position.set(0.05, 0.52, 0);
  axe.rotation.set(0.5, 0.3, 0);
  g.add(axe);
  return g;
}

/** Logs stacked in rows as they come in (up to 18 shown), split firewood in front (up to 12). */
function woodpile(s: PropState): THREE.Group {
  const g = new THREE.Group();
  const rnd = seeded(21);
  let logs = Math.min(18, s.logs);
  for (let row = 0; row < 4 && logs > 0; row++) {
    for (let i = 0; i < 6 - row && logs > 0; i++, logs--) {
      const x = -0.9 + i * 0.32 + row * 0.16;
      const y = 0.13 + row * 0.24;
      const m = log(g, v(x, y, -0.55), v(x + (rnd() - 0.5) * 0.08, y, 0.55), 0.12, C.bark);
      m.rotation.y += (rnd() - 0.5) * 0.05;
    }
  }
  // Two rails it sits on, so an empty pile still reads as a woodpile.
  for (const x of [-0.85, 0.75]) log(g, v(x, 0.03, -0.6), v(x + 0.1, 0.03, 0.6), 0.04, C.woodDark);
  const split = Math.min(12, s.firewood);
  for (let i = 0; i < split; i++) {
    const layer = Math.floor(i / 6);
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.42, 3), mat(C.cut), -0.75 + (i % 6) * 0.28 + layer * 0.14, 0.08 + layer * 0.15, 0.95, 0, rnd(), Math.PI / 2));
  }
  return g;
}

/** The meat hook: a piece hanging for each portion (up to 4), berries filling the basket (up to 12). */
function food(s: PropState): THREE.Group {
  const g = new THREE.Group();
  log(g, v(-0.5, 0, 0), v(0, 1.9, 0), 0.04);
  log(g, v(0.5, 0, 0.1), v(0, 1.9, 0), 0.04);
  log(g, v(0, 0, -0.5), v(0, 1.9, 0), 0.04);
  g.add(mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.5, 4), mat(C.rope), 0, 1.65, 0));
  const meat = Math.min(4, s.meat);
  for (let i = 0; i < meat; i++) {
    const a = (i / Math.max(1, meat)) * Math.PI * 2;
    const r = meat > 1 ? 0.13 : 0;
    g.add(mesh(rough(new THREE.SphereGeometry(0.15, 6, 5), 0.05, 4 + i), mat(C.meat), Math.cos(a) * r, 1.3 - i * 0.04, Math.sin(a) * r));
  }
  // A bark basket with berries.
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.18, 8), mat(C.woodLight), 0.55, 0.09, 0.45));
  const rnd = seeded(5);
  for (let i = 0; i < Math.min(12, s.berries); i++) g.add(mesh(new THREE.SphereGeometry(0.035, 5, 4), mat(C.berry, { rough: 0.4 }), 0.55 + (rnd() - 0.5) * 0.24, 0.19 + (i > 8 ? 0.04 : 0), 0.45 + (rnd() - 0.5) * 0.24));
  return g;
}

/** Materials: a stone heap (up to 10), a moss mound that grows with the moss, clay balls, a tinder bundle. */
function stock(s: PropState): THREE.Group {
  const g = new THREE.Group();
  const rnd = seeded(31);
  for (let i = 0; i < Math.min(10, s.rocks); i++) g.add(mesh(stoneGeo(0.14 + rnd() * 0.08, i + 40), mat(C.stone), -0.55 + rnd() * 0.4, 0.1 + (i >= 5 ? 0.18 : 0), -0.2 + rnd() * 0.4));
  if (s.moss > 0) {
    const k = 0.5 + 0.5 * Math.min(1, s.moss / 15);
    const m = mesh(rough(new THREE.SphereGeometry(0.32, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0.08, 3), mat(C.moss), 0.25, 0, -0.1);
    m.scale.setScalar(k);
    g.add(m);
  }
  for (let i = 0; i < Math.min(3, s.clay); i++) g.add(mesh(rough(new THREE.SphereGeometry(0.16, 6, 4), 0.05, 7 + i), mat(C.clay), 0.75 + i * 0.12, 0.1 + (i === 2 ? 0.16 : 0), 0.2 - i * 0.18));
  if (s.tinder > 0) g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.35, 6), mat(0xd0c4a8), 0.3, 0.06, 0.4, 0, 0, Math.PI / 2));
  return g;
}

function killsite(s: PropState): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CircleGeometry(0.9, 9), mat(s.winter ? 0x9a3a3a : 0x4a1f1a), 0, 0.015, 0, -Math.PI / 2));
  g.add(mesh(rough(new THREE.CapsuleGeometry(0.32, 0.8, 3, 7), 0.07, 2), mat(C.fur), 0, 0.3, 0, 0, 0.4, Math.PI / 2));
  g.add(mesh(rough(new THREE.CapsuleGeometry(0.12, 0.3, 2, 6), 0.03, 3), mat(C.fur), 0.6, 0.25, 0.25, 0, 0.4, 1.0));
  return g;
}

function snag(): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(rough(new THREE.CylinderGeometry(0.1, 0.25, 7.5, 6), 0.06, 3), mat(0x6e6a62), 0, 3.75, 0));
  const rnd = seeded(9);
  for (let i = 0; i < 6; i++) {
    const y = 2.5 + i * 0.75;
    const a = rnd() * Math.PI * 2;
    log(g, v(0, y, 0), v(Math.cos(a) * 1.0, y + 0.45, Math.sin(a) * 1.0), 0.035, 0x6e6a62);
  }
  // Roger, the raven.
  const bird = new THREE.Group();
  bird.add(mesh(new THREE.CapsuleGeometry(0.1, 0.18, 2, 6), mat(C.black, { rough: 0.5 }), 0, 0, 0, Math.PI / 2 - 0.4, 0, 0));
  bird.add(mesh(new THREE.ConeGeometry(0.04, 0.12, 4), mat(0x101010), 0, 0.12, 0.19, Math.PI / 2, 0, 0));
  bird.position.set(0, 7.65, 0);
  g.add(bird);
  return g;
}

function sapling(height: number, color: number): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.07, height * 0.3, 5), mat(C.bark), 0, height * 0.15, 0));
  for (let i = 0; i < 3; i++) {
    const h = height * (0.5 - i * 0.1);
    g.add(mesh(new THREE.ConeGeometry(height * (0.3 - i * 0.07), h, 7), mat(color), 0, height * 0.3 + i * height * 0.22 + h / 2, 0));
  }
  return g;
}

function jay(s: PropState): THREE.Group {
  const g = sapling(2.4, s.winter ? 0x6f8a78 : 0x2f4a33);
  const bird = new THREE.Group();
  bird.add(mesh(new THREE.CapsuleGeometry(0.06, 0.1, 2, 6), mat(0x8a9196), 0, 0, 0, Math.PI / 2 - 0.3, 0, 0));
  bird.add(mesh(new THREE.SphereGeometry(0.05, 6, 4), mat(0xe8e8e2), 0, 0.07, 0.07));
  bird.position.set(0.35, 1.4, 0.2);
  bird.name = 'jay-bird';
  g.add(bird);
  return g;
}

/** A signpost at the edge of the area pointing the way to the next place. */
function exit(label: string): THREE.Group {
  const g = new THREE.Group();
  log(g, v(0, 0, 0), v(0, 2.0, 0), 0.07);
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.48, 0.06), [
    mat(C.woodDark),
    mat(C.woodDark),
    mat(C.woodDark),
    mat(C.woodDark),
    new THREE.MeshStandardMaterial({ map: signTexture(label), roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ map: signTexture(label), roughness: 0.9 }),
  ]);
  board.position.set(0.25, 1.6, 0.1);
  board.castShadow = true;
  g.add(board);
  return g;
}

// ---- shore

/** A flat rock over the water; your rod, line and float only while a line is set here. */
function fishingSpot(seed: number, set: boolean, netHere = false): THREE.Group {
  const g = new THREE.Group();
  if (netHere) {
    // Your gill net: a line of floats out on the water.
    for (let i = 0; i < 7; i++) g.add(mesh(new THREE.SphereGeometry(0.06, 6, 4), mat(0xe0b030, { rough: 0.5 }), -1.2 + i * 0.4, -0.18, -3.2 - Math.sin(i) * 0.15));
  }
  g.add(mesh(rough(new THREE.CylinderGeometry(1.0, 1.3, 0.45, 8), 0.2, seed), mat(C.stone), 0, 0.05, 0));
  if (set) {
    log(g, v(0.3, 0.2, 0.3), v(0.1, 1.5, -1.6), 0.025, C.wood);
    g.add(mesh(new THREE.CylinderGeometry(0.003, 0.003, 1.4, 3), mat(0xdddddd), 0.1, 0.8, -1.65, 0, 0, 0.0));
    g.add(mesh(new THREE.SphereGeometry(0.05, 6, 4), mat(0xd23a2a, { rough: 0.4 }), 0.1, 0.06, -1.65));
    // Stones holding the butt of the rod down.
    for (let i = 0; i < 2; i++) g.add(mesh(stoneGeo(0.1, seed + 60 + i), mat(C.stoneDark), 0.3 + i * 0.16, 0.32, 0.36 - i * 0.08));
  }
  return g;
}

/** The net frame: a few strands while it is being woven, the whole net hanging when it is home, empty while it is set. */
function net(s: PropState): THREE.Group {
  const g = new THREE.Group();
  log(g, v(-1.0, 0, 0), v(-1.0, 1.6, 0), 0.05);
  log(g, v(1.0, 0, 0), v(1.0, 1.6, 0), 0.05);
  log(g, v(-1.2, 1.55, 0), v(1.2, 1.55, 0), 0.04);
  if (s.netBuilt && !s.netSpot) {
    const mesh0 = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.3, 12, 8), new THREE.MeshBasicMaterial({ color: 0xc8bfa8, wireframe: true }));
    mesh0.position.set(0, 0.85, 0);
    g.add(mesh0);
  } else if (!s.netBuilt) {
    for (let i = 0; i < 5; i++) g.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.5 + (i % 3) * 0.2, 3), mat(0xc8bfa8), -0.8 + i * 0.4, 1.3 - (i % 3) * 0.1, 0));
  }
  return g;
}

function edge(): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(rough(new THREE.CylinderGeometry(0.6, 0.7, 0.18, 7), 0.08, 3), mat(C.stoneDark), 0, 0.02, 0));
  g.add(mesh(new THREE.TorusGeometry(0.9, 0.02, 3, 20), new THREE.MeshBasicMaterial({ color: 0x9fb8c4, transparent: true, opacity: 0.5 }), 0, 0.0, -0.6, -Math.PI / 2));
  return g;
}

function rockBar(): THREE.Group {
  const g = new THREE.Group();
  const rnd = seeded(77);
  for (let i = 0; i < 12; i++) {
    const s = 0.2 + rnd() * 0.25;
    const m = mesh(rough(new THREE.CylinderGeometry(s, s * 1.1, s * 0.4, 7), s * 0.2, i), mat(i % 3 ? C.stone : C.stoneDark), (rnd() - 0.5) * 2, s * 0.2, (rnd() - 0.5) * 1.4, rnd() * 0.3, rnd() * 3, rnd() * 0.3);
    g.add(m);
  }
  return g;
}

function clay(s: PropState): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(rough(new THREE.SphereGeometry(1.4, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), 0.25, 4), mat(s.winter ? C.snow : 0x6a5a40), 0, -0.3, -0.6, 0, 0, 0));
  g.add(mesh(rough(new THREE.BoxGeometry(1.4, 0.5, 0.6, 3, 1, 1), 0.12, 6), mat(C.clay), 0, 0.15, 0.55));
  return g;
}

function iceCache(): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CircleGeometry(0.5, 10), mat(0x0e1c22, { rough: 0.2 }), 0, 0.02, 0, -Math.PI / 2));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), mat(C.ice, { rough: 0.2 }), Math.cos(a) * 0.8, 0.15, Math.sin(a) * 0.8, 0, -a, 0));
  }
  return g;
}

function ducks(): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const d = new THREE.Group();
    d.add(mesh(new THREE.CapsuleGeometry(0.15, 0.25, 2, 6), mat(0x5a4a3a), 0, 0.08, 0, Math.PI / 2, 0, 0));
    d.add(mesh(new THREE.SphereGeometry(0.09, 6, 4), mat(0x2a4a32), 0, 0.25, 0.2));
    d.position.set(i * 1.3 - 2, 0, (i % 2) * 0.8);
    d.rotation.y = i;
    d.name = 'duck';
    d.userData.home = d.position.clone();
    g.add(d);
  }
  g.scale.setScalar(1.6);
  return g;
}

// ---- woods

function conifer(height: number, color: number, seed: number): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.12 * height * 0.12, 0.2 * height * 0.1, height * 0.35, 6), mat(C.bark), 0, height * 0.17, 0));
  for (let i = 0; i < 4; i++) {
    const h = height * (0.42 - i * 0.06);
    g.add(mesh(rough(new THREE.ConeGeometry(height * (0.24 - i * 0.045), h, 7), 0.1, seed + i), mat(color), 0, height * 0.25 + i * height * 0.17 + h / 2, 0));
  }
  return g;
}

function timber(s: PropState): THREE.Group {
  const g = new THREE.Group();
  const col = s.winter ? 0x55705e : 0x2c4630;
  const a = conifer(11, col, 3);
  const b = conifer(9, col, 5);
  b.position.set(1.6, 0, 0.8);
  const c = conifer(10, col, 7);
  c.position.set(-1.4, 0, 0.9);
  g.add(a, b, c);
  // A felled one with a stump.
  g.add(mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.4, 8), mat(C.bark), 0.3, 0.2, 2.0));
  g.add(mesh(new THREE.CircleGeometry(0.22, 8), mat(C.cut), 0.3, 0.41, 2.0, -Math.PI / 2));
  return g;
}

function birch(): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(rough(new THREE.CylinderGeometry(0.12, 0.18, 8, 7), 0.03, 2), mat(0xddd8cc), 0, 4, 0));
  const rnd = seeded(14);
  for (let i = 0; i < 14; i++) {
    const y = 0.4 + rnd() * 6.5;
    const a = rnd() * Math.PI * 2;
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.05, 0.02), mat(0x222222), Math.cos(a) * 0.15, y, Math.sin(a) * 0.15, 0, -a + Math.PI / 2, 0));
  }
  for (let i = 0; i < 4; i++) g.add(mesh(rough(new THREE.IcosahedronGeometry(1.0, 0), 0.3, i + 3), mat(0x8a9a4a), (rnd() - 0.5) * 1.6, 6.8 + i * 0.5, (rnd() - 0.5) * 1.6));
  // A curl of peeled bark at chest height.
  g.add(mesh(new THREE.TorusGeometry(0.2, 0.03, 3, 8, Math.PI), mat(0xf0e8d8), 0, 1.3, 0.1, 0, 0, 0));
  return g;
}

function animal(s: PropState): THREE.Group {
  const g = new THREE.Group();
  const big = s.species === 'moose';
  const small = s.species === 'hare' || s.species === 'grouse' || s.species === 'squirrel';
  const k = big ? 1.5 : small ? 0.35 : 1;
  const coat = s.species === 'hare' && s.winter ? 0xeeeeee : s.species === 'moose' ? 0x3a2a1e : 0x7a5a3a;
  g.add(mesh(rough(new THREE.CapsuleGeometry(0.32, 0.9, 3, 7), 0.05, 3), mat(coat), 0, 1.05, 0, Math.PI / 2, 0, 0));
  for (const [x, z] of [[-0.18, 0.45], [0.18, 0.45], [-0.18, -0.45], [0.18, -0.45]] as const) log(g, v(x, 0, z), v(x, 0.95, z), 0.05, coat);
  log(g, v(0, 1.2, 0.55), v(0, 1.65, 0.85), 0.11, coat);
  g.add(mesh(new THREE.ConeGeometry(0.12, 0.42, 6), mat(coat), 0, 1.68, 1.02, Math.PI / 2 + 0.4, 0, 0));
  if (!small) {
    for (const side of [-1, 1]) log(g, v(side * 0.06, 1.8, 0.8), v(side * 0.35, 2.15, 0.7), 0.025, 0xb8a888);
  }
  g.scale.setScalar(k);
  return g;
}

/** The trapline post: spare wire loops, and a strip of red flagging tape for each snare you have set. */
function trailhead(label: string, snares: number): THREE.Group {
  const g = exit(label);
  for (let i = 0; i < 3; i++) g.add(mesh(new THREE.TorusGeometry(0.06, 0.008, 3, 8), mat(0xb0a080, { metal: 0.6 }), -0.02, 1.0 + i * 0.12, 0.08));
  for (let i = 0; i < Math.min(6, snares); i++) {
    g.add(mesh(new THREE.BoxGeometry(0.035, 0.2, 0.01), mat(0xd04a2a), -0.09 + i * 0.036, 1.86 - (i % 2) * 0.03, 0.09, 0, 0, (i % 2 ? 1 : -1) * 0.12));
  }
  return g;
}

/** Camp's own timber (rc.3): a fallen trunk, a tangle of deadfall and a standing dead spruce. */
function fallen(): THREE.Group {
  const g = deadfall();
  const snagWood = mat(0x6e6052);
  g.add(mesh(rough(new THREE.CylinderGeometry(0.12, 0.24, 7, 7), 0.04, 9), snagWood, 1.6, 3.5, -1.2));
  for (let i = 0; i < 6; i++) {
    const y = 2.2 + i * 0.75;
    const a = i * 2.1;
    log(g, v(1.6, y, -1.2), v(1.6 + Math.cos(a) * 0.7, y - 0.25, -1.2 + Math.sin(a) * 0.7), 0.025, 0x6e6052);
  }
  return g;
}

/** Loose stones in the slope above camp (rc.3). */
function stones(): THREE.Group {
  const g = new THREE.Group();
  const rnd = seeded(91);
  g.add(mesh(rough(new THREE.DodecahedronGeometry(0.8, 0), 0.2, 3), mat(C.stoneDark), 0, 0.3, -0.4));
  for (let i = 0; i < 9; i++) {
    const s = 0.16 + rnd() * 0.2;
    g.add(mesh(rough(new THREE.DodecahedronGeometry(s, 0), s * 0.25, i + 5), mat(i % 3 ? C.stone : C.stoneDark), (rnd() - 0.5) * 2.2, s * 0.6, 0.3 + (rnd() - 0.5) * 1.2, rnd(), rnd() * 3, rnd()));
  }
  return g;
}

function deadfall(): THREE.Group {
  const g = new THREE.Group();
  log(g, v(-2.2, 0.25, -0.3), v(2.3, 0.35, 0.4), 0.22, 0x6a5a48);
  log(g, v(-1.4, 0.2, 0.8), v(1.6, 0.6, -0.5), 0.15, 0x5e4e3c);
  const rnd = seeded(66);
  for (let i = 0; i < 8; i++) {
    const x = (rnd() - 0.5) * 3;
    const z = (rnd() - 0.5) * 2;
    log(g, v(x, 0.04, z), v(x + (rnd() - 0.5) * 1.2, 0.06, z + (rnd() - 0.5) * 1.2), 0.03, 0x7a6a58);
  }
  return g;
}

function mossyRocks(s: PropState): THREE.Group {
  const g = new THREE.Group();
  const rnd = seeded(5);
  for (let i = 0; i < 4; i++) {
    const r = 0.4 + rnd() * 0.4;
    const x = (rnd() - 0.5) * 1.6;
    const z = (rnd() - 0.5) * 1.2;
    g.add(mesh(stoneGeo(r, i + 50), mat(C.stone), x, r * 0.5, z));
    g.add(mesh(rough(new THREE.SphereGeometry(r * 0.85, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2.4), r * 0.15, i), mat(s.winter ? C.snow : C.moss), x, r * 0.7, z));
  }
  return g;
}

function berries(s: PropState): THREE.Group {
  const g = new THREE.Group();
  const rnd = seeded(8);
  for (let i = 0; i < 4; i++) {
    const r = 0.45 + rnd() * 0.3;
    const x = (rnd() - 0.5) * 2.2;
    const z = (rnd() - 0.5) * 1.6;
    g.add(mesh(rough(new THREE.IcosahedronGeometry(r, 1), r * 0.25, i + 20), mat(s.winter ? 0x6a6458 : 0x3e5a2e), x, r * 0.8, z));
    if (!s.winter) for (let j = 0; j < 8; j++) g.add(mesh(new THREE.SphereGeometry(0.045, 5, 3), mat(j % 2 ? 0x3a3a8a : 0xb02a3a, { rough: 0.4 }), x + (rnd() - 0.5) * r * 1.6, r * (0.5 + rnd() * 0.7), z + (rnd() - 0.5) * r * 1.6));
  }
  return g;
}

function ridge(): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(rough(new THREE.DodecahedronGeometry(2.6, 1), 0.7, 3), mat(C.stone), 0, 0.4, 0));
  g.add(mesh(rough(new THREE.DodecahedronGeometry(1.4, 0), 0.4, 6), mat(C.stoneDark), 1.6, 0.3, 1.4));
  return g;
}

function tracks(): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const m = mesh(new THREE.CircleGeometry(0.07, 6), mat(0x2a2018), (i % 2 ? 0.15 : -0.15) + i * 0.1, 0.02, 1.8 - i * 0.35, -Math.PI / 2);
    m.scale.set(1, 1.6, 1);
    g.add(m);
  }
  return g;
}

/** Builds the prop for one station. */
export function buildProp(id: string, s: PropState): THREE.Group {
  switch (id) {
    case 'fire': return fire(s);
    case 'water': return water();
    case 'shelter': return shelter(s);
    case 'pack': return pack();
    case 'rack': return rack(s);
    case 'cache': return cache(s);
    case 'post': return post(s);
    case 'camera': return camera();
    case 'comforts': return comforts(s);
    case 'stump': return stump();
    case 'woodpile': return woodpile(s);
    case 'food': return food(s);
    case 'stock': return stock(s);
    case 'killsite': return killsite(s);
    case 'raven': return snag();
    case 'jay': return jay(s);
    case 'point': return fishingSpot(1, s.lines.includes('point'), s.netSpot === 'point');
    case 'inlet': return fishingSpot(2, s.lines.includes('inlet'), s.netSpot === 'inlet');
    case 'bar': return fishingSpot(3, s.lines.includes('bar'), s.netSpot === 'bar');
    case 'channel': return fishingSpot(4, s.lines.includes('channel'), s.netSpot === 'channel');
    case 'net': return net(s);
    case 'edge': return edge();
    case 'rocks': return rockBar();
    case 'clay': return clay(s);
    case 'icecache': return iceCache();
    case 'duck': return ducks();
    case 'ridge': return ridge();
    case 'timber': return timber(s);
    case 'birch': return birch();
    case 'animal': return animal(s);
    case 'trailhead': return trailhead(s.exitLabels[id] ?? 'TRAPLINE', s.snares);
    case 'deadfall': return deadfall();
    case 'fallen': return fallen();
    case 'stones': return stones();
    case 'moss': return mossyRocks(s);
    case 'berries': return berries(s);
    case 'tracks': return tracks();
    default:
      if (id.startsWith('to')) return exit(s.exitLabels[id] ?? id.slice(2).toUpperCase());
      return new THREE.Group();
  }
}

/** Which parts of the run a prop shows, so it is rebuilt only when one of them changes. */
export function propKey(id: string, s: PropState): string {
  switch (id) {
    case 'fire': return `${s.firepitTier}-${s.fireLit}`;
    case 'shelter': return `${s.structure}-${s.buildProg ?? 0}-${s.dugout}-${s.dugoutProg ?? 0}-${s.insulation}-${s.bed}-${s.winter}`;
    case 'rack': return `${s.rackTier}-${s.hugeRack}-${Math.min(10, s.smoking)}-${Math.min(10, s.smoked)}`;
    case 'cache': return `${s.cacheTier}`;
    case 'post': return `${Math.min(s.day, 40)}`;
    case 'comforts': return `${s.chair}-${s.table}`;
    case 'point': case 'inlet': case 'bar': case 'channel': return `${s.lines.includes(id)}-${s.netSpot === id}`;
    case 'net': return `${s.netBuilt}-${!!s.netSpot}`;
    case 'trailhead': return `${Math.min(6, s.snares)}`;
    case 'woodpile': return `${Math.min(18, s.logs)}-${Math.min(12, s.firewood)}`;
    case 'food': return `${Math.min(4, s.meat)}-${Math.min(12, s.berries)}`;
    case 'stock': return `${Math.min(10, s.rocks)}-${Math.min(15, Math.ceil(s.moss))}-${Math.min(3, s.clay)}-${s.tinder > 0}`;
    case 'animal': return `${s.species}-${s.winter}`;
    case 'killsite': case 'jay': case 'clay': case 'timber': case 'moss': case 'berries': return `${s.winter}`;
    default: return '';
  }
}
