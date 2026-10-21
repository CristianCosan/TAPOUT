// Small helpers for building low-poly things out of plain shapes: flat-shaded materials,
// a seeded random for scenery, and a little value noise for the ground.

import * as THREE from 'three';

const materials = new Map<string, THREE.MeshStandardMaterial>();

/** A shared flat-shaded material. Station props clone theirs so they can glow on hover. */
export function mat(color: number, opts: { rough?: number; metal?: number; emissive?: number; key?: string } = {}): THREE.MeshStandardMaterial {
  const key = `${color}-${opts.rough ?? 0.92}-${opts.metal ?? 0}-${opts.emissive ?? 0}-${opts.key ?? ''}`;
  let m = materials.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.rough ?? 0.92,
      metalness: opts.metal ?? 0,
      flatShading: true,
      emissive: opts.emissive ?? 0x000000,
    });
    materials.set(key, m);
  }
  return m;
}

export function seeded(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Nudges every corner of a shape a little, the same way for corners that touch. */
export function rough<T extends THREE.BufferGeometry>(geo: T, amount: number, seed = 1): T {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const offsets = new Map<string, [number, number, number]>();
  const rnd = seeded(seed);
  for (let i = 0; i < pos.count; i++) {
    const k = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    let o = offsets.get(k);
    if (!o) {
      o = [(rnd() - 0.5) * amount, (rnd() - 0.5) * amount, (rnd() - 0.5) * amount];
      offsets.set(k, o);
    }
    pos.setXYZ(i, pos.getX(i) + o[0], pos.getY(i) + o[1], pos.getZ(i) + o[2]);
  }
  geo.computeVertexNormals();
  return geo;
}

export function mesh(
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** A round length of wood between two points. */
export function pole(a: THREE.Vector3, b: THREE.Vector3, r: number, material: THREE.Material, sides = 6): THREE.Mesh {
  const len = a.distanceTo(b);
  const geo = new THREE.CylinderGeometry(r * 0.85, r, len, sides);
  const m = mesh(geo, material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

export const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ---- noise for the ground

function hash(x: number, z: number, seed: number): number {
  const s = Math.sin(x * 127.1 + z * 311.7 + seed * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

export function noise(x: number, z: number, seed = 0): number {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const w = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi, seed);
  const b = hash(xi + 1, zi, seed);
  const c = hash(xi, zi + 1, seed);
  const d = hash(xi + 1, zi + 1, seed);
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
}

/** A sign board with words on it, painted from code. */
export function signTexture(text: string, sub = ''): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const g = c.getContext('2d')!;
  g.fillStyle = '#6b4f33';
  g.fillRect(0, 0, 512, 192);
  for (let i = 0; i < 14; i++) {
    g.strokeStyle = `rgba(40,25,12,${0.15 + (i % 3) * 0.08})`;
    g.beginPath();
    g.moveTo(0, 12 + i * 13);
    g.bezierCurveTo(160, 6 + i * 13, 340, 20 + i * 13, 512, 10 + i * 13);
    g.stroke();
  }
  g.fillStyle = '#efe3c8';
  g.font = 'bold 74px Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 256, sub ? 80 : 96);
  if (sub) {
    g.font = 'italic 34px Georgia, serif';
    g.fillText(sub, 256, 150);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
