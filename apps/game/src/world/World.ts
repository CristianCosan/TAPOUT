// The first-person world (D-030): one small 3D area at a time, built from code shapes, that you
// walk around in. Looking at a station lights it up; clicking it opens its v12 actions in the
// React panel. Walking costs no game time. Light, sky, fog and weather follow v12's clock and
// weather, which the screen passes in; nothing here changes the run.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FIRST_PERSON, type LocationLayout, type WorldArea } from '@tapout/content';
import { mat, noise, rough, seeded } from './kit.ts';
import { buildProp, propKey, type PropState } from './props.ts';
import { audio } from '../audio/engine.ts';
import { settings } from '../settings.ts';
import { Wildlife } from './life.ts';
import { Ambience } from './sound.ts';

export interface WorldInput {
  area: WorldArea;
  layout: LocationLayout;
  hidden: ReadonlySet<string>;
  selected: string | null;
  /** v12's clock, in hours (fractional). */
  hour: number;
  dawn: number;
  dusk: number;
  weather: string;
  winter: boolean;
  /** v12's air temperature now, for your breath showing in the cold. */
  tempC?: number;
  props: PropState;
  /** An overlay is open: no walking, no looking. */
  frozen: boolean;
  /** v12's birds-go-silent tell. */
  birdsSilent?: boolean;
  /** Northern lights tonight (scenery, chosen by the app). */
  aurora?: boolean;
}

export interface Hover {
  id: string;
  label: string;
  /** Close enough to use. */
  near: boolean;
  /** Where to show the label, in stage pixels. */
  x: number;
  y: number;
}

export interface WorldEvents {
  select: (id: string) => void;
  clear: () => void;
  hover: (hover: Hover | null) => void;
  /** Pointer lock came or went: whether you are looking around with the mouse. */
  looking: (on: boolean) => void;
}

interface StationNode {
  group: THREE.Group;
  key: string;
  mats: THREE.MeshStandardMaterial[];
  box: THREE.Box3;
}

const LEAVES = 160;
const RINGS = 48;
const SPARKS = 60;
const PRINTS = 200;
const FLASH = new THREE.Color(0xdfe6ff);

