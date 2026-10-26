// Birds that are only scenery: ravens turning high overhead, geese going south in autumn, a pair
// of loons on open water, chickadees hopping about that scatter when you walk up; and in the
// woods a deer at the tree line that snorts and bounds off if you come too close; and at the shore
// a beaver swimming its line now and then, that slaps its tail and dives if you come down to the water;
// and in winter a red fox trotting across the snow, that stops to listen and pounces on a vole;
// and a snowshoe hare at the edge of the clearing, brown in autumn and white in winter, that freezes and then bolts;
// and over open water a bald eagle that circles, folds and drops on a fish, and labours away with it. None of them
// is a station and none touches the run; they come and go with the light and the weather.

import * as THREE from 'three';
import type { WorldArea } from '@tapout/content';
import { mat } from './kit.ts';

export type CallKind = 'chickadee' | 'raven' | 'goose' | 'loon' | 'jay' | 'owl' | 'wolf' | 'deer' | 'beaver' | 'squirrel' | 'woodpecker' | 'fox' | 'hare' | 'eagle' | 'splash';

export interface Call {
  kind: CallKind;
  at: THREE.Vector3;
}

export interface LifeState {
  /** 0 at night, 1 in full day. */
  day: number;
  weather: string;
  /** v12's birds-go-silent tell: something is coming (a front, the frost, a predator). */
  silent: boolean;
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

/** A white-tailed deer facing -z: legs, neck and tail named so they can move. */
function deer(winter: boolean): THREE.Group {
  const coat = winter ? 0x6b5b4b : 0x8a5f3a;
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.9, 3, 8), mat(coat));
  body.rotation.x = Math.PI / 2;
  body.position.y = 1.0;
  g.add(body);
  const neck = new THREE.Group();
  neck.name = 'neck';
  neck.position.set(0, 1.15, -0.55);
  const n = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.6, 6), mat(coat));
  n.position.set(0, 0.25, -0.1);
  n.rotation.x = -0.45;
  neck.add(n);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 6), mat(coat));
  head.rotation.x = -Math.PI / 2 - 0.3;
  head.position.set(0, 0.55, -0.32);
  neck.add(head);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 4), mat(coat));
    ear.position.set(side * 0.09, 0.66, -0.18);
    ear.rotation.z = side * -0.6;
    neck.add(ear);
  }
  g.add(neck);
  const legs: Array<[number, number, string]> = [[-0.17, -0.45, 'fl'], [0.17, -0.45, 'fr'], [-0.17, 0.45, 'bl'], [0.17, 0.45, 'br']];
  for (const [x, z, name] of legs) {
    const geo = new THREE.CylinderGeometry(0.045, 0.035, 0.85, 5);
    geo.translate(0, -0.42, 0);
    const leg = new THREE.Mesh(geo, mat(coat));
    leg.position.set(x, 0.88, z);
    leg.name = name;
    g.add(leg);
  }
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.05), mat(0xeeeae0));
  tail.position.set(0, 1.12, 0.72);
  tail.rotation.x = 0.5;
  tail.name = 'tail';
  g.add(tail);
  return g;
}

/** A beaver's head and back low in the water, facing -z, and the V of its wake. */
function beaver(): THREE.Group {
  const g = new THREE.Group();
  const back = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 5), mat(0x3b2a1c));
  back.scale.set(1, 0.45, 1.8);
  back.position.set(0, 0, 0.18);
  g.add(back);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 7, 5), mat(0x45311f));
  head.scale.set(1, 0.8, 1.25);
  head.position.set(0, 0.06, -0.24);
  g.add(head);
  const wake = new THREE.Group();
  wake.name = 'wake';
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 4).translate(0, 2, 0), new THREE.MeshBasicMaterial({ color: 0xc8d6dc, transparent: true, opacity: 0.35, depthWrite: false }));
    arm.rotation.x = Math.PI / 2;
    arm.rotation.z = side * 0.32;
    arm.position.set(0, -0.08, -0.2);
    wake.add(arm);
  }
  g.add(wake);
  const splash = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 28), new THREE.MeshBasicMaterial({ color: 0xe0eaee, transparent: true, opacity: 0, depthWrite: false }));
  splash.rotation.x = -Math.PI / 2;
  splash.name = 'splash';
  g.add(splash);
  return g;
}

/** A red squirrel facing -z, its bushy tail up behind it. */
function squirrel(): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), mat(0x9a4a24));
  body.scale.set(0.9, 1.1, 1.4);
  body.position.y = 0.09;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 5), mat(0xa4532a));
  head.position.set(0, 0.17, -0.1);
  g.add(head);
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 2, 6), mat(0xb0602e));
  tail.position.set(0, 0.2, 0.13);
  tail.rotation.x = 0.35;
  tail.name = 'tail';
  g.add(tail);
  return g;
}

