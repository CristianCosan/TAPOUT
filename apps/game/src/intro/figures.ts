// The two things the drop-off needs that no station has: the float plane and the producer.
// Built from shapes like everything else; the producer stands still, so nothing is animated
// but the plane leaving.

import * as THREE from 'three';
import { mat, mesh, pole, rough, v } from '../world/kit.ts';

export function floatPlane(): THREE.Group {
  const g = new THREE.Group();
  const paint = mat(0xe8e2d0, { rough: 0.5 });
  const stripe = mat(0xb8402a, { rough: 0.5 });
  g.add(mesh(new THREE.CapsuleGeometry(0.55, 4.2, 4, 10), paint, 0, 1.6, 0, Math.PI / 2, 0, 0));
  g.add(mesh(new THREE.BoxGeometry(1.14, 0.12, 4.6), stripe, 0, 1.5, 0));
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.45, 1.2), mat(0x24343e, { rough: 0.2, metal: 0.4 }), 0, 2.05, -0.9));
  g.add(mesh(new THREE.BoxGeometry(11, 0.1, 1.3), paint, 0, 2.3, -0.6));
  g.add(mesh(new THREE.BoxGeometry(3, 0.08, 0.8), paint, 0, 1.8, 2.6));
  g.add(mesh(new THREE.BoxGeometry(0.08, 1.1, 0.9), stripe, 0, 2.3, 2.6));
  const prop = new THREE.Group();
  prop.name = 'prop';
  prop.add(mesh(new THREE.BoxGeometry(2.0, 0.14, 0.04), mat(0x2a2a2a), 0, 0, 0));
  prop.add(mesh(new THREE.ConeGeometry(0.18, 0.35, 8), mat(0xd0d0d0, { metal: 0.6 }), 0, 0, -0.15, -Math.PI / 2, 0, 0));
  prop.position.set(0, 1.6, -2.9);
  g.add(prop);
  for (const side of [-1, 1]) {
    g.add(mesh(rough(new THREE.CapsuleGeometry(0.28, 4.2, 3, 8), 0.02), mat(0xc8c4b8), side * 1.2, 0.25, -0.1, Math.PI / 2, 0, 0));
    g.add(pole(v(side * 1.2, 0.45, -1.2), v(side * 0.4, 1.3, -1.0), 0.04, mat(0x8a8a8a)));
    g.add(pole(v(side * 1.2, 0.45, 0.9), v(side * 0.4, 1.3, 0.9), 0.04, mat(0x8a8a8a)));
  }
  return g;
}

/** Kerry, in a red parka and a cap, holding out the sat phone. */
export function producer(): THREE.Group {
  const g = new THREE.Group();
  const trousers = mat(0x2e3238);
  for (const side of [-1, 1]) {
    g.add(mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.85, 6), trousers, side * 0.11, 0.43, 0));
    g.add(mesh(new THREE.BoxGeometry(0.13, 0.09, 0.26), mat(0x3a2a1e), side * 0.11, 0.045, 0.04));
  }
  g.add(mesh(rough(new THREE.CylinderGeometry(0.2, 0.25, 0.72, 8), 0.02), mat(0xa8302a), 0, 1.2, 0));
  g.add(mesh(new THREE.SphereGeometry(0.22, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xa8302a), 0, 1.53, 0));
  g.add(mesh(new THREE.SphereGeometry(0.12, 10, 8), mat(0xd8a888), 0, 1.75, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.07, 10), mat(0x2a3a4a), 0, 1.84, 0));
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.02, 0.12), mat(0x2a3a4a), 0, 1.81, 0.12));
  // One arm down, one held out with the phone.
  g.add(pole(v(-0.24, 1.48, 0), v(-0.28, 0.95, 0.02), 0.06, mat(0xa8302a)));
  g.add(pole(v(0.24, 1.48, 0), v(0.3, 1.15, 0.38), 0.06, mat(0xa8302a)));
  const phone = mesh(new THREE.BoxGeometry(0.08, 0.17, 0.05), mat(0xe0b020, { rough: 0.4 }), 0.31, 1.15, 0.47);
  phone.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 4), mat(0x1a1a1a), 0.02, 0.12, 0));
  g.add(phone);
  return g;
}
