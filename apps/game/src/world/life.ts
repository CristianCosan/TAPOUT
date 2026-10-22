// Birds that are only scenery: ravens turning high overhead, geese going south in autumn, a pair
// of loons on open water, chickadees hopping about that scatter when you walk up. None of them
// is a station and none touches the run; they come and go with the light and the weather.

import * as THREE from 'three';
import type { WorldArea } from '@tapout/content';
import { mat } from './kit.ts';

export type CallKind = 'chickadee' | 'raven' | 'goose' | 'loon' | 'jay';

export interface Call {
  kind: CallKind;
  at: THREE.Vector3;
}

export interface LifeState {
  /** 0 at night, 1 in full day. */
  day: number;
  weather: string;
  player: THREE.Vector3;
}

const WET = new Set(['rain', 'storm']);
const WATER_Y = -0.22;

/** A small bird facing -z, with wings named so they can flap. */
function bird(body: number, head: number, size: number, wing = body, neck = 0): THREE.Group {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(size * 0.32, size * 0.7, 2, 6), mat(body));
  b.rotation.x = Math.PI / 2;
  g.add(b);
  const h = new THREE.Mesh(new THREE.SphereGeometry(size * 0.26, 6, 4), mat(head));
  h.position.set(0, size * (0.18 + neck), -size * (0.62 + neck * 0.5));
  h.name = 'head';
  g.add(h);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(size * 0.07, size * 0.3, 4), mat(0x1a1a18));
  beak.rotation.x = -Math.PI / 2;
  beak.position.set(0, h.position.y, h.position.z - size * 0.3);
  g.add(beak);
  for (const side of [-1, 1]) {
    const geo = new THREE.BoxGeometry(size * 1.1, size * 0.04, size * 0.5);
    geo.translate((side * size * 1.1) / 2, 0, 0);
    const w = new THREE.Mesh(geo, mat(wing));
    w.position.set(side * size * 0.2, size * 0.1, 0);
    w.name = side < 0 ? 'wl' : 'wr';
    g.add(w);
  }
  return g;
}

function flap(g: THREE.Group, angle: number): void {
  const l = g.getObjectByName('wl');
  const r = g.getObjectByName('wr');
  if (l) l.rotation.z = -angle;
  if (r) r.rotation.z = angle;
}

