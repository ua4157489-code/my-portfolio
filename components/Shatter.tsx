"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

// deterministic pseudo-random so the shards are the same every load
function rand(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const GREEN = new THREE.Color("#00ff9c");
const PINK = new THREE.Color("#ff2d6f");

const _v = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _c = new THREE.Color();

export default function Shatter({ sc }: { sc: RefObject<{ s: number }> }) {
  const group = useRef<THREE.Group>(null!);
  const wire = useRef<THREE.MeshBasicMaterial>(null!);
  const amount = useRef(0);

  // build the shards once: every triangle face of the sphere is one shard
  const data = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(3, 2); // raise 2 -> 3 for more, smaller shards
    const orig = Float32Array.from(geo.attributes.position.array as ArrayLike<number>);
    const faces = orig.length / 9;
    const centers = new Float32Array(faces * 3);
    const dirs = new Float32Array(faces * 3);
    const axes = new Float32Array(faces * 3);
    const speeds = new Float32Array(faces);
    const spins = new Float32Array(faces);
    const d = new THREE.Vector3();

    for (let f = 0; f < faces; f++) {
      const o = f * 9;
      const cx = (orig[o] + orig[o + 3] + orig[o + 6]) / 3;
      const cy = (orig[o + 1] + orig[o + 4] + orig[o + 7]) / 3;
      const cz = (orig[o + 2] + orig[o + 5] + orig[o + 8]) / 3;
      centers.set([cx, cy, cz], f * 3);

      // fly outward from the center, with some random sideways wobble
      d.set(cx, cy, cz).normalize();
      d.x += (rand(f * 3 + 1) - 0.5) * 0.6;
      d.y += (rand(f * 3 + 2) - 0.5) * 0.6;
      d.z += (rand(f * 3 + 3) - 0.5) * 0.6;
      d.normalize();
      dirs.set([d.x, d.y, d.z], f * 3);

      d.set(rand(f * 5 + 2) - 0.5, rand(f * 5 + 3) - 0.5, rand(f * 5 + 4) - 0.5).normalize();
      axes.set([d.x, d.y, d.z], f * 3);

      speeds[f] = 0.4 + rand(f * 7 + 5) * 1.2;
      spins[f] = (rand(f * 11 + 6) - 0.5) * 6;
    }
    return { geo, orig, centers, dirs, axes, speeds, spins, faces };
  }, []);

  useFrame((state, delta) => {
    // starts breaking at 8% scroll, fully broken at 90%; low damping = slow motion
    const target = THREE.MathUtils.smoothstep(sc.current.s, 0.08, 0.9);
    amount.current = THREE.MathUtils.damp(amount.current, target, 1.5, delta);
    const e = amount.current;

    const { geo, orig, centers, dirs, axes, speeds, spins, faces } = data;
    const arr = geo.attributes.position.array as Float32Array;

    for (let f = 0; f < faces; f++) {
      const cx = centers[f * 3];
      const cy = centers[f * 3 + 1];
      const cz = centers[f * 3 + 2];
      _axis.set(axes[f * 3], axes[f * 3 + 1], axes[f * 3 + 2]);
      _q.setFromAxisAngle(_axis, e * spins[f]);
      const dist = e * 6 * speeds[f];
      const dx = dirs[f * 3] * dist;
      const dy = dirs[f * 3 + 1] * dist;
      const dz = dirs[f * 3 + 2] * dist;

      for (let k = 0; k < 3; k++) {
        const i = f * 9 + k * 3;
        _v.set(orig[i] - cx, orig[i + 1] - cy, orig[i + 2] - cz).applyQuaternion(_q);
        arr[i] = cx + _v.x + dx;
        arr[i + 1] = cy + _v.y + dy;
        arr[i + 2] = cz + _v.z + dz;
      }
    }
    geo.attributes.position.needsUpdate = true;

    // slow drift, tilts a little toward the mouse, turns red-pink and fades as it breaks
    const g = group.current;
    g.rotation.y += delta * 0.05;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, state.pointer.y * 0.2, 3, delta);
    wire.current.color.copy(_c.copy(GREEN).lerp(PINK, e));
    wire.current.opacity = 0.45 - e * 0.25;
  });

  return (
    <group ref={group} position={[0, 0, -3]}>
      <mesh geometry={data.geo} frustumCulled={false}>
        <meshBasicMaterial ref={wire} color="#00ff9c" wireframe transparent opacity={0.45} />
      </mesh>
      <mesh geometry={data.geo} frustumCulled={false}>
        <meshBasicMaterial
          color="#00c8ff"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
