"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import Landmarks from "@/components/Landmarks";
import { ORDER, TITLES, GAP, gateZ, camZ } from "@/data/world";

const PALETTE = ["#22d3ee", "#a78bfa", "#ff4d9d"].map((c) => new THREE.Color(c));

// deterministic pseudo-random so the city is identical on every load
function rand(i: number) {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// which chapter is in the middle of the screen, as a decimal (1.5 = halfway between chapter 1 and 2)
function chapterIndex() {
  const mid = window.scrollY + window.innerHeight / 2;
  const centers: number[] = [];
  let prev = 0;
  for (const id of ORDER) {
    const el = document.getElementById(id);
    if (el) {
      const r = el.getBoundingClientRect();
      prev = r.top + window.scrollY + r.height / 2;
    } else {
      prev += 1;
    }
    centers.push(prev);
  }
  if (mid <= centers[0]) return 0;
  for (let i = 0; i < centers.length - 1; i++) {
    if (mid <= centers[i + 1]) {
      const f = (mid - centers[i]) / Math.max(centers[i + 1] - centers[i], 1);
      return i + f * f * (3 - 2 * f); // ease: the camera dwells at every chapter
    }
  }
  return centers.length - 1;
}

/* ---------- camera: flies down the avenue as you scroll ---------- */
function Rig() {
  const idx = useRef(0);

  useFrame((state, delta) => {
    const target = chapterIndex();
    const diff = target - idx.current;
    idx.current = THREE.MathUtils.damp(idx.current, target, 3.5, delta);
    const s = idx.current;
    const t = state.clock.elapsedTime;
    const cam = state.camera as THREE.PerspectiveCamera;

    cam.position.set(
      Math.sin(s * 1.4) * 1.8 + state.pointer.x * 0.9,
      3 + Math.sin(s * 0.9) * 0.7 + state.pointer.y * 0.5 + Math.sin(t * 0.6) * 0.06,
      camZ(s)
    );
    cam.lookAt(cam.position.x * 0.35, 2.7, camZ(s) - 30);
    cam.rotateZ(Math.sin(s * 1.1) * 0.035 - state.pointer.x * 0.01);

    // a little extra field of view while moving fast gives a sense of speed
    const fov = 60 + Math.min(Math.abs(diff) * 10, 14);
    const next = THREE.MathUtils.damp(cam.fov, fov, 6, delta);
    if (Math.abs(next - cam.fov) > 0.01) {
      cam.fov = next;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}

/* ---------- city: dark towers with glowing edges ---------- */
function addBox(
  fill: number[],
  edges: number[],
  ecol: number[],
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  col: THREE.Color
) {
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const z0 = z - d / 2;
  const z1 = z + d / 2;
  const c = [
    [x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1],
    [x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1],
  ];
  const tris = [
    [0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6],
    [0, 4, 5], [0, 5, 1], [1, 5, 6], [1, 6, 2],
    [2, 6, 7], [2, 7, 3], [3, 7, 4], [3, 4, 0],
  ];
  for (const t of tris) {
    for (const i of t) fill.push(c[i][0], c[i][1], c[i][2]);
  }
  const es = [
    [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6],
    [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  for (const [a, b] of es) {
    edges.push(c[a][0], c[a][1], c[a][2], c[b][0], c[b][1], c[b][2]);
    ecol.push(col.r, col.g, col.b, col.r, col.g, col.b);
  }
}

function buildCity() {
  const fill: number[] = [];
  const edges: number[] = [];
  const ecol: number[] = [];
  const far = GAP * (ORDER.length - 1) + 90;
  let n = 0;

  for (let z = 14; z > -far; z -= 7) {
    for (const side of [-1, 1]) {
      for (let c = 0; c < 5; c++) {
        n++;
        if (rand(n * 3.1) < 0.22) continue; // gaps between towers
        const x = side * (15 + c * 9 + rand(n * 5.7) * 4);
        const w = 3 + rand(n * 7.3) * 3.5;
        const d = 3 + rand(n * 11.9) * 3.5;
        const h = 3 + Math.pow(rand(n * 13.7), 2) * (14 + c * 5);
        const pick = rand(n * 17.3);
        const col = PALETTE[pick < 0.6 ? 0 : pick < 0.9 ? 1 : 2];
        addBox(fill, edges, ecol, x, z + (rand(n * 2.3) - 0.5) * 2, w, d, h, col);
      }
    }
  }
  return { fill, edges, ecol };
}

function City() {
  const { fillGeo, edgeGeo } = useMemo(() => {
    const d = buildCity();
    const f = new THREE.BufferGeometry();
    f.setAttribute("position", new THREE.BufferAttribute(new Float32Array(d.fill), 3));
    const e = new THREE.BufferGeometry();
    e.setAttribute("position", new THREE.BufferAttribute(new Float32Array(d.edges), 3));
    e.setAttribute("color", new THREE.BufferAttribute(new Float32Array(d.ecol), 3));
    return { fillGeo: f, edgeGeo: e };
  }, []);

  return (
    <>
      <mesh geometry={fillGeo} frustumCulled={false}>
        <meshBasicMaterial
          color="#060a1a"
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <lineSegments geometry={edgeGeo} frustumCulled={false}>
        <lineBasicMaterial vertexColors transparent opacity={0.9} />
      </lineSegments>
    </>
  );
}

/* ---------- floating dust: makes the flight feel fast ---------- */
function Dust() {
  const geo = useMemo(() => {
    const n = 2200;
    const a = new Float32Array(n * 3);
    const far = GAP * (ORDER.length - 1) + 90;
    for (let i = 0; i < n; i++) {
      a[i * 3] = (rand(i * 1.7) - 0.5) * 70;
      a[i * 3 + 1] = rand(i * 2.3) * 26;
      a[i * 3 + 2] = 20 - rand(i * 3.1) * (far + 40);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return g;
  }, []);

  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial
        color="#8be9ff"
        size={0.14}
        transparent
        opacity={0.65}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ---------- ground grid ---------- */
function Floor() {
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(900, 180, "#22d3ee", "#164e63");
    const m = g.material as THREE.LineBasicMaterial;
    m.transparent = true;
    m.opacity = 0.4;
    g.position.set(0, 0, -180);
    return g;
  }, []);
  return <primitive object={grid} />;
}

/* ---------- gates: one glowing arch per chapter ---------- */
function makeLabel(text: string) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 160;
  const ctx = c.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 84px monospace";
  ctx.fillStyle = "#22d3ee";
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 24;
  ctx.fillText(text, 512, 84);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Gate({ i }: { i: number }) {
  const z = gateZ(i);
  const a = useRef<THREE.MeshBasicMaterial>(null!);
  const b = useRef<THREE.MeshBasicMaterial>(null!);
  const l = useRef<THREE.MeshBasicMaterial>(null!);
  const tex = useMemo(() => makeLabel(String(i).padStart(2, "0") + "  " + TITLES[i]), [i]);

  useFrame((state) => {
    const d = state.camera.position.z - z;
    const flash = Math.exp(-(d * d) / 20); // flares up as the camera passes through
    const near = THREE.MathUtils.smoothstep(70 - Math.abs(d), 0, 30);
    a.current.opacity = (0.4 + 0.6 * flash) * near;
    b.current.opacity = (0.25 + 0.5 * flash) * near;
    l.current.opacity = (0.55 + 0.45 * flash) * near;
  });

  return (
    <group position={[0, 0, z]}>
      <mesh>
        <torusGeometry args={[7, 0.05, 8, 96, Math.PI]} />
        <meshBasicMaterial
          ref={a}
          color="#22d3ee"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh>
        <torusGeometry args={[6.3, 0.025, 8, 96, Math.PI]} />
        <meshBasicMaterial
          ref={b}
          color="#a78bfa"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh position={[0, 8.1, 0]}>
        <planeGeometry args={[9, 1.4]} />
        <meshBasicMaterial
          ref={l}
          map={tex}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default function World() {
  return (
    <div className="fixed inset-0 z-0 bg-black">
      <Canvas camera={{ position: [0, 3, 8], fov: 60, near: 0.1, far: 700 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#04050b"]} />
        <fog attach="fog" args={["#04050b", 30, 190]} />
        <Rig />
        <Floor />
        <City />
        <Dust />
        {ORDER.map((id, i) => (
          <Gate key={id} i={i} />
        ))}
        <Landmarks />
      </Canvas>
      {/* soft vignette keeps the edges dark so text stays readable */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(4,5,11,0.85)_100%)]" />
    </div>
  );
}
