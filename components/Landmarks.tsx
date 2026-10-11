"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import * as THREE from "three";
import PhotoBust from "@/components/PhotoBust";
import { AlNafiModel, RukhsanaModel } from "@/components/Campus";
import type { Mats } from "@/components/Campus";
import { gateZ } from "@/data/world";

type Fade = RefObject<{ w: number }>;
type V3 = [number, number, number];

/* ---------- wrapper: shows its content while the camera is near its chapter ---------- */
function Landmark({
  index,
  x,
  y = 0,
  scale = 1,
  rotY = 0,
  children,
}: {
  index: number;
  x: number;
  y?: number;
  scale?: number;
  rotY?: number;
  children: (fade: Fade) => ReactNode;
}) {
  const group = useRef<THREE.Group>(null!);
  const fade = useRef({ w: 0 });
  const z = gateZ(index);

  useFrame((state, delta) => {
    const d = state.camera.position.z - z; // distance ahead of the camera
    const ahead = THREE.MathUtils.smoothstep(40 - d, 0, 14);
    const pass = THREE.MathUtils.smoothstep(d + 10, 0, 8);
    fade.current.w = THREE.MathUtils.damp(fade.current.w, ahead * pass, 5, delta);
    const w = fade.current.w;
    const g = group.current;
    g.visible = w > 0.01;
    g.scale.setScalar(scale * (0.85 + 0.15 * w));
  });

  return (
    <group ref={group} position={[x, y, z]} rotation={[0, rotY, 0]} visible={false}>
      {children(fade)}
    </group>
  );
}

/* ---------- small building blocks ---------- */
function useMats(color: string, fade: Fade) {
  const mats = useMemo(
    () => ({
      fill: new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(0.12),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      line: new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 }),
    }),
    [color]
  );
  useFrame(() => {
    const w = fade.current.w;
    mats.fill.opacity = 0.35 * w;
    mats.line.opacity = 0.95 * w;
  });
  return mats;
}

type LineMats = { fill: THREE.Material; line: THREE.Material };

function Block({
  pos,
  size,
  mats,
  solid = true,
}: {
  pos: V3;
  size: V3;
  mats: LineMats;
  solid?: boolean;
}) {
  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(size[0], size[1], size[2])),
    [size]
  );
  return (
    <group position={pos}>
      {solid && (
        <mesh material={mats.fill}>
          <boxGeometry args={size} />
        </mesh>
      )}
      <lineSegments geometry={edges} material={mats.line} />
    </group>
  );
}

function Led({
  pos,
  phase,
  color,
  fade,
}: {
  pos: V3;
  phase: number;
  color: string;
  fade: Fade;
}) {
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame((s) => {
    const on = Math.sin(s.clock.elapsedTime * 3 + phase) > 0.2 ? 1 : 0.15;
    mat.current.opacity = on * fade.current.w;
  });
  return (
    <mesh position={pos}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial ref={mat} color={color} transparent opacity={0} />
    </mesh>
  );
}

/* ---------- experience: a stack of server racks with blinking LEDs ---------- */
function Racks({ fade }: { fade: Fade }) {
  const mats = useMats("#ff4d9d", fade);
  const colors = ["#22d3ee", "#fbbf24", "#a78bfa"];
  return (
    <>
      {[0, 1].map((col) =>
        [0, 1, 2, 3, 4].map((i) => (
          <group key={col + "-" + i} position={[-1.2 + col * 2.4, 0.4 + i * 0.62, 0]}>
            <Block pos={[0, 0, 0]} size={[2, 0.5, 1.2]} mats={mats} />
            {[0, 1, 2].map((j) => (
              <Led
                key={j}
                pos={[-0.8 + j * 0.18, 0, 0.62]}
                phase={col * 2 + i * 1.7 + j * 0.9}
                color={colors[j]}
                fade={fade}
              />
            ))}
          </group>
        ))
      )}
    </>
  );
}