/** A red fox facing -z: legs, head and tail named so they can move. */
function fox(): THREE.Group {
  const coat = 0xb4561e;
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.42, 3, 7), mat(coat));
  body.rotation.x = Math.PI / 2;
  body.position.y = 0.38;
  g.add(body);
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 0.48, -0.33);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.1, 7, 5), mat(coat));
  skull.scale.set(1, 0.9, 1.1);
  head.add(skull);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 5), mat(0xe8e0d4));
  snout.rotation.x = -Math.PI / 2;
  snout.position.set(0, -0.03, -0.14);
  head.add(snout);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.11, 4), mat(0x2a1a12));
    ear.position.set(side * 0.055, 0.1, 0);
    head.add(ear);
  }
  g.add(head);
  const legs: Array<[number, number, string]> = [[-0.07, -0.2, 'fl'], [0.07, -0.2, 'fr'], [-0.07, 0.2, 'bl'], [0.07, 0.2, 'br']];
  for (const [x, z, name] of legs) {
    const geo = new THREE.CylinderGeometry(0.022, 0.018, 0.32, 4);
    geo.translate(0, -0.16, 0);
    const leg = new THREE.Mesh(geo, mat(0x1e1612));
    leg.position.set(x, 0.32, z);
    leg.name = name;
    g.add(leg);
  }
  const tail = new THREE.Group();
  tail.name = 'tail';
  tail.position.set(0, 0.38, 0.32);
  const brush = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.3, 2, 6), mat(coat));
  brush.rotation.x = Math.PI / 2;
  brush.position.z = 0.2;
  tail.add(brush);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), mat(0xf0ece4));
  tip.position.z = 0.42;
  tail.add(tip);
  tail.rotation.x = 0.35;
  g.add(tail);
  return g;
}

/** A snowshoe hare facing -z, sitting hunched: ears named so they can turn. */
function hare(winter: boolean): THREE.Group {
  const coat = winter ? 0xeceeea : 0x7a6448;
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 7, 5), mat(coat));
  body.scale.set(0.85, 0.9, 1.25);
  body.position.set(0, 0.15, 0.03);
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.075, 6, 5), mat(coat));
  head.scale.set(0.9, 0.95, 1.2);
  head.position.set(0, 0.25, -0.15);
  g.add(head);
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.name = side < 0 ? 'el' : 'er';
    ear.position.set(side * 0.03, 0.3, -0.12);
    const e = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.12, 2, 4).translate(0, 0.07, 0), mat(coat));
    e.scale.z = 0.5;
    ear.add(e);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 4, 3), mat(0x1c1814));
    tip.position.y = 0.145;
    tip.scale.set(1, 1, 0.5);
    ear.add(tip);
    g.add(ear);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.16), mat(winter ? 0xe0e2de : 0x8a7860));
    foot.position.set(side * 0.08, 0.015, 0.06);
    g.add(foot);
  }
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), mat(0xf4f4f0));
  tail.position.set(0, 0.14, 0.2);
  g.add(tail);
  return g;
}

interface Hare {
  g: THREE.Group;
  x: number;
  z: number;
  heading: number;
  state: 'sit' | 'freeze' | 'run' | 'gone';
  timer: number;
  /** Seconds into the current little hop or the bolt. */
  hop: number;
}

interface Eagle {
  g: THREE.Group;
  splash: THREE.Mesh;
  state: 'soar' | 'dive' | 'splash' | 'climb' | 'gone';
  timer: number;
  cx: number;
  cz: number;
  a: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
}

interface Fox {
  g: THREE.Group;
  x: number;
  z: number;
  heading: number;
  state: 'trot' | 'listen' | 'pounce' | 'look' | 'flee' | 'gone';
  timer: number;
  /** How far is left to go across. */
  left: number;
  /** Whether it has stopped to hunt on this crossing yet. */
  hunted: boolean;
}

interface Squirrel {
  g: THREE.Group;
  x: number;
  z: number;
  heading: number;
  state: 'sit' | 'run' | 'gone';
  timer: number;
  chatter: number;
}

interface Beaver {
  g: THREE.Group;
  x: number;
  z: number;
  dir: number;
  state: 'swim' | 'dive' | 'gone';
  timer: number;
}

