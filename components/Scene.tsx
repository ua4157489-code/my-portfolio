"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import Shatter from "./Shatter";
import Campus from "./Campus";
import SectionObjects from "./SectionObjects";
import { EFFECTS } from "@/data/effects";

type Shared = RefObject<{ s: number; idx: number; vel: number }>;

const GREEN = new THREE.Color("#00ff9c");
const CYAN = new THREE.Color("#00c8ff");
const PURPLE = new THREE.Color("#a855f7");

// where the object sits for each section: top, about, skills, projects, contact
const IDS = ["top", "about", "education", "skills", "projects", "contact"];
const X = [0, 0.3, 0.42, -0.3, 0.3, 0]; // fraction of screen width
const Y = [0, 0.04, 0.3, -0.04, 0.04, 0]; // fraction of screen height
const SCALE = [1, 0.8, 0.45, 0.8, 0.8, 1.2];

function scrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? THREE.MathUtils.clamp(window.scrollY / max, 0, 1) : 0;
}

// which section is in the middle of the screen, as a decimal (1.5 = halfway from about to skills)
function sectionIndex() {
  const mid = window.scrollY + window.innerHeight / 2;
  const centers = IDS.map((id) => {
    const el = document.getElementById(id);
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return r.top + window.scrollY + r.height / 2;
  });
  if (mid <= centers[0]) return 0;
  for (let i = 0; i < centers.length - 1; i++) {
    if (mid <= centers[i + 1]) {
      return i + (mid - centers[i]) / (centers[i + 1] - centers[i]);
    }
  }
  return centers.length - 1;
}

function sample(arr: number[], idx: number) {
  const i = Math.min(Math.floor(idx), arr.length - 2);
  const f = THREE.MathUtils.smoothstep(idx - i, 0, 1);
  return THREE.MathUtils.lerp(arr[i], arr[i + 1], f);
}

// deterministic pseudo-random so particle positions are stable
function rand(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// reads the scroll position each frame, smooths it, and nudges the camera
function Rig({ sc }: { sc: Shared }) {
  useFrame((state, delta) => {
    const v = sc.current;
    const targetIdx = sectionIndex();
    v.s = THREE.MathUtils.damp(v.s, scrollProgress(), 4, delta);
    v.vel = Math.abs(targetIdx - v.idx); // how fast we're travelling between sections
    v.idx = THREE.MathUtils.damp(v.idx, targetIdx, 4, delta);

    const cam = state.camera;
    cam.position.z = 6 - v.s * 1;
    cam.lookAt(0, 0, 0);
  });
  return null;
}

// torus knot that orbits the main shape (it travels with it)
function Orbiter({ sc }: { sc: Shared }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const s = sc.current.s;
    ref.current.scale.setScalar(THREE.MathUtils.smoothstep(s, 0.05, 0.3));
    ref.current.position.set(
      Math.cos(t * 0.5) * 2.6,
      Math.sin(t * 0.7) * 1.2,
      Math.sin(t * 0.5) * 1.2
    );
    ref.current.rotation.x = t * 0.5;
    ref.current.rotation.y = t * 0.3 + s * Math.PI * 3;
  });

  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[0.45, 0.13, 120, 14]} />
      <meshBasicMaterial color="#00c8ff" wireframe transparent opacity={0.5} />
    </mesh>
  );
}

// main wireframe: glides to a new spot for each section, spins faster while moving
function Core({ sc }: { sc: Shared }) {
  const group = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.Mesh>(null!);
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    const { s, idx, vel } = sc.current;
    const vw = state.viewport.width;
    const vh = state.viewport.height;

    mesh.current.rotation.x += delta * (0.15 + vel * 2);
    mesh.current.rotation.y += delta * (0.2 + vel * 3);

    const tx = sample(X, idx) * vw + state.pointer.x * 0.5;
    const ty = sample(Y, idx) * vh + state.pointer.y * 0.3;
    const g = group.current;
    g.position.x = THREE.MathUtils.damp(g.position.x, tx, 6, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, ty, 6, delta);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, sample(SCALE, idx), 6, delta));

    if (s < 0.5) tmp.copy(GREEN).lerp(CYAN, s * 2);
    else tmp.copy(CYAN).lerp(PURPLE, (s - 0.5) * 2);
    mat.current.color.copy(tmp);
  });

  return (
    <group ref={group}>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={1}>
        <mesh ref={mesh}>
          <icosahedronGeometry args={[1.6, 1]} />
          <meshBasicMaterial ref={mat} color="#00ff9c" wireframe transparent opacity={0.6} />
        </mesh>
      </Float>
      {EFFECTS.orbiter && <Orbiter sc={sc} />}
    </group>
  );
}

// particle field that rotates with the scroll
function Particles({ sc }: { sc: Shared }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const arr = new Float32Array(1500 * 3);
    for (let i = 0; i < arr.length; i++) arr[i] = (rand(i + 1) - 0.5) * 22;
    return arr;
  }, []);

  useFrame((state) => {
    const s = sc.current.s;
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
  const sc = useRef({ s: 0, idx: 0, vel: 0 });

  return (
    <div className="fixed inset-0 z-0 bg-black">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} dpr={[1, 1.5]}>
        <Rig sc={sc} />
        {EFFECTS.stars && <Stars radius={80} depth={50} count={800} factor={3} fade speed={0.4} />}
        {EFFECTS.shatter && <Shatter sc={sc} />}
        {EFFECTS.particles && <Particles sc={sc} />}
        {EFFECTS.core && <Core sc={sc} />}
        <Campus />
        {EFFECTS.sectionObjects && <SectionObjects />}
      </Canvas>
    </div>
  );
}