/* ---------- skills: a floating network of nodes ---------- */
const NODES: V3[] = [
  [0, 0, 0], [2.2, 1.4, 0.5], [-2, 1.8, -0.4], [1.2, 3.6, 0], [-1.6, -0.2, 1.4],
  [2.6, -0.8, -1.2], [0, 2.2, -1.6], [-2.8, 3.2, 0.6], [1, 5.2, 0.4],
];
const LINKS: [number, number][] = [
  [0, 1], [0, 2], [0, 4], [1, 3], [1, 5], [2, 3], [2, 7], [3, 8], [0, 6], [6, 3], [4, 5],
];
const NODE_SIZE: V3 = [0.45, 0.45, 0.45];

function Cluster({ fade }: { fade: Fade }) {
  const mats = useMats("#fbbf24", fade);
  const group = useRef<THREE.Group>(null!);
  const lines = useMemo(() => {
    const p: number[] = [];
    for (const [a, b] of LINKS) p.push(...NODES[a], ...NODES[b]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(p), 3));
    return g;
  }, []);

  useFrame((s) => {
    group.current.position.y = 2.5 + Math.sin(s.clock.elapsedTime * 0.7) * 0.25;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lines} material={mats.line} />
      {NODES.map((p, i) => (
        <Block key={i} pos={p} size={NODE_SIZE} mats={mats} />
      ))}
    </group>
  );
}

/* ---------- projects: floating terminal screens ---------- */
function makeScreenTexture(lines: string[]) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 320;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(6,10,26,0.92)";
  ctx.fillRect(0, 0, 512, 320);
  ctx.fillStyle = "rgba(34,211,238,0.9)";
  ctx.fillRect(0, 0, 512, 34);
  ctx.fillStyle = "#04050b";
  ctx.font = "bold 20px monospace";
  ctx.textBaseline = "middle";
  ctx.fillText("  terminal", 10, 17);
  ctx.font = "22px monospace";
  ctx.textBaseline = "top";
  lines.forEach((l, i) => {
    ctx.fillStyle = i === 0 ? "#22d3ee" : "#d6e4ff";
    ctx.fillText(l, 18, 58 + i * 40);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const SCREENS: { lines: string[]; pos: V3; rotY: number }[] = [
  {
    lines: ["$ nmap -sV target", "22/tcp   open  ssh", "80/tcp   open  http", "443/tcp  open  https"],
    pos: [-3.4, 3.6, 0],
    rotY: 0.35,
  },
  {
    lines: ["$ docker compose up", "[+] Running 4/4", "api     started", "wazuh   started"],
    pos: [0, 2.2, 1.2],
    rotY: 0,
  },
  {
    lines: ["$ python scan.py", "[*] 128 hosts checked", "[!] 3 findings", "[+] report saved"],
    pos: [3.4, 3.9, 0.2],
    rotY: -0.35,
  },
];

function Screen({
  lines,
  pos,
  rotY,
  fade,
  mats,
}: {
  lines: string[];
  pos: V3;
  rotY: number;
  fade: Fade;
  mats: LineMats;
}) {
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  const g = useRef<THREE.Group>(null!);
  const tex = useMemo(() => makeScreenTexture(lines), [lines]);

  useFrame((s) => {
    mat.current.opacity = 0.95 * fade.current.w;
    g.current.position.y = pos[1] + Math.sin(s.clock.elapsedTime * 0.8 + pos[0]) * 0.12;
  });

  return (
    <group ref={g} position={pos} rotation={[0, rotY, 0]}>
      <mesh>
        <planeGeometry args={[3.2, 2]} />
        <meshBasicMaterial ref={mat} map={tex} transparent opacity={0} depthWrite={false} />
      </mesh>
      <Block pos={[0, 0, -0.02]} size={[3.3, 2.1, 0.04]} mats={mats} solid={false} />
    </group>
  );
}

function Screens({ fade }: { fade: Fade }) {
  const mats = useMats("#22d3ee", fade);
  return (
    <>
      {SCREENS.map((s, i) => (
        <Screen key={i} lines={s.lines} pos={s.pos} rotY={s.rotY} fade={fade} mats={mats} />
      ))}
    </>
  );
}

/* ---------- contact: a transmitter sending out signal waves ---------- */
function Antenna({ fade }: { fade: Fade }) {
  const mats = useMats("#a78bfa", fade);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const ringMats = useMemo(
    () =>
      [0, 1, 2].map(
        () =>
          new THREE.MeshBasicMaterial({
            color: "#22d3ee",
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          })
      ),
    []
  );

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    ringMats.forEach((m, i) => {
      const p = (t * 0.35 + i / 3) % 1;
      const mesh = rings.current[i];
      if (mesh) mesh.scale.setScalar(1 + p * 5);
      m.opacity = (1 - p) * 0.7 * fade.current.w;
    });
  });

  return (
    <>
      <Block pos={[0, 0.3, 0]} size={[1.6, 0.6, 1.6]} mats={mats} />
      <Block pos={[0, 3, 0]} size={[0.35, 6, 0.35]} mats={mats} />
      <Block pos={[0, 6.2, 0]} size={[0.9, 0.5, 0.9]} mats={mats} />
      {ringMats.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            rings.current[i] = el;
          }}
          position={[0, 6.2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={m}
        >
          <ringGeometry args={[0.9, 0.96, 64]} />
        </mesh>
      ))}
    </>
  );
}

