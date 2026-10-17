"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import * as THREE from "three";

type Shared = MutableRefObject<{ p: number; mx: number; my: number }>;

const LOOP = 9; // seconds per attack cycle
const PAYLOAD = "' OR '1'='1' --";

/* ───────── canvas drawing: the page and the terminal ───────── */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
const MONO = "ui-monospace, Menlo, Consolas, 'DejaVu Sans Mono', monospace";

export function drawBrowser(ctx: CanvasRenderingContext2D, t: number) {
  const W = 640, H = 446;
  ctx.clearRect(0, 0, W, H);

  // window body
  ctx.fillStyle = "#0a101c";
  rr(ctx, 1, 1, W - 2, H - 2, 14);
  ctx.fill();
  ctx.save();
  rr(ctx, 1, 1, W - 2, H - 2, 14);
  ctx.clip();
  ctx.fillStyle = "#0f1a2b";
  ctx.fillRect(0, 0, W, 46);
  ctx.restore();
  ctx.strokeStyle = "#1d3b5c";
  ctx.lineWidth = 2;
  rr(ctx, 1, 1, W - 2, H - 2, 14);
  ctx.stroke();

  // traffic lights + address bar
  ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(24 + i * 20, 23, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#0a101c";
  ctx.strokeStyle = "#1d3b5c";
  ctx.lineWidth = 1.5;
  rr(ctx, 92, 10, W - 112, 26, 13);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#34d399";
  rr(ctx, 106, 19, 9, 8, 2);
  ctx.fill();
  ctx.fillStyle = "#9fb4cc";
  ctx.font = `13px ${MONO}`;
  ctx.fillText("https://app.example.com/login", 124, 28);

  // page skeleton (nav + side blocks)
  ctx.fillStyle = "#111c2e";
  [0, 1, 2].forEach((i) => {
    rr(ctx, 30 + i * 80, 64, 64, 12, 6);
    ctx.fill();
  });
  rr(ctx, W - 110, 62, 80, 16, 8);
  ctx.fill();
  rr(ctx, 30, 120, 110, 70, 10);
  ctx.fill();
  rr(ctx, 30, 204, 110, 40, 10);
  ctx.fill();
  rr(ctx, W - 140, 120, 110, 70, 10);
  ctx.fill();
  rr(ctx, W - 140, 204, 110, 40, 10);
  ctx.fill();

  // login card
  const cx = 170, cy = 92;
  ctx.fillStyle = "#0e1828";
  ctx.strokeStyle = "#1d3b5c";
  ctx.lineWidth = 2;
  rr(ctx, cx, cy, 300, 312, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 22px ${MONO}`;
  ctx.fillText("Sign in", cx + 26, cy + 46);
  ctx.fillStyle = "#6f86a3";
  ctx.font = `12px ${MONO}`;
  ctx.fillText("Welcome back", cx + 26, cy + 66);

  const typedN = Math.floor(Math.min(1, Math.max(0, (t - 1.2) / 1.6)) * PAYLOAD.length);
  const typed = PAYLOAD.slice(0, typedN);
  const hot = typedN > 0;

  // username
  ctx.fillStyle = "#8aa2bf";
  ctx.font = `11px ${MONO}`;
  ctx.fillText("Username", cx + 26, cy + 98);
  ctx.fillStyle = "#0a101c";
  ctx.strokeStyle = hot ? "#ff4d6d" : "#22d3ee";
  ctx.lineWidth = 1.5;
  rr(ctx, cx + 26, cy + 106, 248, 36, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hot ? "#ffb3c0" : "#cfe6ff";
  ctx.font = `14px ${MONO}`;
  ctx.fillText(typed, cx + 36, cy + 129);
  if (t % 1 < 0.5 && t < 4.6) {
    const w = ctx.measureText(typed).width;
    ctx.fillRect(cx + 38 + w, cy + 115, 2, 18);
  }

  // password
  const dots = t > 3.2 ? Math.min(8, Math.floor((t - 3.2) / 0.12)) : 0;
  ctx.fillStyle = "#8aa2bf";
  ctx.font = `11px ${MONO}`;
  ctx.fillText("Password", cx + 26, cy + 164);
  ctx.fillStyle = "#0a101c";
  ctx.strokeStyle = "#1d3b5c";
  rr(ctx, cx + 26, cy + 172, 248, 36, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#cfe6ff";
  for (let i = 0; i < dots; i++) {
    ctx.beginPath();
    ctx.arc(cx + 44 + i * 16, cy + 190, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // button
  const pressed = t > 3.9 && t < 4.7;
  const g = ctx.createLinearGradient(cx + 26, 0, cx + 274, 0);
  g.addColorStop(0, pressed ? "#1aa6bf" : "#22d3ee");
  g.addColorStop(1, pressed ? "#7c5fd6" : "#a78bfa");
  ctx.fillStyle = g;
  rr(ctx, cx + 26, cy + 226 + (pressed ? 2 : 0), 248, 40, 10);
  ctx.fill();
  ctx.fillStyle = "#03101a";
  ctx.font = `bold 15px ${MONO}`;
  ctx.textAlign = "center";
  ctx.fillText("Login", cx + 150, cy + 252 + (pressed ? 2 : 0));
  ctx.textAlign = "left";
  ctx.fillStyle = "#5d7694";
  ctx.font = `11px ${MONO}`;
  ctx.fillText("Forgot password?", cx + 26, cy + 292);

  // result overlay
  if (t > 4.8 && t < 8.3) {
    const a = Math.min(1, (t - 4.8) / 0.3) * (t > 7.7 ? (8.3 - t) / 0.6 : 1);
    ctx.save();
    ctx.globalAlpha = a * 0.99;
    ctx.fillStyle = "#2a0a14";
    ctx.strokeStyle = "#ff2d55";
    ctx.lineWidth = 2;
    rr(ctx, cx, cy, 300, 312, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ff4d6d";
    ctx.font = `bold 21px ${MONO}`;
    ctx.textAlign = "center";
    ctx.fillText("AUTH BYPASSED", cx + 150, cy + 140);
    ctx.fillStyle = "#ffd0d8";
    ctx.font = `14px ${MONO}`;
    ctx.fillText("Logged in as admin", cx + 150, cy + 172);
    ctx.fillStyle = "#c98a99";
    ctx.font = `11px ${MONO}`;
    ctx.fillText("no valid password needed", cx + 150, cy + 196);
    ctx.textAlign = "left";
    ctx.restore();
  }
}

const LINES: { at: number; t: string; c: string }[] = [
  { at: 0.4, t: "$ curl -s -X POST /api/login", c: "#9fe8ff" },
  { at: 1.6, t: `> {"user":"${PAYLOAD}"}`, c: "#cfe6ff" },
  { at: 4.7, t: "< HTTP/1.1 200 OK", c: "#7ee787" },
  { at: 5.1, t: '< {"role":"admin","token":"eyJ..."}', c: "#ffb3c0" },
  { at: 5.7, t: "[!] SQLi: authentication bypass", c: "#ff4d6d" },
  { at: 6.5, t: "[+] fix: parameterised queries", c: "#7ee787" },
];

export function drawTerm(ctx: CanvasRenderingContext2D, t: number) {
  const W = 512, H = 300;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#070b12";
  rr(ctx, 1, 1, W - 2, H - 2, 12);
  ctx.fill();
  ctx.strokeStyle = "#1d3b5c";
  ctx.lineWidth = 2;
  ctx.stroke();
  ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(22 + i * 18, 22, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#6f86a3";
  ctx.font = `12px ${MONO}`;
  ctx.fillText("request log", 90, 26);
  ctx.font = `14px ${MONO}`;
  LINES.forEach((l, i) => {
    if (t < l.at) return;
    const n = Math.min(l.t.length, Math.floor(((t - l.at) / 0.45) * l.t.length));
    ctx.fillStyle = l.c;
    ctx.fillText(l.t.slice(0, n), 20, 64 + i * 32);
  });
  if (t % 0.8 < 0.4) {
    ctx.fillStyle = "#9fe8ff";
    ctx.fillRect(20, 64 + LINES.filter((l) => t >= l.at).length * 32 - 14, 8, 16);
  }
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

function makeCanvasTex(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 4;
  return { ctx: c.getContext("2d")!, tx };
}

/* ───────── the station ───────── */
export default function BrowserStation({ sh }: { sh: Shared }) {
  const root = useRef<THREE.Group>(null!);
  const edgeMat = useRef<THREE.LineBasicMaterial>(null!);
  const packets = useRef<THREE.InstancedMesh>(null!);
  const payload = useRef<THREE.Group>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null!);
  const lastFrame = useRef(-1);

  const ui = useMemo(() => makeCanvasTex(640, 446), []);
  const term = useMemo(() => makeCanvasTex(512, 300), []);
  const gTex = useMemo(() => glowTex(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const slabEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(3.4, 2.4, 0.08)), []);
  const termEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(2.04, 1.2, 0.04)), []);
  const pk = useMemo(() => {
    let a = 5;
    const r = () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
    return Array.from({ length: 34 }, () => ({ y: (r() - 0.5) * 2.0, z: (r() - 0.5) * 0.7, sp: 0.18 + r() * 0.22, off: r() }));
  }, []);

  useEffect(() => {
    drawBrowser(ui.ctx, 0);
    ui.tx.needsUpdate = true;
    drawTerm(term.ctx, 0);
    term.tx.needsUpdate = true;
  }, [ui, term]);

  useFrame((state, dt) => {
    const time = state.clock.elapsedTime;
    const t = time % LOOP;

    // redraw the screens at ~15 fps
    const fr = Math.floor(time * 15);
    if (fr !== lastFrame.current) {
      lastFrame.current = fr;
      drawBrowser(ui.ctx, t);
      ui.tx.needsUpdate = true;
      drawTerm(term.ctx, t);
      term.tx.needsUpdate = true;
    }

    // 3D sway + parallax
    const damp = THREE.MathUtils.damp;
    root.current.rotation.y = damp(root.current.rotation.y, 0.2 + sh.current.mx * 0.4, 3, dt);
    root.current.rotation.x = damp(root.current.rotation.x, -0.04 - sh.current.my * 0.15, 3, dt);
    root.current.position.y = Math.sin(time * 0.7) * 0.07;

    // request packets streaming towards the page
    pk.forEach((p, i) => {
      const u = (time * p.sp + p.off) % 1;
      dummy.position.set(-5.6 + u * 3.9, p.y, p.z);
      dummy.scale.setScalar(0.06 * (1 - Math.pow(u, 6)));
      dummy.updateMatrix();
      packets.current.setMatrixAt(i, dummy.matrix);
    });
    packets.current.instanceMatrix.needsUpdate = true;

    // the malicious payload packet
    const flying = t > 3.9 && t < 4.65;
    payload.current.visible = flying;
    if (flying) {
      const p = (t - 3.9) / 0.75;
      payload.current.position.set(-5.6 + p * 3.95, 0.1, 0.1);
    }

    // impact shockwave
    const hit = t > 4.65 && t < 5.6;
    ring.current.visible = hit;
    if (hit) {
      const k = (t - 4.65) / 0.95;
      ring.current.scale.setScalar(0.3 + k * 2.2);
      ringMat.current.opacity = (1 - k) * 0.8;
    }

    // frame glows red while compromised
    const red = t > 4.7 && t < 8.2 ? 1 : 0;
    edgeMat.current.color.lerp(new THREE.Color(red ? "#ff2d55" : "#22d3ee"), 0.15);
  });

  return (
    <group ref={root} scale={0.95}>
      {/* soft glow behind */}
      <sprite scale={[7, 5, 1]} position={[0, 0, -0.4]}>
        <spriteMaterial map={gTex} color="#22d3ee" transparent opacity={0.14} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      {/* browser slab */}
      <mesh>
        <boxGeometry args={[3.4, 2.4, 0.08]} />
        <meshStandardMaterial color="#0a1220" metalness={0.55} roughness={0.35} emissive="#04101c" />
      </mesh>
      <mesh position={[0, 0, 0.042]}>
        <planeGeometry args={[3.3, 2.3]} />
        <meshBasicMaterial map={ui.tx} toneMapped={false} transparent />
      </mesh>
      <lineSegments geometry={slabEdges}>
        <lineBasicMaterial ref={edgeMat} color="#22d3ee" transparent opacity={0.9} />
      </lineSegments>

      {/* terminal floating in front, for depth */}
      <group position={[1.95, -1.05, 0.75]} rotation={[0, -0.14, 0]}>
        <mesh>
          <boxGeometry args={[2.04, 1.2, 0.04]} />
          <meshStandardMaterial color="#05080f" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[2.0, 1.172]} />
          <meshBasicMaterial map={term.tx} toneMapped={false} transparent />
        </mesh>
        <lineSegments geometry={termEdges}>
          <lineBasicMaterial color="#a78bfa" transparent opacity={0.8} />
        </lineSegments>
      </group>

      {/* incoming requests */}
      <instancedMesh ref={packets} args={[undefined, undefined, pk.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#67e8f9" />
      </instancedMesh>

      {/* the payload */}
      <group ref={payload} visible={false}>
        <mesh>
          <sphereGeometry args={[0.1, 16, 12]} />
          <meshBasicMaterial color="#ff3355" />
        </mesh>
        <sprite scale={[0.9, 0.9, 1]}>
          <spriteMaterial map={gTex} color="#ff2d55" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>

      {/* impact ring */}
      <mesh ref={ring} position={[0, 0, 0.07]} visible={false}>
        <ringGeometry args={[0.9, 1.0, 64]} />
        <meshBasicMaterial ref={ringMat} color="#ff2d55" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