/** Points a bird along its velocity. */
function face(g: THREE.Object3D, vx: number, vz: number): void {
  if (Math.abs(vx) + Math.abs(vz) > 1e-6) g.rotation.y = Math.atan2(-vx, -vz);
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

interface Soarer {
  g: THREE.Group;
  cx: number;
  cz: number;
  r: number;
  h: number;
  w: number;
  a: number;
  phase: number;
}

interface Loon {
  g: THREE.Group;
  x: number;
  z: number;
  heading: number;
  turn: number;
  /** Seconds until the next dive, or (negative) how long it stays under. */
  timer: number;
  under: boolean;
}

interface Hopper {
  g: THREE.Group;
  x: number;
  z: number;
  state: 'ground' | 'flee' | 'gone';
  timer: number;
  hop: { fx: number; fz: number; tx: number; tz: number; t: number } | null;
  vel: THREE.Vector3;
}

export class Wildlife {
  readonly root = new THREE.Group();
  private soarers: Soarer[] = [];
  private loons: Loon[] = [];
  private hoppers: Hopper[] = [];
  private geese = new THREE.Group();
  private goose: { from: THREE.Vector3; to: THREE.Vector3; t: number; length: number } | null = null;
  private geeseWait = rand(20, 60);
  private nextCall = rand(4, 10);
  private calls: Call[] = [];

  constructor(
    private readonly area: WorldArea,
    private readonly winter: boolean,
    private readonly ground: (x: number, z: number) => number,
  ) {
    for (let i = 0; i < 2; i++) {
      const g = bird(0x141416, 0x0e0e10, 0.9);
      this.soarers.push({ g, cx: rand(-30, 30), cz: rand(-40, 10), r: rand(22, 45), h: rand(26, 42), w: rand(0.08, 0.14) * (i ? -1 : 1), a: rand(0, 6.3), phase: rand(0, 10) });
      this.root.add(g);
    }

    if (!winter) {
      for (let i = 0; i < 9; i++) {
        const g = bird(0x6e665c, 0x111111, 1.1, 0x4e483f, 0.6);
        const row = Math.ceil(i / 2);
        g.position.set((i % 2 ? 1 : -1) * row * 2.6, 0, row * 2.4);
        this.geese.add(g);
      }
      this.geese.visible = false;
      this.root.add(this.geese);
    }

    if (area.shoreZ !== undefined && !winter) {
      for (let i = 0; i < 2; i++) {
        const g = bird(0x16191b, 0x0c0e10, 0.55, 0x16191b, 0.5);
        // The white necklace and the chequered back.
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 3, 10), mat(0xd8d8d0));
        band.position.set(0, 0.1, -0.4);
        band.rotation.x = Math.PI / 2.4;
        g.add(band);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.36), mat(0x9a9c98));
        back.position.set(0, 0.15, 0.05);
        g.add(back);
        flap(g, -0.05);
        const z = area.shoreZ - rand(14, 34);
        this.loons.push({ g, x: rand(-18, 18) + i * 3, z, heading: rand(0, 6.3), turn: 0, timer: rand(12, 40), under: false });
        this.root.add(g);
      }
    }

    const hoppers = area.id === 'shore' ? 3 : 5;
    for (let i = 0; i < hoppers; i++) {
      const g = bird(0x9a948a, 0x101010, 0.16, 0x6e6a64);
      g.scale.setScalar(1.6);
      const h: Hopper = { g, x: 0, z: 0, state: 'gone', timer: rand(0, 6), hop: null, vel: new THREE.Vector3() };
      this.hoppers.push(h);
      this.root.add(g);
    }
  }

  /** Where every bird is, for tests and screenshots. */
  where(): { kind: string; at: THREE.Vector3; visible: boolean }[] {
    return [
      ...this.soarers.map((r) => ({ kind: 'raven', at: r.g.position.clone(), visible: r.g.visible })),
      ...this.geese.children.map((g) => ({ kind: 'goose', at: g.getWorldPosition(new THREE.Vector3()), visible: this.geese.visible })),
      ...this.loons.map((l) => ({ kind: 'loon', at: l.g.position.clone(), visible: l.g.visible })),
      ...this.hoppers.map((h) => ({ kind: 'chickadee', at: h.g.position.clone(), visible: h.g.visible })),
    ];
  }

  /** Calls made since the last frame, for the sound to play. */
  takeCalls(): Call[] {
    const c = this.calls;
    this.calls = [];
    return c;
  }

  update(dt: number, t: number, s: LifeState): void {
    const daytime = s.day > 0.25;
    const wet = WET.has(s.weather);

    // Ravens, high and slow, mostly gliding with a few wingbeats now and then.
    for (const r of this.soarers) {
      r.g.visible = daytime && s.weather !== 'storm';
      if (!r.g.visible) continue;
      r.a += r.w * dt;
      const x = r.cx + Math.cos(r.a) * r.r;
      const z = r.cz + Math.sin(r.a) * r.r;
      r.g.position.set(x, r.h + Math.sin(t * 0.2 + r.phase) * 2, z);
      face(r.g, -Math.sin(r.a) * r.w, Math.cos(r.a) * r.w);
      r.g.rotation.z = r.w > 0 ? -0.25 : 0.25;
      const beating = Math.sin(t * 0.35 + r.phase) > 0.75;
      flap(r.g, beating ? Math.sin(t * 9) * 0.6 : 0.12);
    }

    // Geese pass over in autumn, north to south, now and then.
    if (!this.winter) {
      if (!this.goose) {
        this.geese.visible = false;
        this.geeseWait -= dt;
        if (this.geeseWait <= 0 && daytime && s.weather !== 'storm') {
          const x = rand(-60, 40);
          const from = new THREE.Vector3(x, rand(40, 55), -320);
          const to = new THREE.Vector3(x + rand(20, 90), from.y, 320);
          this.goose = { from, to, t: 0, length: from.distanceTo(to) / 13 };
        }
      } else {
        const gs = this.goose;
        gs.t += dt;
        const k = gs.t / gs.length;
        this.geese.visible = true;
        this.geese.position.lerpVectors(gs.from, gs.to, k);
        face(this.geese, gs.to.x - gs.from.x, gs.to.z - gs.from.z);
        this.geese.children.forEach((g, i) => flap(g as THREE.Group, Math.sin(t * 6 + i * 0.7) * 0.55));
        if (Math.random() < dt * 0.9 && Math.abs(this.geese.position.z - s.player.z) < 180) this.call('goose', this.geese.position);
        if (k >= 1) {
          this.goose = null;
          this.geeseWait = rand(70, 160);
        }
      }
    }

    // Loons drift, dive, come up somewhere else, and call mostly at dusk and in the dark.
    for (const l of this.loons) {
      if (l.under) {
        l.timer -= dt;
        if (l.timer <= 0) {
          l.under = false;
          l.x += rand(-8, 8);
          l.z = Math.min(this.area.shoreZ! - 10, Math.max(this.area.shoreZ! - 40, l.z + rand(-8, 8)));
          l.timer = rand(20, 50);
        }
      } else {
        l.timer -= dt;
        if (Math.random() < dt * 0.1) l.turn = rand(-0.25, 0.25);
        l.heading += l.turn * dt;
        l.x += -Math.sin(l.heading) * 0.35 * dt;
        l.z += -Math.cos(l.heading) * 0.35 * dt;
        if (Math.abs(l.x) > 30) l.heading += Math.PI * dt;
        if (l.timer <= 0) {
          l.under = true;
          l.timer = rand(8, 18);
        }
      }
      const sink = l.under ? -0.6 : Math.sin(t * 1.4 + l.x) * 0.02;
      l.g.position.set(l.x, WATER_Y + 0.05 + sink, l.z);
      l.g.rotation.y = l.heading;
      l.g.visible = !l.under;
    }
    const loonOdds = s.day < 0.35 ? 1 / 40 : 1 / 160;
    if (this.loons.length && !wet && Math.random() < dt * loonOdds) {
      const l = this.loons[Math.floor(Math.random() * this.loons.length)]!;
      this.call('loon', l.g.position.clone().setY(0));
    }

    // Chickadees on the ground: hop, peck, and scatter when you come close.
    const out = !daytime || wet || s.weather === 'snow';
    for (const h of this.hoppers) this.hopper(h, dt, s, out);

    // Voices from the trees you cannot see.
    this.nextCall -= dt;
    if (this.nextCall <= 0) {
      this.nextCall = rand(5, 14);
      if (daytime && !wet) {
        const a = rand(0, Math.PI * 2);
        const far = this.area.walkRadius + rand(4, 14);
        const at = new THREE.Vector3(Math.cos(a) * far, 4, Math.sin(a) * far);
        const roll = Math.random();
        if (roll < 0.62) this.call('chickadee', at);
        else if (roll < 0.85) this.call('raven', this.soarers[0]!.g.position);
        else this.call('jay', at);
      }
    }
  }

  private call(kind: CallKind, at: THREE.Vector3): void {
    this.calls.push({ kind, at: at.clone() });
  }

  private place(h: Hopper, s: LifeState): boolean {
    for (let tries = 0; tries < 8; tries++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(2, this.area.walkRadius - 1);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (this.area.shoreZ !== undefined && z < this.area.shoreZ + 1.5) continue;
      if (Math.hypot(x - s.player.x, z - s.player.z) < 7) continue;
      const clear = Object.values(this.area.stations).every((st) => Math.hypot(st.x - x, st.z - z) > st.radius + 0.6);
      if (!clear) continue;
      h.x = x;
      h.z = z;
      return true;
    }
    return false;
  }

  private hopper(h: Hopper, dt: number, s: LifeState, out: boolean): void {
    const g = h.g;
    if (h.state === 'gone') {
      g.visible = false;
      h.timer -= dt;
      if (h.timer <= 0 && !out && this.place(h, s)) {
        h.state = 'ground';
        h.timer = rand(0.3, 1.2);
        g.visible = true;
      } else if (h.timer <= 0) h.timer = rand(4, 10);
      if (h.state === 'gone') return;
    }
    if (h.state === 'flee') {
      h.timer -= dt;
      h.vel.y += dt * 1.5;
      g.position.addScaledVector(h.vel, dt);
      face(g, h.vel.x, h.vel.z);
      flap(g, Math.sin(h.timer * 60) * 0.9);
      if (h.timer <= 0) {
        h.state = 'gone';
        h.timer = rand(14, 30);
      }
      return;
    }
    // On the ground.
    const near = Math.hypot(h.x - s.player.x, h.z - s.player.z);
    if (near < 3.4 || out) {
      h.state = 'flee';
      h.timer = 3;
      const away = new THREE.Vector3(h.x - s.player.x, 0, h.z - s.player.z).normalize();
      away.applyAxisAngle(new THREE.Vector3(0, 1, 0), rand(-0.6, 0.6));
      h.vel.set(away.x * 6, 2.5, away.z * 6);
      h.hop = null;
      if (Math.random() < 0.5) this.call('chickadee', g.position);
      return;
    }
    if (h.hop) {
      h.hop.t += dt / 0.22;
      const k = Math.min(1, h.hop.t);
      h.x = h.hop.fx + (h.hop.tx - h.hop.fx) * k;
      h.z = h.hop.fz + (h.hop.tz - h.hop.fz) * k;
      g.position.set(h.x, this.ground(h.x, h.z) + 0.1 + Math.sin(k * Math.PI) * 0.12, h.z);
      flap(g, 0.3);
      if (k >= 1) h.hop = null;
    } else {
      h.timer -= dt;
      const peck = Math.max(0, Math.sin(h.timer * 14)) * 0.5;
      g.rotation.x = peck;
      g.position.set(h.x, this.ground(h.x, h.z) + 0.1, h.z);
      flap(g, 0.05);
      if (h.timer <= 0) {
        g.rotation.x = 0;
        h.timer = rand(0.4, 1.6);
        const a = rand(0, Math.PI * 2);
        const tx = h.x + Math.cos(a) * rand(0.2, 0.6);
        const tz = h.z + Math.sin(a) * rand(0.2, 0.6);
        if (Math.hypot(tx, tz) < this.area.walkRadius) {
          h.hop = { fx: h.x, fz: h.z, tx, tz, t: 0 };
          face(g, tx - h.x, tz - h.z);
        }
      }
    }
  }
}
