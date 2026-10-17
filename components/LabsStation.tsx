"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import * as THREE from "three";

type Shared = MutableRefObject<{ p: number; mx: number; my: number }>;

const LABS = [
  { n: "DVWA", f: "A03 Injection", c: "#22d3ee", x: -0.6, z: -0.8 },
  { n: "Juice Shop", f: "A01 Broken Access", c: "#a78bfa", x: 0.6, z: -0.8 },
  { n: "Docker", f: "A05 Misconfiguration", c: "#38bdf8", x: -1.7, z: 0.55 },
  { n: "Kubernetes", f: "Over-privileged RBAC", c: "#34d399", x: 1.7, z: 0.55 },
];
const CYCLE = 3.2; // seconds per lab
const STACK = new THREE.Vector3(0, -0.55, 1.7);
const AMBER = new THREE.Color("#ffb020");
const MONO = "ui-monospace, Menlo, Consolas, 'DejaVu Sans Mono', monospace";

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function tex(cv: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function nameTex(text: string) {
  const cv = document.createElement("canvas");
  cv.width = 320;
  cv.height = 64;
  const ctx = cv.getContext("2d")!;
  ctx.font = `600 28px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "#e6f2ff";
  ctx.fillText(text, 160, 33);
  return tex(cv);
}
function chipTex(text: string) {
  const cv = document.createElement("canvas");
  cv.width = 384;
  cv.height = 64;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "rgba(40,24,4,0.85)";
  ctx.strokeStyle = "#ffb020";
  ctx.lineWidth = 3;
  rr(ctx, 4, 8, 376, 48, 24);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffd27a";
  ctx.font = `600 24px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 192, 33);
  return tex(cv);
}
function docTex() {
  const cv = document.createElement("canvas");
  cv.width = 128;
  cv.height = 160;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#eaf4ff";
  rr(ctx, 2, 2, 124, 156, 8);
  ctx.fill();
  ctx.fillStyle = "#22d3ee";
  ctx.fillRect(14, 16, 60, 8);
  ctx.fillStyle = "#ffb020";
  rr(ctx, 90, 14, 24, 12, 6);
  ctx.fill();
  ctx.fillStyle = "#9db4cc";
  [40, 54, 68, 82, 96, 110].forEach((y, i) => ctx.fillRect(14, y, i % 3 === 2 ? 64 : 100, 5));
  return tex(cv);
}
function glowTex() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

