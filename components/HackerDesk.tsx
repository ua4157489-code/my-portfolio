"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type V3 = [number, number, number];
type Line = { t: string; c: string };
type Step = { kind: "cmd" | "out"; text: string; color?: string };

// decorative lab session on the documentation range 192.0.2.x, no real target
const SCRIPT: Step[] = [
  { kind: "cmd", text: "nmap -sV -p 22,80,443 192.0.2.10" },
  { kind: "out", text: "PORT     STATE  SERVICE  VERSION", color: "#9aa7b8" },
  { kind: "out", text: "22/tcp   open   ssh      OpenSSH 8.9", color: "#34d399" },
  { kind: "out", text: "80/tcp   open   http     nginx 1.24", color: "#34d399" },
  { kind: "out", text: "443/tcp  open   https    nginx 1.24", color: "#34d399" },
  { kind: "cmd", text: "whatweb http://192.0.2.10" },
  { kind: "out", text: "[200 OK] nginx, HTML5, Country[RESERVED]", color: "#c9d1d9" },
  { kind: "cmd", text: "nikto -h 192.0.2.10 -maxtime 10" },
  { kind: "out", text: "+ Server: nginx/1.24", color: "#c9d1d9" },
  { kind: "out", text: "+ /admin/: directory indexing found", color: "#ffb347" },
  { kind: "out", text: "+ 1 finding, report saved", color: "#ffb347" },
  { kind: "cmd", text: "echo 'authorized lab only'" },
  { kind: "out", text: "authorized lab only", color: "#c9d1d9" },
];

const ri = (n: number) => Math.floor(Math.random() * n);
const UP = new THREE.Vector3(0, 1, 0);
const LH = 36;
const MAX = 13;
const HEX = "0123456789abcdef";

/* ---------------- canvases ---------------- */
function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { ctx: c.getContext("2d")!, tex };
}

