"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import * as THREE from "three";
import PhotoBust from "./PhotoBust";

type V3 = [number, number, number];
type Fade = RefObject<{ w: number }>;
type Mats = { fill: THREE.MeshBasicMaterial; line: THREE.LineBasicMaterial };

const TAU = Math.PI * 2;

/* ---------- ek glowing wireframe block ---------- */
function Part({
  kind = "box",
  size,
  pos,
  rot,
  solid = true,
  mats,
}: {
  kind?: "box" | "cyl" | "ball" | "torus";
  size: number[];
  pos?: V3;
  rot?: V3;
  solid?: boolean;
  mats: Mats;
}) {
  const { geo, edges } = useMemo(() => {
    let g: THREE.BufferGeometry;
    if (kind === "cyl") {
      g = new THREE.CylinderGeometry(size[0], size[1], size[2], size[3] ?? 10);
    } else if (kind === "ball") {
      g = new THREE.IcosahedronGeometry(size[0], size[1] ?? 1);
    } else if (kind === "torus") {
      g = new THREE.TorusGeometry(size[0], size[1], size[2] ?? 8, size[3] ?? 32, size[4] ?? TAU);
    } else {
      g = new THREE.BoxGeometry(size[0], size[1], size[2]);
    }
    return { geo: g, edges: new THREE.EdgesGeometry(g) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, size.join(",")]);

  return (
    <group position={pos} rotation={rot}>
      {solid && <mesh geometry={geo} material={mats.fill} />}
      <lineSegments geometry={edges} material={mats.line} />
    </group>
  );
}

/* ---------- ABOUT: padlock jiska shackle khulta band hota hai ---------- */
function Padlock({ mats }: { mats: Mats }) {
  const root = useRef<THREE.Group>(null!);
  const shackle = useRef<THREE.Group>(null!);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    root.current.rotation.y = Math.sin(t * 0.5) * 0.6;
    root.current.position.y = Math.sin(t * 0.8) * 0.1;
    const open = 0.5 + 0.5 * Math.sin(t * 0.9);
    shackle.current.rotation.y = open * 1.3;
    shackle.current.position.y = 0.25 + open * 0.18;
  });

  return (
    <group ref={root}>
      <Part size={[1.4, 1.1, 0.7]} pos={[0, -0.3, 0]} mats={mats} />
      <group ref={shackle} position={[0.45, 0.25, 0]}>
        <Part kind="torus" size={[0.45, 0.07, 8, 24, Math.PI]} pos={[-0.45, 0, 0]} mats={mats} />
      </group>
      <Part kind="cyl" size={[0.1, 0.1, 0.06, 12]} rot={[Math.PI / 2, 0, 0]} pos={[0, -0.2, 0.38]} mats={mats} />
      <Part size={[0.07, 0.3, 0.06]} pos={[0, -0.45, 0.38]} mats={mats} />
    </group>
  );
}

/* ---------- SKILLS: network graph jo ghoomta hai ---------- */
function Network({ mats }: { mats: Mats }) {
  const root = useRef<THREE.Group>(null!);
  const ringA = useRef<THREE.Group>(null!);
  const ringB = useRef<THREE.Group>(null!);

  const { nodes, lines } = useMemo(() => {
    const n = 9;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const a = i * 2.399963;
      pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).multiplyScalar(1.5));
    }
    const seg: THREE.Vector3[] = [];
    pts.forEach((p, i) => {
      seg.push(new THREE.Vector3(0, 0, 0), p);
      seg.push(p, pts[(i + 1) % n]);
    });
    return { nodes: pts, lines: new THREE.BufferGeometry().setFromPoints(seg) };
  }, []);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    root.current.rotation.y = t * 0.35;
    root.current.rotation.x = Math.sin(t * 0.4) * 0.3;
    ringA.current.rotation.x = t * 0.5;
    ringB.current.rotation.z = t * 0.4;
  });

  return (
    <group ref={root}>
      <lineSegments geometry={lines} material={mats.line} />
      <Part kind="ball" size={[0.38, 1]} mats={mats} />
      {nodes.map((p, i) => (
        <Part key={i} kind="ball" size={[0.12, 1]} pos={[p.x, p.y, p.z]} mats={mats} />
      ))}
      <group ref={ringA}>
        <Part kind="torus" size={[1.9, 0.012, 4, 64]} solid={false} mats={mats} />
      </group>
      <group ref={ringB} rotation={[0, Math.PI / 2, 0]}>
        <Part kind="torus" size={[1.9, 0.012, 4, 64]} solid={false} mats={mats} />
      </group>
    </group>
  );
}

/* ---------- PROJECTS: server rack jiski LEDs blink karti hain ---------- */
function Led({ pos, phase, color, fade }: { pos: V3; phase: number; color: string; fade: Fade }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame((s) => {
    const on = Math.sin(s.clock.elapsedTime * 3 + phase) > 0.2 ? 1 : 0.15;
    mat.current.opacity = on * fade.current.w;
  });
  return (
    <mesh position={pos}>
      <sphereGeometry args={[0.045, 8, 8]} />
      <meshBasicMaterial ref={mat} color={color} transparent opacity={0} />
    </mesh>
  );
}

