"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import * as THREE from "three";

type V3 = [number, number, number];
type Fade = RefObject<{ w: number }>;
type LineKey = "green" | "cyan" | "amber";
type Mats = {
  fill: THREE.MeshBasicMaterial;
  green: THREE.LineBasicMaterial;
  cyan: THREE.LineBasicMaterial;
  amber: THREE.LineBasicMaterial;
};
type SignLine = { text: string; size: number; y: number; color: string };

/* ---------- helpers ---------- */

function makeTexture(lines: SignLine[], h: number) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const l of lines) {
    ctx.font = `bold ${l.size}px monospace`;
    ctx.fillStyle = l.color;
    ctx.shadowColor = l.color;
    ctx.shadowBlur = 14;
    ctx.fillText(l.text, 512, l.y);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// one glowing wireframe block (box, cylinder/prism, or ball) with a faint fill
function Part({
  kind = "box",
  size,
  pos,
  rot,
  scl,
  line = "green",
  solid = true,
  mats,
}: {
  kind?: "box" | "cyl" | "ball";
  size: number[];
  pos?: V3;
  rot?: V3;
  scl?: V3;
  line?: LineKey;
  solid?: boolean;
  mats: Mats;
}) {
  const { geo, edges } = useMemo(() => {
    let g: THREE.BufferGeometry;
    if (kind === "cyl") {
      g = new THREE.CylinderGeometry(size[0], size[1], size[2], size[3] ?? 8);
    } else if (kind === "ball") {
      g = new THREE.IcosahedronGeometry(size[0], 1);
    } else {
      g = new THREE.BoxGeometry(size[0], size[1], size[2]);
    }
    return { geo: g, edges: new THREE.EdgesGeometry(g) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, size.join(",")]);

  return (
    <group position={pos} rotation={rot} scale={scl}>
      {solid && <mesh geometry={geo} material={mats.fill} />}
      <lineSegments geometry={edges} material={mats[line]} />
    </group>
  );
}

// glowing text on a flat plane (name boards)
function Sign({
  lines,
  size,
  pos,
  px = 256,
  fade,
}: {
  lines: SignLine[];
  size: [number, number];
  pos: V3;
  px?: number;
  fade: Fade;
}) {
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  const tex = useMemo(() => makeTexture(lines, px), [lines, px]);
  useFrame(() => {
    mat.current.opacity = fade.current.w;
  });
  return (
    <mesh position={pos}>
      <planeGeometry args={size} />
      <meshBasicMaterial ref={mat} map={tex} transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function Palm({ x, z, h, mats }: { x: number; z: number; h: number; mats: Mats }) {
  return (
    <>
      <Part kind="cyl" size={[0.06, 0.1, h, 6]} pos={[x, h / 2, z]} solid={false} mats={mats} />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <Part
            key={i}
            size={[0.95, 0.02, 0.16]}
            pos={[x + Math.cos(a) * 0.4, h - 0.1, z + Math.sin(a) * 0.4]}
            rot={[0, -a, -0.5]}
            solid={false}
            mats={mats}
          />
        );
      })}
    </>
  );
}

/* ---------- Rukhsana Foundation (3-storey house, wooden gate, palms) ---------- */

const RUKHSANA_SIGN: SignLine[] = [
  { text: "RUKHSANA FOUNDATION", size: 80, y: 64, color: "#00ff9c" },
];