function drawTerminal(ctx: CanvasRenderingContext2D, lines: Line[], typing: string, blink: boolean) {
  const W = 1024;
  const H = 640;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0a1020");
  g.addColorStop(1, "#05070d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#111a2e";
  ctx.fillRect(0, 0, W, 46);
  ["#ff5f56", "#ffbd2e", "#27c93f"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(26 + i * 26, 23, 7, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.font = "bold 20px ui-monospace, monospace";
  ctx.fillStyle = "#8da2b8";
  ctx.fillText("kali@kali: ~/labs   (simulated session)", 110, 30);
  ctx.font = "28px ui-monospace, monospace";
  lines.forEach((l, i) => {
    ctx.fillStyle = l.c;
    ctx.fillText(l.t, 20, 88 + i * LH);
  });
  ctx.fillStyle = "#e6edf3";
  ctx.fillText("└─$ " + typing + (blink ? "█" : " "), 20, 88 + lines.length * LH);
  ctx.fillStyle = "rgba(255,255,255,0.035)";
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
}

function hexRow() {
  let s = "";
  for (let i = 0; i < 8; i++) s += HEX[ri(16)] + HEX[ri(16)] + " ";
  return s;
}

function drawHex(ctx: CanvasRenderingContext2D, rows: string[], base: number) {
  ctx.fillStyle = "#04070c";
  ctx.fillRect(0, 0, 512, 320);
  ctx.fillStyle = "#0e1a2c";
  ctx.fillRect(0, 0, 512, 30);
  ctx.font = "bold 15px ui-monospace, monospace";
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("hexdump -C capture.bin  (simulated)", 12, 20);
  ctx.font = "14px ui-monospace, monospace";
  rows.forEach((r, i) => {
    const y = 52 + i * 20;
    ctx.fillStyle = "#3b5a78";
    ctx.fillText((base + i * 8).toString(16).padStart(8, "0"), 12, y);
    ctx.fillStyle = i % 5 === 3 ? "#ffb347" : "#34d399";
    ctx.fillText(r, 96, y);
  });
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let y = 0; y < 320; y += 4) ctx.fillRect(0, y, 512, 1);
}

const NODES = [
  { x: 60, y: 160, c: "#ff2d55", n: "kali" },
  { x: 190, y: 80, c: "#22d3ee", n: "192.0.2.5" },
  { x: 190, y: 240, c: "#22d3ee", n: "192.0.2.7" },
  { x: 330, y: 160, c: "#a78bfa", n: "192.0.2.10" },
  { x: 450, y: 90, c: "#34d399", n: "db" },
  { x: 450, y: 235, c: "#ffb347", n: "dc01" },
];
const EDGES: [number, number][] = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [1, 2]];

function drawGraph(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = "#04070c";
  ctx.fillRect(0, 0, 512, 320);
  ctx.fillStyle = "#0e1a2c";
  ctx.fillRect(0, 0, 512, 30);
  ctx.font = "bold 15px ui-monospace, monospace";
  ctx.fillStyle = "#a78bfa";
  ctx.fillText("attack-path graph  (simulated)", 12, 20);
  ctx.lineWidth = 2;
  EDGES.forEach(([a, b], i) => {
    const A = NODES[a];
    const B = NODES[b];
    ctx.strokeStyle = "#1e3a4a";
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
    const f = (t * 0.45 + i * 0.27) % 1;
    ctx.fillStyle = i % 3 === 0 ? "#ff2d55" : "#22d3ee";
    ctx.beginPath();
    ctx.arc(A.x + (B.x - A.x) * f, A.y + (B.y - A.y) * f, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.font = "13px ui-monospace, monospace";
  NODES.forEach((n, i) => {
    const pulse = 11 + Math.sin(t * 3 + i) * 2;
    ctx.shadowColor = n.c;
    ctx.shadowBlur = 14;
    ctx.fillStyle = n.c;
    ctx.beginPath();
    ctx.arc(n.x, n.y, pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(n.n, n.x - 22, n.y + 30);
  });
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let y = 0; y < 320; y += 4) ctx.fillRect(0, y, 512, 1);
}

function keyTexture() {
  const { ctx, tex } = makeCanvas(512, 200);
  ctx.fillStyle = "#070a12";
  ctx.fillRect(0, 0, 512, 200);
  [14, 14, 13, 12, 8].forEach((n, r) => {
    const w = 512 / (n + 0.4);
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = "#141c2e";
      ctx.fillRect(k * w + 3, r * 39 + 5, w - 6, 31);
      ctx.fillStyle = "rgba(56,189,248,0.45)";
      ctx.fillRect(k * w + 3, r * 39 + 33, w - 6, 3);
    }
  });
  tex.needsUpdate = true;
  return tex;
}

/* ---------------- small parts ---------------- */
// static limb between two points (cylinder, so it never stretches sideways)
function Bone({ a, b, r, color }: { a: V3; b: V3; r: number; color: string }) {
  const k = a.join() + "|" + b.join();
  const d = useMemo(() => {
    const A = new THREE.Vector3(...a);
    const v = new THREE.Vector3(...b).sub(A);
    const len = v.length();
    return { A, len, q: new THREE.Quaternion().setFromUnitVectors(UP, v.normalize()) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);
  return (
    <>
      <group position={d.A} quaternion={d.q}>
        <mesh position={[0, d.len / 2, 0]}>
          <cylinderGeometry args={[r, r * 0.88, d.len, 12]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      </group>
      <mesh position={b}>
        <sphereGeometry args={[r * 0.95, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </>
  );
}

function Monitor({ pos, rotY, w, h, tex }: { pos: V3; rotY: number; w: number; h: number; tex: THREE.Texture }) {
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[0.28, 0.02, 0.2]} />
        <meshStandardMaterial color="#0b0e15" metalness={0.9} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.16, -0.02]}>
        <boxGeometry args={[0.05, 0.3, 0.03]} />
        <meshStandardMaterial color="#0b0e15" metalness={0.9} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[w + 0.04, h + 0.04, 0.035]} />
        <meshStandardMaterial color="#080a10" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.5, 0.0185]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

// arm: shoulder -> elbow -> hand, the hand taps on the keyboard
function Arm({ side, phase }: { side: 1 | -1; phase: number }) {
  const up = useRef<THREE.Group>(null!);
  const fore = useRef<THREE.Group>(null!);
  const hand = useRef<THREE.Mesh>(null!);
  const m = useMemo(
    () => ({
      s: new THREE.Vector3(side * 0.22, 1.06, -0.03),
      e: new THREE.Vector3(side * 0.26, 0.86, -0.25),
      h: new THREE.Vector3(),
      d: new THREE.Vector3(),
    }),
    [side]
  );
  const aim = (g: THREE.Group, from: THREE.Vector3, to: THREE.Vector3) => {
    m.d.subVectors(to, from);
    const len = m.d.length();
    g.position.copy(from);
    g.quaternion.setFromUnitVectors(UP, m.d.normalize());
    g.scale.set(1, len, 1);
  };
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const tap = Math.max(0, Math.sin(t * (13 + phase * 3) + phase * 5));
    m.h.set(side * (0.12 + 0.02 * Math.sin(t * 1.3 + phase)), 0.8 + tap * 0.022, -0.57 + Math.sin(t * 0.9 + phase) * 0.02);
    aim(up.current, m.s, m.e);
    aim(fore.current, m.e, m.h);
    hand.current.position.copy(m.h);
  });
  const mat = <meshStandardMaterial color="#141a2b" roughness={0.9} />;
  return (
    <>
      <group ref={up}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.05, 0.045, 1, 12]} />
          {mat}
        </mesh>
      </group>
      <mesh position={m.e}>
        <sphereGeometry args={[0.048, 12, 12]} />
        {mat}
      </mesh>
      <group ref={fore}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.045, 0.036, 1, 12]} />
          {mat}
        </mesh>
      </group>
      <mesh ref={hand}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#7a5a46" roughness={0.8} />
      </mesh>
    </>
  );
}

