"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";

/* ---------------- dimensions ---------------- */
const UH = 0.1; // one rack unit
const RACK_U = 42;
const TOP = (RACK_U * UH) / 2;
const IW = 0.9; // unit face width
const FZ = 0.45; // z of the front faces
const DEPTH = 0.85;
const CABLES = 14;

type Kind = "patch" | "switch" | "mgmt" | "server" | "console" | "storage" | "ups" | "blank";
const LAYOUT: [Kind, number][] = [
  ["patch", 1], ["switch", 1], ["mgmt", 1], ["patch", 1], ["switch", 1], ["mgmt", 1],
  ["server", 2], ["server", 2], ["server", 2], ["server", 2],
  ["console", 2], ["blank", 1],
  ["server", 2], ["server", 2], ["server", 2], ["server", 2], ["server", 2],
  ["storage", 4], ["storage", 4], ["blank", 1],
  ["ups", 3], ["ups", 3],
];
const CHASSIS: Record<Kind, string> = {
  patch: "#171c27", switch: "#1d2433", mgmt: "#121620", server: "#1b2130",
  console: "#151a25", storage: "#1a202e", ups: "#10141c", blank: "#0e1118",
};

/* ---------------- logs ---------------- */
type Lvl = "CRIT" | "HIGH" | "WARN" | "INFO";
type Log = { lvl: Lvl; msg: string; act: string; ip: string; time: string };
const LVL_COL: Record<Lvl, string> = { CRIT: "#ff2d55", HIGH: "#ff9f0a", WARN: "#ffd60a", INFO: "#22d3ee" };
const TEMPLATES: { lvl: Lvl; msg: string; act: string }[] = [
  { lvl: "CRIT", msg: "SQL injection on /login", act: "BLOCKED" },
  { lvl: "CRIT", msg: "Struts2 OGNL RCE (S2-045)", act: "BLOCKED" },
  { lvl: "CRIT", msg: "Ransomware beacon detected", act: "ISOLATED" },
  { lvl: "CRIT", msg: "Privilege escalation: sudo", act: "ALERT" },
  { lvl: "HIGH", msg: "SSH brute force x412", act: "BLOCKED" },
  { lvl: "HIGH", msg: "Kerberoasting TGS burst", act: "ALERT" },
  { lvl: "HIGH", msg: "Odd PowerShell child proc", act: "ALERT" },
  { lvl: "WARN", msg: "XSS probe on /search", act: "BLOCKED" },
  { lvl: "WARN", msg: "Port scan 1-1024", act: "LOGGED" },
  { lvl: "INFO", msg: "TLS 1.3 handshake", act: "OK" },
  { lvl: "INFO", msg: "Patch window verified", act: "OK" },
];
const RANGES = ["192.0.2", "198.51.100", "203.0.113"];
const ri = (n: number) => Math.floor(Math.random() * n);
function makeLog(): Log {
  const r = Math.random();
  const want: Lvl = r < 0.2 ? "CRIT" : r < 0.4 ? "HIGH" : r < 0.65 ? "WARN" : "INFO";
  const pool = TEMPLATES.filter((t) => t.lvl === want);
  const t = pool[ri(pool.length)];
  return { ...t, ip: `${RANGES[ri(3)]}.${1 + ri(254)}`, time: new Date().toISOString().slice(11, 19) };
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLog(ctx: CanvasRenderingContext2D, w: number, h: number, l: Log) {
  const col = LVL_COL[l.lvl];
  ctx.clearRect(0, 0, w, h);
  ctx.shadowColor = col;
  ctx.shadowBlur = 18;
  rr(ctx, 10, 10, w - 20, h - 20, 18);
  ctx.fillStyle = "rgba(6,10,18,0.9)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = col;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = col;
  ctx.fillRect(10, 30, 8, h - 60);
  ctx.font = "bold 38px ui-monospace, monospace";
  ctx.fillText(l.lvl, 40, 62);
  ctx.font = "30px ui-monospace, monospace";
  ctx.fillStyle = "#8da2b8";
  ctx.fillText(`${l.time}  ${l.ip}`, 160, 62);
  ctx.font = "bold 44px ui-monospace, monospace";
  ctx.fillStyle = "#f1f5f9";
  ctx.fillText(l.msg, 40, 122);
  ctx.textAlign = "right";
  ctx.font = "bold 34px ui-monospace, monospace";
  ctx.fillStyle = col;
  ctx.fillText(l.act, w - 36, 62);
  ctx.textAlign = "left";
}

function drawScreen(ctx: CanvasRenderingContext2D, w: number, h: number, logs: Log[], cursor: boolean) {
  ctx.fillStyle = "#020b10";
  ctx.fillRect(0, 0, w, h);
  ctx.font = "bold 22px ui-monospace, monospace";
  ctx.fillStyle = "#22d3ee";
  ctx.fillText("SOC-CONSOLE > simulated feed", 14, 28);
  ctx.fillStyle = "#0e3a46";
  ctx.fillRect(14, 38, w - 28, 2);
  ctx.font = "21px ui-monospace, monospace";
  logs.slice(0, 6).forEach((l, i) => {
    const y = 68 + i * 30;
    ctx.fillStyle = LVL_COL[l.lvl];
    ctx.fillText(l.lvl, 14, y);
    ctx.fillStyle = "#8da2b8";
    ctx.fillText(`${l.time} ${l.ip}`, 90, y);
    ctx.fillStyle = l.lvl === "CRIT" ? "#ffd1da" : "#cbd5e1";
    ctx.fillText(l.msg.slice(0, 27), 400, y);
    ctx.fillStyle = LVL_COL[l.lvl];
    ctx.fillText(l.act, 900, y);
  });
  ctx.fillStyle = "#22d3ee";
  if (cursor) ctx.fillRect(14, h - 26, 12, 18);
}

function radialTex(stops: [number, string][]) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------- rack geometry data ---------------- */
type Detail = { x: number; y: number; z: number; w: number; h: number; d: number; c: THREE.Color };
type LedKind = "link" | "drive" | "status" | "ups";
type Led = { x: number; y: number; z: number; s: number; base: THREE.Color; kind: LedKind; unit: number; phase: number; rate: number };
type Fan = { x: number; y: number; r: number };

function buildRack() {
  const details: Detail[] = [];
  const leds: Led[] = [];
  const fans: Fan[] = [];
  const units: { kind: Kind; y: number; h: number }[] = [];
  const swPorts: { x: number; y: number }[] = [];
  const patchPorts: { x: number; y: number }[] = [];
  const serverUnits: number[] = [];
  let screen = { x: 0, y: 0, w: 0.6, h: 0.14 };

  const det = (x: number, y: number, w: number, h: number, c: string, d = 0.01) =>
    details.push({ x, y, z: FZ + 0.002, w, h, d, c: new THREE.Color(c) });
  const led = (x: number, y: number, unit: number, kind: LedKind, base: string) =>
    leds.push({ x, y, z: FZ + 0.009, s: 0.011, base: new THREE.Color(base), kind, unit, phase: Math.random() * 100, rate: 2 + Math.random() * 8 });

  let cum = 0;
  let serverCount = 0;
  LAYOUT.forEach(([kind, u], i) => {
    const h = u * UH - 0.006;
    const y = TOP - (cum + u / 2) * UH;
    cum += u;
    units.push({ kind, y, h });

    if (kind === "switch") {
      for (let p = 0; p < 24; p++) {
        const x = -0.4 + p * 0.0235;
        det(x, y - 0.004, 0.018, 0.024, "#04060a");
        led(x, y + 0.027, i, "link", "#34d399");
        swPorts.push({ x, y: y - 0.004 });
      }
      for (let p = 0; p < 4; p++) {
        const x = 0.22 + p * 0.045;
        det(x, y - 0.004, 0.034, 0.03, "#070a10");
        led(x, y + 0.03, i, "link", "#38bdf8");
      }
      led(-0.435, y, i, "status", "#22d3ee");
    } else if (kind === "patch") {
      det(-0.12, y + 0.03, 0.56, 0.007, "#4b5563");
      for (let p = 0; p < 24; p++) {
        const x = -0.4 + p * 0.0235;
        det(x, y - 0.006, 0.018, 0.026, "#06080c");
        patchPorts.push({ x, y: y - 0.006 });
      }
    } else if (kind === "mgmt") {
      for (let k = 0; k < 4; k++) det(0, y - 0.02 + k * 0.013, 0.8, 0.003, "#06080c");
    } else if (kind === "server") {
      for (let r = 0; r < 2; r++)
        for (let c = 0; c < 4; c++) {
          const bx = -0.355 + c * 0.09;
          const by = y + (r ? -0.04 : 0.04);
          det(bx, by, 0.08, 0.066, "#0b0f16");
          det(bx, by - 0.027, 0.06, 0.006, "#3d4558");
          led(bx + 0.03, by + 0.022, i, "drive", "#34d399");
        }
      if (serverCount % 2 === 0) {
        fans.push({ x: 0.12, y, r: 0.066 }, { x: 0.27, y, r: 0.066 });
      } else {
        for (let k = 0; k < 9; k++) det(0.04 + k * 0.035, y, 0.012, 0.15, "#05070a");
      }
      det(0.395, y + 0.04, 0.022, 0.022, "#2b3345");
      led(0.395, y - 0.02, i, "status", "#22d3ee");
      serverUnits.push(i);
      serverCount++;
    } else if (kind === "storage") {
      for (let r = 0; r < 2; r++)
        for (let c = 0; c < 12; c++) {
          const bx = -0.4 + c * 0.0675;
          const by = y + (r ? -0.095 : 0.095);
          det(bx, by, 0.06, 0.17, "#0b0f16");
          det(bx, by + 0.075, 0.045, 0.006, "#3d4558");
          led(bx + 0.02, by - 0.07, i, "drive", "#34d399");
        }
      led(0.425, y + 0.1, i, "status", "#22d3ee");
    } else if (kind === "console") {
      det(-0.1, y, 0.64, 0.17, "#020305");
      screen = { x: -0.1, y, w: 0.6, h: 0.14 };
      det(0.33, y, 0.2, 0.12, "#10141c");
      led(0.41, y + 0.06, i, "status", "#22d3ee");
    } else if (kind === "ups") {
      det(-0.28, y + 0.06, 0.16, 0.07, "#0b3a2c");
      for (let k = 0; k < 5; k++) led(-0.34 + k * 0.03, y - 0.04, i, "ups", "#34d399");
      for (let k = 0; k < 8; k++) det(0.15, y + 0.1 - k * 0.026, 0.55, 0.008, "#05070a");
    } else {
      det(0, y, 0.8, 0.004, "#05070a");
    }
  });
  return { details, leds, fans, units, swPorts, patchPorts, serverUnits, screen };
}

/* ---------------- scroll poses ---------------- */
type Pose = { x: number; y: number; ry: number; s: number; door: number };
const HOME: (Pose & { p: number })[] = [
  { p: 0, x: 0.25, y: 0, ry: -0.55, s: 0.92, door: 0 },
  { p: 0.2, x: -0.25, y: 0.04, ry: 0.5, s: 0.95, door: 1.0 },
  { p: 0.45, x: 0.26, y: -0.02, ry: -0.4, s: 1.0, door: 1.3 },
  { p: 0.7, x: -0.22, y: 0.04, ry: 0.65, s: 0.95, door: 0.8 },
  { p: 1, x: 0, y: 0.02, ry: 0, s: 1.0, door: 0 },
];
const ss = (a: number) => a * a * (3 - 2 * a);
function homePose(p: number): Pose {
  for (let i = 0; i < HOME.length - 1; i++) {
    const a = HOME[i];
    const b = HOME[i + 1];
    if (p <= b.p) {
      const k = ss(THREE.MathUtils.clamp((p - a.p) / (b.p - a.p), 0, 1));
      const l = THREE.MathUtils.lerp;
      return { x: l(a.x, b.x, k), y: l(a.y, b.y, k), ry: l(a.ry, b.ry, k), s: l(a.s, b.s, k), door: l(a.door, b.door, k) };
    }
  }
  return HOME[HOME.length - 1];
}
const SIDE: Record<string, [number, number]> = {
  "/about": [0.34, -0.5], "/experience": [-0.34, 0.5], "/education": [0.34, -0.5],
  "/skills": [-0.34, 0.5], "/projects": [0.34, -0.5], "/contact": [0, 0],
};
function pagePose(path: string, p: number): Pose {
  const [x, ry] = SIDE[path] ?? [0.34, -0.5];
  return { x, y: 0, ry: ry + p * 0.7, s: 0.62, door: 0.5 + p * 0.5 };
}

/* ---------------- the rack ---------------- */
type State = { next: number; logs: Log[]; flash: Float32Array; hot: Float32Array; alert: number; dirty: boolean; nextBlink: number };
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _s = new THREE.Vector3();
const _id = new THREE.Quaternion();

function Rack({ path }: { path: string }) {
  const data = useMemo(buildRack, []);
  const group = useRef<THREE.Group>(null!);
  const door = useRef<THREE.Group>(null!);
  const doorAng = useRef(0);
  const detMesh = useRef<THREE.InstancedMesh>(null!);
  const ledMesh = useRef<THREE.InstancedMesh>(null!);
  const glowMesh = useRef<THREE.InstancedMesh>(null!);
  const pulseMesh = useRef<THREE.InstancedMesh>(null!);
  const fanRefs = useRef<THREE.Group[]>([]);
  const alertLight = useRef<THREE.PointLight>(null!);
  const beacon = useRef<THREE.MeshBasicMaterial>(null!);
  const dustRef = useRef<THREE.Points>(null!);
  const S = useRef<State | null>(null);
  if (!S.current) {
    S.current = {
      next: 0.8, logs: Array.from({ length: 6 }, makeLog), flash: new Float32Array(data.units.length),
      hot: new Float32Array(CABLES), alert: 0, dirty: true, nextBlink: 0,
    };
  }

  const scr = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 256;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return { ctx: c.getContext("2d")!, t };
  }, []);

  const glowTex = useMemo(() => radialTex([[0, "rgba(255,255,255,1)"], [0.25, "rgba(255,255,255,0.45)"], [1, "rgba(255,255,255,0)"]]), []);
  const floorGlow = useMemo(() => radialTex([[0, "rgba(34,211,238,0.55)"], [0.5, "rgba(34,211,238,0.12)"], [1, "rgba(34,211,238,0)"]]), []);
  const floorShadow = useMemo(() => radialTex([[0, "rgba(0,0,0,0.9)"], [0.6, "rgba(0,0,0,0.45)"], [1, "rgba(0,0,0,0)"]]), []);

  const cables = useMemo(() => {
    const cols = ["#2a6df4", "#f5c518", "#e8e8f0", "#ff7a3d", "#22c55e", "#a78bfa"];
    const sw = data.swPorts;
    const pp = data.patchPorts;
    return Array.from({ length: CABLES }, (_, k) => {
      const a = sw[(k * 3 + 2) % sw.length];
      const b = pp[(k * 7 + 5) % pp.length];
      const j = () => (Math.random() - 0.5) * 0.06;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(a.x, a.y, FZ + 0.015),
        new THREE.Vector3(a.x + j(), a.y - 0.03, FZ + 0.06),
        new THREE.Vector3((a.x + b.x) / 2 + (Math.random() - 0.5) * 0.3, (a.y + b.y) / 2 - 0.05, FZ + 0.14 + Math.random() * 0.06),
        new THREE.Vector3(b.x + j(), b.y + 0.03, FZ + 0.06),
        new THREE.Vector3(b.x, b.y, FZ + 0.015),
      ]);
      return { curve, geo: new THREE.TubeGeometry(curve, 40, 0.0055, 6, false), color: cols[k % cols.length] };
    });
  }, [data]);

  const pulses = useMemo(
    () => Array.from({ length: CABLES * 2 }, (_, i) => ({ t: Math.random(), v: 0.2 + Math.random() * 0.25, dir: i % 2 ? 1 : -1 })),
    []
  );

  const pool = useMemo(
    () =>
      Array.from({ length: 6 }, () => {
        const c = document.createElement("canvas");
        c.width = 1024;
        c.height = 160;
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 160 / 1024), mat);
        mesh.visible = false;
        mesh.renderOrder = 20;
        return { mesh, mat, tex, ctx: c.getContext("2d")!, active: false, age: 0, life: 4, x0: 0, y0: 0, dx: 0, dy: 0 };
      }),
    []
  );

  const dust = useMemo(
    () => Float32Array.from({ length: 240 * 3 }, (_, i) => (i % 3 === 1 ? (Math.random() - 0.5) * 5 : (Math.random() - 0.5) * 3.2)),
    []
  );

  useLayoutEffect(() => {
    const dm = detMesh.current;
    data.details.forEach((d, i) => {
      _m.compose(_v.set(d.x, d.y, d.z), _id, _s.set(d.w, d.h, d.d));
      dm.setMatrixAt(i, _m);
      dm.setColorAt(i, d.c);
    });
    dm.instanceMatrix.needsUpdate = true;
    if (dm.instanceColor) dm.instanceColor.needsUpdate = true;

    const n = data.leds.length;
    [ledMesh.current, glowMesh.current].forEach((mesh, k) => {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
      data.leds.forEach((l, i) => {
        const sc = k === 0 ? l.s : l.s * 4.5;
        _m.compose(_v.set(l.x, l.y, l.z), _id, _s.set(sc, sc, k === 0 ? 0.006 : 1));
        mesh.setMatrixAt(i, _m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
    pulseMesh.current.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CABLES * 2 * 3), 3);
  }, [data]);

  const fire = () => {
    const st = S.current!;
    const log = makeLog();
    st.logs.unshift(log);
    if (st.logs.length > 8) st.logs.pop();
    st.dirty = true;
    if (log.lvl === "INFO") return;
    const n = log.lvl === "WARN" ? 1 : 3;
    for (let i = 0; i < n; i++) st.hot[ri(CABLES)] = 1;
    if (log.lvl === "WARN") return;
    const unit = data.serverUnits[ri(data.serverUnits.length)];
    st.flash[unit] = log.lvl === "CRIT" ? 2.4 : 1.3;
    if (log.lvl === "CRIT") st.alert = 1;
    const slot = pool.find((s) => !s.active);
    if (!slot) return;
    drawLog(slot.ctx, 1024, 160, log);
    slot.tex.needsUpdate = true;
    Object.assign(slot, {
      active: true, age: 0, life: log.lvl === "CRIT" ? 4.2 : 3.2,
      x0: (Math.random() - 0.5) * 0.5, y0: data.units[unit].y,
      dx: (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.35), dy: 0.35 + Math.random() * 0.5,
    });
  };

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const st = S.current!;
    const g = group.current;
    const damp = THREE.MathUtils.damp;

    /* pose from scroll */
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? THREE.MathUtils.clamp(window.scrollY / max, 0, 1) : 0;
    const target = path === "/" ? homePose(p) : pagePose(path, p);
    const { viewport, size, pointer } = state;
    const narrow = size.width < 768;
    g.position.x = damp(g.position.x, (narrow ? 0 : target.x) * viewport.width, 3, delta);
    g.position.y = damp(g.position.y, (narrow ? 0.16 : target.y) * viewport.height, 3, delta);
    g.scale.setScalar(damp(g.scale.x, narrow ? target.s * 0.62 : target.s, 3, delta));
    g.rotation.y = damp(g.rotation.y, target.ry + pointer.x * 0.15 + Math.sin(t * 0.3) * 0.04, 3, delta);
    g.rotation.x = damp(g.rotation.x, -pointer.y * 0.05, 3, delta);
    doorAng.current = damp(doorAng.current, target.door, 2.5, delta);
    door.current.rotation.y = -doorAng.current;

    /* log events */
    st.next -= delta;
    if (st.next <= 0) {
      fire();
      st.next = 0.9 + Math.random() * 1.6;
    }
    for (let i = 0; i < st.flash.length; i++) st.flash[i] = Math.max(0, st.flash[i] - delta * 0.8);
    st.alert = Math.max(0, st.alert - delta * 0.45);

    /* console screen */
    if (st.dirty || t > st.nextBlink) {
      drawScreen(scr.ctx, 1024, 256, st.logs, Math.floor(t * 2) % 2 === 0);
      scr.t.needsUpdate = true;
      st.dirty = false;
      st.nextBlink = t + 0.5;
    }

    /* LEDs */
    const lc = ledMesh.current.instanceColor!.array as Float32Array;
    const gc = glowMesh.current.instanceColor!.array as Float32Array;
    for (let i = 0; i < data.leds.length; i++) {
      const L = data.leds[i];
      let b = 1;
      if (L.kind === "drive") b = Math.sin(t * L.rate + L.phase) * Math.sin(t * L.rate * 0.43 + L.phase * 1.9) > 0.2 ? 1 : 0.15;
      else if (L.kind === "link") b = 0.55 + 0.45 * (Math.sin(t * L.rate * 0.6 + L.phase) > 0.1 ? 1 : 0.2);
      let r = L.base.r * b;
      let gg = L.base.g * b;
      let bl = L.base.b * b;
      const f = st.flash[L.unit];
      if (f > 0) {
        const k = Math.min(f, 1);
        const strobe = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 16 + L.phase));
        r = r * (1 - k) + strobe * k;
        gg = gg * (1 - k) + 0.06 * k;
        bl = bl * (1 - k) + 0.14 * k;
      }
      lc[i * 3] = r * 1.6; lc[i * 3 + 1] = gg * 1.6; lc[i * 3 + 2] = bl * 1.6;
      gc[i * 3] = r; gc[i * 3 + 1] = gg; gc[i * 3 + 2] = bl;
    }
    ledMesh.current.instanceColor!.needsUpdate = true;
    glowMesh.current.instanceColor!.needsUpdate = true;

    /* data pulses on the cables */
    const pc = pulseMesh.current.instanceColor!.array as Float32Array;
    for (let k = 0; k < CABLES; k++) {
      const hot = st.hot[k];
      for (let j = 0; j < 2; j++) {
        const idx = k * 2 + j;
        const pu = pulses[idx];
        pu.t = (pu.t + pu.v * delta * (1 + hot * 3)) % 1;
        cables[k].curve.getPointAt(pu.dir > 0 ? pu.t : 1 - pu.t, _v);
        _m.compose(_v, _id, _s.setScalar(1 + hot * 0.9));
        pulseMesh.current.setMatrixAt(idx, _m);
        pc[idx * 3] = hot > 0.05 ? 1.6 : 0.2;
        pc[idx * 3 + 1] = hot > 0.05 ? 0.1 : 1.4;
        pc[idx * 3 + 2] = hot > 0.05 ? 0.25 : 1.6;
      }
      st.hot[k] = Math.max(0, hot - delta * 0.5);
    }
    pulseMesh.current.instanceMatrix.needsUpdate = true;
    pulseMesh.current.instanceColor!.needsUpdate = true;

    /* fans, beacon, alert light, dust */
    fanRefs.current.forEach((f, i) => {
      if (f) f.rotation.z += delta * (16 + (i % 3) * 3);
    });
    const a = st.alert;
    const strobe = 0.5 + 0.5 * Math.sin(t * 12);
    alertLight.current.intensity = a * (14 + strobe * 22);
    beacon.current.color.setRGB(0.15 + a * (0.85 + strobe * 0.8), 0.05, 0.08 + a * 0.1);
    dustRef.current.rotation.y = t * 0.04;
    dustRef.current.position.y = Math.sin(t * 0.3) * 0.05;

    /* floating log cards */
    g.getWorldQuaternion(_q);
    _q.invert().multiply(state.camera.quaternion);
    for (const s of pool) {
      if (!s.active) continue;
      s.age += delta;
      const k = s.age / s.life;
      if (k >= 1) {
        s.active = false;
        s.mesh.visible = false;
        continue;
      }
      s.mesh.visible = true;
      const e = 1 - Math.pow(1 - Math.min(k * 1.6, 1), 3);
      s.mesh.position.set(s.x0 + s.dx * e, s.y0 + s.dy * e, FZ + 0.05 + 0.95 * e);
      const sc = 1.5 * (0.55 + 0.45 * e);
      s.mesh.scale.set(sc, sc, 1);
      s.mesh.quaternion.copy(_q);
      s.mat.opacity = Math.min(k / 0.07, 1) * (k > 0.7 ? (1 - k) / 0.3 : 1);
    }
  });

  const post = (x: number, z: number, i: number) => (
    <mesh key={i} position={[x, 0, z]}>
      <boxGeometry args={[0.04, 4.3, 0.04]} />
      <meshStandardMaterial color="#0b0e15" metalness={0.9} roughness={0.35} />
    </mesh>
  );

  return (
    <group ref={group}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[2, 3, 4]} intensity={0.9} color="#cfe8ff" />
      <pointLight position={[-1.8, 1.2, -0.4]} intensity={14} color="#22d3ee" distance={7} />
      <pointLight position={[1.9, -0.5, -0.4]} intensity={12} color="#a855f7" distance={7} />
      <pointLight ref={alertLight} position={[0, 0, 1.7]} intensity={0} color="#ff2d55" distance={6} />

      {/* floor shadow + underglow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -2.22, 0.1]}>
        <planeGeometry args={[3.6, 3]} />
        <meshBasicMaterial map={floorShadow} transparent depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -2.21, 0.1]}>
        <planeGeometry args={[3.2, 2.5]} />
        <meshBasicMaterial map={floorGlow} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>

      {/* frame */}
      {[[-0.48, 0.47], [0.48, 0.47], [-0.48, -0.52], [0.48, -0.52]].map(([x, z], i) => post(x, z, i))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.51, 0, -0.02]}>
          <boxGeometry args={[0.015, 4.3, 1.06]} />
          <meshStandardMaterial color="#080b11" metalness={0.8} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0, -0.545]}>
        <boxGeometry args={[1.04, 4.3, 0.015]} />
        <meshStandardMaterial color="#06080d" metalness={0.8} roughness={0.5} />
      </mesh>
      {[-2.17, 2.17].map((y) => (
        <mesh key={y} position={[0, y, -0.02]}>
          <boxGeometry args={[1.06, 0.05, 1.08]} />
          <meshStandardMaterial color="#0a0d14" metalness={0.9} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[-0.46, 0, 0.497]}>
        <boxGeometry args={[0.006, 4.1, 0.006]} />
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
      <mesh position={[0.46, 0, 0.497]}>
        <boxGeometry args={[0.006, 4.1, 0.006]} />
        <meshBasicMaterial color="#a78bfa" toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.26, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.12, 16]} />
        <meshBasicMaterial ref={beacon} color="#260a10" toneMapped={false} />
      </mesh>

      {/* units */}
      {data.units.map((u, i) => (
        <mesh key={i} position={[0, u.y, FZ - DEPTH / 2]}>
          <boxGeometry args={[IW, u.h, DEPTH]} />
          <meshStandardMaterial color={CHASSIS[u.kind]} metalness={0.85} roughness={0.38} />
        </mesh>
      ))}
      <instancedMesh ref={detMesh} args={[undefined, undefined, data.details.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" metalness={0.4} roughness={0.55} />
      </instancedMesh>
      <mesh position={[data.screen.x, data.screen.y, FZ + 0.0125]}>
        <planeGeometry args={[data.screen.w, data.screen.h]} />
        <meshBasicMaterial map={scr.t} toneMapped={false} />
      </mesh>

      {/* LEDs + glow */}
      <instancedMesh ref={ledMesh} args={[undefined, undefined, data.leds.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={glowMesh} args={[undefined, undefined, data.leds.length]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={glowTex} color="#ffffff" transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </instancedMesh>

      {/* fans */}
      {data.fans.map((f, i) => (
        <group key={i} position={[f.x, f.y, FZ + 0.006]}>
          <mesh>
            <circleGeometry args={[f.r, 32]} />
            <meshBasicMaterial color="#030507" />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <torusGeometry args={[f.r, 0.004, 6, 32]} />
            <meshStandardMaterial color="#3a4256" metalness={0.8} roughness={0.4} />
          </mesh>
          <group ref={(el) => { if (el) fanRefs.current[i] = el; }} position={[0, 0, 0.004]}>
            {Array.from({ length: 7 }, (_, b) => (
              <group key={b} rotation-z={(b / 7) * Math.PI * 2}>
                <mesh position={[f.r * 0.5, 0, 0]} rotation-x={0.55}>
                  <boxGeometry args={[f.r * 0.62, f.r * 0.28, 0.003]} />
                  <meshStandardMaterial color="#222b3d" metalness={0.6} roughness={0.5} />
                </mesh>
              </group>
            ))}
            <mesh rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[f.r * 0.2, f.r * 0.2, 0.012, 16]} />
              <meshStandardMaterial color="#0d1119" metalness={0.9} roughness={0.3} />
            </mesh>
          </group>
          <mesh position={[0, 0, 0.007]}>
            <circleGeometry args={[f.r * 0.95, 32]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.06} depthWrite={false} />
          </mesh>
        </group>
      ))}

      {/* cables + pulses */}
      {cables.map((c, i) => (
        <mesh key={i} geometry={c.geo}>
          <meshStandardMaterial color={c.color} roughness={0.5} metalness={0.1} />
        </mesh>
      ))}
      <instancedMesh ref={pulseMesh} args={[undefined, undefined, CABLES * 2]}>
        <sphereGeometry args={[0.011, 8, 8]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>

      {/* glass door */}
      <group ref={door} position={[-0.51, 0, 0.53]}>
        <mesh position={[0.51, 0, 0]}>
          <planeGeometry args={[1.0, 4.2]} />
          <meshPhysicalMaterial color="#8fdcff" transparent opacity={0.07} roughness={0.04} metalness={0} clearcoat={1} envMapIntensity={2.4} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        {[[0.51, 2.1, 1.04, 0.04], [0.51, -2.1, 1.04, 0.04], [0, 0, 0.04, 4.24], [1.02, 0, 0.04, 4.24]].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0]}>
            <boxGeometry args={[w, h, 0.03]} />
            <meshStandardMaterial color="#0b0e15" metalness={0.9} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0.96, 0, 0.02]}>
          <boxGeometry args={[0.02, 0.5, 0.03]} />
          <meshStandardMaterial color="#6b7488" metalness={1} roughness={0.25} />
        </mesh>
      </group>

      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.02} color="#67e8f9" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>

      {pool.map((s, i) => (
        <primitive key={i} object={s.mesh} />
      ))}
    </group>
  );
}

export default function ServerRack() {
  const path = usePathname();
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(14,116,144,0.18),transparent_60%),#03050a]"
      />
      <div className="pointer-events-none fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0.15, 9], fov: 34 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
          <Environment resolution={256} frames={1}>
            <group rotation={[-Math.PI / 3, 0, 1]}>
              <Lightformer form="rect" intensity={3} position={[0, 5, -5]} scale={[10, 10, 1]} color="#ffffff" />
              <Lightformer form="ring" intensity={5} position={[-5, 1, -1]} scale={10} color="#22d3ee" />
              <Lightformer form="rect" intensity={3} position={[6, -2, 2]} scale={[6, 8, 1]} color="#a855f7" />
            </group>
          </Environment>
          <Rack path={path} />
        </Canvas>
      </div>
    </>
  );
}