function RukhsanaModel({ mats, fade }: { mats: Mats; fade: Fade }) {
  return (
    <>
      {/* ground floor, first floor, second floor */}
      <Part size={[5.0, 1.2, 3.0]} pos={[0, 0.6, 0]} mats={mats} />
      <Part size={[4.4, 1.15, 2.6]} pos={[-0.2, 1.775, -0.1]} mats={mats} />
      <Part size={[3.2, 1.05, 2.2]} pos={[0.4, 2.875, -0.3]} mats={mats} />

      {/* balcony + railing */}
      <Part size={[4.6, 0.1, 0.9]} pos={[-0.2, 2.35, 1.55]} mats={mats} />
      <Part size={[4.6, 0.35, 0.04]} pos={[-0.2, 2.58, 1.98]} line="cyan" solid={false} mats={mats} />

      {/* roof terrace + railing, tank room, water tank */}
      <Part size={[3.5, 0.1, 2.5]} pos={[0.4, 3.45, -0.3]} mats={mats} />
      <Part size={[3.5, 0.3, 2.5]} pos={[0.4, 3.65, -0.3]} line="cyan" solid={false} mats={mats} />
      <Part size={[0.7, 0.7, 0.7]} pos={[-0.9, 3.85, -1.0]} mats={mats} />
      <Part kind="cyl" size={[0.25, 0.25, 0.4, 10]} pos={[-0.9, 4.4, -1.0]} line="cyan" solid={false} mats={mats} />

      {/* terracotta roof strips */}
      <Part size={[3.2, 0.06, 0.5]} pos={[0.4, 3.52, 0.9]} line="amber" mats={mats} />
      <Part size={[1.5, 0.06, 0.5]} pos={[-1.6, 2.4, 0.3]} line="amber" mats={mats} />

      {/* windows and wooden door */}
      <Part size={[0.8, 0.75, 0.05]} pos={[-1.9, 1.8, 1.22]} line="cyan" mats={mats} />
      <Part size={[0.8, 0.85, 0.05]} pos={[-0.3, 1.78, 1.22]} line="amber" mats={mats} />
      <Part size={[0.9, 0.7, 0.05]} pos={[0.9, 1.8, 1.22]} line="cyan" mats={mats} />
      <Part size={[1.2, 0.7, 0.05]} pos={[0.4, 2.9, 0.82]} line="amber" mats={mats} />

      {/* wooden slatted gate with posts */}
      {Array.from({ length: 10 }, (_, i) => (
        <Part
          key={i}
          size={[0.05, 0.85, 0.05]}
          pos={[-1.2 + i * 0.267, 0.45, 2.0]}
          line="amber"
          solid={false}
          mats={mats}
        />
      ))}
      <Part size={[2.7, 0.05, 0.05]} pos={[0, 0.88, 2.0]} line="amber" solid={false} mats={mats} />
      <Part size={[2.7, 0.05, 0.05]} pos={[0, 0.06, 2.0]} line="amber" solid={false} mats={mats} />
      <Part size={[0.14, 1.2, 0.14]} pos={[-1.45, 0.6, 2.0]} line="amber" mats={mats} />
      <Part size={[0.14, 1.2, 0.14]} pos={[1.45, 0.6, 2.0]} line="amber" mats={mats} />

      {/* brick wall on the left, name board on the right */}
      <Part size={[0.5, 1.35, 1.0]} pos={[-2.8, 0.675, 2.0]} line="amber" mats={mats} />
      <Part size={[0.9, 0.7, 0.05]} pos={[2.3, 0.8, 2.3]} line="cyan" mats={mats} />

      {/* palms */}
      <Palm x={3.0} z={1.4} h={2.6} mats={mats} />
      <Palm x={3.5} z={2.8} h={2.2} mats={mats} />

      <Sign lines={RUKHSANA_SIGN} size={[2.8, 0.35]} pos={[0, 1.02, 1.53]} px={128} fade={fade} />
    </>
  );
}

/* ---------- Al Nafi International College (white building, blue tent, sign wall) ---------- */

const ALNAFI_SIGN: SignLine[] = [
  { text: "al-nafi", size: 100, y: 90, color: "#00c8ff" },
  { text: "INTERNATIONAL COLLEGE", size: 56, y: 205, color: "#00ff9c" },
];

function AlNafiModel({ mats, fade }: { mats: Mats; fade: Fade }) {
  return (
    <>
      {/* main white building, two storeys, flat roofs */}
      <Part size={[6.0, 1.5, 3.0]} pos={[0.4, 0.75, -0.5]} mats={mats} />
      <Part size={[4.0, 1.0, 2.6]} pos={[1.2, 2.0, -0.7]} mats={mats} />
      <Part size={[6.1, 0.08, 3.1]} pos={[0.4, 1.54, -0.5]} line="cyan" solid={false} mats={mats} />
      <Part size={[4.1, 0.08, 2.7]} pos={[1.2, 2.54, -0.7]} line="cyan" solid={false} mats={mats} />

      {/* windows */}
      <Part size={[0.8, 0.6, 0.05]} pos={[0.2, 2.0, 0.62]} line="cyan" mats={mats} />
      <Part size={[0.8, 0.6, 0.05]} pos={[1.6, 2.0, 0.62]} line="cyan" mats={mats} />
      <Part size={[0.7, 0.6, 0.05]} pos={[2.0, 0.95, 1.02]} line="cyan" mats={mats} />

      {/* blue tent / canopy on the left (triangular prism) */}
      <Part
        kind="cyl"
        size={[1.7, 1.7, 3.0, 3]}
        rot={[-Math.PI / 2, 0, 0]}
        scl={[1, 1, 0.5]}
        pos={[-2.3, 0.425, 0.2]}
        line="cyan"
        mats={mats}
      />

      {/* front sign wall and navy gate */}
      <Part size={[5.0, 1.3, 0.18]} pos={[0.2, 0.65, 2.0]} mats={mats} />
      <Part size={[1.5, 1.4, 0.1]} pos={[3.55, 0.7, 2.0]} line="cyan" mats={mats} />
      {Array.from({ length: 6 }, (_, i) => (
        <Part
          key={i}
          size={[0.04, 1.3, 0.04]}
          pos={[2.95 + i * 0.24, 0.7, 2.08]}
          line="cyan"
          solid={false}
          mats={mats}
        />
      ))}

      {/* yellow curb */}
      <Part size={[2.4, 0.12, 0.5]} pos={[3.4, 0.06, 2.6]} line="amber" mats={mats} />

      {/* potted plants */}
      {[0, 1, 2].map((i) => (
        <group key={i}>
          <Part kind="cyl" size={[0.14, 0.1, 0.22, 8]} pos={[-3.0 + i * 0.5, 0.11, 2.5]} line="amber" mats={mats} />
          <Part kind="ball" size={[0.22]} pos={[-3.0 + i * 0.5, 0.42, 2.5]} solid={false} mats={mats} />
        </group>
      ))}

      <Sign lines={ALNAFI_SIGN} size={[4.4, 1.1]} pos={[0.2, 0.65, 2.1]} fade={fade} />
    </>
  );
}

