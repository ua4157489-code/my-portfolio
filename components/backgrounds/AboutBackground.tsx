"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const COUNT = 70;
const LINK_DIST = 2.2;
const BOUNDS = new THREE.Vector3(9, 5, 3);
const MAX_SEGMENTS = (COUNT * (COUNT - 1)) / 2;

function Network() {
  const group = useRef<THREE.Group>(null);
  const points = useRef<THREE.Points>(null);
  const lines = useRef<THREE.LineSegments>(null);
  const ring = useRef<THREE.Mesh>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const reduce = useRef(false);

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * BOUNDS.x * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * BOUNDS.y * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * BOUNDS.z * 2;
      velocities[i * 3] = (Math.random() - 0.5) * 0.4;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    return { positions, velocities };
  }, []);

  const linePositions = useMemo(() => new Float32Array(MAX_SEGMENTS * 6), []);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const speed = reduce.current ? 0 : 1;

    // move nodes, bounce at the edges
    for (let i = 0; i < COUNT; i++) {
      for (let k = 0; k < 3; k++) {
        const idx = i * 3 + k;
        positions[idx] += velocities[idx] * dt * speed;
        const limit = k === 0 ? BOUNDS.x : k === 1 ? BOUNDS.y : BOUNDS.z;
        if (Math.abs(positions[idx]) > limit) velocities[idx] *= -1;
      }
    }

    // link nearby nodes
    let n = 0;
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < LINK_DIST * LINK_DIST) {
          linePositions.set(
            [
              positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
              positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2],
            ],
            n * 6
          );
          n++;
        }
      }
    }

    if (points.current) {
      points.current.geometry.attributes.position.needsUpdate = true;
    }
    if (lines.current) {
      lines.current.geometry.attributes.position.needsUpdate = true;
      lines.current.geometry.setDrawRange(0, n * 2);
    }

    // mouse parallax
    if (group.current) {
      group.current.rotation.y += (mouse.current.x * 0.25 - group.current.rotation.y) * 0.03;
      group.current.rotation.x += (-mouse.current.y * 0.15 - group.current.rotation.x) * 0.03;
    }

    // scan ring: expands and fades, then repeats
    if (ring.current) {
      const t = (state.clock.elapsedTime % 6) / 6;
      const s = 0.5 + t * 9;
      ring.current.scale.set(s, s, s);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.35;
    }
  });

  return (
    <group ref={group}>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <pointsMaterial size={0.07} color="#38bdf8" transparent opacity={0.9} sizeAttenuation />
      </points>

      <lineSegments ref={lines}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
            usage={THREE.DynamicDrawUsage}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#38bdf8" transparent opacity={0.18} />
      </lineSegments>

      <mesh ref={ring} rotation={[Math.PI / 2.6, 0, 0]}>
        <ringGeometry args={[0.98, 1, 128]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function AboutBackground() {
  return (
    <div
      aria-hidden
      style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
    >
      <Canvas
        camera={{ position: [0, 0, 9], fov: 60 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        <Network />
      </Canvas>
    </div>
  );
}