export default function LabsStation({ sh }: { sh: Shared }) {
  const root = useRef<THREE.Group>(null!);
  const cubes = useRef<(THREE.Group | null)[]>([]);
  const edgeMats = useRef<(THREE.LineBasicMaterial | null)[]>([]);
  const coreMats = useRef<(THREE.SpriteMaterial | null)[]>([]);
  const badges = useRef<(THREE.SpriteMaterial | null)[]>([]);
  const beam = useRef<THREE.Mesh>(null!);
  const beamMat = useRef<THREE.MeshBasicMaterial>(null!);
  const doc = useRef<THREE.Mesh>(null!);
  const pile = useRef<(THREE.Mesh | null)[]>([]);

  const g = useMemo(() => glowTex(), []);
  const names = useMemo(() => LABS.map((l) => nameTex(l.n)), []);
  const chips = useMemo(() => LABS.map((l) => chipTex(l.f)), []);
  const dTex = useMemo(() => docTex(), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.7, 0.7, 0.7)), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const cyc = Math.floor(t / CYCLE);
    const ph = (t % CYCLE) / CYCLE;
    const act = cyc % LABS.length;
    const sm = THREE.MathUtils.smoothstep;
    const damp = THREE.MathUtils.damp;

    root.current.rotation.y = damp(root.current.rotation.y, Math.sin(t * 0.2) * 0.22 + sh.current.mx * 0.3, 3, dt);
    root.current.rotation.x = damp(root.current.rotation.x, 0.34 - sh.current.my * 0.12, 3, dt);

    LABS.forEach((L, i) => {
      const bob = Math.sin(t * 0.8 + i) * 0.05;
      cubes.current[i]!.position.y = bob;
      const isA = i === act;
      const found = isA ? sm(ph, 0.38, 0.45) * (1 - sm(ph, 0.9, 1.0)) : 0;
      const scan = isA && ph < 0.42 ? 1 : 0;
      const em = edgeMats.current[i]!;
      em.color.set(L.c).lerp(AMBER, found);
      em.opacity = 0.5 + (isA ? 0.4 : 0);
      coreMats.current[i]!.opacity = 0.22 + scan * 0.35 + found * 0.3;
      badges.current[i]!.opacity = found;
    });

    // scan beam rises through the active cube
    const a = LABS[act];
    const bp = ph / 0.42;
    beam.current.visible = bp < 1;
    if (bp < 1) {
      beam.current.position.set(a.x, -0.35 + 0.7 * bp + Math.sin(t * 0.8 + act) * 0.05, a.z);
      beamMat.current.opacity = 0.7 * Math.sin(Math.PI * bp);
      beamMat.current.color.set(a.c);
    }

    // the write-up flies from the cube to the pile
    const done = cyc % 11;
    const fly = ph > 0.7;
    doc.current.visible = fly;
    if (fly) {
      const u = (ph - 0.7) / 0.3;
      const e = u * u * (3 - 2 * u);
      const sy = STACK.y + done * 0.035 + 0.04;
      const y0 = 0.5; // top of the cube
      doc.current.position.set(
        a.x + (STACK.x - a.x) * e,
        y0 + (sy - y0) * e + Math.sin(Math.PI * e) * 0.8,
        a.z + (STACK.z - a.z) * e
      );
      doc.current.rotation.set(-e * (Math.PI / 2), 0, 0);
    }
    pile.current.forEach((m, i) => {
      if (m) m.visible = i < done;
    });
  });

  return (
    <group scale={0.82}>
      <group ref={root}>
        {/* platform */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
          <circleGeometry args={[2.35, 72]} />
          <meshBasicMaterial color="#06101a" transparent opacity={0.75} />
        </mesh>
        {[2.33].map((r, i) => (
          <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.595, 0]}>
            <ringGeometry args={[r - 0.012, r, 96]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.35 + i * 0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}

        {/* lab environments */}
        {LABS.map((L, i) => (
          <group key={L.n} ref={(el) => { cubes.current[i] = el; }} position={[L.x, 0, L.z]}>
            <mesh>
              <boxGeometry args={[0.7, 0.7, 0.7]} />
              <meshBasicMaterial color={L.c} transparent opacity={0.05} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            <lineSegments geometry={edges}>
              <lineBasicMaterial ref={(el) => { edgeMats.current[i] = el; }} color={L.c} transparent opacity={0.6} />
            </lineSegments>
            <sprite scale={[0.55, 0.55, 1]}>
              <spriteMaterial ref={(el) => { coreMats.current[i] = el; }} map={g} color={L.c} transparent opacity={0.25} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
            <sprite position={[0, 0.6, 0]} scale={[1.1, 0.22, 1]}>
              <spriteMaterial map={names[i]} transparent depthWrite={false} />
            </sprite>
            <sprite position={[0, 0.93, 0]} scale={[1.35, 0.23, 1]}>
              <spriteMaterial ref={(el) => { badges.current[i] = el; }} map={chips[i]} transparent opacity={0} depthWrite={false} />
            </sprite>
          </group>
        ))}

        {/* scan beam */}
        <mesh ref={beam} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.78, 0.78]} />
          <meshBasicMaterial ref={beamMat} color="#22d3ee" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>

        {/* the write-up in flight + the pile of finished write-ups */}
        <mesh ref={doc} visible={false}>
          <planeGeometry args={[0.36, 0.45]} />
          <meshBasicMaterial map={dTex} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        {Array.from({ length: 11 }, (_, i) => (
          <mesh key={i} ref={(el) => { pile.current[i] = el; }} position={[STACK.x, STACK.y + i * 0.035 + 0.0175, STACK.z]} rotation={[0, (i % 3) * 0.06 - 0.06, 0]} visible={false}>
            <boxGeometry args={[0.36, 0.03, 0.45]} />
            <meshBasicMaterial color={i % 2 ? "#cfe3f7" : "#e8f3ff"} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