/* ---------- appears while its education card is on screen ---------- */

function Building({
  cardId,
  x,
  rotY,
  children,
}: {
  cardId: string;
  x: number; // fraction of screen width
  rotY: number;
  children: (mats: Mats, fade: Fade) => ReactNode;
}) {
  const group = useRef<THREE.Group>(null!);
  const scan = useRef<THREE.Mesh>(null!);
  const scanMat = useRef<THREE.MeshBasicMaterial>(null!);
  const fade = useRef({ w: 0 });

  const mats = useMemo<Mats>(
    () => ({
      fill: new THREE.MeshBasicMaterial({
        color: "#003322",
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      green: new THREE.LineBasicMaterial({ color: "#00ff9c", transparent: true, opacity: 0 }),
      cyan: new THREE.LineBasicMaterial({ color: "#00c8ff", transparent: true, opacity: 0 }),
      amber: new THREE.LineBasicMaterial({ color: "#ffb347", transparent: true, opacity: 0 }),
    }),
    []
  );

  useFrame((state, delta) => {
    // how close is this card to the middle of the screen?
    const el = document.getElementById(cardId);
    let target = 0;
    if (el) {
      const r = el.getBoundingClientRect();
      const d =
        Math.abs(r.top + r.height / 2 - window.innerHeight / 2) / (window.innerHeight * 0.3);
      target = THREE.MathUtils.smoothstep(1 - d, 0.3, 0.9);
    }
    fade.current.w = THREE.MathUtils.damp(fade.current.w, target, 3, delta);
    const w = fade.current.w;

    const g = group.current;
    g.visible = w > 0.01;
    if (!g.visible) return;

    const vp = state.viewport.getCurrentViewport(state.camera, [0, 0, -1]);
    const fit = Math.min(1, vp.width / 9); // shrink on narrow screens
    g.position.set(x * vp.width, -2.4, -1);
    // rises out of the ground
    g.scale.set(fit * (0.75 + 0.25 * w), fit * w, fit * (0.75 + 0.25 * w));
    g.rotation.y = rotY + Math.sin(state.clock.elapsedTime * 0.3) * 0.12 + state.pointer.x * 0.15;

    mats.fill.opacity = 0.25 * w;
    mats.green.opacity = 0.9 * w;
    mats.cyan.opacity = 0.9 * w;
    mats.amber.opacity = 0.85 * w;

    // hologram scan line sweeping up the building
    const phase = (state.clock.elapsedTime * 0.35) % 1;
    scan.current.position.y = phase * 4.6;
    scanMat.current.opacity = 0.18 * w * (1 - phase);
  });

  return (
    <group ref={group} position={[0, -2.4, -1]} visible={false}>
      {children(mats, fade)}
      <mesh ref={scan} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.3]}>
        <planeGeometry args={[7, 5]} />
        <meshBasicMaterial
          ref={scanMat}
          color="#00ff9c"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function Campus() {
  return (
    <>
      {/* first education card: Al Nafi */}
      <Building cardId="edu-0" x={-0.14} rotY={0.45}>
        {(mats, fade) => <AlNafiModel mats={mats} fade={fade} />}
      </Building>
      {/* second education card: Rukhsana Foundation */}
      <Building cardId="edu-1" x={0.14} rotY={-0.45}>
        {(mats, fade) => <RukhsanaModel mats={mats} fade={fade} />}
      </Building>
    </>
  );
}
