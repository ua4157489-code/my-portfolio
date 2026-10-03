"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

type Progress = RefObject<number>;

const GREEN = new THREE.Color("#00ff9c");
const CYAN = new THREE.Color("#00c8ff");
const PURPLE = new THREE.Color("#a855f7");

function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? THREE.MathUtils.clamp(window.scrollY / max, 0, 1) : 0;
}

// deterministic pseudo-random so particle positions are stable
function rand(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Smooths the scroll value and moves the camera along a path
function Rig({ progress }: { progress: Progress }) {
  useFrame((state, delta) => {
    progress.current = THREE.MathUtils.damp(
      progress.current,
      scrollProgress(),
      4,
      delta
    );
    const s = progress.current;
    const cam = state.camera;
    cam.position.z = 6 - s * 2;
    cam.position.x = Math.sin(s * Math.PI * 2) * 1.2;
    cam.position.y = -s * 1.2;
    cam.lookAt(0, 0, 0);
  });
  return null;
}

// Main wireframe: spins faster as you scroll, drifts sideways, shifts color
function Core({ progress }: { progress: Progress }) {
  const group = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.Mesh>(null!);
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    const s = progress.current;
    const t = state.clock.elapsedTime;

    mesh.current.rotation.x = t * 0.15 + s * Math.PI * 2;
    mesh.current.rotation.y = t * 0.2 + s * Math.PI * 4;

    const targetX = state.pointer.x * 0.8 + Math.sin(s * Math.PI * 3) * 2.2;
    const targetY = state.pointer.y * 0.5;
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, targetX, 4, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, targetY, 4, delta);
    group.current.scale.setScalar(1 - s * 0.3);

    if (s < 0.5) tmp.copy(GREEN).lerp(CYAN, s * 2);
    else tmp.copy(CYAN).lerp(PURPLE, (s - 0.5) * 2);
    mat.current.color.copy(tmp);
  });

  return (
    <group ref={group}>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={1}>
        <mesh ref={mesh}>
          <icosahedronGeometry args={[1.6, 1]} />
          <meshBasicMaterial ref={mat} color="#00ff9c" wireframe transparent opacity={0.3} />
        </mesh>
      </Float>
    </group>
  );
}

// Torus knot that fades in and orbits once you start scrolling
function Orbiter({ progress }: { progress: Progress }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const s = progress.current;
    ref.current.scale.setScalar(THREE.MathUtils.smoothstep(s, 0.05, 0.35));
    ref.current.position.set(
      Math.cos(t * 0.4) * 3.2,
      Math.sin(t * 0.6) * 1.4,
      Math.sin(t * 0.4) * 1.5 - 1
    );
    ref.current.rotation.x = t * 0.5 + s * Math.PI * 3;
    ref.current.rotation.y = t * 0.3;
  });

  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[0.55, 0.16, 120, 14]} />
      <meshBasicMaterial color="#00c8ff" wireframe transparent opacity={0.45} />
    </mesh>
  );
}

// Particle field that rotates with the scroll
function Particles({ progress }: { progress: Progress }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const arr = new Float32Array(1500 * 3);
    for (let i = 0; i < arr.length; i++) arr[i] = (rand(i + 1) - 0.5) * 22;
    return arr;
  }, []);

  useFrame((state) => {
    const s = progress.current;
    ref.current.rotation.y = s * Math.PI * 2 + state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = s * 0.6;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#00ff9c" transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

export default function Scene() {
  const progress = useRef(0);

  return (
    <div className="fixed inset-0 z-0 bg-black">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} dpr={[1, 1.5]}>
        <Rig progress={progress} />
        <Stars radius={80} depth={50} count={3000} factor={4} fade speed={1} />
        <Particles progress={progress} />
        <Core progress={progress} />
        <Orbiter progress={progress} />
      </Canvas>
    </div>
  );
}
