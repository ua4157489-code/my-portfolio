"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Stage, damp, usePointer } from "./shared";

const N = 70;
const at = (t: number, s: number): [number, number, number] => {
  const a = t * 0.42 + s * Math.PI;
  return [Math.cos(a) * 2, (t - N / 2) * 0.2, Math.sin(a) * 2];
};

function Helix() {
  const g = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const pointer = usePointer();

  const { nodes, rungs, strands } = useMemo(() => {
    const nodes = new Float32Array(N * 6);
    const rungs = new Float32Array(N * 6);
    const strands = new Float32Array((N - 1) * 12);
    for (let t = 0; t < N; t++) {
      nodes.set([...at(t, 0), ...at(t, 1)], t * 6);
      rungs.set([...at(t, 0), ...at(t, 1)], t * 6);
    }
    for (let t = 0; t < N - 1; t++)
      for (let s = 0; s < 2; s++)
        strands.set([...at(t, s), ...at(t + 1, s)], (t * 2 + s) * 6);
    return { nodes, rungs, strands };
  }, []);

  useFrame((st, d) => {
    const dt = Math.min(d, 0.05);
    const o = g.current;
    if (!o) return;
    o.rotation.y += dt * 0.3;
    o.rotation.x = damp(o.rotation.x, 0.3 + pointer.current.y * 0.2, 3, dt);
    o.rotation.z = damp(o.rotation.z, 0.45 + pointer.current.x * 0.2, 3, dt);
    if (pulse.current) {
      const t = (st.clock.elapsedTime * 9) % N;
      const i = Math.floor(t);
      const a = at(i, 0);
      const b = at(Math.min(i + 1, N - 1), 0);
      const f = t - i;
      pulse.current.position.set(
        a[0] + (b[0] - a[0]) * f,
        a[1] + (b[1] - a[1]) * f,
        a[2] + (b[2] - a[2]) * f
      );
    }
  });

  return (
    <group ref={g} position={[3.6, 0, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodes, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.14} color="#7dd3fc" sizeAttenuation />
      </points>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[rungs, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#6366f1" transparent opacity={0.22} />
      </lineSegments>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[strands, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#22d3ee" transparent opacity={0.45} />
      </lineSegments>
      <mesh ref={pulse}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

export default function ExperienceBackground() {
  return (
    <Stage>
      <Helix />
    </Stage>
  );
}
