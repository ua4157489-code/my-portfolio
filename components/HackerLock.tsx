"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

type Shared = RefObject<{ s: number }>;

const GREEN = new THREE.Color("#00ff9c");
const RED = new THREE.Color("#ff2d6f");
const IMPACT = new THREE.Vector3(0, -0.35, 0.5); // the keyhole: the crack starts here

// deterministic pseudo-random so the shards are the same every load
function rand(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// a padlock made of about 1,100 triangular shards
function buildLock() {
  const parts: THREE.BufferGeometry[] = [];

  const body = new THREE.BoxGeometry(2.6, 2.0, 0.9, 10, 8, 3).toNonIndexed();
  body.translate(0, -0.5, 0);
  parts.push(body);

  const shackle = new THREE.TorusGeometry(0.85, 0.2, 10, 28, Math.PI).toNonIndexed();
  shackle.translate(0, 0.5, 0);
  parts.push(shackle);

  const hole = new THREE.CylinderGeometry(0.22, 0.22, 0.1, 14).toNonIndexed();
  hole.rotateX(Math.PI / 2);
  hole.translate(0, -0.35, 0.47);
  parts.push(hole);

  const slot = new THREE.BoxGeometry(0.14, 0.5, 0.1).toNonIndexed();
  slot.translate(0, -0.75, 0.47);
  parts.push(slot);

  const all: number[] = [];
  for (const g of parts) {
    const a = g.attributes.position.array as Float32Array;
    for (let i = 0; i < a.length; i++) all.push(a[i]);
  }
  const orig = new Float32Array(all);
  const faces = orig.length / 9;

  const centers = new Float32Array(faces * 3);
  const dirs = new Float32Array(faces * 3);
  const axes = new Float32Array(faces * 3);
  const speeds = new Float32Array(faces);
  const spins = new Float32Array(faces);
  const delays = new Float32Array(faces);
  const dist = new Float32Array(faces);

  const c = new THREE.Vector3();
  const d = new THREE.Vector3();
  let maxDist = 0;

  for (let f = 0; f < faces; f++) {
    const o = f * 9;
    c.set(
      (orig[o] + orig[o + 3] + orig[o + 6]) / 3,
      (orig[o + 1] + orig[o + 4] + orig[o + 7]) / 3,
      (orig[o + 2] + orig[o + 5] + orig[o + 8]) / 3
    );
    centers.set([c.x, c.y, c.z], f * 3);
    dist[f] = c.distanceTo(IMPACT);
    maxDist = Math.max(maxDist, dist[f]);

    // fly outward from the keyhole with some random wobble
    d.copy(c).sub(IMPACT).normalize();
    d.x += (rand(f * 3 + 1) - 0.5) * 0.7;
    d.y += (rand(f * 3 + 2) - 0.5) * 0.7;
    d.z += (rand(f * 3 + 3) - 0.5) * 0.7 + 0.2;
    d.normalize();
    dirs.set([d.x, d.y, d.z], f * 3);

    d.set(rand(f * 5 + 2) - 0.5, rand(f * 5 + 3) - 0.5, rand(f * 5 + 4) - 0.5).normalize();
    axes.set([d.x, d.y, d.z], f * 3);

    speeds[f] = 0.5 + rand(f * 7 + 5) * 1.3;
    spins[f] = (rand(f * 11 + 6) - 0.5) * 7;
  }
  // shards near the keyhole break first, far ones later
  for (let f = 0; f < faces; f++) delays[f] = (dist[f] / (maxDist || 1)) * 0.4;

  const geo = new THREE.BufferGeometry();
  const pos = new THREE.BufferAttribute(new Float32Array(orig), 3);
  pos.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute("position", pos);

  return { geo, orig, centers, dirs, axes, speeds, spins, delays, faces };
}

const _v = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _col = new THREE.Color();

export default function HackerLock({ sc }: { sc: Shared }) {
  const group = useRef<THREE.Group>(null!);
  const wire = useRef<THREE.MeshBasicMaterial>(null!);
  const fill = useRef<THREE.MeshBasicMaterial>(null!);
  const ringA = useRef<THREE.Mesh>(null!);
  const ringB = useRef<THREE.Mesh>(null!);
  const ringMatA = useRef<THREE.MeshBasicMaterial>(null!);
  const ringMatB = useRef<THREE.MeshBasicMaterial>(null!);
  const scan = useRef<THREE.Mesh>(null!);
  const scanMat = useRef<THREE.MeshBasicMaterial>(null!);
  const amount = useRef(0);
  const dim = useRef(0);

  const lock = useMemo(() => buildLock(), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // how broken it is: a slow, smooth follow of the scroll position
    const target = THREE.MathUtils.smoothstep(sc.current.s, 0.03, 0.85);
    amount.current = THREE.MathUtils.damp(amount.current, target, 1.2, delta);
    const a = amount.current;

    // calm down while the About portrait is on screen
    const el = document.getElementById("about");
    let aw = 0;
    if (el) {
      const r = el.getBoundingClientRect();
      const far =
        Math.abs(r.top + r.height / 2 - window.innerHeight / 2) /
        (r.height / 2 + window.innerHeight * 0.25);
      aw = THREE.MathUtils.smoothstep(1 - far, 0.1, 0.5);
    }
    dim.current = THREE.MathUtils.damp(dim.current, aw, 3, delta);
    const m = 1 - 0.85 * dim.current;

    // move every shard
    const { geo, orig, centers, dirs, axes, speeds, spins, delays, faces } = lock;
    const arr = geo.attributes.position.array as Float32Array;
    for (let f = 0; f < faces; f++) {
      const k = THREE.MathUtils.clamp((a - delays[f]) / 0.6, 0, 1);
      const e = k * k * (3 - 2 * k); // smooth ease in and out
      const cx = centers[f * 3];
      const cy = centers[f * 3 + 1];
      const cz = centers[f * 3 + 2];
      _axis.set(axes[f * 3], axes[f * 3 + 1], axes[f * 3 + 2]);
      _q.setFromAxisAngle(_axis, e * spins[f]);
      const travel = e * speeds[f] * 6;
      const dx = dirs[f * 3] * travel;
      const dy = dirs[f * 3 + 1] * travel - e * e * 1.2; // slow fall
      const dz = dirs[f * 3 + 2] * travel;
      for (let v = 0; v < 3; v++) {
        const i = f * 9 + v * 3;
        _v.set(orig[i] - cx, orig[i + 1] - cy, orig[i + 2] - cz).applyQuaternion(_q);
        arr[i] = cx + _v.x + dx;
        arr[i + 1] = cy + _v.y + dy;
        arr[i + 2] = cz + _v.z + dz;
      }
    }
    geo.attributes.position.needsUpdate = true;

    // placement: right side of the screen, scaled down on narrow screens
    const vp = state.viewport.getCurrentViewport(state.camera, [0, 0, -2.2]);
    const g = group.current;
    g.position.set(vp.width * 0.2, 0.1, -2.2);
    g.scale.setScalar(Math.min(1, vp.width / 12));
    g.rotation.y = Math.sin(t * 0.4) * 0.4 + state.pointer.x * 0.3 + a * 0.8;
    g.rotation.x = -state.pointer.y * 0.15 + a * 0.2;

    // green while locked, hot pink-red once breached
    wire.current.color.copy(_col.copy(GREEN).lerp(RED, a));
    wire.current.opacity = (0.55 - 0.3 * a) * m;
    fill.current.opacity = 0.06 * m;

    // the "firewall" rings spin, then expand and fade as it breaks
    ringA.current.rotation.z = t * 0.4;
    ringB.current.rotation.z = -t * 0.3;
    ringA.current.scale.setScalar(1 + a * 0.5);
    ringB.current.scale.setScalar(1 + a * 0.5);
    ringMatA.current.opacity = 0.6 * (1 - a) * m;
    ringMatB.current.opacity = 0.4 * (1 - a) * m;

    // scan line sweeping up and down
    scan.current.position.y = Math.sin(t * 0.9) * 1.4;
    scanMat.current.opacity = 0.5 * (1 - a) * m;
  });

  return (
    <group ref={group}>
      <mesh geometry={lock.geo} frustumCulled={false}>
        <meshBasicMaterial ref={wire} color="#00ff9c" wireframe transparent opacity={0.55} />
      </mesh>
      <mesh geometry={lock.geo} frustumCulled={false}>
        <meshBasicMaterial
          ref={fill}
          color="#00c8ff"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={ringA}>
        <torusGeometry args={[2.5, 0.014, 6, 100, 4.4]} />
        <meshBasicMaterial
          ref={ringMatA}
          color="#00c8ff"
          transparent
          opacity={0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ringB}>
        <torusGeometry args={[2.85, 0.01, 6, 100, 3.2]} />
        <meshBasicMaterial
          ref={ringMatB}
          color="#00ff9c"
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={scan}>
        <planeGeometry args={[3.4, 0.03]} />
        <meshBasicMaterial
          ref={scanMat}
          color="#00ff9c"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
