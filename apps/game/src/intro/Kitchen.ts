// The night before (D-033): your kitchen, the kit spread over the table. Packing is the kit
// choice: click an item to put it in the pack, again to take it out. Point and click (D-113):
// three fixed shots of the room, the arrows step between them. Letters, the phone, the
// photo and the answering machine say who you are without a page of text.

import * as THREE from 'three';
import { FIRST_PERSON, type WorldShot } from '@tapout/content';
import { mat, mesh, pole, rough, seeded, v } from '../world/kit.ts';
import { ShotCamera } from '../world/shots.ts';

export interface KitchenHover {
  id: string;
  kind: 'kit' | 'note';
  x: number;
  y: number;
}

export interface KitchenEvents {
  hover: (h: KitchenHover | null) => void;
  click: (id: string, kind: 'kit' | 'note') => void;
  shot: (index: number, count: number, label: string) => void;
}

const ROOM = { w: 6, d: 5, h: 2.6 };
const TABLE = { x: 0, z: -0.3, w: 2.5, d: 1.4, h: 0.78 };
const SHOTS: readonly WorldShot[] = [
  { id: 'table', label: 'The kitchen table', eye: { x: 0, y: 1.85, z: 1.45 }, at: { x: 0.1, y: 0.7, z: -0.45 }, fov: 60 },
  { id: 'counter', label: 'The counter', eye: { x: 0.7, y: 1.6, z: 1.2 }, at: { x: -3, y: 1.0, z: -0.8 }, fov: 60 },
  { id: 'window', label: 'The window', eye: { x: 0.3, y: 1.6, z: 1.6 }, at: { x: 0, y: 1.4, z: -2.5 }, fov: 58 },
];

function kitModel(id: string): THREE.Group {
  const g = new THREE.Group();
  const wood = mat(0x9a7448);
  const metal = mat(0x6a6e72, { metal: 0.6, rough: 0.4 });
  switch (id) {
    case 'axe':
      g.add(pole(v(-0.3, 0.03, 0), v(0.3, 0.03, 0), 0.018, wood));
      g.add(mesh(new THREE.BoxGeometry(0.08, 0.02, 0.15), metal, 0.3, 0.03, 0.05));
      break;
    case 'saw':
      g.add(mesh(new THREE.BoxGeometry(0.42, 0.01, 0.09), metal, 0, 0.01, 0));
      g.add(mesh(new THREE.BoxGeometry(0.12, 0.03, 0.06), mat(0xb0502a), -0.26, 0.02, 0));
      break;
    case 'pot':
      g.add(mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.13, 10), metal, 0, 0.065, 0));
      break;
    case 'bag':
      g.add(mesh(rough(new THREE.CylinderGeometry(0.11, 0.11, 0.32, 8), 0.02), mat(0x9a5a2a), 0, 0.11, 0, 0, 0, Math.PI / 2));
      break;
    case 'ferro':
      g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 6), mat(0x2a2a2a), 0, 0.012, 0, 0, 0, Math.PI / 2));
      g.add(mesh(new THREE.BoxGeometry(0.06, 0.006, 0.02), metal, 0.03, 0.01, 0.04));
      break;
    case 'bow':
      g.add(mesh(new THREE.TorusGeometry(0.35, 0.012, 4, 16, Math.PI * 0.8), wood, 0, 0.02, 0.1, -Math.PI / 2, 0, Math.PI * 0.1));
      for (let i = 0; i < 4; i++) g.add(pole(v(-0.2, 0.01 + i * 0.012, -0.05 + i * 0.02), v(0.2, 0.01 + i * 0.012, -0.05 + i * 0.02), 0.005, mat(0xc8b088)));
      break;
    case 'line':
      g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 10), mat(0x3a7a9a), 0, 0.02, 0));
      break;
    case 'wire':
      g.add(mesh(new THREE.TorusGeometry(0.06, 0.008, 4, 14), mat(0xb0a080, { metal: 0.6 }), 0, 0.01, 0, -Math.PI / 2));
      g.add(mesh(new THREE.TorusGeometry(0.05, 0.008, 4, 14), mat(0xb0a080, { metal: 0.6 }), 0.01, 0.025, 0, -Math.PI / 2));
      break;
    case 'mace':
      g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 8), mat(0xd06a1a), 0, 0.1, 0));
      g.add(mesh(new THREE.BoxGeometry(0.03, 0.03, 0.04), mat(0x1a1a1a), 0, 0.21, 0));
      break;
    case 'multitool':
      g.add(mesh(new THREE.BoxGeometry(0.1, 0.02, 0.035), mat(0x8a1a1a), 0, 0.01, 0));
      break;
    case 'net': {
      g.add(mesh(new THREE.BoxGeometry(0.24, 0.07, 0.18), mat(0xc8bfa8), 0, 0.035, 0));
      const n = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.071, 0.19, 6, 2, 5), new THREE.MeshBasicMaterial({ color: 0x8a8070, wireframe: true }));
      n.position.y = 0.035;
      g.add(n);
      break;
    }
    case 'knife':
      g.add(mesh(new THREE.BoxGeometry(0.14, 0.01, 0.03), metal, 0.06, 0.01, 0));
      g.add(mesh(new THREE.BoxGeometry(0.1, 0.025, 0.03), mat(0x3a2a1a), -0.06, 0.012, 0));
      break;
    case 'shovel':
      g.add(pole(v(-0.28, 0.02, 0), v(0.18, 0.02, 0), 0.015, wood));
      g.add(mesh(new THREE.BoxGeometry(0.14, 0.015, 0.13), metal, 0.25, 0.02, 0));
      break;
    case 'rations':
      for (let i = 0; i < 3; i++) g.add(mesh(new THREE.BoxGeometry(0.14, 0.04, 0.09), mat(0x6a7a3a), 0, 0.02 + i * 0.042, 0, 0, i * 0.2, 0));
      break;
    case 'salt':
      g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.11, 8), mat(0x2a4aa0), 0, 0.055, 0));
      break;
    case 'tarp':
      g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.34, 8), mat(0x3f6a5a), 0, 0.07, 0, 0, 0, Math.PI / 2));
      break;
    case 'soap':
      g.add(mesh(rough(new THREE.BoxGeometry(0.08, 0.03, 0.05), 0.005), mat(0xe8e0c8), 0, 0.015, 0));
      break;
    default:
      g.add(mesh(new THREE.BoxGeometry(0.1, 0.06, 0.1), mat(0x777777), 0, 0.03, 0));
  }
  return g;
}