let soft: THREE.Texture | null = null;
/** A white dot fading to clear at the edge, drawn once: mist and breath. */
function softTexture(): THREE.Texture {
  if (soft) return soft;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  soft = new THREE.CanvasTexture(c);
  return soft;
}
const WEATHER_GREY: Record<string, number> = { clear: 0, cold: 0.05, overcast: 0.6, rain: 0.8, snow: 0.75, storm: 1 };
/** How much of the sky clouds take, by v12 weather. */
const CLOUD_COVER: Record<string, number> = { clear: 0.4, cold: 0.3, overcast: 0.72, rain: 0.85, snow: 0.85, storm: 0.95 };
const FOG: Record<string, [number, number]> = { clear: [40, 280], cold: [40, 240], overcast: [22, 130], rain: [12, 75], snow: [8, 55], storm: [6, 42] };

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export class World {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private areaRoot = new THREE.Group();
  private stations = new Map<string, StationNode>();
  private input: WorldInput | null = null;
  private events: WorldEvents | null = null;
  private areaKey = '';

  // light and sky
  private sun = new THREE.DirectionalLight(0xffffff, 2);
  private hemi = new THREE.HemisphereLight(0xbfd8ff, 0x3a3020, 0.8);
  private fireLight = new THREE.PointLight(0xff8a3a, 0, 0, 1.7);
  private sky: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  private stars: THREE.Points;
  private moon: THREE.Mesh;
  private water: THREE.Mesh | null = null;
  private shownHour = -1;

  // weather
  private rain: THREE.LineSegments;
  /** Autumn leaves drifting down around you (scenery only). */
  private leaves: THREE.InstancedMesh;
  private leafAt: Float32Array;
  private snow: THREE.Points;
  private smoke: THREE.Mesh[] = [];
  /** Sparks off a burning fire: additive points whose colour fades to black as they die. */
  private sparks: THREE.Points;
  private sparkLife = new Float32Array(SPARKS);
  private sparkVel = new Float32Array(SPARKS * 3);
  private breath: THREE.Sprite[] = [];
  private breathAt = 0;

  // you
  private pos = new THREE.Vector3();
  private yaw = 0;
  private pitch = 0;
  private keys = new Set<string>();
  private bob = 0;
  private locked = false;
  private mouse: { x: number; y: number } | null = null;
  private hovered: Hover | null = null;
  private raycaster = new THREE.Raycaster();
  private clock = new THREE.Clock();
  private time = 0;
  private disposed = false;
  private sound = new Ambience();
  private life: Wildlife | null = null;
  private unready: () => void = () => undefined;
  /** How much daylight the sky showed last frame, 0 to 1. */
  private daylight = 1;
  /** Screenshot and test aid: show another hour or weather without touching the run. */
  private previewing: { hour?: number; weather?: string; tempC?: number; aurora?: boolean } = {};
  set preview(p: { hour?: number; weather?: string; tempC?: number; aurora?: boolean }) {
    this.previewing = p;
    this.shownHour = -1;
    this.wetSnap = true;
  }
  get preview() {
    return this.previewing;
  }

  constructor(private readonly host: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(FIRST_PERSON.fov, 1920 / 1080, 0.05, 900);
    this.camera.rotation.order = 'YXZ';

    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -28;
    sc.right = 28;
    sc.top = 28;
    sc.bottom = -28;
    sc.near = 1;
    sc.far = 160;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun, this.sun.target, this.hemi, this.fireLight, this.areaRoot);
    this.fireLight.castShadow = true;
    this.fireLight.shadow.mapSize.set(512, 512);
    this.fireLight.shadow.bias = -0.002;
    this.applyGraphics();

    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(600, 24, 12),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color() },
          horizon: { value: new THREE.Color() },
          glow: { value: new THREE.Color() },
          sunDir: { value: new THREE.Vector3() },
          cloud: { value: new THREE.Color() },
          cover: { value: 0 },
          drift: { value: 0 },
        },
        vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        // clouds: value noise on a flat ceiling above you, drifting with the wind; `cover` is how much sky they take
        fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 glow; uniform vec3 sunDir; uniform vec3 cloud; uniform float cover; uniform float drift; varying vec3 vDir;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
          float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
          void main(){ float h = max(vDir.y, 0.0); vec3 c = mix(horizon, top, pow(h, 0.55));
          float s = max(dot(normalize(vDir), normalize(sunDir)), 0.0); c += glow * pow(s, 6.0) * (1.0 - h);
          if (vDir.y > 0.02 && cover > 0.0) {
            vec2 uv = vDir.xz / (vDir.y + 0.12) * 1.6 + vec2(drift, drift * 0.35);
            float n = fbm(uv);
            float k = smoothstep(1.0 - cover, 1.0 - cover + 0.28, n) * smoothstep(0.02, 0.25, vDir.y);
            vec3 cc = mix(cloud * 0.72, cloud, smoothstep(0.4, 0.9, fbm(uv + 0.6))) + glow * pow(s, 3.0) * 0.6;
            c = mix(c, cc, k * 0.92);
          }
          if (vDir.y < 0.0) c = horizon; gl_FragColor = vec4(c, 1.0); }`,
      }),
    );
    this.sky.renderOrder = -1;
    this.scene.add(this.sky);
    this.prints = new THREE.InstancedMesh(new THREE.CircleGeometry(0.07, 7).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x9aa8b4 }), PRINTS);
    this.prints.count = 0;
    this.prints.frustumCulled = false;
    this.scene.add(this.prints);
    this.aurora = this.makeAurora();
    this.scene.add(this.aurora);

    const rnd = seeded(99);
    const starPos: number[] = [];
    for (let i = 0; i < 1800; i++) {
      const a = rnd() * Math.PI * 2;
      const y = 0.05 + rnd() * 0.95;
      const r = Math.sqrt(1 - y * y);
      starPos.push(Math.cos(a) * r * 560, y * 560, Math.sin(a) * r * 560);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    this.scene.add(this.stars);
    this.moon = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 10), new THREE.MeshBasicMaterial({ color: 0xe8ecf4, fog: false, transparent: true }));
    this.scene.add(this.moon);

    // Rain: short streaks in a box that follows you. Snow: drifting points.
    const rainPos = new Float32Array(2400 * 6);
    for (let i = 0; i < 2400; i++) {
      const x = (rnd() - 0.5) * 40;
      const y = rnd() * 20;
      const z = (rnd() - 0.5) * 40;
      rainPos.set([x, y, z, x, y - 0.5, z], i * 6);
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    this.rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x9fb2c0, transparent: true, opacity: 0.45 }));
    this.rain.frustumCulled = false;
    const snowPos = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) snowPos.set([(rnd() - 0.5) * 40, rnd() * 18, (rnd() - 0.5) * 40], i * 3);
    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    this.snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.9 }));
    this.snow.frustumCulled = false;
    this.scene.add(this.rain, this.snow);

    this.leafAt = new Float32Array(LEAVES * 4);
    for (let i = 0; i < LEAVES; i++) this.leafAt.set([(rnd() - 0.5) * 36, rnd() * 12, (rnd() - 0.5) * 36, rnd() * 6.28], i * 4);
    this.leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.12, 0.09), new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), LEAVES);
    const leafColors = [0xc8761e, 0xd9a520, 0xa8441c, 0xb88a2a, 0x8a5a1c];
    for (let i = 0; i < LEAVES; i++) this.leaves.setColorAt(i, new THREE.Color(leafColors[i % leafColors.length]!));
    this.leaves.frustumCulled = false;
    this.scene.add(this.leaves);

    for (let i = 0; i < 3; i++) {
      const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTexture(), color: 0xeef2f4, transparent: true, opacity: 0, depthWrite: false }));
      b.userData.age = 9;
      this.breath.push(b);
      this.scene.add(b);
    }

    for (let i = 0; i < 10; i++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 0), new THREE.MeshLambertMaterial({ color: 0x8a8a8a, transparent: true, opacity: 0, depthWrite: false, flatShading: true }));
      puff.userData.t = i / 10;
      this.smoke.push(puff);
      this.scene.add(puff);
    }

    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SPARKS * 3), 3));
    sparkGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(SPARKS * 3), 3));
    this.sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ size: 0.07, map: softTexture(), vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: true }));
    this.sparks.frustumCulled = false;
    this.scene.add(this.sparks);

    this.scene.fog = new THREE.Fog(0x9fb0bf, 30, 190);
    this.bind();
    this.unready = audio.ready(() => this.sound.start());
    this.renderer.setAnimationLoop(() => this.frame());
  }

  configure(input: WorldInput, events: WorldEvents): void {
    this.events = events;
    this.syncLock(input);
    const prev = this.input;
    this.input = input;
    const key = `${input.area.id}-${input.winter}`;
    if (key !== this.areaKey) {
      const sameArea = prev?.area.id === input.area.id;
      this.buildArea(input);
      if (!sameArea) this.spawn(input.area);
      this.areaKey = key;
      if (!sameArea) this.shownHour = -1;
    }
    this.syncStations(input);
  }

  dispose(): void {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.unbind();
    this.unready();
    this.sound.stop();
    if (document.pointerLockElement === this.renderer.domElement) document.exitPointerLock();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  /** Things that are not stations, added by a scene of its own (the intro's plane). */
  addExtra(o: THREE.Object3D): void {
    this.scene.add(o);
  }

  /** Called every frame with the frame time and the time since the world began. */
  onFrame: ((dt: number, t: number) => void) | null = null;

  /** Where you stand, for scenes that place things around you. */
  get standing(): THREE.Vector3 {
    return this.pos.clone();
  }

  /** Where the scenery birds are. For tests and screenshots. */
  where() {
    const r = this.renderer.info.render;
    return { x: this.pos.x, z: this.pos.z, prints: this.prints.count, calls: r.calls, triangles: r.triangles, rings: this.rings?.children.filter((c) => c.visible).length ?? 0, shoreZ: this.input?.area.shoreZ };
  }

  birds() {
    this.life?.showDeer();
    return this.life?.where() ?? [];
  }

  /** Stands you somewhere and points you at a spot. For tests and screenshots. */
  stand(x: number, z: number, at: { x: number; y: number; z: number }): void {
    this.pos.set(x, 0, z);
    const eye = this.eye();
    const d = new THREE.Vector3(at.x, at.y, at.z).sub(eye);
    this.yaw = Math.atan2(-d.x, -d.z);
    this.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
  }

  /** Points you at a station from a step away. For tests and the robot player. */
  lookAt(id: string): boolean {
    const node = this.stations.get(id);
    if (!node || !node.group.visible) return false;
    const c = node.box.getCenter(new THREE.Vector3());
    const st = this.input!.area.stations[id]!;
    const away = new THREE.Vector3(this.pos.x - st.x, 0, this.pos.z - st.z);
    if (away.lengthSq() < 0.01) away.set(0, 0, 1);
    away.normalize().multiplyScalar(st.radius + 1.6);
    this.pos.set(st.x + away.x, 0, st.z + away.z);
    this.keepInside();
    const eye = this.eye();
    const d = c.clone().sub(eye);
    this.yaw = Math.atan2(-d.x, -d.z);
    this.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
    return true;
  }

  // ---- building an area

  private buildArea(input: WorldInput): void {
    for (const child of [...this.areaRoot.children]) {
      this.areaRoot.remove(child);
      child.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.InstancedMesh) o.geometry.dispose();
      });
    }
    this.stations.clear();
    this.water = null;
    this.mist = null;
    this.rings = null;
    this.prints.count = 0;
    this.printNext = 0;
    this.wetSnap = true;
    const { area, winter } = input;
    this.areaRoot.add(this.terrain(area, winter));
    if (area.shoreZ !== undefined) {
      const ice = winter;
      const w = new THREE.Mesh(
        new THREE.PlaneGeometry(700, 400, 1, 1),
        new THREE.MeshStandardMaterial({ color: ice ? 0xc4d4dc : 0x24404e, roughness: ice ? 0.45 : 0.08, metalness: ice ? 0 : 0.25 }),
      );
      w.rotation.x = -Math.PI / 2;
      w.position.set(0, -0.22, area.shoreZ - 200);
      w.receiveShadow = true;
      this.water = w;
      this.areaRoot.add(w);
      if (!ice) {
        this.areaRoot.add(this.makeMist(area.shoreZ));
        this.areaRoot.add(this.makeRings());
      }
    }
    this.areaRoot.add(this.trees(area, winter));
    this.areaRoot.add(this.rocks(area, winter));
    this.areaRoot.add(this.undergrowth(area, winter));
    this.life = new Wildlife(area, winter, (x, z) => this.ground(area, x, z));
    this.areaRoot.add(this.life.root);
  }

  /** Ground height: flat where you walk, rising into hills, dropping into the lake. */
  private ground(area: WorldArea, x: number, z: number): number {
    const r = Math.hypot(x, z);
    let h = (noise(x * 0.18, z * 0.18, area.trees.seed) - 0.5) * 0.25;
    h += Math.max(0, r - area.walkRadius - 2) * 0.07 * (0.6 + noise(x * 0.05, z * 0.05, 3));
    h += smooth(70, 160, r) * (8 + noise(x * 0.02, z * 0.02, 5) * 22);
    if (area.shoreZ !== undefined && z < area.shoreZ) {
      const far = area.shoreZ - 95;
      const lake = smooth(area.shoreZ, area.shoreZ - 5, z) * (1 - smooth(far + 8, far, z));
      h = h * (1 - lake) - 1.4 * lake;
    }
    return h;
  }

  private terrain(area: WorldArea, winter: boolean): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(420, 420, 160, 160);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const colors: number[] = [];
    const grass = new THREE.Color(winter ? 0xdfe6ea : 0x4b5a30);
    const dry = new THREE.Color(winter ? 0xc9d3d8 : 0x6b6a3a);
    const dirt = new THREE.Color(winter ? 0xb8b4ac : 0x5a4a36);
    const sand = new THREE.Color(winter ? 0xcfd8dc : 0x7a7466);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.ground(area, x, z);
      pos.setY(i, y);
      const n = noise(x * 0.3, z * 0.3, 7);
      c.copy(grass).lerp(dry, n * 0.7);
      const r = Math.hypot(x, z);
      if (r < area.walkRadius * 0.75) c.lerp(dirt, (1 - r / (area.walkRadius * 0.75)) * 0.8 * (0.6 + n * 0.4));
      if (area.shoreZ !== undefined && z < area.shoreZ + 2.5) c.lerp(sand, smooth(area.shoreZ + 2.5, area.shoreZ, z));
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
    this.groundMat = m.material;
    m.receiveShadow = true;
    return m;
  }

  private trees(area: WorldArea, winter: boolean): THREE.Group {
    const g = new THREE.Group();
    const rnd = seeded(area.trees.seed);
    const spots: Array<{ x: number; z: number; s: number; birch: boolean }> = [];
    const exits = Object.entries(area.stations).filter(([id]) => id.startsWith('to') || id === 'trailhead').map(([, s]) => s);
    const blocked = (x: number, z: number) => {
      if (area.shoreZ !== undefined && z < area.shoreZ + 1.5 && z > area.shoreZ - 92) return true;
      for (const e of exits) {
        // Keep the trail beyond each exit open so you can see where it goes.
        const len = Math.hypot(e.x, e.z);
        const ux = e.x / len;
        const uz = e.z / len;
        const t = (x - e.x) * ux + (z - e.z) * uz;
        if (t > -1 && t < 14 && Math.hypot(x - (e.x + ux * t), z - (e.z + uz * t)) < 2.2) return true;
      }
      return false;
    };
    let guard = 0;
    while (spots.length < area.trees.count && guard++ < area.trees.count * 20) {
      const a = rnd() * Math.PI * 2;
      const r = area.trees.clearing + Math.sqrt(rnd()) * (area.trees.outer - area.trees.clearing);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (blocked(x, z)) continue;
      spots.push({ x, z, s: 0.7 + rnd() * 0.7, birch: rnd() < area.trees.birchShare });
    }
    // The far shore across the lake: a band of timber.
    if (area.shoreZ !== undefined) {
      for (let i = 0; i < 260; i++) spots.push({ x: (rnd() - 0.5) * 360, z: area.shoreZ - 92 - rnd() * 40, s: 0.9 + rnd() * 0.8, birch: rnd() < 0.1 });
    }

    const conifers = spots.filter((t) => !t.birch);
    const birches = spots.filter((t) => t.birch);
    const foliage = mergeGeometries([0, 1, 2, 3].map((i) => rough(new THREE.ConeGeometry(2.3 - i * 0.45, 3.6 - i * 0.5, 7), 0.25, i + 1).translate(0, 2.6 + i * 1.6 + (3.6 - i * 0.5) / 2, 0)));
    const trunk = new THREE.CylinderGeometry(0.16, 0.26, 3.2, 6).translate(0, 1.6, 0);
    const bTrunk = new THREE.CylinderGeometry(0.1, 0.16, 7.5, 6).translate(0, 3.75, 0);
    const bCrown = rough(new THREE.IcosahedronGeometry(1.6, 0), 0.5, 5).translate(0, 7, 0);
    const add = (geo: THREE.BufferGeometry, color: number, list: typeof spots, tint: boolean) => {
      const m = new THREE.InstancedMesh(geo, mat(color), list.length);
      const o = new THREE.Object3D();
      const col = new THREE.Color();
      list.forEach((t, i) => {
        o.position.set(t.x, this.ground(area, t.x, t.z) - 0.1, t.z);
        o.rotation.y = t.x * 7.1;
        o.scale.set(t.s, t.s * (0.9 + (Math.abs(t.z * 13.7) % 0.4)), t.s);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        if (tint) m.setColorAt(i, col.setHex(color).multiplyScalar(0.8 + ((i * 37) % 10) / 25));
      });
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    };
    add(foliage, winter ? 0x6d8676 : 0x2a4430, conifers, true);
    add(trunk, 0x4a3828, conifers, false);
    add(bTrunk, 0xd8d2c4, birches, false);
    add(bCrown, winter ? 0x8a8478 : 0x7a8c3e, birches, true);
    return g;
  }

  private rocks(area: WorldArea, winter: boolean): THREE.Group {
    const g = new THREE.Group();
    const rnd = seeded(area.rocks.seed);
    for (let i = 0; i < area.rocks.count; i++) {
      const a = rnd() * Math.PI * 2;
      const r = area.walkRadius * 0.9 + rnd() * 22;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (area.shoreZ !== undefined && z < area.shoreZ - 3) continue;
      const s = 0.3 + rnd() * 1.1;
      const m = new THREE.Mesh(rough(new THREE.DodecahedronGeometry(s, 0), s * 0.4, i + 100), mat(winter && rnd() < 0.5 ? 0xb8c0c4 : 0x76746e));
      m.position.set(x, this.ground(area, x, z) + s * 0.25, z);
      m.rotation.set(rnd(), rnd() * 3, rnd());
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    }
    return g;
  }

  /** Grass, bushes, ferns, driftwood and a creek: the small things that make a place feel alive. */
  private undergrowth(area: WorldArea, winter: boolean): THREE.Group {
    const g = new THREE.Group();
    const rnd = seeded(area.trees.seed + 500);
    const nearStation = (x: number, z: number, pad: number) =>
      Object.values(area.stations).some((st) => Math.hypot(x - st.x, z - st.z) < st.radius + pad);
    const onLand = (z: number) => area.shoreZ === undefined || z > area.shoreZ + 1.5;
    const ground = (x: number, z: number) => this.ground(area, x, z);
    const scatter = (geo: THREE.BufferGeometry, color: number, count: number, inner: number, outer: number, size: [number, number], pad: number) => {
      const m = new THREE.InstancedMesh(geo, mat(color), count);
      const o = new THREE.Object3D();
      const col = new THREE.Color();
      let n = 0;
      for (let tries = 0; n < count && tries < count * 8; tries++) {
        const a = rnd() * Math.PI * 2;
        const r = inner + Math.sqrt(rnd()) * (outer - inner);
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        if (!onLand(z) || nearStation(x, z, pad)) continue;
        const k = size[0] + rnd() * (size[1] - size[0]);
        o.position.set(x, ground(x, z) - 0.02, z);
        o.rotation.set(0, rnd() * Math.PI * 2, 0);
        o.scale.set(k, k * (0.7 + rnd() * 0.6), k);
        o.updateMatrix();
        m.setMatrixAt(n, o.matrix);
        m.setColorAt(n, col.setHex(color).multiplyScalar(0.75 + rnd() * 0.45));
        n++;
      }
      m.count = n;
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    };

    if (!winter) {
      // Tufts of grass: three thin blades.
      const tuft = mergeGeometries([0, 1, 2].map((i) => new THREE.ConeGeometry(0.045, 0.3, 3).translate(Math.cos(i * 2.1) * 0.06, 0.15, Math.sin(i * 2.1) * 0.06).rotateZ((i - 1) * 0.25)));
      scatter(tuft, 0x8aa04c, area.id === 'woods' ? 500 : 900, 2.5, 42, [0.6, 1.3], 0.6);
    }
    // Low bushes, and ferns under the trees in the woods.
    scatter(rough(new THREE.IcosahedronGeometry(0.6, 0), 0.25, 3).translate(0, 0.35, 0), winter ? 0x8a8f86 : 0x4f6e3a, 70, area.walkRadius - 2, 40, [0.6, 1.4], 1.2);
    if (area.id === 'woods') {
      const fern = mergeGeometries([0, 1, 2, 3, 4].map((i) => new THREE.ConeGeometry(0.12, 0.9, 3).rotateZ(1.0).translate(0.38, 0.22, 0).rotateY((i / 5) * Math.PI * 2)));
      scatter(fern, winter ? 0x7d7a6a : 0x6a9a48, 220, 3, 30, [0.7, 1.3], 0.8);
      if (!winter) {
        // Autumn mushrooms in little clusters: a pale stem under a rust cap.
        const shroom = (dx: number, dz: number, k: number) => [
          new THREE.CylinderGeometry(0.018 * k, 0.024 * k, 0.09 * k, 5).translate(dx, 0.045 * k, dz),
          new THREE.SphereGeometry(0.055 * k, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2).translate(dx, 0.085 * k, dz),
        ];
        const cluster = mergeGeometries([...shroom(0, 0, 1), ...shroom(0.08, 0.05, 0.7), ...shroom(-0.06, 0.07, 0.55)].map((geo) => geo.toNonIndexed()));
        scatter(cluster, 0xa0522d, 80, 3, 28, [1.2, 2.2], 0.8);
      }
    }
    if (area.shoreZ !== undefined) {
      // Driftwood along the waterline.
      const wood = mat(winter ? 0x9a948a : 0x9a8a70);
      for (let i = 0; i < 9; i++) {
        const x = -16 + rnd() * 32;
        const z = area.shoreZ + 0.6 + rnd() * 1.6;
        if (nearStation(x, z, 1.2)) continue;
        const len = 1 + rnd() * 2.2;
        const log = new THREE.Mesh(rough(new THREE.CylinderGeometry(0.08, 0.12, len, 6), 0.03, i), wood);
        log.position.set(x, ground(x, z) + 0.08, z);
        log.rotation.set(0, rnd() * Math.PI, Math.PI / 2);
        log.castShadow = true;
        g.add(log);
      }
    }
    if (area.shoreZ !== undefined) {
      // Pebbles along the waterline.
      const pebble = rough(new THREE.DodecahedronGeometry(0.1, 0), 0.04, 9).scale(1, 0.55, 1);
      const m = new THREE.InstancedMesh(pebble, mat(winter ? 0xb8bec2 : 0x86827a), 260);
      const o = new THREE.Object3D();
      const col = new THREE.Color();
      for (let i = 0; i < 260; i++) {
        const x = -30 + rnd() * 60;
        const z = area.shoreZ + 0.2 + rnd() * rnd() * 3.2;
        o.position.set(x, ground(x, z) + 0.02, z);
        o.rotation.set(0, rnd() * 6, 0);
        o.scale.setScalar(0.6 + rnd() * 1.8);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
        m.setColorAt(i, col.setHex(0x86827a).multiplyScalar(0.7 + rnd() * 0.5));
      }
      m.receiveShadow = true;
      g.add(m);
    }
    if (area.id === 'shore' && area.shoreZ !== undefined && !winter) {
      // Reeds standing in the shallows either side of the creek mouth.
      const inlet = area.stations.inlet;
      if (inlet) {
        const reed = new THREE.CylinderGeometry(0.012, 0.02, 1.3, 3).translate(0, 0.45, 0);
        const m = new THREE.InstancedMesh(reed, mat(0x8a9a52), 180);
        const o = new THREE.Object3D();
        for (let i = 0; i < 180; i++) {
          const side = i % 2 ? 1 : -1;
          const x = inlet.x + side * (1.8 + rnd() * 3.5);
          const z = area.shoreZ - 0.6 + rnd() * 1.4;
          o.position.set(x, -0.3, z);
          o.rotation.set((rnd() - 0.5) * 0.3, 0, (rnd() - 0.5) * 0.3);
          o.scale.set(1, 0.7 + rnd() * 0.6, 1);
          o.updateMatrix();
          m.setMatrixAt(i, o.matrix);
        }
        m.castShadow = true;
        g.add(m);
      }
    }
    if (area.id === 'woods') {
      // Old stumps, fallen trunks and moss on the forest floor.
      const bark = mat(winter ? 0x6a5e52 : 0x5a4634);
      for (let i = 0; i < 14; i++) {
        const a = rnd() * Math.PI * 2;
        const r = 4 + rnd() * 26;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        if (nearStation(x, z, 1.5)) continue;
        const h = 0.25 + rnd() * 0.5;
        const stump = new THREE.Mesh(rough(new THREE.CylinderGeometry(0.22 + rnd() * 0.15, 0.32, h, 7), 0.05, i), bark);
        stump.position.set(x, ground(x, z) + h / 2, z);
        stump.castShadow = true;
        stump.receiveShadow = true;
        g.add(stump);
      }
      for (let i = 0; i < 9; i++) {
        const a = rnd() * Math.PI * 2;
        const r = 8 + rnd() * 24;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        if (nearStation(x, z, 3)) continue;
        const len = 3 + rnd() * 5;
        const log = new THREE.Mesh(rough(new THREE.CylinderGeometry(0.16, 0.24, len, 7), 0.05, i + 30), bark);
        log.position.set(x, ground(x, z) + 0.18, z);
        log.rotation.set(0, rnd() * Math.PI, Math.PI / 2);
        log.castShadow = true;
        log.receiveShadow = true;
        g.add(log);
      }
      if (!winter) {
        const moss = new THREE.CircleGeometry(1, 7).rotateX(-Math.PI / 2).translate(0, 0.05, 0);
        scatter(moss, 0x4e6e30, 90, 2, 30, [0.5, 1.6], 1.0);
      }
    }
    if (area.id === 'shore' && area.shoreZ !== undefined) {
      // The creek that gives the Inlet Mouth its name, running down into the lake.
      const inlet = area.stations.inlet;
      if (inlet) {
        const pts = [0, 1, 2, 3, 4, 5].map((i) => new THREE.Vector3(inlet.x - i * 1.4 + Math.sin(i * 1.3) * 1.2, 0, area.shoreZ! + 0.5 + i * 5));
        const curve = new THREE.CatmullRomCurve3(pts);
        const ribbon = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 40, 0.8, 4, false),
          new THREE.MeshStandardMaterial({ color: winter ? 0xc4d4dc : 0x2e5464, roughness: 0.1, metalness: 0.2 }),
        );
        ribbon.scale.set(1, 0.08, 1);
        ribbon.receiveShadow = true;
        // Follow the ground: lift each vertex onto the terrain.
        const pos = ribbon.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) + ground(pos.getX(i), pos.getZ(i)) / 0.08 + 0.4);
        ribbon.geometry.computeVertexNormals();
        g.add(ribbon);
      }
    }
    return g;
  }

  private syncStations(input: WorldInput): void {
    const { area, layout, hidden, props } = input;
    for (const station of layout.stations) {
      const place = area.stations[station.id];
      if (!place) continue;
      const key = propKey(station.id, props);
      let node = this.stations.get(station.id);
      if (!node || node.key !== key) {
        if (node) this.areaRoot.remove(node.group);
        const group = buildProp(station.id, props);
        group.position.set(place.x, this.ground(area, place.x, place.z), place.z);
        group.rotation.y = ((place.face ?? 0) * Math.PI) / 180;
        group.userData.stationId = station.id;
        const mats: THREE.MeshStandardMaterial[] = [];
        group.traverse((o) => {
          if (!(o instanceof THREE.Mesh)) return;
          if (o.material instanceof THREE.MeshStandardMaterial) {
            o.material = o.material.clone();
            mats.push(o.material);
          } else if (Array.isArray(o.material)) {
            const list = (o.material as THREE.Material[]).map((m) => (m instanceof THREE.MeshStandardMaterial ? m.clone() : m));
            o.material = list;
            mats.push(...list.filter((m): m is THREE.MeshStandardMaterial => m instanceof THREE.MeshStandardMaterial));
          }
        });
        this.areaRoot.add(group);
        group.updateMatrixWorld(true);
        node = { group, key, mats, box: new THREE.Box3().setFromObject(group).expandByScalar(0.15) };
        this.stations.set(station.id, node);
      }
      node.group.visible = !hidden.has(station.id);
    }
    const fire = this.stations.get('fire');
    this.fireLight.visible = !!fire && fire.group.visible && props.fireLit;
    if (fire) this.fireLight.position.copy(fire.group.position).add(new THREE.Vector3(0, 0.9, 0));
  }

  private spawn(area: WorldArea): void {
    this.pos.set(area.spawn.x, 0, area.spawn.z);
    this.yaw = (-area.spawn.look * Math.PI) / 180;
    this.pitch = -0.08;
  }

  // ---- input

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    this.sound.start();
    this.keys.add(e.code);
  };
  private onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
  private onBlur = () => this.keys.clear();
  private onMouseMove = (e: MouseEvent) => {
    if (this.locked) {
      if (this.input?.frozen) return;
      const s = settings();
      const k = FIRST_PERSON.lookSensitivity * s.mouseSpeed;
      this.yaw -= e.movementX * k;
      this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch - e.movementY * k * (s.invertY ? -1 : 1)));
      return;
    }
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (e.target !== this.renderer.domElement) {
      this.mouse = null;
      return;
    }
    this.mouse = { x: ((e.clientX - rect.left) / rect.width) * 1920, y: ((e.clientY - rect.top) / rect.height) * 1080 };
  };
  private onMouseDown = (e: MouseEvent) => {
    this.sound.start();
    if (e.button !== 0 || this.input?.frozen) return;
    if (!this.locked) this.onMouseMove(e);
    // What is under the pointer right now, not as of the last frame.
    this.updateHover(this.eye());
    const h = this.hovered;
    if (h && h.near) {
      // The panel opening frees the mouse (syncLock) and closing it takes it back.
      this.events?.select(h.id);
      return;
    }
    if (!this.locked) {
      this.events?.clear();
      this.wantLook = true;
      this.lock();
    }
  };
  /**
   * Once you have clicked to look around, the mouse keeps looking: it is freed while a panel,
   * card or menu is open and taken back as soon as it closes. Esc frees it until you click again.
   */
  private wantLook = false;
  private freedForUi = false;

  private syncLock(input: WorldInput): void {
    const busy = input.frozen || input.selected !== null;
    if (busy && this.locked) {
      this.freedForUi = true;
      document.exitPointerLock();
    } else if (!busy && this.wantLook && !this.locked) {
      this.lock();
    }
  }

  private lock(): void {
    const canvas = this.renderer.domElement;
    try {
      void canvas.requestPointerLock?.()?.catch?.(() => undefined);
    } catch {
      // Without a recent click the browser may refuse; the next click on the world takes it.
    }
  }

  private onLockChange = () => {
    const was = this.locked;
    this.locked = document.pointerLockElement === this.renderer.domElement;
    if (this.locked) this.wantLook = true;
    else if (was && !this.freedForUi) this.wantLook = false;
    this.freedForUi = false;
    if (this.locked) this.mouse = null;
    this.events?.looking(this.locked);
  };

  private bind(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('pointerlockchange', this.onLockChange);
  }

  private unbind(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('pointerlockchange', this.onLockChange);
  }

  // ---- every frame

  private eye(): THREE.Vector3 {
    const area = this.input!.area;
    return new THREE.Vector3(this.pos.x, this.ground(area, this.pos.x, this.pos.z) + FIRST_PERSON.eyeHeight + (settings().headBob ? Math.sin(this.bob) * 0.035 : 0), this.pos.z);
  }

  private keepInside(): void {
    const area = this.input!.area;
    for (const [id, node] of this.stations) {
      const st = area.stations[id];
      if (!st || !st.radius || !node.group.visible) continue;
      const dx = this.pos.x - st.x;
      const dz = this.pos.z - st.z;
      const d = Math.hypot(dx, dz);
      const min = st.radius + 0.35;
      if (d < min && d > 0.0001) {
        this.pos.x = st.x + (dx / d) * min;
        this.pos.z = st.z + (dz / d) * min;
      }
    }
    const r = Math.hypot(this.pos.x, this.pos.z);
    if (r > area.walkRadius) this.pos.multiplyScalar(area.walkRadius / r);
    if (area.shoreZ !== undefined) this.pos.z = Math.max(this.pos.z, area.shoreZ + 0.8);
  }

  private lowGraphics: boolean | null = null;

  /** High: full 1920x1080 with 2048 sun shadows and fire shadows. Lighter: 1280x720, 1024, none. */
  private applyGraphics(): void {
    const low = settings().lowGraphics;
    if (low === this.lowGraphics) return;
    this.lowGraphics = low;
    if (low) this.renderer.setSize(1280, 720, false);
    else this.renderer.setSize(1920, 1080, false);
    const size = low ? 1024 : 2048;
    this.sun.shadow.mapSize.set(size, size);
    this.sun.shadow.map?.dispose();
    this.sun.shadow.map = null;
    this.fireLight.castShadow = !low;
  }

  private frame(): void {
    this.applyGraphics();
    if (this.disposed || !this.input) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    this.time += dt;
    const input = this.input;

    // Walking.
    if (!input.frozen) {
      const k = this.keys;
      const f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
      const s = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
      const turn = (k.has('ArrowLeft') ? 1 : 0) - (k.has('ArrowRight') ? 1 : 0);
      this.yaw += turn * dt * 1.8;
      if (f || s) {
        const speed = k.has('ShiftLeft') || k.has('ShiftRight') ? FIRST_PERSON.runSpeed : FIRST_PERSON.walkSpeed;
        const len = Math.hypot(f, s);
        const fx = -Math.sin(this.yaw);
        const fz = -Math.cos(this.yaw);
        this.pos.x += ((fx * f - fz * s) / len) * speed * dt;
        this.pos.z += ((fz * f + fx * s) / len) * speed * dt;
        const before = Math.sin(this.bob);
        this.bob += dt * speed * 2.6;
        if (before > 0 && Math.sin(this.bob) <= 0) {
          this.sound.step(speed > FIRST_PERSON.walkSpeed, input.winter);
          if (input.winter) this.footprint(input.area);
        }
        this.keepInside();
      }
    }
    const eye = this.eye();
    this.camera.position.copy(eye);
    this.camera.rotation.set(this.pitch, this.yaw, 0);

    // Walking away from what you had open puts it away.
    if (input.selected) {
      const st = input.area.stations[input.selected];
      if (st && Math.hypot(this.pos.x - st.x, this.pos.z - st.z) > Math.max(st.reach ?? 0, st.radius + FIRST_PERSON.reach + 1.5)) this.events?.clear();
    }

    this.onFrame?.(dt, this.time);
    this.updateHover(eye);
    this.updateSky(dt);
    this.updateFire(dt);
    this.updateWeather(dt, eye);
    this.updateAurora(dt);
    this.updateBreath(dt, eye, this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'));
    this.updateLife(dt);
    const fire = this.stations.get('fire');
    const w = { ...input, ...this.preview };
    this.sound.update(dt, {
      weather: w.weather,
      fireDistance: this.fireLight.visible && fire ? fire.group.position.distanceTo(this.pos) : Infinity,
      waterDistance: input.area.shoreZ !== undefined && !input.winter ? Math.max(0, this.pos.z - input.area.shoreZ) : Infinity,
      frozen: input.frozen,
      winter: input.winter,
    });
    this.renderer.render(this.scene, this.camera);
  }

  private updateHover(eye: THREE.Vector3): void {
    const input = this.input!;
    let next: Hover | null = null;
    if (!input.frozen && (this.locked || this.mouse)) {
      const ndc = this.locked ? new THREE.Vector2(0, 0) : new THREE.Vector2((this.mouse!.x / 1920) * 2 - 1, -(this.mouse!.y / 1080) * 2 + 1);
      this.raycaster.setFromCamera(ndc, this.camera);
      const groups = [...this.stations.values()].filter((n) => n.group.visible).map((n) => n.group);
      let id: string | null = null;
      let dist = Infinity;
      const hit = this.raycaster.intersectObjects(groups, true).find((h) => h.object.visible);
      if (hit) {
        let o: THREE.Object3D | null = hit.object;
        while (o && !o.userData.stationId) o = o.parent;
        if (o) {
          id = o.userData.stationId as string;
          dist = hit.distance;
        }
      }
      if (!id) {
        const p = new THREE.Vector3();
        for (const [sid, node] of this.stations) {
          if (!node.group.visible || !this.raycaster.ray.intersectBox(node.box, p)) continue;
          const d = p.distanceTo(eye);
          if (d < dist) {
            dist = d;
            id = sid;
          }
        }
      }
      if (id && dist < 60) {
        const st = input.area.stations[id]!;
        const station = input.layout.stations.find((s) => s.id === id);
        const flat = Math.hypot(this.pos.x - st.x, this.pos.z - st.z);
        const near = flat <= Math.max(st.reach ?? 0, st.radius + FIRST_PERSON.reach);
        next = { id, label: station?.label ?? id, near, x: this.locked ? 960 : this.mouse!.x, y: this.locked ? 540 : this.mouse!.y };
      }
    }
    const prev = this.hovered;
    if (prev?.id !== next?.id || prev?.near !== next?.near || (next && (prev?.x !== next.x || prev?.y !== next.y))) {
      this.hovered = next;
      this.events?.hover(next);
    }
    for (const [sid, node] of this.stations) {
      const lit = sid === input.selected ? 0.1 : next?.id === sid ? (next.near ? 0.16 : 0.06) : 0;
      for (const m of node.mats) {
        m.emissive.setHex(0xffa040);
        m.emissiveIntensity = lit;
      }
    }
    this.renderer.domElement.style.cursor = !this.locked && next?.near ? 'pointer' : this.locked ? 'none' : 'crosshair';
  }

  /** v12's hour and weather, as light. The shown clock eases forward to the run's. */
  private updateSky(dt: number): void {
    const input = { ...this.input!, ...this.preview };
    const target = ((input.hour % 24) + 24) % 24;
    if (this.shownHour < 0) this.shownHour = target;
    else {
      let d = target - this.shownHour;
      if (d < -12) d += 24;
      if (d > 12 || d < 0) this.shownHour = target;
      else this.shownHour = (this.shownHour + Math.min(d, Math.max(0.02, d) * dt * 1.2)) % 24;
    }
    const h = this.shownHour;
    const { dawn, dusk } = input;
    let e: number;
    if (h >= dawn && h <= dusk) e = Math.sin((Math.PI * (h - dawn)) / (dusk - dawn)) * 0.9;
    else {
      const toDawn = (dawn - h + 24) % 24;
      const fromDusk = (h - dusk + 24) % 24;
      e = -Math.min(1, Math.min(toDawn, fromDusk) / 2.5);
    }
    const sunT = (h - dawn) / (dusk - dawn);
    const day = smooth(-0.15, 0.3, e);
    this.daylight = day;
    const twilight = Math.max(0, 1 - Math.abs(e) / 0.28);
    const grey = WEATHER_GREY[input.weather] ?? 0;

    const top = new THREE.Color(0x060a14).lerp(new THREE.Color(0x3f74ad), day);
    const horizon = new THREE.Color(0x0b1220).lerp(new THREE.Color(0xb6cad8), day);
    horizon.lerp(new THREE.Color(0xd8875a), twilight * 0.45 * (1 - grey * 0.7));
    const greyCol = new THREE.Color(0x0e1014).lerp(new THREE.Color(0x8e959c), day);
    top.lerp(greyCol, grey * 0.85);
    horizon.lerp(greyCol, grey * 0.8);
    const u = this.sky.material.uniforms;
    u.top!.value.copy(top).lerp(FLASH, this.flash * 0.55);
    u.horizon!.value.copy(horizon).lerp(FLASH, this.flash * 0.7);
    u.glow!.value.setHex(0xffb070).multiplyScalar(twilight * 0.7 * (1 - grey));
    u.cover!.value = CLOUD_COVER[input.weather] ?? 0.3;
    u.drift!.value += dt * (input.weather === 'storm' ? 0.05 : 0.008);
    u.cloud!.value.setHex(0x14171c).lerp(new THREE.Color(0xf2f2ee), day).lerp(greyCol, grey * 0.6).lerp(FLASH, this.flash * 0.8);

    // The sun arcs across the southern sky; at night the moon takes its place.
    const az = Math.PI * (0.5 + Math.min(1.2, Math.max(-0.2, sunT)));
    const sunDir = new THREE.Vector3(Math.cos(az), Math.max(0.05, e + 0.05), Math.abs(Math.sin(az)) * 0.6 + 0.3).normalize();
    const moonDir = new THREE.Vector3(-0.4, 0.55, -0.7).normalize();
    const lightDir = day > 0.05 ? sunDir : moonDir;
    u.sunDir!.value.copy(sunDir);
    this.sun.position.copy(this.pos).addScaledVector(lightDir, 80);
    this.sun.target.position.copy(this.pos);
    this.sun.color.setHex(day > 0.05 ? 0xfff0da : 0x9ab0e0).lerp(new THREE.Color(0xffa060), twilight * 0.6);
    this.sun.intensity = day > 0.05 ? day * 3.2 * (1 - grey * 0.88) : 0.6 * (1 - grey * 0.8);
    this.hemi.color.copy(top).lerp(new THREE.Color(0xffffff), 0.35);
    this.hemi.groundColor.setHex(input.winter ? 0x8a9298 : 0x3a3222).multiplyScalar(0.3 + day * 0.7);
    this.hemi.intensity = 0.42 + day * (1.0 + grey * 0.5) + this.flash * 2.5;
    this.renderer.toneMappingExposure = 1.0 + (1 - day) * 0.35 + this.flash * 1.2;

    (this.stars.material as THREE.PointsMaterial).opacity = (1 - day) * (1 - grey) * 0.9;
    this.moon.visible = day < 0.4 && grey < 0.7;
    this.moon.position.copy(this.pos).addScaledVector(moonDir, 520);
    (this.moon.material as THREE.MeshBasicMaterial).opacity = 1 - day * 2.5;
    this.sky.position.copy(this.pos);
    this.stars.position.copy(this.pos);

    const fog = this.scene.fog as THREE.Fog;
    const [near, far] = FOG[input.weather] ?? FOG.clear!;
    fog.color.copy(horizon).lerp(FLASH, this.flash * 0.6);
    if (this.water) (this.water.material as THREE.MeshStandardMaterial).emissive.copy(horizon).multiplyScalar(input.winter ? 0.1 : 0.32);
    fog.near = near * (0.4 + day * 0.6);
    fog.far = far * (0.45 + day * 0.55);
  }

  private updateSparks(dt: number, base: THREE.Vector3 | null): void {
    const pos = this.sparks.geometry.getAttribute('position') as THREE.BufferAttribute;
    const col = this.sparks.geometry.getAttribute('color') as THREE.BufferAttribute;
    const p = pos.array as Float32Array;
    const c = col.array as Float32Array;
    this.sparks.visible = !!base;
    if (!base) return;
    const w = this.preview.weather ?? this.input!.weather;
    const wind = w === 'storm' ? 2.5 : w === 'rain' || w === 'snow' ? 0.8 : 0.3;
    for (let i = 0; i < SPARKS; i++) {
      let life = this.sparkLife[i]! - dt;
      const o = i * 3;
      if (life <= 0) {
        // a new spark from the embers, now and then a little burst of them
        if (Math.random() > dt * 0.3) {
          c[o] = c[o + 1] = c[o + 2] = 0;
          this.sparkLife[i] = 0;
          continue;
        }
        life = 0.8 + Math.random() * 1.8;
        p[o] = base.x + (Math.random() - 0.5) * 0.4;
        p[o + 1] = base.y + 0.35;
        p[o + 2] = base.z + (Math.random() - 0.5) * 0.4;
        this.sparkVel[o] = (Math.random() - 0.5) * 0.6 + wind;
        this.sparkVel[o + 1] = 1.2 + Math.random() * 1.6;
        this.sparkVel[o + 2] = (Math.random() - 0.5) * 0.6;
      }
      this.sparkLife[i] = life;
      p[o] = p[o]! + (this.sparkVel[o]! + Math.sin(this.time * 7 + i) * 0.4) * dt;
      p[o + 1] = p[o + 1]! + this.sparkVel[o + 1]! * dt;
      p[o + 2] = p[o + 2]! + (this.sparkVel[o + 2]! + Math.cos(this.time * 6 + i) * 0.4) * dt;
      this.sparkVel[o + 1] = this.sparkVel[o + 1]! * (1 - dt * 0.6);
      const k = Math.min(1, life / 1.2);
      c[o] = 0.9 * k;
      c[o + 1] = 0.4 * k * k;
      c[o + 2] = 0.08 * k * k * k;
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  }

  private updateFire(dt: number): void {
    const node = this.stations.get('fire');
    const lit = this.fireLight.visible;
    const t = this.time;
    const flicker = 1 + Math.sin(t * 11) * 0.06 + Math.sin(t * 23.7) * 0.05 + Math.sin(t * 5.3) * 0.08;
    this.fireLight.intensity = lit ? 60 * flicker : 0;
    const flames = node?.group.getObjectByName('flames');
    flames?.children.forEach((f) => {
      const p = f.userData.phase as number;
      f.scale.y = 0.75 + Math.sin(t * 9 + p) * 0.18 + Math.sin(t * 17 + p * 2) * 0.1;
      f.rotation.y = t * 0.8 + p;
    });
    const base = node?.group.position;
    this.updateSparks(dt, lit && base && node?.group.visible ? base : null);
    for (const puff of this.smoke) {
      const m = puff.material as THREE.MeshLambertMaterial;
      if (!lit || !base || !node?.group.visible) {
        m.opacity = 0;
        continue;
      }
      const k = (puff.userData.t as number) + this.time * 0.09;
      const life = k - Math.floor(k);
      puff.position.set(base.x + Math.sin(k * 9) * 0.25 + life * 1.2, base.y + 1.0 + life * 7, base.z + Math.cos(k * 7) * 0.25);
      puff.scale.setScalar(0.5 + life * 2.4);
      m.opacity = 0.32 * (1 - life) * Math.min(1, life * 6);
    }
  }

  /** Scenery birds, the jay and the ducks moving, and their calls, placed left or right. */
  private updateLife(dt: number): void {
    const t = this.time;
    const weather = this.preview.weather ?? this.input!.weather;
    this.life?.update(dt, t, { day: this.daylight, weather, player: this.pos, silent: !!this.input!.birdsSilent });
    const calls = this.life?.takeCalls() ?? [];

    const jay = this.stations.get('jay');
    const jb = jay?.group.visible ? jay.group.getObjectByName('jay-bird') : undefined;
    if (jb) {
      const hop = Math.max(0, Math.sin(t * 0.9) * 8 - 7);
      jb.position.y = 1.4 + hop * 0.12;
      jb.rotation.y = Math.floor(t / 1.7) % 2 ? 0.6 : -0.4;
      const head = jb.children[1];
      if (head) head.position.y = 0.07 + Math.max(0, Math.sin(t * 3.1)) * 0.015;
      if (Math.random() < dt / 18 && this.daylight > 0.25 && !this.input!.birdsSilent) calls.push({ kind: 'jay', at: jay!.group.position.clone().setY(1.4) });
    }
    const ducks = this.stations.get('duck');
    ducks?.group.children.forEach((d, i) => {
      if (d.name !== 'duck') return;
      const home = d.userData.home as THREE.Vector3;
      d.position.set(home.x + Math.sin(t * 0.13 + i * 1.7) * 0.6, Math.sin(t * 1.3 + i) * 0.03, home.z + Math.cos(t * 0.11 + i) * 0.4);
      d.rotation.y = i + Math.sin(t * 0.13 + i * 1.7) * 0.8;
    });

    if (!calls.length) return;
    const view = this.camera.matrixWorldInverse;
    for (const c of calls) {
      const local = c.at.clone().applyMatrix4(view);
      const dist = Math.max(1, local.length());
      const loud = (c.kind === 'loon' || c.kind === 'wolf' ? 0.9 : c.kind === 'owl' ? 0.5 : c.kind === 'goose' ? 1 / (1 + dist / 70) : 1 / (1 + dist / 14)) * (this.input!.frozen ? 0.6 : 1);
      this.sound.call(c.kind, loud, local.x / dist);
    }
  }

  private updateWeather(dt: number, eye: THREE.Vector3): void {
    const w = this.preview.weather ?? this.input!.weather;
    const raining = w === 'rain' || w === 'storm';
    const snowing = w === 'snow' || (w === 'storm' && this.input!.winter);
    this.rain.visible = raining && !snowing;
    this.snow.visible = snowing;
    if (this.rain.visible) {
      const count = w === 'storm' ? 2400 : 1400;
      this.rain.geometry.setDrawRange(0, count * 2);
      const pos = this.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      const fall = (w === 'storm' ? 26 : 18) * dt;
      const wind = (w === 'storm' ? 7 : 1.5) * dt;
      for (let i = 0; i < count; i++) {
        const o = i * 6;
        let y = arr[o + 1]! - fall;
        let x = arr[o]! + wind;
        if (y < -1) y += 21;
        if (x > 20) x -= 40;
        arr[o] = x;
        arr[o + 1] = y;
        arr[o + 3] = x - (w === 'storm' ? 0.15 : 0.03);
        arr[o + 4] = y - 0.55;
      }
      pos.needsUpdate = true;
      this.rain.position.set(eye.x, eye.y - 8, eye.z);
    }
    if (this.snow.visible) {
      const count = w === 'storm' ? 3000 : 1800;
      this.snow.geometry.setDrawRange(0, count);
      const pos = this.snow.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      const wind = (w === 'storm' ? 5 : 0.6) * dt;
      for (let i = 0; i < count; i++) {
        const o = i * 3;
        let y = arr[o + 1]! - (1.1 + (i % 5) * 0.12) * dt;
        let x = arr[o]! + wind + Math.sin(this.time + i) * 0.3 * dt;
        if (y < -1) y += 19;
        if (x > 20) x -= 40;
        arr[o] = x;
        arr[o + 1] = y;
      }
      pos.needsUpdate = true;
      this.snow.position.set(eye.x, eye.y - 6, eye.z);
    }
    this.updateLeaves(dt, eye, w);
    this.updateLightning(dt, w);
    this.updateWet(dt, w);
    this.updateMist(this.preview.hour ?? this.input!.hour, w);
    this.updateRings(dt, eye, w);
    if (this.water && !this.input!.winter) {
      (this.water.material as THREE.MeshStandardMaterial).roughness = w === 'storm' || w === 'rain' ? 0.35 : 0.08;
    }
  }

  private mist: THREE.Group | null = null;

  /** Soft banks of mist lying on open water: thick at dawn, a little at dusk, none by day. */
  private makeMist(shoreZ: number): THREE.Group {
    const tex = softTexture();
    const group = new THREE.Group();
    const rnd = seeded(77);
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: tex, color: 0xdfe6ea, transparent: true, opacity: 0, depthWrite: false, fog: true }),
      );
      const w = 14 + rnd() * 18;
      m.scale.set(w, w * 0.35, 1);
      m.rotation.x = -Math.PI / 2 + 0.25;
      m.position.set((rnd() - 0.5) * 90, 0.3 + rnd() * 0.6, shoreZ - 6 - rnd() * 45);
      m.userData.drift = 0.15 + rnd() * 0.25;
      m.userData.base = m.position.x;
      group.add(m);
    }
    this.mist = group;
    return group;
  }

  private updateMist(hour: number, w: string): void {
    if (!this.mist) return;
    const h = ((hour % 24) + 24) % 24;
    const dawn = Math.max(0, 1 - Math.abs(h - 6.5) / 2.8);
    const dusk = Math.max(0, 1 - Math.abs(h - 20) / 2) * 0.4;
    const k = Math.max(dawn, dusk) * (w === 'storm' ? 0.2 : w === 'clear' || w === 'cold' ? 1 : 0.7);
    this.mist.visible = k > 0.01;
    for (const m of this.mist.children as THREE.Mesh[]) {
      (m.material as THREE.MeshBasicMaterial).opacity = 0.32 * k;
      m.position.x = m.userData.base + Math.sin(this.time * 0.02 * m.userData.drift * 10) * 6;
    }
  }

  private rings: THREE.Group | null = null;
  private nextRise = 3;
  private nextDrop = 0;

  /** Rings on open water: now and then a fish rising, and in rain the drops around you. */
  private makeRings(): THREE.Group {
    const group = new THREE.Group();
    const geo = new THREE.RingGeometry(0.8, 1, 40);
    for (let i = 0; i < RINGS; i++) {
      const r = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xeef4f6, transparent: true, opacity: 0, depthWrite: false, fog: true }));
      r.rotation.x = -Math.PI / 2;
      r.visible = false;
      r.userData.age = 0;
      r.userData.life = 1;
      r.userData.size = 1;
      group.add(r);
    }
    this.rings = group;
    return group;
  }

  private ring(x: number, z: number, size: number, life: number): void {
    const r = (this.rings!.children as THREE.Mesh[]).find((m) => !m.visible) ?? (this.rings!.children[0] as THREE.Mesh);
    r.position.set(x, -0.2, z);
    r.userData.age = 0;
    r.userData.life = life;
    r.userData.size = size;
    r.visible = true;
  }

  private updateRings(dt: number, eye: THREE.Vector3, w: string): void {
    const shoreZ = this.input!.area.shoreZ;
    if (!this.rings || shoreZ === undefined) return;
    const raining = w === 'rain' || w === 'storm';
    const h = (((this.preview.hour ?? this.input!.hour) % 24) + 24) % 24;
    // fish rise most at dawn and dusk, a little by day, hardly in a storm
    const evening = Math.max(1 - Math.abs(h - 6.5) / 2.5, 1 - Math.abs(h - 19.5) / 2.5, 0);
    this.nextRise -= dt * (0.25 + evening) * (w === 'storm' ? 0.1 : raining ? 0.4 : 1);
    if (this.nextRise <= 0) {
      this.nextRise = 3 + Math.random() * 9;
      const x = eye.x + (Math.random() - 0.5) * 50;
      const z = shoreZ - 5 - Math.random() * 30;
      this.ring(x, z, 1.8, 2.6);
      const dist = Math.hypot(x - eye.x, z - eye.z);
      if (dist < 30) this.sound.plop(1 / (1 + dist / 8));
    }
    if (raining) {
      this.nextDrop -= dt;
      while (this.nextDrop <= 0) {
        this.nextDrop += w === 'storm' ? 0.03 : 0.06;
        const z = Math.min(shoreZ - 0.6, eye.z - 2 - Math.random() * 12);
        this.ring(eye.x + (Math.random() - 0.5) * 16, z, 0.3, 0.8);
      }
    }
    for (const r of this.rings.children as THREE.Mesh[]) {
      if (!r.visible) continue;
      const u = r.userData as { age: number; life: number; size: number };
      u.age += dt;
      const k = u.age / u.life;
      if (k >= 1) {
        r.visible = false;
        continue;
      }
      const s = u.size * (0.15 + k);
      r.scale.set(s, s, 1);
      (r.material as THREE.MeshBasicMaterial).opacity = 0.75 * (1 - k);
    }
  }

  /** In the cold your breath shows: a small cloud in front of you every few seconds, quicker when running. */
  private updateBreath(dt: number, eye: THREE.Vector3, running: boolean): void {
    const cold = (this.preview.tempC ?? this.input?.tempC ?? 10) <= 2;
    this.breathAt -= dt;
    if (cold && this.breathAt <= 0 && !this.input?.frozen) {
      this.breathAt = running ? 1.6 : 3.4;
      const b = this.breath.reduce((a, c) => ((c.userData.age as number) > (a.userData.age as number) ? c : a));
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      b.position.copy(eye).addScaledVector(dir, 0.55);
      b.position.y -= 0.16;
      b.userData.age = 0;
      b.userData.vel = dir.multiplyScalar(0.25);
    }
    for (const b of this.breath) {
      const age = (b.userData.age as number) + dt;
      b.userData.age = age;
      const life = Math.min(1, age / 1.3);
      b.material.opacity = 0.18 * Math.sin(Math.PI * life);
      b.visible = life < 1;
      if (!b.visible) continue;
      b.scale.setScalar(0.18 + life * 0.35);
      b.position.addScaledVector(b.userData.vel as THREE.Vector3, dt);
      b.position.y += 0.06 * dt;
    }
  }

  private aurora: THREE.Group;
  private auroraLight = 0;

  /** Curtains of green and violet light low in the northern sky, rippling slowly. */
  private makeAurora(): THREE.Group {
    const g = new THREE.Group();
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false,
      uniforms: { time: { value: 0 }, strength: { value: 0 } },
      vertexShader: `uniform float time; varying vec2 vUv; varying float vShift;
        void main(){ vUv = uv; vec3 p = position;
          float w = sin(p.x * 0.012 + time * 0.07) * 28.0 + sin(p.x * 0.031 - time * 0.11) * 12.0;
          p.z += w; vShift = sin(p.x * 0.02 + time * 0.05);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `uniform float time; uniform float strength; varying vec2 vUv; varying float vShift;
        void main(){
          float bottom = smoothstep(0.0, 0.12, vUv.y);
          float top = 1.0 - smoothstep(0.35, 1.0, vUv.y);
          float rays = 0.55 + 0.45 * sin(vUv.x * 140.0 + time * 0.4 + vShift * 3.0) * sin(vUv.x * 37.0 - time * 0.23);
          float sides = smoothstep(0.0, 0.15, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x));
          vec3 green = vec3(0.25, 1.0, 0.55);
          vec3 violet = vec3(0.65, 0.3, 0.9);
          vec3 c = mix(green, violet, smoothstep(0.35, 0.9, vUv.y));
          gl_FragColor = vec4(c * bottom * top * rays * sides * strength * 0.55, 1.0); }`,
    });
    for (let i = 0; i < 3; i++) {
      const band = new THREE.Mesh(new THREE.PlaneGeometry(520, 90, 120, 1), material);
      band.position.set(-60 + i * 70, 110 + i * 18, -330 - i * 40);
      band.rotation.y = (i - 1) * 0.18;
      g.add(band);
    }
    g.visible = false;
    return g;
  }

  private updateAurora(dt: number): void {
    const want = (this.preview.aurora ?? this.input?.aurora) && this.daylight < 0.15 ? 1 : 0;
    this.auroraLight += (want - this.auroraLight) * Math.min(1, dt * 0.4);
    this.aurora.visible = this.auroraLight > 0.01;
    if (!this.aurora.visible) return;
    const m = (this.aurora.children[0] as THREE.Mesh).material as THREE.ShaderMaterial;
    m.uniforms.time!.value = this.time;
    m.uniforms.strength!.value = this.auroraLight;
    this.aurora.position.set(this.pos.x, 0, this.pos.z);
  }

  private prints!: THREE.InstancedMesh;
  private printNext = 0;
  private printLeft = false;

  /** In winter each step leaves a print in the snow, left and right in turn; the oldest fade out of the list. */
  private footprint(area: WorldArea): void {
    this.printLeft = !this.printLeft;
    const side = this.printLeft ? 0.11 : -0.11;
    const x = this.pos.x + Math.cos(this.yaw) * side;
    const z = this.pos.z - Math.sin(this.yaw) * side;
    const d = this.leafDummy;
    d.position.set(x, this.ground(area, x, z) + 0.012, z);
    d.rotation.set(0, this.yaw, 0);
    d.scale.set(0.75, 1, 1.5);
    d.updateMatrix();
    this.prints.setMatrixAt(this.printNext, d.matrix);
    this.printNext = (this.printNext + 1) % PRINTS;
    this.prints.count = Math.min(PRINTS, Math.max(this.prints.count, this.printNext === 0 ? PRINTS : this.printNext));
    this.prints.instanceMatrix.needsUpdate = true;
  }

  private groundMat: THREE.MeshStandardMaterial | null = null;
  private wetness = 0;
  private wetSnap = true;

  /** Rain darkens the ground and gives it a little sheen; it dries slowly after. */
  private updateWet(dt: number, w: string): void {
    const want = !this.input!.winter && (w === 'rain' || w === 'storm') ? 1 : 0;
    // A new area (or the first frame) starts as wet as the weather says.
    if (this.wetSnap) this.wetness = want;
    this.wetSnap = false;
    this.wetness += (want - this.wetness) * Math.min(1, dt * (want ? 0.15 : 0.03));
    const m = this.groundMat;
    if (!m) return;
    m.color.setScalar(1 - this.wetness * 0.28);
    m.roughness = 1 - this.wetness * 0.35;
  }

  private flash = 0;
  private nextBolt = 15;

  /** Storms (not snowstorms): now and then the sky flashes, and thunder follows after a gap that says how far. */
  private updateLightning(dt: number, w: string): void {
    this.flash = Math.max(0, this.flash - dt * 6);
    if (w !== 'storm' || this.input!.winter) return;
    this.nextBolt -= dt;
    if (this.nextBolt > 0) return;
    this.nextBolt = 12 + Math.random() * 30;
    const far = Math.random();
    const k = settings().reduceFlashing ? 0.2 : 1;
    this.flash = (1 - far * 0.6) * k;
    window.setTimeout(() => {
      this.flash = Math.max(this.flash, (0.5 - far * 0.3) * k);
    }, 120);
    window.setTimeout(() => this.sound.thunder(far), (0.4 + far * 3.5) * 1000);
  }

  private leafDummy = new THREE.Object3D();

  /** Leaves fall in autumn, more under the trees and in wind, none in winter or heavy weather. */
  private updateLeaves(dt: number, eye: THREE.Vector3, w: string): void {
    const input = this.input!;
    const on = !input.winter && w !== 'snow' && w !== 'storm';
    this.leaves.visible = on;
    if (!on) return;
    const count = input.area.id === 'woods' ? LEAVES : input.area.id === 'camp' ? Math.floor(LEAVES * 0.5) : Math.floor(LEAVES * 0.25);
    this.leaves.count = count;
    const wind = w === 'rain' ? 0.9 : 0.35;
    const a = this.leafAt;
    const d = this.leafDummy;
    for (let i = 0; i < count; i++) {
      const o = i * 4;
      a[o + 3] = a[o + 3]! + dt * (1.5 + (i % 3));
      let y = a[o + 1]! - (0.45 + (i % 4) * 0.08) * dt;
      let x = a[o]! + (wind + Math.sin(a[o + 3]!) * 0.5) * dt;
      if (y < -0.2) y += 12;
      // World positions, wrapped into a box around you so walking does not drag them along.
      if (x - eye.x > 18) x -= 36;
      else if (x - eye.x < -18) x += 36;
      let z = a[o + 2]!;
      if (z - eye.z > 18) z -= 36;
      else if (z - eye.z < -18) z += 36;
      a[o] = x;
      a[o + 1] = y;
      a[o + 2] = z;
      d.position.set(x, this.ground(input.area, x, z) + y, z);
      d.rotation.set(a[o + 3]! * 0.7, a[o + 3]!, Math.sin(a[o + 3]!) * 0.8);
      d.updateMatrix();
      this.leaves.setMatrixAt(i, d.matrix);
    }
    this.leaves.instanceMatrix.needsUpdate = true;
  }
}
