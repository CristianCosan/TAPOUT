// Point and click (D-113): the camera never walks. It stands at one fixed shot at a time and
// glides to the next when you change view. Shared by the world and the kitchen.

import * as THREE from 'three';
import type { WorldShot } from '@tapout/content';

const GLIDE_SECONDS = 0.9;

export class ShotCamera {
  private from: { eye: THREE.Vector3; at: THREE.Vector3; fov: number } | null = null;
  private to = { eye: new THREE.Vector3(), at: new THREE.Vector3(), fov: 60 };
  private t = 1;
  private placed = false;
  /** The point looked at right now, for the sway. */
  private at = new THREE.Vector3();

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  /** Puts the camera on a shot; `cut` jumps there, otherwise it glides. */
  go(shot: WorldShot, groundAt: (x: number, z: number) => number, cut: boolean): void {
    const eye = new THREE.Vector3(shot.eye.x, groundAt(shot.eye.x, shot.eye.z) + shot.eye.y, shot.eye.z);
    const at = new THREE.Vector3(shot.at.x, groundAt(shot.at.x, shot.at.z) + shot.at.y, shot.at.z);
    if (cut || !this.placed) {
      cut = true;
      this.from = null;
      this.t = 1;
    } else {
      this.from = { eye: this.camera.position.clone(), at: this.at.clone(), fov: this.camera.fov };
      this.t = 0;
    }
    this.placed = true;
    this.to = { eye, at, fov: shot.fov ?? 60 };
    if (cut) this.apply(eye, at, this.to.fov);
  }

  /** True while gliding from one shot to the next. */
  get moving(): boolean {
    return this.t < 1;
  }

  /** The camera's ground point, for sounds that fade with distance. */
  get eye(): THREE.Vector3 {
    return this.camera.position;
  }

  update(dt: number, time: number): void {
    if (this.from && this.t < 1) {
      this.t = Math.min(1, this.t + dt / GLIDE_SECONDS);
      const e = this.t * this.t * (3 - 2 * this.t);
      const eye = this.from.eye.clone().lerp(this.to.eye, e);
      // A small lift mid-glide, as if carried there rather than dragged.
      eye.y += Math.sin(e * Math.PI) * 0.6;
      this.apply(eye, this.from.at.clone().lerp(this.to.at, e), this.from.fov + (this.to.fov - this.from.fov) * e);
      return;
    }
    // A held camera, not a tripod: a breath of movement keeps the still shot alive.
    const sway = new THREE.Vector3(Math.sin(time * 0.31) * 0.025, Math.sin(time * 0.23 + 1) * 0.018, 0);
    this.apply(this.to.eye.clone().add(sway), this.to.at, this.to.fov);
  }

  private apply(eye: THREE.Vector3, at: THREE.Vector3, fov: number): void {
    this.camera.position.copy(eye);
    this.at.copy(at);
    this.camera.lookAt(at);
    if (this.camera.fov !== fov) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
  }
}

/** The shot that looks most squarely at a point, of those that see it at all. */
export function bestShot(shots: readonly WorldShot[], p: { x: number; z: number }, groundAt: (x: number, z: number) => number): number {
  let best = -1;
  let score = -Infinity;
  shots.forEach((s, i) => {
    const eye = new THREE.Vector3(s.eye.x, groundAt(s.eye.x, s.eye.z) + s.eye.y, s.eye.z);
    const at = new THREE.Vector3(s.at.x, groundAt(s.at.x, s.at.z) + s.at.y, s.at.z);
    const look = at.sub(eye).setY(0).normalize();
    const to = new THREE.Vector3(p.x - eye.x, 0, p.z - eye.z);
    const d = to.length();
    const cos = look.dot(to.normalize());
    // Squarely in view first, then nearer.
    const sc = cos - d / 200;
    if (cos > 0.6 && sc > score) {
      score = sc;
      best = i;
    }
  });
  return best;
}
