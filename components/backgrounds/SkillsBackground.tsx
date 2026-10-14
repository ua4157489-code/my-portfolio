"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Stage, damp, usePointer } from "./shared";

const COLORS = ["#22d3ee", "#818cf8", "#f472b6", "#fbbf24", "#34d399"];
const TRAIL = 12;

const ORBITS = Array.from({ length: 9 }, (_, i) => ({
  r: 1.5 + i * 0.6,
  tilt: ((i % 3) - 1) * 0.28 + i * 0.03,
  size: 0.09 + (i % 4) * 0.035,
  phase: i * 1.7,
  color: COLORS[i % COLORS.length],
}));

function Orbit({ o }: { o: (typeof ORBITS)[number] }) {
  const planet = useRef<THREE.Mesh>(null);
  const trail = useRef<THREE.Points>(null);
  const trailPos = useMemo(() => new Float32Array(TRAIL * 3), []);

  useFrame((st) => {
    // slower the further out, like real orbits
    const w = (2 * 0.9) / Math.pow(o.r, 1.5);
    const a = o.phase + st.clock.elapsedTime * w;
    planet.current?.position.set(Math.cos(a) * o.r, 0, Math.sin(a) * o.r);
    for (let k = 0; k < TRAIL; k++) {
      const aa = a - (k + 1) * 0.06;
      trailPos.set([Math.cos(aa) * o.r, 0, Math.sin(aa) * o.r], k * 3);
    }
    if (trail.current) trail.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group rotation={[o.tilt, 0, o.tilt * 0.6]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[o.r - 0.006, o.r + 0.006, 160]} />
        <meshBasicMaterial color={o.color} transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={planet}>
        <sphereGeometry args={[o.size, 24, 24]} />
        <meshStandardMaterial color={o.color} emissive={o.color} emissiveIntensity={1.3} />
      </mesh>
      <points ref={trail}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={o.size * 0.9} color={o.color} transparent opacity={0.5} sizeAttenuation />
      </points>
    </group>
  );
}

function System() {
  const root = useRef<THREE.Group>(null);
  const pointer = usePointer();

  useFrame((_, d) => {
    const dt = Math.min(d, 0.05);
    const g = root.current;
    if (!g) return;
    g.rotation.y += dt * 0.05;
    g.rotation.x = damp(g.rotation.x, 0.55 - pointer.current.y * 0.3, 2.5, dt);
    g.rotation.z = damp(g.rotation.z, pointer.current.x * 0.25, 2.5, dt);
  });

  return (
    <group ref={root} position={[3.4, 0, 0]}>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#e0f2fe" />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.14} />
      </mesh>
      <pointLight intensity={60} color="#7dd3fc" />
      {ORBITS.map((o, i) => (
        <Orbit key={i} o={o} />
      ))}
    </group>
  );
}

export default function SkillsBackground() {
  return (
    <Stage>
      <ambientLight intensity={0.35} />
      <System />
    </Stage>
  );
}
