"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { Stage, usePointer } from "./shared";

function Terrain() {
  const geo = useRef<THREE.PlaneGeometry>(null);
  const pointer = usePointer();

  useFrame((st) => {
    const g = geo.current;
    if (!g) return;
    const a = g.attributes.position;
    const t = st.clock.elapsedTime;
    const mx = pointer.current.x * 12;
    const my = pointer.current.y * 6 + 2;
    for (let i = 0; i < a.count; i++) {
      const x = a.getX(i);
      const y = a.getY(i);
      let z =
        Math.sin(x * 0.5 + t * 0.8) * 0.45 +
        Math.sin(y * 0.6 + t * 0.6) * 0.35 +
        Math.sin((x + y) * 0.3 + t * 0.4) * 0.3;
      const d = Math.hypot(x - mx, y - my);
      z += Math.exp(-d * d * 0.08) * 0.9 * Math.sin(d * 1.5 - t * 3);
      a.setZ(i, z);
    }
    a.needsUpdate = true;
  });

  return (
    <mesh rotation={[-Math.PI / 2.4, 0, 0]} position={[0, -2.2, 0]}>
      <planeGeometry ref={geo} args={[26, 18, 80, 56]} />
      <meshBasicMaterial wireframe color="#38bdf8" transparent opacity={0.55} />
    </mesh>
  );
}

export default function ProjectsBackground() {
  return (
    <Stage camera={[0, 2, 9]}>
      <fog attach="fog" args={["#020617", 8, 20]} />
      <Terrain />
    </Stage>
  );
}
