// A short first-person motion for every activity (rc.2, Sir: "a very simple graphic tell of a
// done activity... for every single thing"). Two gloved hands and the tool for the job come up
// into view for a second or two, do the work, and drop away. Presentation only.

import * as THREE from 'three';

export type Motion =
  | 'chop'
  | 'gather'
  | 'rocks'
  | 'dig'
  | 'build'
  | 'fire'
  | 'friction'
  | 'pour'
  | 'drink'
  | 'fish'
  | 'pull'
  | 'snare'
  | 'bow'
  | 'knife'
  | 'eat'
  | 'stir'
  | 'flute'
  | 'call'
  | 'drop'
  | 'write'
  | 'wash'
  | 'look'
  | 'sit'
  | 'nod';

/** v12 handler name → the motion that shows it. */
export const MOTIONS: Readonly<Record<string, Motion>> = {
  actWood: 'chop', actWoodCamp: 'chop', actFirewood: 'gather', actTinder: 'gather', actMoss: 'gather', actForage: 'gather', actBerryPicker: 'build',
  actFire: 'fire', actFireNoFerro: 'friction', actFrictionFire: 'friction',
  actBoil: 'stir', actFetchWater: 'pour', actStream: 'drink', actDrink: 'drink', actJug: 'dig', actWash: 'wash',
  placeLineAt: 'fish', checkOneLine: 'pull', moveLine: 'fish', iceFishAt: 'fish', actIceFish: 'fish', actCheckShore: 'pull', placeNetAt: 'pull', checkNet: 'pull', actNet: 'snare', openNetModal: 'snare',
  actShelter: 'build', actDugout: 'dig', actInsulate: 'gather', actFirepit: 'rocks', actRack: 'build', actHugeRack: 'build', actCache: 'build', actIceCache: 'dig',
  actChair: 'build', actTable: 'build', actBed: 'gather', actPatchRoof: 'build', actRepairBoots: 'knife', actHaftAxe: 'knife',
  actClay: 'dig', actRocks: 'rocks',
  actCampSnares: 'snare', placeSnareAt: 'snare', moveSnare: 'snare', actCheckTraps: 'pull', checkOneSnare: 'pull',
  actShot: 'bow', actCall: 'call', actCarve: 'knife', actHaul: 'drop', actFollow: 'look', actTrail: 'look', actScout: 'look', actInvestigate: 'look', exploreNewGrounds: 'look',
  actCookMeal: 'stir', actSmoke: 'stir', actSmokeHuge: 'stir',
  actSharpenAxe: 'knife', actMaintainFerro: 'knife', actTreeMark: 'knife', actPoultice: 'stir', actFlute: 'knife',
  eatCooked: 'eat', eatSmoked: 'eat', eatBerries: 'eat', eatRation: 'eat', eatSpoiledAnyway: 'eat', actFeedJay: 'drop',
  actMusic: 'flute', actConfess: 'nod', actDropOff: 'drop', actRest: 'sit', actSitWatch: 'sit',
  actWriteLetter: 'write', weaveNetSession: 'snare',
};

const SECONDS: Partial<Record<Motion, number>> = { sit: 2.6, look: 2.2, chop: 1.9, build: 1.9, fire: 1.8, friction: 1.9 };

type Pose = [x: number, y: number, z: number, rx: number, ry: number, rz: number];
const AWAY_R: Pose = [0.32, -0.75, -0.45, 0, 0, 0];
const AWAY_L: Pose = [-0.32, -0.75, -0.45, 0, 0, 0];

function mat(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, emissive: color, emissiveIntensity: 0.12 });
}

function hand(): THREE.Group {
  const g = new THREE.Group();
  const glove = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.05, 0.11), mat(0x3a2e24));
  const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.05), mat(0x3a2e24));
  thumb.position.set(-0.05, 0.005, -0.01);
  thumb.rotation.y = 0.5;
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.12, 8).rotateX(Math.PI / 2), mat(0x4e5a3a));
  cuff.position.set(0, -0.005, 0.11);
  g.add(glove, thumb, cuff);
  return g;
}

