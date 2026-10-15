"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Step = { kind: "cmd" | "out"; text: string; color?: string };
type Line = { t: string; c: string };

// decorative lab session: documentation IP range (192.0.2.x), no real target
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

const LH = 36;
const MAX = 13;
const ROT = 0.3;

function drawScreen(ctx: CanvasRenderingContext2D, lines: Line[], typing: string, blink: boolean) {
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

function keyboardTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 220;
  const x = c.getContext("2d")!;
  x.fillStyle = "#070a12";
  x.fillRect(0, 0, 512, 220);
  const rows = [14, 14, 13, 12, 8];
  rows.forEach((n, r) => {
    const w = 512 / (n + 0.4);
    for (let k = 0; k < n; k++) {
      x.fillStyle = "#121a2b";
      x.fillRect(k * w + 4, r * 42 + 6, w - 8, 34);
      x.fillStyle = "rgba(56,189,248,0.35)";
      x.fillRect(k * w + 4, r * 42 + 36, w - 8, 3);
    }
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export default function KaliLaptop({
  x = -2.1,
  z = 0.95,
  floorY = -1.94,
  scale = 1.25,
}: {
  x?: number;
  z?: number;
  floorY?: number;
  scale?: number;
}) {
  const lid = useRef<THREE.Group>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const pulses = useRef<(THREE.Mesh | null)[]>([]);
  const open = useRef(1.55);
  const sim = useRef({ i: 0, ch: 0, wait: 1.8, lines: [] as Line[], typing: "", dirty: true, blinkT: 0, blink: true });

  const screen = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 640;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { ctx: c.getContext("2d")!, tex };
  }, []);
  const kb = useMemo(keyboardTexture, []);

  // thin cable from a lower rack port to the laptop's right side
  const cable = useMemo(() => {
    const px = 0.66 * scale;
    const ex = x + px * Math.cos(ROT);
    const ez = z - px * Math.sin(ROT);
    const ey = floorY + 0.66 * scale;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.4, floorY + 0.64, 0.48),
      new THREE.Vector3(-0.5, floorY + 0.4, 0.75),
      new THREE.Vector3((ex - 0.4) / 2, floorY + 0.06, (ez + 0.9) / 2 + 0.2),
      new THREE.Vector3(ex + 0.1, floorY + 0.1, ez + 0.05),
      new THREE.Vector3(ex + 0.04, floorY + 0.4 * scale, ez),
      new THREE.Vector3(ex, ey, ez),
    ]);
    return { curve, geo: new THREE.TubeGeometry(curve, 64, 0.014, 8, false) };
  }, [x, z, floorY, scale]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const s = sim.current;

    // lid opens after a short delay
    open.current = THREE.MathUtils.damp(open.current, t > 1.2 ? -0.3 : 1.55, 2.2, delta);
    lid.current.rotation.x = open.current + Math.sin(t * 0.9) * 0.008;
    const openness = THREE.MathUtils.clamp((1.55 - open.current) / 1.85, 0, 1);
    light.current.intensity = 5 * openness;

    // typing simulation
    if (openness > 0.6) {
      s.wait -= delta;
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
        s.dirty = true;
      }
      s.blinkT += delta;
      if (s.blinkT > 0.5) { s.blinkT = 0; s.blink = !s.blink; s.dirty = true; }
      if (s.dirty) {
        drawScreen(screen.ctx, s.lines, s.typing, s.blink);
        screen.tex.needsUpdate = true;
        s.dirty = false;
      }
    }

    // data pulses travelling along the cable
    pulses.current.forEach((m, k) => {
      if (m) cable.curve.getPointAt((t * 0.22 + k / 4) % 1, m.position);
    });
  });

  return (
    <>
      <group position={[x, floorY, z]} rotation={[0, ROT, 0]} scale={scale}>
        {/* cart */}
        <mesh position={[0, 0.575, 0]}>
          <boxGeometry args={[1.5, 0.05, 1.0]} />
          <meshStandardMaterial color="#0e131d" metalness={0.8} roughness={0.4} />
        </mesh>
        {[[-0.7, -0.45], [0.7, -0.45], [-0.7, 0.45], [0.7, 0.45]].map(([lx, lz], i) => (
          <mesh key={i} position={[lx, 0.3, lz]}>
            <boxGeometry args={[0.04, 0.55, 0.04]} />
            <meshStandardMaterial color="#0b0e15" metalness={0.9} roughness={0.35} />
          </mesh>
        ))}

        {/* laptop */}
        <group position={[0, 0.6, 0]}>
          <mesh position={[0, 0.0225, 0]}>
            <boxGeometry args={[1.3, 0.045, 0.9]} />
            <meshStandardMaterial color="#1a2233" metalness={0.8} roughness={0.35} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0455, -0.08]}>
            <planeGeometry args={[1.18, 0.5]} />
            <meshBasicMaterial map={kb} toneMapped={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0465, 0.3]}>
            <planeGeometry args={[0.36, 0.2]} />
            <meshStandardMaterial color="#0f1522" metalness={0.6} roughness={0.4} />
          </mesh>

          <group ref={lid} position={[0, 0.045, -0.42]} rotation={[1.55, 0, 0]}>
            <mesh position={[0, 0.44, 0]}>
              <boxGeometry args={[1.3, 0.88, 0.03]} />
              <meshStandardMaterial color="#141b2a" metalness={0.85} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.44, 0.0165]}>
              <planeGeometry args={[1.2, 0.75]} />
              <meshBasicMaterial map={screen.tex} toneMapped={false} />
            </mesh>
          </group>
          <pointLight ref={light} position={[0, 0.5, 0.7]} color="#38bdf8" intensity={0} distance={4} />
        </group>
      </group>

      {/* cable and pulses (rack space) */}
      <mesh geometry={cable.geo}>
        <meshStandardMaterial color="#1f6fe5" roughness={0.45} metalness={0.2} />
      </mesh>
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} ref={(m) => { pulses.current[k] = m; }}>
          <sphereGeometry args={[0.024, 10, 10]} />
          <meshBasicMaterial color="#7dd3fc" toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}
