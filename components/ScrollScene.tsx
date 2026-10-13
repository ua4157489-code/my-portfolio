"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";

type Pose = { x: number; y: number; s: number };

// where the object sits on each page (x/y are fractions of the screen)
const HOME: Pose = { x: 0.27, y: 0.0, s: 0.9 };
const POSES: Record<string, Pose> = {
  "/": HOME,
  "/about": { x: 0.33, y: 0.02, s: 0.62 },
  "/experience": { x: -0.33, y: 0.02, s: 0.62 },
  "/education": { x: 0.33, y: -0.02, s: 0.62 },
  "/skills": { x: -0.33, y: 0.02, s: 0.62 },
  "/projects": { x: 0.33, y: 0.0, s: 0.62 },
  "/contact": { x: 0, y: 0.0, s: 0.8 },
};

const SATS = [
  { r: 2.1, a: 0.0, size: 0.14, y: 0.5 },
  { r: 2.7, a: 1.9, size: 0.09, y: -0.6 },
  { r: 3.3, a: 3.6, size: 0.18, y: 0.9 },
  { r: 2.4, a: 4.8, size: 0.07, y: -1.1 },
  { r: 3.8, a: 5.7, size: 0.11, y: 0.1 },
];

function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? THREE.MathUtils.clamp(window.scrollY / max, 0, 1) : 0;
}

function Rig({ pose, calm }: { pose: React.RefObject<Pose>; calm: boolean }) {
  const root = useRef<THREE.Group>(null!);
  const knot = useRef<THREE.Mesh>(null!);
  const orbit = useRef<THREE.Group>(null!);
  const sv = useRef(0); // smoothed scroll
  const last = useRef(0);
  const spin = useRef(0); // extra spin from scroll speed

  useFrame((state, delta) => {
    const p = scrollProgress();
    sv.current = THREE.MathUtils.damp(sv.current, p, 3, delta);
    const speed = Math.abs(sv.current - last.current) / Math.max(delta, 0.001);
    last.current = sv.current;
    spin.current = THREE.MathUtils.damp(spin.current, Math.min(speed, 1.5), 3, delta);

    const { viewport, pointer, size } = state;
    const narrow = size.width < 768;
    const t = pose.current;
    const tx = (narrow ? 0 : t.x) * viewport.width + pointer.x * 0.35;
    const ty = (narrow ? 0.22 : t.y) * viewport.height - sv.current * 0.9 + pointer.y * 0.2;
    const ts = narrow ? t.s * 0.6 : t.s;

    const g = root.current;
    g.position.x = THREE.MathUtils.damp(g.position.x, tx, 3, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, ty, 3, delta);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, ts, 3, delta));

    const idle = calm ? 0 : state.clock.elapsedTime;
    knot.current.rotation.y = idle * 0.12 + sv.current * Math.PI * 1 + spin.current * 0.3;
    knot.current.rotation.x = 0.4 + sv.current * 1.1 + Math.sin(idle * 0.2) * 0.1;
    orbit.current.rotation.y = idle * 0.08 - sv.current * Math.PI * 1.5;
  });

  return (
    <group ref={root}>
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.6}>
        <mesh ref={knot}>
          <torusKnotGeometry args={[1, 0.32, 240, 36, 2, 3]} />
          <meshPhysicalMaterial
            color="#0a1020"
            metalness={1}
            roughness={0.16}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={2}
          />
        </mesh>
      </Float>

      <group ref={orbit}>
        {SATS.map((s, i) => (
          <mesh key={i} position={[Math.cos(s.a) * s.r, s.y, Math.sin(s.a) * s.r]}>
            <sphereGeometry args={[s.size, 32, 32]} />
            <meshPhysicalMaterial
              color={i % 2 ? "#a78bfa" : "#22d3ee"}
              metalness={0.9}
              roughness={0.12}
              clearcoat={1}
              envMapIntensity={1.6}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default function ScrollScene() {
  const path = usePathname();
  const pose = useRef<Pose>(HOME);
  const calm = useRef(false);

  useEffect(() => {
    pose.current = POSES[path] ?? { ...HOME, s: 0.62, x: 0.33 };
  }, [path]);

  useEffect(() => {
    calm.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  return (
    <>
      {/* 2D layer: soft colored light + vignette behind the 3D object */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(34,211,238,0.10),transparent_55%),radial-gradient(ellipse_at_10%_90%,rgba(168,85,247,0.10),transparent_50%),#04060c]"
      />
      <div className="pointer-events-none fixed inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 7], fov: 40 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
        >
          <Environment resolution={256}>
            <group rotation={[-Math.PI / 3, 0, 1]}>
              <Lightformer form="rect" intensity={4} position={[0, 5, -5]} scale={[10, 10, 1]} color="#ffffff" />
              <Lightformer form="ring" intensity={6} position={[-5, 1, -1]} scale={10} color="#22d3ee" />
              <Lightformer form="rect" intensity={3} position={[6, -2, 2]} scale={[6, 8, 1]} color="#a855f7" />
            </group>
          </Environment>
          <Rig pose={pose} calm={calm.current} />
        </Canvas>
      </div>
    </>
  );
}