function tools() {
  const wood = mat(0x8a6038);
  const steel = mat(0x9aa0a4);
  const axe = new THREE.Group();
  const haft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.017, 0.55, 6), wood);
  haft.position.y = 0.2;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.025), steel);
  head.position.set(0.04, 0.45, 0);
  axe.add(haft, head);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6).rotateZ(Math.PI / 2), wood);
  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07, 0), mat(0x8c8a84));
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13, 0), mat(0x8c8a84));
  const clay = new THREE.Mesh(new THREE.SphereGeometry(0.07, 7, 5), mat(0x9a8a7a));
  const bundle = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 5).rotateZ(Math.PI / 2 + (i - 1.5) * 0.15), mat(i % 2 ? 0x6a9a42 : 0x8a6038));
    s.position.y = i * 0.012;
    bundle.add(s);
  }
  const ferro = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6), mat(0x3a3a3a));
  const sparks = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 36 }, (_, i) => (i % 3 === 1 ? -Math.random() * 0.15 : (Math.random() - 0.5) * 0.16)), 3)),
    new THREE.PointsMaterial({ color: 0xffb040, size: 0.012, transparent: true }),
  );
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.1, 10, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, side: THREE.DoubleSide, roughness: 0.6 }));
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.07, 8), steel);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.012, 1.2, 5), wood);
  rod.geometry.translate(0, 0.5, 0);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.012, 4, 16, Math.PI * 0.7), wood);
  bow.rotation.z = Math.PI / 2 + Math.PI * 0.15;
  const knife = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.11, 0.025), steel);
  blade.position.y = 0.07;
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.025), mat(0x2a2a2a));
  knife.add(blade, grip);
  const food = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.05), mat(0x8a4428));
  const flute = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6).rotateZ(Math.PI / 2), wood);
  const paper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.004, 0.14), mat(0xe8e0cc));
  const wire = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.004, 4, 16), steel);
  const saw = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.01, 4, 14, Math.PI), mat(0xa04030));
  const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.02, 0.003), steel);
  teeth.position.y = 0.005;
  saw.add(frame, teeth);
  saw.rotation.z = Math.PI / 2;
  const shovel = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.6, 6), wood);
  shaft.position.y = 0.22;
  const spade = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.15, 0.012), steel);
  spade.position.y = 0.58;
  shovel.add(shaft, spade);
  return { axe, stick, stone, rock, clay, bundle, ferro, sparks, pot, cup, rod, bow, knife, food, flute, paper, wire, saw, shovel };
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (k: number) => k * k * (3 - 2 * k);
/** 0 → 1 in the first quarter, 1 through the middle, 1 → 0 in the last quarter: in, work, out. */
const envelope = (t: number) => ease(Math.min(1, t / 0.22)) * ease(Math.min(1, (1 - t) / 0.22));

function mix(away: Pose, pose: Pose, k: number): Pose {
  return away.map((v, i) => lerp(v, pose[i]!, k)) as Pose;
}

/** A tool you can carry in hand between jobs (rc.5, keys 1-5). */
export type Held = 'bow' | 'axe' | 'saw' | 'shovel' | 'knife';

export class Hands {
  readonly root = new THREE.Group();
  private right = hand();
  private left = hand();
  private kit = tools();
  private motion: Motion | null = null;
  private t = 0;
  private length = 1.6;
  private inRight: THREE.Object3D | null = null;
  private inLeft: THREE.Object3D | null = null;
  private held: Held | null = null;
  private heldTool: THREE.Object3D | null = null;
  private clock = 0;

  constructor() {
    this.root.add(this.right, this.left);
    this.left.scale.x = -1;
    this.root.visible = false;
  }

  get playing(): Motion | null {
    return this.motion;
  }

  /** Carries a tool low in the view between jobs, or empties the hands (null). */
  hold(tool: Held | null): void {
    if (tool === this.held) return;
    this.held = tool;
    this.heldTool?.removeFromParent();
    this.heldTool = tool ? this.kit[tool] : null;
    if (!this.motion) this.showHeld();
  }

  get holding(): Held | null {
    return this.held;
  }

  private showHeld(): void {
    for (const tool of [this.inRight, this.inLeft]) tool?.removeFromParent();
    this.inRight = this.inLeft = null;
    const tool = this.heldTool;
    this.root.visible = !!tool;
    if (!tool) return;
    tool.position.set(0, 0, -0.03);
    // The bow stands upright in the left hand; everything else sits in the right.
    tool.rotation.set(0, 0, this.held === 'bow' ? Math.PI * 0.15 - Math.PI / 2 + Math.PI : 0);
    if (this.held === 'bow') this.left.add(tool);
    else this.right.add(tool);
  }

  play(motion: Motion): void {
    this.heldTool?.removeFromParent();
    this.motion = motion;
    this.t = 0;
    this.length = SECONDS[motion] ?? 1.6;
    for (const tool of [this.inRight, this.inLeft]) tool?.removeFromParent();
    this.inRight = this.inLeft = null;
    const k = this.kit;
    const r: Partial<Record<Motion, THREE.Object3D>> = { chop: k.axe, build: k.stone, fire: k.stone, pour: k.pot, drink: k.cup, fish: k.rod, knife: k.knife, eat: k.food, stir: k.stick, flute: k.flute, write: k.stick, gather: k.bundle, dig: k.clay, snare: k.wire, drop: k.bundle };
    const l: Partial<Record<Motion, THREE.Object3D>> = { build: k.stick, fire: k.ferro, bow: k.bow, knife: k.stick, write: k.paper, friction: k.stick };
    const put = (tool: THREE.Object3D | undefined, parent: THREE.Group) => {
      if (!tool) return null;
      tool.position.set(0, 0, -0.03);
      tool.rotation.set(0, 0, 0);
      parent.add(tool);
      return tool;
    };
    this.inRight = put(r[motion], this.right);
    this.inLeft = put(l[motion], this.left);
    if (motion === 'rocks') this.inRight = put(k.rock, this.right);
    if (motion === 'fire') {
      k.sparks.removeFromParent();
      this.left.add(k.sparks);
    }
    this.root.visible = motion !== 'look' && motion !== 'sit' && motion !== 'nod';
  }

