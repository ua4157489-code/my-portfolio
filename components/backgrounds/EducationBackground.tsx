"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { Stage, damp, usePointer } from "./shared";

function Ring({ r, color }: { r: number; color: string }) {
  return (
    <mesh>
      <torusGeometry args={[r, 0.05, 20, 180]} />
      <meshStandardMaterial color={color} metalness={0.85} roughness={0.25} />
    </mesh>
  );
}

function Gyro() {
  const root = useRef<THREE.Group>(null);
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  const c = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const pointer = usePointer();

  useFrame((st, d) => {
    const dt = Math.min(d, 0.05);
    // each ring turns on its own axis; nesting makes the motion compound
    if (a.current) a.current.rotation.x += dt * 0.35;
    if (b.current) b.current.rotation.y += dt * 0.55;
    if (c.current) c.current.rotation.z += dt * 0.85;
    if (core.current) core.current.rotation.y -= dt * 0.4;
    if (root.current) {
      root.current.rotation.y = damp(root.current.rotation.y, pointer.current.x * 0.5, 2.5, dt);
      root.current.rotation.x = damp(root.current.rotation.x, -pointer.current.y * 0.35, 2.5, dt);
      root.current.position.y = Math.sin(st.clock.elapsedTime * 0.6) * 0.25;
    }
  });

  return (
    <group ref={root} position={[3.4, 0, 0]}>
      <group ref={a}>
        <Ring r={3.1} color="#38bdf8" />
        <group ref={b}>
          <Ring r={2.4} color="#818cf8" />
          <group ref={c}>
            <Ring r={1.7} color="#22d3ee" />
            <mesh ref={core}>
              <icosahedronGeometry args={[0.85, 1]} />
              <meshStandardMaterial
                color="#0ea5e9"
                emissive="#0369a1"
                emissiveIntensity={0.9}
                metalness={0.6}
                roughness={0.3}
                flatShading
              />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

export default function EducationBackground() {
  return (
    <Stage>
      <ambientLight intensity={0.5} />
      <pointLight position={[6, 5, 6]} intensity={80} color="#7dd3fc" />
      <pointLight position={[-6, -4, 4]} intensity={50} color="#a78bfa" />
      <Gyro />
    </Stage>
  );
}