interface Deer {
  g: THREE.Group;
  x: number;
  z: number;
  heading: number;
  state: 'graze' | 'alert' | 'bolt' | 'gone';
  timer: number;
  /** Seconds into its bounding. */
  run: number;
}

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
  private deer: Deer | null = null;
  private beaver: Beaver | null = null;
  private squirrel: Squirrel | null = null;
  private fox: Fox | null = null;
  private hare: Hare | null = null;
  private eagle: Eagle | null = null;
  /** At dusk and at night an owl now and then glides low and silent across the clearing. */
  private owl = bird(0x6a5a48, 0x5e5040, 0.75, 0x7a6a56);
  private owlFlight: { from: THREE.Vector3; to: THREE.Vector3; t: number; length: number } | null = null;
  private owlWait = rand(30, 90);
  /** Open water's surface: lower when you look down on the lake from a perched camp. */
  private get waterY(): number {
    return WATER_Y - (this.area.perch?.drop ?? 0);
  }

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

    if (area.id === 'shore' && area.shoreZ !== undefined && !winter) {
      const g = beaver();
      g.visible = false;
      this.beaver = { g, x: 0, z: 0, dir: 1, state: 'gone', timer: rand(10, 40) };
      this.root.add(g);
    }

    if (area.id === 'woods' || area.id === 'camp') {
      const g = squirrel();
      g.visible = false;
      this.squirrel = { g, x: 0, z: 0, heading: 0, state: 'gone', timer: rand(5, 25), chatter: rand(2, 6) };
      this.root.add(g);
    }

    if (area.id === 'woods') {
      const g = deer(winter);
      g.visible = false;
      this.deer = { g, x: 0, z: 0, heading: 0, state: 'gone', timer: rand(15, 40), run: 0 };
      this.root.add(g);
    }

    if (area.shoreZ !== undefined && !winter) {
      const g = bird(0x3a2a1c, 0xf0eee6, 1.25, 0x33251a);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.4), mat(0xf0eee6));
      tail.position.set(0, 0, 0.6);
      g.add(tail);
      for (const side of [-1, 1]) {
        const tip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.4), mat(0x2a1e14));
        tip.position.set(side * 1.25, 0, 0.05);
        g.getObjectByName(side < 0 ? 'wl' : 'wr')!.add(tip);
      }
      g.visible = false;
      const splash = new THREE.Mesh(new THREE.RingGeometry(0.7, 1, 28), new THREE.MeshBasicMaterial({ color: 0xe0eaee, transparent: true, opacity: 0, depthWrite: false }));
      splash.rotation.x = -Math.PI / 2;
      splash.visible = false;
      this.eagle = { g, splash, state: 'gone', timer: rand(40, 120), cx: 0, cz: 0, a: 0, from: new THREE.Vector3(), to: new THREE.Vector3() };
      this.root.add(g, splash);
    }

    if (area.id === 'woods' || area.id === 'camp') {
      const g = hare(winter);
      g.visible = false;
      this.hare = { g, x: 0, z: 0, heading: 0, state: 'gone', timer: rand(20, 60), hop: 0 };
      this.root.add(g);
    }

    if (winter) {
      const g = fox();
      g.visible = false;
      this.fox = { g, x: 0, z: 0, heading: 0, state: 'gone', timer: rand(20, 60), left: 0, hunted: false };
      this.root.add(g);
    }

    this.owl.visible = false;
    this.root.add(this.owl);

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
      ...(this.deer ? [{ kind: 'deer', at: this.deer.g.position.clone(), visible: this.deer.g.visible }] : []),
      { kind: 'owl', at: this.owl.position.clone(), visible: this.owl.visible },
      ...(this.squirrel ? [{ kind: 'squirrel', at: this.squirrel.g.position.clone(), visible: this.squirrel.g.visible }] : []),
      ...(this.eagle ? [{ kind: 'eagle', at: this.eagle.g.position.clone(), visible: this.eagle.g.visible }] : []),
      ...(this.hare ? [{ kind: 'hare', at: this.hare.g.position.clone(), visible: this.hare.g.visible }] : []),
      ...(this.fox ? [{ kind: 'fox', at: this.fox.g.position.clone(), visible: this.fox.g.visible }] : []),
      ...(this.beaver ? [{ kind: 'beaver', at: this.beaver.g.position.clone(), visible: this.beaver.g.visible }] : []),
    ];
  }

  /** Brings the deer out now, for tests and screenshots. */
  showDeer(): void {
    if (this.deer?.state === 'gone') this.deer.timer = 0;
    if (this.beaver?.state === 'gone') this.beaver.timer = 0;
    if (this.squirrel?.state === 'gone') this.squirrel.timer = 0;
    if (this.fox?.state === 'gone') this.fox.timer = 0;
    if (this.hare?.state === 'gone') this.hare.timer = 0;
    if (this.eagle?.state === 'gone') this.eagle.timer = 0;
    if (!this.owlFlight) this.owlWait = 0;
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
      l.g.position.set(l.x, this.waterY + 0.05 + sink, l.z);
      l.g.rotation.y = l.heading;
      l.g.visible = !l.under;
    }
    const loonOdds = s.day < 0.35 ? 1 / 40 : 1 / 160;
    if (this.loons.length && !wet && Math.random() < dt * loonOdds) {
      const l = this.loons[Math.floor(Math.random() * this.loons.length)]!;
      this.call('loon', l.g.position.clone().setY(0));
    }

    // Chickadees on the ground: hop, peck, and scatter when you come close.
    const out = !daytime || wet || s.weather === 'snow' || s.silent;
    for (const h of this.hoppers) this.hopper(h, dt, s, out);

    if (this.deer) this.updateDeer(this.deer, dt, t, s);
    if (this.beaver) this.updateBeaver(this.beaver, dt, t, s);
    if (this.squirrel) this.updateSquirrel(this.squirrel, dt, t, s);
    if (this.fox) this.updateFox(this.fox, dt, t, s);
    if (this.hare) this.updateHare(this.hare, dt, t, s);
    if (this.eagle) this.updateEagle(this.eagle, dt, t, s);
    this.updateOwl(dt, t, s);

    // Voices from the trees you cannot see.
    this.nextCall -= dt;
    if (this.nextCall <= 0) {
      this.nextCall = rand(5, 14);
      const a = rand(0, Math.PI * 2);
      const far = this.area.walkRadius + rand(4, 14);
      const at = new THREE.Vector3(Math.cos(a) * far, 4, Math.sin(a) * far);
      const roll = Math.random();
      if (daytime && !wet && !s.silent) {
        if (this.area.id === 'woods' && Math.random() < 0.18) this.call('woodpecker', at.setY(7));
        else if (roll < 0.62) this.call('chickadee', at);
        else if (roll < 0.85) this.call('raven', this.soarers[0]!.g.position);
        else this.call('jay', at);
      } else if (s.day < 0.1 && s.weather !== 'storm') {
        // The night: an owl now and then, wolves far off more rarely.
        if (roll < 0.22) this.call('owl', at);
        else if (roll < 0.3) this.call('wolf', at.setLength(220));
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

  /** Out at the tree line at dawn, dusk and quiet days; it grazes, looks up, and bounds off if you come close. */
  private updateDeer(d: Deer, dt: number, t: number, s: LifeState): void {
    const g = d.g;
    const neck = g.getObjectByName('neck')!;
    const tail = g.getObjectByName('tail')!;
    const legs = ['fl', 'fr', 'bl', 'br'].map((n) => g.getObjectByName(n)!);
    const away = s.weather === 'storm' || s.day < 0.12 || s.silent;
    if (d.state === 'gone') {
      g.visible = false;
      d.timer -= dt;
      if (d.timer > 0 || away) {
        if (d.timer <= 0) d.timer = rand(20, 50);
        return;
      }
      const a = rand(0, Math.PI * 2);
      const r = this.area.walkRadius + rand(5, 14);
      d.x = Math.cos(a) * r;
      d.z = Math.sin(a) * r;
      if (Math.hypot(d.x - s.player.x, d.z - s.player.z) < 14) {
        d.timer = rand(5, 10);
        return;
      }
      d.heading = rand(0, Math.PI * 2);
      d.state = 'graze';
      d.timer = rand(50, 120);
      g.visible = true;
    }
    const near = Math.hypot(d.x - s.player.x, d.z - s.player.z);
    if (d.state !== 'bolt' && (near < 9 || away)) {
      d.state = 'bolt';
      d.run = 0;
      // turn away from you, give or take
      d.heading = Math.atan2(-(d.x - s.player.x), -(d.z - s.player.z)) + rand(-0.5, 0.5);
      if (!away) this.call('deer', g.position);
    } else if (d.state === 'graze' && near < 15) {
      d.state = 'alert';
      d.timer = rand(4, 8);
    } else if (d.state === 'alert' && near >= 17) d.state = 'graze';

    if (d.state === 'bolt') {
      d.run += dt;
      const speed = Math.min(9, 3 + d.run * 8);
      d.x += -Math.sin(d.heading) * speed * dt;
      d.z += -Math.cos(d.heading) * speed * dt;
      const bound = Math.abs(Math.sin(d.run * 5.5));
      g.position.set(d.x, this.ground(d.x, d.z) + bound * 0.55, d.z);
      g.rotation.set(Math.cos(d.run * 5.5) * 0.18, d.heading, 0);
      legs.forEach((l, i) => (l.rotation.x = (i < 2 ? -1 : 1) * (0.4 + bound * 0.6)));
      neck.rotation.x = -0.2;
      tail.rotation.x = -0.4; // the white flag goes up
      if (d.run > 6) {
        d.state = 'gone';
        d.timer = rand(60, 140);
      }
      return;
    }
    g.position.set(d.x, this.ground(d.x, d.z), d.z);
    g.rotation.set(0, d.heading, 0);
    legs.forEach((l) => (l.rotation.x = 0));
    tail.rotation.x = 0.5 + Math.max(0, Math.sin(t * 3.1)) * 0.25;
    if (d.state === 'alert') {
      // head up, ears on you
      neck.rotation.x = 0.15;
      neck.rotation.y = Math.atan2(-(s.player.x - d.x), -(s.player.z - d.z)) - d.heading;
      d.timer -= dt;
      if (d.timer <= 0) d.state = 'graze';
      return;
    }
    neck.rotation.y = 0;
    d.timer -= dt;
    // mostly head down, now and then a look round
    const look = Math.sin(t * 0.37 + d.x) > 0.7;
    neck.rotation.x += ((look ? 0.1 : -1.25) - neck.rotation.x) * Math.min(1, dt * 3);
    if (Math.random() < dt * 0.08) d.heading += rand(-0.6, 0.6);
    if (d.timer <= 0) {
      d.state = 'bolt';
      d.run = 2.5;
    }
  }

  /** Out in the light, swimming a slow line along the shore; at the water's edge near it, a slap and a dive. */
  private updateBeaver(b: Beaver, dt: number, t: number, s: LifeState): void {
    const g = b.g;
    const shoreZ = this.area.shoreZ!;
    const splash = g.getObjectByName('splash') as THREE.Mesh;
    const wake = g.getObjectByName('wake')!;
    const out = s.day > 0.05;
    if (b.state === 'gone') {
      g.visible = false;
      b.timer -= dt;
      if (b.timer > 0 || !out || s.weather === 'storm' || s.silent) {
        if (b.timer <= 0) b.timer = rand(20, 60);
        return;
      }
      b.dir = Math.random() < 0.5 ? -1 : 1;
      b.x = -b.dir * rand(30, 40);
      b.z = shoreZ - rand(6, 16);
      b.state = 'swim';
      g.visible = true;
      wake.visible = true;
      (splash.material as THREE.MeshBasicMaterial).opacity = 0;
    }
    if (b.state === 'swim') {
      b.x += b.dir * 0.75 * dt;
      g.position.set(b.x, this.waterY + 0.03 + Math.sin(t * 2.2) * 0.012, b.z);
      g.rotation.y = b.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      wake.children.forEach((a) => ((a as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.28 + Math.sin(t * 3) * 0.06);
      const edge = s.player.z < shoreZ + 3;
      const near = Math.hypot(b.x - s.player.x, b.z - s.player.z);
      if (edge && near < 16) {
        b.state = 'dive';
        b.timer = 0;
        this.call('beaver', g.position);
      } else if (Math.abs(b.x) > 42) {
        b.state = 'gone';
        b.timer = rand(60, 160);
      }
      return;
    }
    // the dive: the tail comes down, a splash spreads, and it is gone under
    b.timer += dt;
    wake.visible = false;
    g.children.forEach((c) => {
      if (c !== splash) c.visible = b.timer < 0.25;
    });
    splash.visible = true;
    splash.scale.setScalar(0.3 + b.timer * 1.4);
    (splash.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.6 * (1 - b.timer / 1.6));
    if (b.timer > 1.6) {
      g.children.forEach((c) => (c.visible = true));
      b.state = 'gone';
      b.timer = rand(90, 200);
    }
  }

  /** Sits near the edge of the clearing scolding you now and then; come within a few metres and it dashes off into the trees. */
  private updateSquirrel(q: Squirrel, dt: number, t: number, s: LifeState): void {
    const g = q.g;
    const out = s.day > 0.2 && !WET.has(s.weather) && !s.silent;
    if (q.state === 'gone') {
      g.visible = false;
      q.timer -= dt;
      if (q.timer > 0 || !out) {
        if (q.timer <= 0) q.timer = rand(20, 50);
        return;
      }
      const a = rand(0, Math.PI * 2);
      const r = this.area.walkRadius - rand(0.5, 3);
      q.x = Math.cos(a) * r;
      q.z = Math.sin(a) * r;
      if (this.area.shoreZ !== undefined && q.z < this.area.shoreZ + 2) {
        q.timer = rand(3, 8);
        return;
      }
      if (Math.hypot(q.x - s.player.x, q.z - s.player.z) < 7) {
        q.timer = rand(3, 8);
        return;
      }
      q.heading = Math.atan2(q.x, q.z); // facing the middle of the clearing
      q.state = 'sit';
      q.timer = rand(40, 90);
      g.visible = true;
    }
    const tail = g.getObjectByName('tail')!;
    const near = Math.hypot(q.x - s.player.x, q.z - s.player.z);
    if (q.state === 'sit') {
      g.position.set(q.x, this.ground(q.x, q.z), q.z);
      g.rotation.set(0, q.heading, 0);
      q.chatter -= dt;
      const scolding = q.chatter < 1.2;
      tail.rotation.x = 0.35 + (scolding ? Math.sin(t * 30) * 0.25 : 0);
      if (q.chatter <= 0) {
        q.chatter = rand(5, 12);
        this.call('squirrel', g.position);
      }
      q.timer -= dt;
      if (near < 4 || q.timer <= 0 || !out) {
        q.state = 'run';
        q.timer = 2.5;
        // away from you, out toward the trees
        q.heading = Math.atan2(-(q.x - s.player.x), -(q.z - s.player.z));
        if (near < 4) this.call('squirrel', g.position);
      }
      return;
    }
    q.timer -= dt;
    q.x += -Math.sin(q.heading) * 4.5 * dt;
    q.z += -Math.cos(q.heading) * 4.5 * dt;
    g.position.set(q.x, this.ground(q.x, q.z) + Math.abs(Math.sin(t * 22)) * 0.08, q.z);
    g.rotation.set(0, q.heading, 0);
    tail.rotation.x = 1.1;
    if (q.timer <= 0) {
      q.state = 'gone';
      q.timer = rand(40, 100);
    }
  }

  /** Circles high over the water, folds and drops on a fish, and labours away low over the lake. */
  private updateEagle(e: Eagle, dt: number, t: number, s: LifeState): void {
    const g = e.g;
    const shoreZ = this.area.shoreZ!;
    if (e.state === 'gone') {
      g.visible = false;
      e.timer -= dt;
      if (e.timer > 0 || s.day < 0.3 || WET.has(s.weather) || s.weather === 'storm') {
        if (e.timer <= 0) e.timer = rand(40, 90);
        return;
      }
      e.cx = s.player.x + rand(-15, 15);
      e.cz = shoreZ - rand(22, 40);
      e.a = rand(0, Math.PI * 2);
      e.state = 'soar';
      e.timer = rand(14, 26);
      g.visible = true;
      if (Math.random() < 0.6) this.call('eagle', new THREE.Vector3(e.cx, 28, e.cz));
    }
    const splashMat = e.splash.material as THREE.MeshBasicMaterial;
    if (e.state === 'soar') {
      e.a += dt * 0.22;
      const r = 16;
      const x = e.cx + Math.cos(e.a) * r;
      const z = e.cz + Math.sin(e.a) * r;
      g.position.set(x, 28 + Math.sin(t * 0.4) * 1.5, z);
      face(g, -Math.sin(e.a), Math.cos(e.a));
      g.rotation.z = 0.25; // banked into the turn
      flap(g, 0.06);
      e.timer -= dt;
      if (e.timer <= 0) {
        e.state = 'dive';
        e.timer = 0;
        e.from.copy(g.position);
        e.to.set(e.cx + rand(-4, 4), this.waterY + 0.3, e.cz + rand(-4, 4));
      }
      return;
    }
    if (e.state === 'dive') {
      e.timer += dt;
      const k = Math.min(1, e.timer / 2.4);
      g.position.lerpVectors(e.from, e.to, k * k);
      face(g, e.to.x - e.from.x, e.to.z - e.from.z);
      g.rotation.x = -0.6 * (1 - k * 0.5); // head down, wings swept back
      g.rotation.z = 0;
      flap(g, -0.5);
      if (k >= 1) {
        e.state = 'splash';
        e.timer = 0;
        e.splash.position.set(e.to.x, this.waterY + 0.02, e.to.z);
        e.splash.visible = true;
        this.call('splash', e.to);
      }
      return;
    }
    if (e.state === 'splash') {
      // talons in, wings up and beating, a ring spreading round it
      e.timer += dt;
      g.rotation.x = 0.3;
      flap(g, Math.sin(t * 9) * 0.8);
      g.position.y = e.to.y + Math.min(1.5, e.timer * 1.2);
      e.splash.scale.setScalar(0.6 + e.timer * 2.4);
      splashMat.opacity = Math.max(0, 0.6 * (1 - e.timer / 1.4));
      if (e.timer > 1.0) {
        e.state = 'climb';
        e.timer = 0;
        e.from.copy(g.position);
        e.to.set(e.from.x + rand(-40, 40), 14, shoreZ - 90);
      }
      return;
    }
    // climbing away low and heavy with the fish, out across the lake
    e.timer += dt;
    e.splash.scale.setScalar(3 + e.timer * 2.4);
    splashMat.opacity = Math.max(0, 0.6 * (1 - (e.timer + 1) / 1.4));
    if (splashMat.opacity <= 0) e.splash.visible = false;
    const k = Math.min(1, e.timer / 12);
    g.position.lerpVectors(e.from, e.to, k);
    face(g, e.to.x - e.from.x, e.to.z - e.from.z);
    g.rotation.x = 0.05;
    flap(g, Math.sin(t * 6) * 0.6);
    if (k >= 1) {
      e.state = 'gone';
      e.splash.visible = false;
      e.timer = rand(120, 300);
    }
  }

  /** Sits at the edge of the clearing nibbling and now and then hopping; inside 8 m it freezes, inside 5 m (or when its nerve goes) it bolts in a zigzag. */
  private updateHare(h: Hare, dt: number, t: number, s: LifeState): void {
    const g = h.g;
    const el = g.getObjectByName('el')!;
    const er = g.getObjectByName('er')!;
    const out = s.day > 0.05 && !WET.has(s.weather) && s.weather !== 'storm' && !s.silent;
    if (h.state === 'gone') {
      g.visible = false;
      h.timer -= dt;
      if (h.timer > 0 || !out) {
        if (h.timer <= 0) h.timer = rand(30, 70);
        return;
      }
      const a = rand(0, Math.PI * 2);
      const r = this.area.walkRadius + rand(-1, 2);
      h.x = Math.cos(a) * r;
      h.z = Math.sin(a) * r;
      if ((this.area.shoreZ !== undefined && h.z < this.area.shoreZ + 2) || Math.hypot(h.x - s.player.x, h.z - s.player.z) < 10) {
        h.timer = rand(3, 8);
        return;
      }
      h.heading = rand(0, Math.PI * 2);
      h.state = 'sit';
      h.timer = rand(50, 110);
      h.hop = 9;
      g.visible = true;
    }
    const near = Math.hypot(h.x - s.player.x, h.z - s.player.z);
    const y = this.ground(h.x, h.z);
    if (h.state === 'run') {
      h.hop += dt;
      // each bound a little off the last, the zigzag that throws off a fox
      if (Math.floor(h.hop * 3) !== Math.floor((h.hop - dt) * 3)) h.heading += rand(-0.7, 0.7);
      const speed = 7;
      h.x += -Math.sin(h.heading) * speed * dt;
      h.z += -Math.cos(h.heading) * speed * dt;
      g.position.set(h.x, this.ground(h.x, h.z) + Math.abs(Math.sin(h.hop * 9.4)) * 0.3, h.z);
      g.rotation.set(Math.cos(h.hop * 9.4) * 0.25, h.heading, 0);
      el.rotation.x = er.rotation.x = 0.9; // ears laid back
      if (h.hop > 3) {
        h.state = 'gone';
        h.timer = rand(60, 150);
      }
      return;
    }
    if (near < 5 || (h.state === 'freeze' && h.timer <= 0) || !out) {
      h.state = 'run';
      h.hop = 0;
      h.heading = Math.atan2(-(h.x - s.player.x), -(h.z - s.player.z));
      if (near < 9) this.call('hare', g.position);
      return;
    }
    if (h.state === 'freeze') {
      // stock still, ears straight up and on you
      h.timer -= dt;
      g.position.set(h.x, y, h.z);
      el.rotation.set(0, 0, 0.08);
      er.rotation.set(0, 0, -0.08);
      if (near > 11) h.state = 'sit';
      return;
    }
    if (near < 8) {
      h.state = 'freeze';
      h.timer = rand(1.5, 4);
      return;
    }
    // sitting: nibbling, ears turning, now and then a lazy hop or two
    h.timer -= dt;
    h.hop += dt;
    if (h.hop > 9 && Math.random() < dt * 0.25) {
      h.hop = 0;
      h.heading += rand(-1.2, 1.2);
    }
    const hopping = h.hop < 0.35;
    if (hopping) {
      h.x += -Math.sin(h.heading) * 1.6 * dt;
      h.z += -Math.cos(h.heading) * 1.6 * dt;
    }
    g.position.set(h.x, this.ground(h.x, h.z) + (hopping ? Math.sin((h.hop / 0.35) * Math.PI) * 0.1 : 0), h.z);
    g.rotation.set(hopping ? 0 : Math.sin(t * 9) * 0.02, h.heading, 0);
    el.rotation.set(0.25 + Math.sin(t * 0.7) * 0.2, 0, 0.15);
    er.rotation.set(0.25 + Math.sin(t * 0.9 + 1) * 0.2, 0, -0.15);
    if (h.timer <= 0) {
      h.state = 'run';
      h.hop = 0;
    }
  }

  /** Trots across the snow edge to edge; once on the way it may stop, listen and pounce; it notices you inside 10 m, looks, barks and runs. */
  private updateFox(f: Fox, dt: number, t: number, s: LifeState): void {
    const g = f.g;
    const head = g.getObjectByName('head')!;
    const tail = g.getObjectByName('tail')!;
    const legs = ['fl', 'fr', 'bl', 'br'].map((n) => g.getObjectByName(n)!);
    if (f.state === 'gone') {
      g.visible = false;
      f.timer -= dt;
      if (f.timer > 0 || s.day < 0.1 || s.weather === 'storm' || s.silent) {
        if (f.timer <= 0) f.timer = rand(30, 80);
        return;
      }
      const a = rand(0, Math.PI * 2);
      const r = this.area.walkRadius + 6;
      const b = a + Math.PI + rand(-0.7, 0.7);
      f.x = Math.cos(a) * r;
      f.z = Math.sin(a) * r;
      const tx = Math.cos(b) * r;
      const tz = Math.sin(b) * r;
      if (this.area.shoreZ !== undefined && (f.z < this.area.shoreZ + 1 || tz < this.area.shoreZ + 1)) {
        f.timer = rand(2, 6);
        return;
      }
      f.heading = Math.atan2(-(tx - f.x), -(tz - f.z));
      f.left = Math.hypot(tx - f.x, tz - f.z);
      f.hunted = Math.random() < 0.4;
      f.state = 'trot';
      g.visible = true;
    }
    const near = Math.hypot(f.x - s.player.x, f.z - s.player.z);
    if (near < 10 && (f.state === 'trot' || f.state === 'listen')) {
      f.state = 'look';
      f.timer = rand(1.2, 2.2);
      if (Math.random() < 0.5) this.call('fox', g.position);
    }
    const y = this.ground(f.x, f.z);
    if (f.state === 'trot' || f.state === 'flee') {
      const speed = f.state === 'flee' ? 6.5 : 2.2;
      const step = speed * dt;
      f.x += -Math.sin(f.heading) * step;
      f.z += -Math.cos(f.heading) * step;
      f.left -= step;
      const gait = t * (f.state === 'flee' ? 16 : 10);
      legs.forEach((l, i) => (l.rotation.x = Math.sin(gait + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.5));
      g.position.set(f.x, y + Math.abs(Math.sin(gait)) * (f.state === 'flee' ? 0.08 : 0.025), f.z);
      g.rotation.set(0, f.heading, 0);
      head.rotation.set(f.state === 'flee' ? 0.1 : 0.25, 0, 0);
      tail.rotation.x = f.state === 'flee' ? 0.05 : 0.35;
      f.timer -= dt;
      if (f.state === 'trot' && !f.hunted && f.left < 18) {
        f.hunted = true;
        f.state = 'listen';
        f.timer = rand(2, 4);
      }
      if ((f.state === 'trot' && f.left <= 0) || (f.state === 'flee' && f.timer <= 0)) {
        f.state = 'gone';
        f.timer = rand(90, 240);
      }
      return;
    }
    legs.forEach((l) => (l.rotation.x = 0));
    f.timer -= dt;
    if (f.state === 'listen') {
      // stock still, head down and cocked, ears on something under the snow
      g.position.set(f.x, y, f.z);
      head.rotation.set(0.7, 0, Math.sin(t * 1.3) * 0.35);
      if (f.timer <= 0) {
        f.state = 'pounce';
        f.timer = 0.7;
      }
      return;
    }
    if (f.state === 'pounce') {
      // a high arc, and nose-first into the snow
      const k = 1 - f.timer / 0.7;
      f.x += -Math.sin(f.heading) * 1.8 * dt;
      f.z += -Math.cos(f.heading) * 1.8 * dt;
      f.left -= 1.8 * dt;
      g.position.set(f.x, y + Math.sin(Math.min(1, k) * Math.PI) * 0.7, f.z);
      g.rotation.set(-0.5 + k * 1.3, f.heading, 0);
      head.rotation.set(0.6, 0, 0);
      tail.rotation.x = -0.3;
      if (f.timer <= 0) {
        g.rotation.set(0, f.heading, 0);
        f.state = 'trot';
      }
      return;
    }
    // looking at you, then away it goes
    g.position.set(f.x, y, f.z);
    head.rotation.set(0, Math.atan2(-(s.player.x - f.x), -(s.player.z - f.z)) - f.heading, 0);
    if (f.timer <= 0) {
      f.state = 'flee';
      f.timer = 4;
      f.heading = Math.atan2(f.x - s.player.x, f.z - s.player.z) + Math.PI + rand(-0.4, 0.4);
    }
  }

  private updateOwl(dt: number, t: number, s: LifeState): void {
    if (!this.owlFlight) {
      this.owl.visible = false;
      this.owlWait -= dt;
      if (this.owlWait > 0) return;
      if (s.day > 0.35 || s.weather === 'storm' || WET.has(s.weather)) {
        this.owlWait = rand(30, 60);
        return;
      }
      const a = rand(0, Math.PI * 2);
      const r = this.area.walkRadius + 14;
      const h = rand(5, 8);
      const from = new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r);
      const b = a + Math.PI + rand(-0.6, 0.6);
      const to = new THREE.Vector3(Math.cos(b) * r, h + rand(-1, 2), Math.sin(b) * r);
      this.owlFlight = { from, to, t: 0, length: from.distanceTo(to) / 6.5 };
    }
    const f = this.owlFlight;
    f.t += dt;
    const k = f.t / f.length;
    this.owl.visible = true;
    this.owl.position.lerpVectors(f.from, f.to, k);
    this.owl.position.y += Math.sin(k * Math.PI) * -1.5; // dips low over the middle
    face(this.owl, f.to.x - f.from.x, f.to.z - f.from.z);
    // a few deep, slow beats, then a long glide
    const beating = (f.t % 2.4) < 0.9;
    flap(this.owl, beating ? Math.sin(t * 7) * 0.55 : 0.08);
    if (k >= 1) {
      this.owlFlight = null;
      this.owlWait = rand(120, 300);
      if (Math.random() < 0.6) this.call('owl', f.to);
    }
  }
}