function ServerRack({ mats, fade }: { mats: Mats; fade: Fade }) {
  const root = useRef<THREE.Group>(null!);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    root.current.rotation.y = Math.sin(t * 0.5) * 0.6;
    root.current.position.y = Math.sin(t * 0.9) * 0.08;
  });
  const colors = ["#00ff9c", "#ffb347", "#00c8ff"];

  return (
    <group ref={root}>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[0, -0.75 + i * 0.5, 0]}>
          <Part size={[1.9, 0.4, 1.0]} mats={mats} />
          <Part size={[0.9, 0.02, 0.02]} pos={[0.25, 0, 0.51]} solid={false} mats={mats} />
          {[0, 1, 2].map((j) => (
            <Led
              key={j}
              pos={[-0.78 + j * 0.14, 0, 0.52]}
              phase={i * 1.7 + j * 0.9}
              color={colors[j]}
              fade={fade}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

/* ---------- CONTACT: radar jisme signal rings phailti hain ---------- */
function Radar({ mats, fade, color }: { mats: Mats; fade: Fade; color: string }) {
  const sweep = useRef<THREE.Group>(null!);
  const rings = useRef<(THREE.LineLoop | null)[]>([]);

  const circle = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * TAU;
      pts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const ringMats = useMemo(
    () => [0, 1, 2].map(() => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 })),
    [color]
  );

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    ringMats.forEach((m, i) => {
      const p = (t * 0.4 + i / 3) % 1;
      const ring = rings.current[i];
      if (ring) ring.scale.setScalar(0.2 + p * 1.7);
      m.opacity = (1 - p) * 0.9 * fade.current.w;
    });
    sweep.current.rotation.z = -t * 1.2;
  });

  return (
    <group rotation={[-0.6, 0, 0]}>
      <lineLoop geometry={circle} material={mats.line} scale={1.9} />
      {ringMats.map((m, i) => (
        <lineLoop
          key={i}
          ref={(el) => {
            rings.current[i] = el;
          }}
          geometry={circle}
          material={m}
        />
      ))}
      <Part kind="ball" size={[0.12, 1]} mats={mats} />
      <group ref={sweep}>
        <Part size={[1.8, 0.02, 0.02]} pos={[0.9, 0, 0]} solid={false} mats={mats} />
      </group>
    </group>
  );
}

/* ---------- jab section screen par ho tab object dikhta hai ---------- */
function Stage({
  id,
  x,
  color,
  children,
}: {
  id: string;
  x: number; // screen width ka hissa (-0.3 = left, 0.3 = right)
  color: string;
  children: (mats: Mats, fade: Fade) => ReactNode;
}) {
  const group = useRef<THREE.Group>(null!);
  const fade = useRef({ w: 0 });

  const mats = useMemo<Mats>(
    () => ({
      fill: new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(0.15),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      line: new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 }),
    }),
    [color]
  );

  useFrame((state, delta) => {
    const el = document.getElementById(id);
    let target = 0;
    if (el) {
      const r = el.getBoundingClientRect();
      const d =
        Math.abs(r.top + r.height / 2 - window.innerHeight / 2) /
        (r.height / 2 + window.innerHeight * 0.25);
      target = THREE.MathUtils.smoothstep(1 - d, 0.1, 0.5);
    }
    fade.current.w = THREE.MathUtils.damp(fade.current.w, target, 3, delta);
    const w = fade.current.w;

    const g = group.current;
    g.visible = w > 0.01;
    if (!g.visible) return;

    const vp = state.viewport.getCurrentViewport(state.camera, [0, 0, -0.5]);
    const fit = Math.min(1, vp.width / 10); // chhoti screen par chhota
    g.position.set(x * vp.width, 0, -0.5);
    g.scale.setScalar(fit * (0.4 + 0.6 * w));
    g.rotation.y = (1 - w) * 1.5; // aate waqt ghoom kar aata hai
    mats.fill.opacity = 0.2 * w;
    mats.line.opacity = 0.85 * w;
  });

  return (
    <group ref={group} visible={false}>
      {children(mats, fade)}
    </group>
  );
}

export default function SectionObjects() {
  return (
    <>
      <Stage id="about" x={0.17} color="#00ff9c">
        {(m, f) => <PhotoBust fade={f} />}
      </Stage>
      <Stage id="skills" x={0.3} color="#a855f7">
        {(m) => <Network mats={m} />}
      </Stage>
      <Stage id="projects" x={-0.3} color="#00ff9c">
        {(m, f) => <ServerRack mats={m} fade={f} />}
      </Stage>
      <Stage id="contact" x={0.3} color="#ffb347">
        {(m, f) => <Radar mats={m} fade={f} color="#ffb347" />}
      </Stage>
    </>
  );
}