export class Kitchen {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FIRST_PERSON.fov, 1920 / 1080, 0.03, 50);
  private clickables: THREE.Object3D[] = [];
  private items = new Map<string, THREE.Group>();
  private home = new Map<string, THREE.Vector3>();
  private pack!: THREE.Group;
  private packFill!: THREE.Mesh;
  private packed = new Set<string>();
  private blink!: THREE.Mesh;
  private shots: ShotCamera;
  private shot = 0;
  private mouse: { x: number; y: number } | null = null;
  private hovered: KitchenHover | null = null;
  private raycaster = new THREE.Raycaster();
  private clock = new THREE.Clock();
  private time = 0;
  private lit = new Set<THREE.MeshStandardMaterial>();
  frozen = false;

  constructor(
    host: HTMLElement,
    private readonly pool: ReadonlyArray<{ id: string }>,
    private readonly events: KitchenEvents,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(1920, 1080, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(this.renderer.domElement);
    this.shots = new ShotCamera(this.camera);
    this.build();
    this.bind();
    this.goShot(0, true);
    this.renderer.setAnimationLoop(() => this.frame());
  }

  dispose(): void {
    this.renderer.setAnimationLoop(null);
    this.unbind();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  /** Steps to the next shot (1) or the one before (-1). */
  turn(step: number): void {
    if (this.frozen) return;
    this.goShot((this.shot + step + SHOTS.length) % SHOTS.length, false);
  }

  private goShot(i: number, cut: boolean): void {
    this.shot = i;
    this.shots.go(SHOTS[i]!, () => 0, cut);
    this.events.shot(i, SHOTS.length, SHOTS[i]!.label);
  }

  setPacked(ids: ReadonlySet<string>): void {
    this.packed = new Set(ids);
    for (const [id, g] of this.items) {
      g.visible = !ids.has(id);
    }
    this.packFill.scale.setScalar(0.6 + (ids.size / 10) * 0.4);
  }

  // ---- the room

  private build(): void {
    const s = this.scene;
    s.background = new THREE.Color(0x0a0c10);
    const floor = mat(0x6a4c32);
    const wall = mat(0x8a8272);
    s.add(mesh(new THREE.BoxGeometry(ROOM.w, 0.1, ROOM.d), floor, 0, -0.05, 0));
    // Floorboards.
    for (let i = 0; i < 12; i++) s.add(mesh(new THREE.BoxGeometry(0.01, 0.002, ROOM.d), mat(0x4a3424), -ROOM.w / 2 + i * 0.5, 0.001, 0));
    s.add(mesh(new THREE.BoxGeometry(ROOM.w, 0.1, ROOM.d), mat(0xb8b0a0), 0, ROOM.h + 0.05, 0));
    s.add(mesh(new THREE.BoxGeometry(ROOM.w, ROOM.h, 0.1), wall, 0, ROOM.h / 2, ROOM.d / 2 + 0.05));
    s.add(mesh(new THREE.BoxGeometry(0.1, ROOM.h, ROOM.d), wall, -ROOM.w / 2 - 0.05, ROOM.h / 2, 0));
    s.add(mesh(new THREE.BoxGeometry(0.1, ROOM.h, ROOM.d), wall, ROOM.w / 2 + 0.05, ROOM.h / 2, 0));
    // Back wall with a window.
    const bz = -ROOM.d / 2 - 0.05;
    s.add(mesh(new THREE.BoxGeometry(ROOM.w, 0.9, 0.1), wall, 0, 0.45, bz));
    s.add(mesh(new THREE.BoxGeometry(ROOM.w, 0.6, 0.1), wall, 0, ROOM.h - 0.3, bz));
    s.add(mesh(new THREE.BoxGeometry(2.4, 1.1, 0.1), wall, -1.8, 1.45, bz));
    s.add(mesh(new THREE.BoxGeometry(2.4, 1.1, 0.1), wall, 1.8, 1.45, bz));
    const glass = mesh(new THREE.PlaneGeometry(1.2, 1.1), new THREE.MeshStandardMaterial({ color: 0x0c1424, roughness: 0.05, metalness: 0.6 }), 0, 1.45, bz + 0.02);
    this.note(glass, 'window');
    s.add(glass);
    s.add(mesh(new THREE.BoxGeometry(0.04, 1.1, 0.06), mat(0xe0dccf), 0, 1.45, bz + 0.05));
    s.add(mesh(new THREE.BoxGeometry(1.2, 0.04, 0.06), mat(0xe0dccf), 0, 1.45, bz + 0.05));
    const moon = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), new THREE.MeshBasicMaterial({ color: 0xdfe6f0 }));
    moon.position.set(0.32, 1.78, bz - 2);
    s.add(moon);
    // A door on the right wall.
    s.add(mesh(new THREE.BoxGeometry(0.06, 2.05, 0.9), mat(0x5a3e28), ROOM.w / 2 - 0.02, 1.02, 1.3));
    s.add(mesh(new THREE.SphereGeometry(0.03, 6, 4), mat(0xb09040, { metal: 0.7 }), ROOM.w / 2 - 0.07, 1.0, 0.95));

    // Counter and sink along the left wall, the fridge in the back-left corner.
    s.add(mesh(new THREE.BoxGeometry(0.65, 0.9, 2.6), mat(0x4e5a4a), -ROOM.w / 2 + 0.33, 0.45, 0.1));
    s.add(mesh(new THREE.BoxGeometry(0.7, 0.04, 2.65), mat(0x8a8478), -ROOM.w / 2 + 0.35, 0.92, 0.1));
    s.add(mesh(new THREE.BoxGeometry(0.4, 0.05, 0.5), mat(0x9aa0a4, { metal: 0.6, rough: 0.3 }), -ROOM.w / 2 + 0.35, 0.92, 0.6));
    const fridge = mesh(new THREE.BoxGeometry(0.75, 1.85, 0.7), mat(0xd8d6ce, { rough: 0.5 }), -ROOM.w / 2 + 0.4, 0.93, -ROOM.d / 2 + 0.4);
    s.add(fridge);
    const photo = new THREE.Group();
    photo.add(mesh(new THREE.BoxGeometry(0.01, 0.12, 0.17), mat(0xf4f0e6), 0, 0, 0));
    photo.add(mesh(new THREE.BoxGeometry(0.012, 0.08, 0.13), mat(0x5a8aa8), 0, 0.01, 0));
    photo.add(mesh(new THREE.SphereGeometry(0.012, 6, 4), mat(0xc84a3a), 0.01, 0.065, 0));
    photo.position.set(-ROOM.w / 2 + 0.79, 1.35, -ROOM.d / 2 + 0.45);
    this.note(photo, 'photo');
    s.add(photo);
    // The answering machine with its blinking light, the phone and the letter on the counter.
    const machine = new THREE.Group();
    machine.add(mesh(new THREE.BoxGeometry(0.2, 0.06, 0.16), mat(0x1e1e20), 0, 0.03, 0));
    this.blink = mesh(new THREE.SphereGeometry(0.012, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff2a1a }), 0.06, 0.065, 0.05);
    machine.add(this.blink);
    machine.position.set(-ROOM.w / 2 + 0.35, 0.94, -0.6);
    machine.rotation.y = Math.PI / 2;
    this.note(machine, 'machine');
    s.add(machine);
    const phone = mesh(new THREE.BoxGeometry(0.075, 0.01, 0.15), mat(0x111214, { rough: 0.3 }), -ROOM.w / 2 + 0.4, 0.945, 0.0, 0, 0.3, 0);
    const screen = mesh(new THREE.PlaneGeometry(0.065, 0.13), new THREE.MeshBasicMaterial({ color: 0x8ab8e8 }), 0, 0.006, 0, -Math.PI / 2);
    phone.add(screen);
    this.note(phone, 'phone');
    s.add(phone);

    // The table, two chairs, and everything you might take.
    const tw = mat(0x8a6440);
    s.add(mesh(new THREE.BoxGeometry(TABLE.w, 0.05, TABLE.d), tw, TABLE.x, TABLE.h, TABLE.z));
    for (const [x, z] of [[-1.15, -0.9], [1.15, -0.9], [-1.15, 0.3], [1.15, 0.3]] as const) s.add(mesh(new THREE.BoxGeometry(0.06, TABLE.h, 0.06), tw, x, TABLE.h / 2, z));
    const chair = (x: number, z: number, r: number) => {
      const c = new THREE.Group();
      c.add(mesh(new THREE.BoxGeometry(0.45, 0.04, 0.45), tw, 0, 0.46, 0));
      for (const [a, b] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]] as const) c.add(mesh(new THREE.BoxGeometry(0.04, 0.46, 0.04), tw, a, 0.23, b));
      c.add(mesh(new THREE.BoxGeometry(0.45, 0.5, 0.04), tw, 0, 0.72, -0.21));
      c.position.set(x, 0, z);
      c.rotation.y = r;
      s.add(c);
      return c;
    };
    chair(-1.65, -0.3, Math.PI / 2);
    chair(1.65, -0.3, -Math.PI / 2);
    // The pack on the right-hand chair.
    this.pack = new THREE.Group();
    this.packFill = mesh(rough(new THREE.BoxGeometry(0.42, 0.62, 0.28, 2, 2, 2), 0.04, 3), mat(0xa2462e), 0, 0.31, 0);
    this.packFill.geometry.translate(0, 0, 0);
    this.pack.add(this.packFill);
    this.pack.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.46, 8), mat(0x2f4a5a), 0, 0.67, 0, 0, 0, Math.PI / 2));
    this.pack.position.set(1.65, 0.48, -0.3);
    this.pack.rotation.y = -Math.PI / 2;
    s.add(this.pack);

    // Kit on the table: three rows.
    const cols = 6;
    this.pool.forEach((item, i) => {
      const g = kitModel(item.id);
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = TABLE.x - TABLE.w / 2 + 0.26 + col * ((TABLE.w - 0.5) / (cols - 1));
      const z = TABLE.z - TABLE.d / 2 + 0.27 + row * 0.43;
      g.position.set(x, TABLE.h + 0.025, z);
      g.rotation.y = (seeded(i + 3)() - 0.5) * 0.5;
      g.scale.setScalar(item.id === 'bow' ? 0.8 : 1.2);
      g.userData.pick = { id: item.id, kind: 'kit' };
      this.items.set(item.id, g);
      this.home.set(item.id, g.position.clone());
      this.clickables.push(g);
      s.add(g);
    });
    // The letter, half under the axe.
    const letter = mesh(new THREE.BoxGeometry(0.22, 0.003, 0.3), mat(0xf2ecdc), TABLE.x + 0.95, TABLE.h + 0.028, TABLE.z + 0.5, 0, 0.4, 0);
    this.note(letter, 'letter');
    s.add(letter);

    // Light: one warm bulb over the table, cold moonlight from the window.
    const bulb = new THREE.PointLight(0xffc98a, 9, 0, 1.6);
    bulb.position.set(0, 2.2, -0.2);
    bulb.castShadow = true;
    bulb.shadow.mapSize.set(1024, 1024);
    bulb.shadow.bias = -0.002;
    s.add(bulb);
    s.add(mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff0d0 }), 0, 2.25, -0.2));
    s.add(pole(v(0, 2.3, -0.2), v(0, ROOM.h, -0.2), 0.008, mat(0x222222)));
    s.add(new THREE.HemisphereLight(0x8090b0, 0x302418, 0.55));
    const moonLight = new THREE.DirectionalLight(0x7088c0, 0.4);
    moonLight.position.set(0.5, 2, -5);
    s.add(moonLight);
  }

  private note(o: THREE.Object3D, id: string): void {
    o.userData.pick = { id, kind: 'note' };
    this.clickables.push(o);
  }

  // ---- input

  private onKey = (e: KeyboardEvent) => {
    if (e.repeat) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.turn(-1);
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.turn(1);
  };
  private onMove = (e: MouseEvent) => {
    if (e.target !== this.renderer.domElement) {
      this.mouse = null;
      return;
    }
    const r = this.renderer.domElement.getBoundingClientRect();
    this.mouse = { x: ((e.clientX - r.left) / r.width) * 1920, y: ((e.clientY - r.top) / r.height) * 1080 };
  };
  private onDown = (e: MouseEvent) => {
    if (e.button !== 0 || this.frozen) return;
    this.onMove(e);
    this.updateHover();
    const h = this.hovered;
    if (h) this.events.click(h.id, h.kind);
  };

  private bind(): void {
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('mousemove', this.onMove);
    this.renderer.domElement.addEventListener('mousedown', this.onDown);
  }

  private unbind(): void {
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('mousemove', this.onMove);
    this.renderer.domElement.removeEventListener('mousedown', this.onDown);
  }

  // ---- every frame

  private updateHover(): void {
    let next: KitchenHover | null = null;
    if (!this.frozen && this.mouse && !this.shots.moving) {
      const ndc = new THREE.Vector2((this.mouse.x / 1920) * 2 - 1, -(this.mouse.y / 1080) * 2 + 1);
      this.raycaster.setFromCamera(ndc, this.camera);
      const hit = this.raycaster.intersectObjects(this.clickables.filter((c) => c.visible), true)[0];
      if (hit && hit.distance < 6) {
        let o: THREE.Object3D | null = hit.object;
        while (o && !o.userData.pick) o = o.parent;
        if (o) {
          const p = o.userData.pick as { id: string; kind: 'kit' | 'note' };
          next = { ...p, x: this.mouse.x, y: this.mouse.y };
        }
      }
    }
    const prev = this.hovered;
    if (prev?.id !== next?.id || (next && (prev?.x !== next.x || prev?.y !== next.y))) {
      this.hovered = next;
      this.events.hover(next);
    }
    for (const m of this.lit) m.emissiveIntensity = 0;
    this.lit.clear();
    if (next) {
      const target = next.kind === 'kit' ? this.items.get(next.id) : this.clickables.find((c) => (c.userData.pick as { id: string }).id === next!.id);
      target?.traverse((o) => {
        if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial) {
          if (!o.userData.ownMat) {
            o.material = o.material.clone();
            o.userData.ownMat = true;
          }
          const m = o.material as THREE.MeshStandardMaterial;
          m.emissive.setHex(0xffa040);
          m.emissiveIntensity = 0.35;
          this.lit.add(m);
        }
      });
    }
    this.renderer.domElement.style.cursor = next ? 'pointer' : 'default';
  }

  private frame(): void {
    const raw = this.clock.getDelta();
    const dt = Math.min(0.05, raw);
    this.time += dt;
    this.shots.update(Math.min(0.25, raw), this.time);
    this.blink.visible = Math.sin(this.time * 5) > 0;
    this.updateHover();
    this.renderer.render(this.scene, this.camera);
  }

  /** For screenshots and tests: what is packed right now. */
  get packedIds(): ReadonlySet<string> {
    return this.packed;
  }
}