/* ---------------- the whole setup ---------------- */
export default function HackerDesk({
  x = -2.3,
  z = 0.9,
  floorY = -1.94,
  scale = 0.85,
  rotY = 0.8,
}: {
  x?: number;
  z?: number;
  floorY?: number;
  scale?: number;
  rotY?: number;
}) {
  const chair = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const torso = useRef<THREE.Group>(null!);
  const fans = useRef<(THREE.Group | null)[]>([]);
  const pulses = useRef<(THREE.Mesh | null)[]>([]);
  const screenLight = useRef<THREE.PointLight>(null!);
  const rgbLight = useRef<THREE.PointLight>(null!);
  const sim = useRef({ i: 0, ch: 0, wait: 1.2, lines: [] as Line[], typing: "", blinkT: 0, blink: true, auxT: 0, base: 0x7ffe0000, rows: Array.from({ length: 13 }, hexRow) });

  const term = useMemo(() => makeCanvas(1024, 640), []);
  const hexS = useMemo(() => makeCanvas(512, 320), []);
  const graphS = useMemo(() => makeCanvas(512, 320), []);
  const keys = useMemo(keyTexture, []);
  const rgb = useMemo(() => new THREE.MeshBasicMaterial({ color: "#22d3ee", toneMapped: false }), []);

  // thin cable: tower front -> floor -> rack port (rack space)
  const cable = useMemo(() => {
    const M = new THREE.Matrix4().compose(
      new THREE.Vector3(x, floorY, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotY, 0)),
      new THREE.Vector3(scale, scale, scale)
    );
    const p = (a: V3) => new THREE.Vector3(...a).applyMatrix4(M);
    const curve = new THREE.CatmullRomCurve3([
      p([-1.6, 0.12, -0.55]),
      p([-1.35, 0.03, -0.1]),
      p([-0.7, 0.03, 0.45]),
      new THREE.Vector3(-0.75, floorY + 0.05, 1.0),
      new THREE.Vector3(-0.5, floorY + 0.3, 0.8),
      new THREE.Vector3(-0.4, floorY + 0.64, 0.48),
    ]);
    return { curve, geo: new THREE.TubeGeometry(curve, 80, 0.012, 8, false) };
  }, [x, z, floorY, scale, rotY]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const s = sim.current;

    // terminal typing
    s.wait -= delta;
    let dirty = false;
    if (s.wait <= 0) {
      const st = SCRIPT[s.i];
      if (!st) {
        s.i = 0; s.ch = 0; s.lines = []; s.typing = ""; s.wait = 2.5;
      } else if (st.kind === "cmd") {
        if (s.ch === 0) s.lines.push({ t: "┌──(kali㉿kali)-[~/labs]", c: "#5fafff" });
        s.ch++;
        s.typing = st.text.slice(0, s.ch);
        if (s.ch >= st.text.length) {
          s.lines.push({ t: "└─$ " + st.text, c: "#e6edf3" });
          s.typing = ""; s.ch = 0; s.i++; s.wait = 0.5;
        } else s.wait = 0.035 + Math.random() * 0.05;
      } else {
        s.lines.push({ t: st.text, c: st.color ?? "#c9d1d9" });
        s.i++; s.wait = 0.14;
      }
      while (s.lines.length > MAX) s.lines.shift();
      dirty = true;
    }
    s.blinkT += delta;
    if (s.blinkT > 0.5) { s.blinkT = 0; s.blink = !s.blink; dirty = true; }
    if (dirty) {
      drawTerminal(term.ctx, s.lines, s.typing, s.blink);
      term.tex.needsUpdate = true;
    }

    // side screens (about 8 fps)
    s.auxT += delta;
    if (s.auxT > 0.12) {
      s.auxT = 0;
      s.rows.push(hexRow());
      s.rows.shift();
      s.base += 8;
      drawHex(hexS.ctx, s.rows, s.base);
      hexS.tex.needsUpdate = true;
      drawGraph(graphS.ctx, t);
      graphS.tex.needsUpdate = true;
    }

    // RGB cycle
    rgb.color.setHSL((t * 0.15) % 1, 1, 0.55);
    rgbLight.current.color.copy(rgb.color);
    screenLight.current.intensity = 5 + Math.sin(t * 7) * 0.4;

    // fans
    fans.current.forEach((f, i) => { if (f) f.rotation.z += delta * (14 + i * 2); });

    // hacker motion
    chair.current.rotation.y = Math.sin(t * 0.4) * 0.07;
    head.current.rotation.y = Math.sin(t * 0.5) * 0.35;
    head.current.rotation.x = -0.12 + Math.sin(t * 0.8) * 0.03;
    torso.current.scale.set(1, 1 + Math.sin(t * 1.6) * 0.008, 1);

    pulses.current.forEach((m, k) => {
      if (m) cable.curve.getPointAt((t * 0.2 + k / 4) % 1, m.position);
    });
  });

  const dark = <meshStandardMaterial color="#0b0e15" metalness={0.9} roughness={0.35} />;

  return (
    <>
      <group position={[x, floorY, z]} rotation={[0, rotY, 0]} scale={scale}>
        {/* ---------- desk ---------- */}
        <mesh position={[0, 0.725, -0.8]}>
          <boxGeometry args={[2.4, 0.05, 0.9]} />
          <meshStandardMaterial color="#10151f" metalness={0.5} roughness={0.5} />
        </mesh>
        {[-1.15, 1.15].map((lx) => (
          <mesh key={lx} position={[lx, 0.36, -0.8]}>
            <boxGeometry args={[0.04, 0.72, 0.8]} />
            {dark}
          </mesh>
        ))}
        <mesh position={[0, 0.7, -0.352]}>
          <boxGeometry args={[2.4, 0.012, 0.012]} />
          <meshBasicMaterial color="#22d3ee" toneMapped={false} />
        </mesh>

        {/* ---------- monitors ---------- */}
        <Monitor pos={[0, 0.75, -1.05]} rotY={0} w={0.88} h={0.5} tex={term.tex} />
        <Monitor pos={[-0.85, 0.75, -0.95]} rotY={0.5} w={0.6} h={0.38} tex={hexS.tex} />
        <Monitor pos={[0.85, 0.75, -0.95]} rotY={-0.5} w={0.6} h={0.38} tex={graphS.tex} />

        {/* keyboard, mouse, mug */}
        <mesh position={[-0.05, 0.768, -0.6]}>
          <boxGeometry args={[0.48, 0.02, 0.16]} />
          <meshStandardMaterial color="#0c101a" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[-0.05, 0.7795, -0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.46, 0.145]} />
          <meshBasicMaterial map={keys} toneMapped={false} />
        </mesh>
        <mesh position={[-0.05, 0.759, -0.6]} material={rgb}>
          <boxGeometry args={[0.5, 0.004, 0.18]} />
        </mesh>
        <mesh position={[0.32, 0.77, -0.58]}>
          <boxGeometry args={[0.06, 0.025, 0.1]} />
          {dark}
        </mesh>
        <mesh position={[0.95, 0.795, -0.55]}>
          <cylinderGeometry args={[0.04, 0.036, 0.07, 16]} />
          <meshStandardMaterial color="#e5e7eb" roughness={0.5} />
        </mesh>

        {/* ---------- CPU tower ---------- */}
        <group position={[-1.6, 0, -0.85]}>
          <mesh position={[0.12, 0.27, 0]}><boxGeometry args={[0.01, 0.5, 0.48]} />{dark}</mesh>
          <mesh position={[0, 0.52, 0]}><boxGeometry args={[0.24, 0.01, 0.48]} />{dark}</mesh>
          <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.24, 0.01, 0.48]} />{dark}</mesh>
          <mesh position={[0, 0.27, 0.235]}><boxGeometry args={[0.24, 0.5, 0.01]} />{dark}</mesh>
          <mesh position={[0, 0.27, -0.235]}><boxGeometry args={[0.24, 0.5, 0.01]} />{dark}</mesh>
          <mesh position={[-0.121, 0.27, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.46, 0.5]} />
            <meshPhysicalMaterial color="#9fdcff" transparent opacity={0.12} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {/* motherboard, GPU, cooler, RAM */}
          <mesh position={[0.105, 0.27, -0.02]}><boxGeometry args={[0.006, 0.4, 0.36]} /><meshStandardMaterial color="#0a1511" roughness={0.6} /></mesh>
          <mesh position={[0.07, 0.2, 0]}><boxGeometry args={[0.055, 0.07, 0.32]} /><meshStandardMaterial color="#111723" metalness={0.7} roughness={0.4} /></mesh>
          <mesh position={[0.04, 0.2, 0]} material={rgb}><boxGeometry args={[0.003, 0.012, 0.3]} /></mesh>
          <mesh position={[0.06, 0.37, -0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.07, 24]} />
            <meshStandardMaterial color="#1a2030" metalness={0.8} roughness={0.35} />
          </mesh>
          <mesh position={[0.024, 0.37, -0.08]} rotation={[0, Math.PI / 2, 0]} material={rgb}>
            <torusGeometry args={[0.04, 0.004, 8, 32]} />
          </mesh>
          {[-0.17, -0.19].map((rz) => (
            <group key={rz}>
              <mesh position={[0.098, 0.4, rz]}><boxGeometry args={[0.008, 0.12, 0.012]} /><meshStandardMaterial color="#0b0f16" /></mesh>
              <mesh position={[0.093, 0.4, rz]} material={rgb}><boxGeometry args={[0.002, 0.12, 0.004]} /></mesh>
            </group>
          ))}
          {/* front fans (RGB, spinning) */}
          {[0.1, 0.27, 0.44].map((fy, i) => (
            <group key={fy} position={[0, fy, 0.245]}>
              <mesh material={rgb}><torusGeometry args={[0.058, 0.004, 8, 32]} /></mesh>
              <group ref={(el) => { fans.current[i] = el; }}>
                {Array.from({ length: 7 }, (_, b) => (
                  <group key={b} rotation-z={(b / 7) * Math.PI * 2}>
                    <mesh position={[0.03, 0, 0]} rotation-x={0.5}>
                      <boxGeometry args={[0.04, 0.018, 0.003]} />
                      <meshStandardMaterial color="#1a2234" metalness={0.5} roughness={0.5} />
                    </mesh>
                  </group>
                ))}
                <mesh rotation-x={Math.PI / 2}>
                  <cylinderGeometry args={[0.013, 0.013, 0.008, 12]} />
                  <meshStandardMaterial color="#0d1119" metalness={0.9} roughness={0.3} />
                </mesh>
              </group>
            </group>
          ))}
          <mesh position={[0.07, 0.527, 0.17]}><cylinderGeometry args={[0.012, 0.012, 0.006, 16]} /><meshBasicMaterial color="#34d399" toneMapped={false} /></mesh>
          <pointLight ref={rgbLight} position={[-0.1, 0.3, 0]} intensity={3} distance={2} color="#22d3ee" />
        </group>

        {/* ---------- chair + hacker (swivels) ---------- */}
        <group ref={chair}>
          <mesh position={[0, 0.46, 0.04]}><boxGeometry args={[0.52, 0.07, 0.5]} />{dark}</mesh>
          <mesh position={[0, 0.8, 0.3]} rotation={[0.1, 0, 0]}><boxGeometry args={[0.5, 0.62, 0.06]} />{dark}</mesh>
          <mesh position={[0, 0.25, 0.04]}><cylinderGeometry args={[0.03, 0.03, 0.4, 12]} />{dark}</mesh>
          {Array.from({ length: 5 }, (_, i) => {
            const a = (i / 5) * Math.PI * 2;
            return (
              <group key={i} position={[0, 0.06, 0.04]} rotation={[0, a, 0]}>
                <mesh position={[0, 0, 0.16]}><boxGeometry args={[0.035, 0.03, 0.32]} />{dark}</mesh>
                <mesh position={[0, -0.03, 0.31]}><sphereGeometry args={[0.03, 10, 10]} /><meshStandardMaterial color="#05070a" /></mesh>
              </group>
            );
          })}

          {/* legs */}
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <Bone a={[sd * 0.1, 0.55, 0.0]} b={[sd * 0.12, 0.52, -0.42]} r={0.075} color="#0d111b" />
              <Bone a={[sd * 0.12, 0.52, -0.42]} b={[sd * 0.13, 0.1, -0.46]} r={0.06} color="#0d111b" />
              <mesh position={[sd * 0.13, 0.04, -0.5]}><boxGeometry args={[0.1, 0.07, 0.22]} /><meshStandardMaterial color="#05070a" /></mesh>
            </group>
          ))}

          {/* torso (hoodie) */}
          <group ref={torso} position={[0, 0.55, 0]} rotation={[-0.12, 0, 0]}>
            <mesh position={[0, 0.0, 0.02]}><sphereGeometry args={[0.2, 20, 16]} /><meshStandardMaterial color="#10162a" roughness={0.9} /></mesh>
            <mesh position={[0, 0.3, 0.02]} scale={[1.12, 1, 0.82]}>
              <capsuleGeometry args={[0.2, 0.3, 8, 18]} />
              <meshStandardMaterial color="#141a2b" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.54, 0.0]}><sphereGeometry args={[0.07, 12, 12]} /><meshStandardMaterial color="#141a2b" roughness={0.9} /></mesh>
          </group>

          {/* head: hood, shadowed face, headset */}
          <group ref={head} position={[0, 1.38, -0.05]}>
            <mesh position={[0, 0.01, 0.04]} scale={[1, 1.06, 1.05]}>
              <sphereGeometry args={[0.16, 24, 20]} />
              <meshStandardMaterial color="#141a2b" roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.01, -0.1]}><sphereGeometry args={[0.085, 16, 14]} /><meshStandardMaterial color="#05070b" roughness={1} /></mesh>
            {[-1, 1].map((sd) => (
              <group key={sd} position={[sd * 0.165, -0.01, 0.0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh><cylinderGeometry args={[0.055, 0.055, 0.05, 16]} />{dark}</mesh>
                <mesh position={[0, sd * 0.027, 0]} material={rgb}><torusGeometry args={[0.04, 0.004, 8, 24]} /></mesh>
              </group>
            ))}
            <mesh position={[0, 0.07, 0.0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.17, 0.008, 8, 32, Math.PI]} />
              {dark}
            </mesh>
          </group>

          <mesh position={[0, 1.22, -0.04]}><cylinderGeometry args={[0.05, 0.055, 0.1, 12]} /><meshStandardMaterial color="#7a5a46" roughness={0.8} /></mesh>

          <Arm side={-1} phase={0} />
          <Arm side={1} phase={1.7} />
        </group>

        {/* light from the screens onto the hacker */}
        <pointLight ref={screenLight} position={[0, 1.1, -0.55]} color="#38bdf8" intensity={5} distance={3.5} />
      </group>

      {/* cable and data pulses (rack space) */}
      <mesh geometry={cable.geo}>
        <meshStandardMaterial color="#1f6fe5" roughness={0.45} metalness={0.2} />
      </mesh>
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} ref={(m) => { pulses.current[k] = m; }}>
          <sphereGeometry args={[0.022, 10, 10]} />
          <meshBasicMaterial color="#7dd3fc" toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}