/* ---------- education: the two schools (models from Campus.tsx) ---------- */
function useCampusMats(fade: Fade): Mats {
  const mats = useMemo<Mats>(
    () => ({
      fill: new THREE.MeshBasicMaterial({
        color: "#07122b",
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      green: new THREE.LineBasicMaterial({ color: "#22d3ee", transparent: true, opacity: 0 }),
      cyan: new THREE.LineBasicMaterial({ color: "#a78bfa", transparent: true, opacity: 0 }),
      amber: new THREE.LineBasicMaterial({ color: "#fbbf24", transparent: true, opacity: 0 }),
    }),
    []
  );
  useFrame(() => {
    const w = fade.current.w;
    mats.fill.opacity = 0.3 * w;
    mats.green.opacity = 0.9 * w;
    mats.cyan.opacity = 0.9 * w;
    mats.amber.opacity = 0.85 * w;
  });
  return mats;
}

function AlNafi({ fade }: { fade: Fade }) {
  const mats = useCampusMats(fade);
  return <AlNafiModel mats={mats} fade={fade} />;
}

function Rukhsana({ fade }: { fade: Fade }) {
  const mats = useCampusMats(fade);
  return <RukhsanaModel mats={mats} fade={fade} />;
}

/* ---------- all landmarks, one or two per chapter ---------- */
export default function Landmarks() {
  return (
    <>
      <Landmark index={1} x={-8.5} y={2.6} scale={1.5}>
        {(f) => <PhotoBust fade={f} />}
      </Landmark>
      <Landmark index={2} x={8.5} scale={1.1}>
        {(f) => <Racks fade={f} />}
      </Landmark>
      <Landmark index={3} x={-9} scale={0.95} rotY={0.5}>
        {(f) => <AlNafi fade={f} />}
      </Landmark>
      <Landmark index={3} x={9} scale={0.95} rotY={-0.5}>
        {(f) => <Rukhsana fade={f} />}
      </Landmark>
      <Landmark index={4} x={-8.5} scale={1.1}>
        {(f) => <Cluster fade={f} />}
      </Landmark>
      <Landmark index={5} x={8.5} y={0.5}>
        {(f) => <Screens fade={f} />}
      </Landmark>
      <Landmark index={6} x={-8.5} scale={1.1}>
        {(f) => <Antenna fade={f} />}
      </Landmark>
    </>
  );
}