  /** Moves the hands; returns how far the view dips (pitch) and drops (metres) right now. */
  update(dt: number, walking = false): { pitch: number; drop: number; yaw: number } {
    this.clock += dt;
    if (!this.motion) {
      if (this.heldTool) this.idle(walking);
      return { pitch: 0, drop: 0, yaw: 0 };
    }
    this.t += dt / this.length;
    if (this.t >= 1) {
      this.motion = null;
      this.root.visible = false;
      this.kit.sparks.removeFromParent();
      this.showHeld();
      return { pitch: 0, drop: 0, yaw: 0 };
    }
    const t = this.t;
    const e = envelope(t);
    const w = Math.max(0, Math.min(1, (t - 0.2) / 0.6)); // the work phase, 0 → 1
    const S = Math.sin;
    let R: Pose = [0.24, -0.28, -0.5, 0, 0, 0];
    let L: Pose = [-0.24, -0.3, -0.5, 0, 0, 0];
    let pitch = -0.25 * e;
    let drop = 0;
    let yaw = 0;
    switch (this.motion) {
      case 'chop': {
        const swing = Math.abs(S(w * Math.PI * 2));
        R = [0.18, -0.2 + swing * 0.25, -0.55, -1.6 + swing * 2.2, 0, 0.2];
        L = [0.05, -0.3 + swing * 0.2, -0.45, -1.4 + swing * 2, 0, 0.2];
        pitch = -0.45 * e;
        break;
      }
      case 'gather':
      case 'rocks':
      case 'dig': {
        const reach = S(Math.min(1, w * 1.4) * Math.PI);
        const heavy = this.motion === 'rocks' ? 1 : 0;
        R = [0.16, -0.42 - reach * 0.18, -0.55 - reach * 0.15, -0.6 * reach, 0, 0];
        L = [-0.16, -0.42 - reach * 0.18, -0.55 - reach * 0.15, -0.6 * reach, 0, 0];
        if (heavy) {
          R[0] = 0.12;
          L[0] = -0.12;
        }
        pitch = -0.75 * e;
        drop = -0.35 * e;
        break;
      }
      case 'build': {
        const hit = Math.abs(S(w * Math.PI * 3));
        R = [0.14, -0.3 + hit * 0.16, -0.5, -0.4 + hit * 0.8, 0, 0];
        L = [-0.14, -0.36, -0.52, 0, 0, Math.PI / 2];
        pitch = -0.55 * e;
        break;
      }
      case 'fire': {
        const strike = (w * 4) % 1;
        R = [0.06 + strike * 0.08, -0.36 - strike * 0.06, -0.48, -0.3, 0, 0];
        L = [-0.06, -0.34, -0.5, 0.4, 0, 0];
        this.kit.sparks.visible = strike > 0.6;
        pitch = -0.6 * e;
        break;
      }
      case 'friction': {
        const saw = S(w * Math.PI * 8) * 0.07;
        R = [0.14 + saw, -0.38, -0.5, 0, 0, 0];
        L = [-0.08, -0.4, -0.5, 0, 0, Math.PI / 2];
        pitch = -0.6 * e;
        break;
      }
      case 'pour':
      case 'stir':
      case 'wash': {
        const round = w * Math.PI * 4;
        if (this.motion === 'pour') R = [0.1, -0.32, -0.5, 0, 0, -0.9 * S(w * Math.PI)];
        else if (this.motion === 'stir') R = [0.08 + Math.cos(round) * 0.05, -0.36, -0.5 + S(round) * 0.04, 0.6, 0, 0];
        else R = [0.04 + S(round) * 0.03, -0.38, -0.46, 0.2, 0, -0.4];
        L = this.motion === 'wash' ? [-0.04 - S(round) * 0.03, -0.38, -0.46, 0.2, 0, 0.4] : AWAY_L;
        pitch = -0.6 * e;
        break;
      }
      case 'drink':
      case 'eat': {
        const sip = S(Math.min(1, w * (this.motion === 'eat' ? 2 : 1)) * Math.PI);
        R = [0.12 - sip * 0.1, -0.3 + sip * 0.2, -0.42 + sip * 0.18, sip * 0.9, 0, 0];
        L = AWAY_L;
        pitch = 0.08 * e * sip;
        break;
      }
      case 'fish': {
        const cast = w < 0.4 ? -w / 0.4 : -1 + (w - 0.4) / 0.25;
        R = [0.2, -0.25, -0.5, -0.4 + Math.max(-1, Math.min(0.6, cast)) * 1.1, 0, 0];
        L = AWAY_L;
        pitch = -0.05 * e;
        break;
      }
      case 'pull':
      case 'snare': {
        const hand = S(w * Math.PI * 4);
        R = [0.08, -0.36 + hand * 0.06, -0.5, -0.3, 0, 0];
        L = [-0.08, -0.36 - hand * 0.06, -0.5, -0.3, 0, 0];
        pitch = (this.motion === 'snare' ? -0.75 : -0.4) * e;
        drop = this.motion === 'snare' ? -0.4 * e : 0;
        break;
      }
      case 'bow': {
        const draw = Math.min(1, w * 1.6);
        const loose = w > 0.75;
        L = [-0.1, -0.12, -0.6, 0, 0, 0];
        R = loose ? [0.18, -0.1, -0.2, 0, 0, 0] : [0.02 + draw * 0.12, -0.12, -0.55 + draw * 0.3, 0, 0, 0];
        pitch = 0.05 * e;
        break;
      }
      case 'knife': {
        const cut = (w * 4) % 1;
        R = [0.1 + cut * 0.06, -0.33, -0.48 + cut * 0.05, -0.8, 0, 0.3];
        L = [-0.06, -0.36, -0.5, 0, 0, Math.PI / 2 - 0.3];
        pitch = -0.6 * e;
        break;
      }
      case 'flute': {
        R = [0.08, -0.12, -0.32, 0, 0, S(w * 30) * 0.03];
        L = [-0.1, -0.12, -0.32, 0, 0, -S(w * 26) * 0.03];
        break;
      }
      case 'call': {
        R = [0.05, -0.1, -0.25, 0, -0.6, 0];
        L = [-0.05, -0.1, -0.25, 0, 0.6, 0];
        pitch = 0.15 * e;
        break;
      }
      case 'drop': {
        const down = S(Math.min(1, w) * Math.PI);
        R = [0.1, -0.35 - down * 0.15, -0.5 - down * 0.1, -0.4 * down, 0, 0];
        L = [-0.1, -0.35 - down * 0.15, -0.5 - down * 0.1, -0.4 * down, 0, 0];
        pitch = -0.6 * e;
        break;
      }
      case 'write': {
        R = [0.06 + S(w * 40) * 0.01 + w * 0.08, -0.38, -0.45, -0.9, 0, 0];
        L = [-0.08, -0.42, -0.45, 0, 0, 0];
        pitch = -0.8 * e;
        break;
      }
      case 'look':
        yaw = S(w * Math.PI * 2) * 0.45 * e;
        pitch = -0.1 * e;
        break;
      case 'sit':
        drop = -0.75 * e;
        pitch = -0.05 * e;
        break;
      case 'nod':
        pitch = S(w * Math.PI * 2) * 0.12 * e;
        break;
    }
    // Squeezed up into the middle of the view, clear of the energy meter at the bottom.
    const lift = (p: Pose): Pose => (p === AWAY_L || p === AWAY_R ? p : [p[0], p[1] * 0.3, p[2], p[3], p[4], p[5]]);
    this.place(this.right, mix(AWAY_R, lift(R), e));
    this.place(this.left, mix(AWAY_L, lift(L), e));
    return { pitch, drop, yaw };
  }

  /** The held tool resting low at the side of the view, swaying a little as you walk. */
  private idle(walking: boolean): void {
    const bob = walking ? Math.sin(this.clock * 9) * 0.012 : Math.sin(this.clock * 1.4) * 0.004;
    const bow = this.held === 'bow';
    const right: Record<Held, Pose> = {
      bow: AWAY_R,
      axe: [0.36, -0.42, -0.62, -1.05, 0.2, 0.35],
      shovel: [0.36, -0.42, -0.62, -1.05, 0.2, 0.35],
      saw: [0.3, -0.3, -0.6, -0.3, 0, 0.2],
      knife: [0.24, -0.28, -0.5, -0.5, 0, 0.2],
    };
    const r = right[this.held!];
    this.place(this.right, bow ? AWAY_R : [r[0], r[1] + bob, r[2], r[3], r[4], r[5]]);
    this.place(this.left, bow ? [-0.66, -0.14 + bob, -1.05, 0, 0.25, 0.1] : AWAY_L);
  }

  private place(g: THREE.Group, p: Pose): void {
    g.position.set(p[0], p[1], p[2]);
    g.rotation.set(p[3], p[4], p[5]);
  }
}
