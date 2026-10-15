"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Stage, damp, usePointer } from "./shared";

/* BEGIN PURE */
const P = 140000; // particles
const HEX_A = ["#22d3ee", "#ff2d55", "#34d399", "#3b9cff"];
const HEX_B = ["#a78bfa", "#ff9f0a", "#22d3ee", "#7df9ff"];
const ACCENT = ["#22d3ee", "#ff2d55", "#34d399", "#3b9cff"];
const rnd = Math.random;
const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 2;

/* ---- shape 0: a spiral galaxy ---- */
function galaxy(n: number): Float32Array {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    let x: number;
    let y: number;
    let z: number;
    if (rnd() < 0.12) {
      const r = Math.pow(rnd(), 2.2) * 1.4;
      const th = rnd() * 6.2832;
      const ph = Math.acos(2 * rnd() - 1);
      x = r * Math.sin(ph) * Math.cos(th);
      y = r * Math.cos(ph) * 0.45;
      z = r * Math.sin(ph) * Math.sin(th);
    } else {
      const r = 0.4 + Math.pow(rnd(), 0.65) * 5.4;
      const arm = Math.floor(rnd() * 3);
      const a = r * 1.15 + arm * 2.0944 + gauss() * (2.0 / (0.6 + r * 0.45));
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
      y = gauss() * 0.9 * Math.exp(-r * 0.3);
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

/* ---- shapes 1-3: draw a picture on a canvas, then scatter particles over it ---- */
function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const k = 2 * r + 1;
  const cx = (x: number) => Math.min(w - 1, Math.max(0, x));
  const cy = (y: number) => Math.min(h - 1, Math.max(0, y));
  for (let y = 0; y < h; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[y * w + cx(x)];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc / k;
      acc += src[y * w + cx(x + r + 1)] - src[y * w + cx(x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[cy(y) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / k;
      acc += tmp[cy(y + r + 1) * w + x] - tmp[cy(y - r) * w + x];
    }
  }
  return out;
}

type Draw = (c: CanvasRenderingContext2D, w: number, h: number) => void;

function raster(draw: Draw, w: number, h: number, sx: number, sy: number, depth: number, n: number): Float32Array {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const c = cv.getContext("2d", { willReadFrequently: true })!;
  draw(c, w, h);
  const a = c.getImageData(0, 0, w, h).data;
  const m = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) m[i] = a[i * 4 + 3] > 128 ? 1 : 0;
  const lit: number[] = [];
  const edge: number[] = [];
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!m[i]) continue;
      lit.push(i);
      if (!m[i - 1] || !m[i + 1] || !m[i - w] || !m[i + w]) edge.push(i);
    }
  // interior depth: blurred mask, so the middle of a shape bulges and the rim is thin
  const bl = boxBlur(boxBlur(m, w, h, Math.round(Math.min(w, h) * 0.07)), w, h, Math.round(Math.min(w, h) * 0.04));
  let mx = 0;
  for (let i = 0; i < bl.length; i++) if (bl[i] > mx) mx = bl[i];
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const useEdge = edge.length > 0 && rnd() < 0.3;
    const idx = useEdge ? edge[Math.floor(rnd() * edge.length)] : lit[Math.floor(rnd() * lit.length)];
    const px = idx % w;
    const py = (idx / w) | 0;
    const d = bl[idx] / mx;
    out[i * 3] = ((px + rnd()) / w - 0.5) * sx;
    out[i * 3 + 1] = -((py + rnd()) / h - 0.5) * sy;
    out[i * 3 + 2] = (rnd() * 2 - 1) * depth * Math.pow(d, 0.8) + (useEdge ? gauss() * 0.12 : 0);
  }
  return out;
}

const drawSkull: Draw = (c) => {
  c.fillStyle = "#fff";
  c.beginPath();
  c.ellipse(128, 100, 80, 74, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(70, 130);
  c.quadraticCurveTo(66, 170, 92, 178);
  c.lineTo(92, 214);
  c.quadraticCurveTo(128, 228, 164, 214);
  c.lineTo(164, 178);
  c.quadraticCurveTo(190, 170, 186, 130);
  c.closePath();
  c.fill();
  c.globalCompositeOperation = "destination-out";
  c.beginPath();
  c.ellipse(97, 108, 22, 26, -0.15, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(159, 108, 22, 26, 0.15, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(128, 126);
  c.lineTo(115, 156);
  c.quadraticCurveTo(128, 150, 141, 156);
  c.closePath();
  c.fill();
  for (let i = 0; i < 4; i++) c.fillRect(104 + i * 16, 192, 4, 26);
  c.fillRect(92, 186, 72, 4);
};

const drawShield: Draw = (c) => {
  const path = () => {
    c.beginPath();
    c.moveTo(128, 14);
    c.bezierCurveTo(158, 36, 196, 40, 224, 40);
    c.lineTo(224, 120);
    c.bezierCurveTo(224, 182, 178, 222, 128, 246);
    c.bezierCurveTo(78, 222, 32, 182, 32, 120);
    c.lineTo(32, 40);
    c.bezierCurveTo(60, 40, 98, 36, 128, 14);
    c.closePath();
  };
  c.fillStyle = "#fff";
  path();
  c.fill();
  c.globalCompositeOperation = "destination-out";
  c.lineWidth = 12;
  c.save();
  c.translate(128, 134);
  c.scale(0.82, 0.82);
  c.translate(-128, -134);
  path();
  c.stroke();
  c.restore();
  c.beginPath();
  c.arc(128, 110, 21, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(115, 122);
  c.lineTo(141, 122);
  c.lineTo(150, 178);
  c.lineTo(106, 178);
  c.closePath();
  c.fill();
};

/* ---- shape 3: a network globe, with continents and arcs of traffic ---- */
function globe(n: number): Float32Array {
  const out = new Float32Array(n * 3);
  const R = 3.2;
  const unit = (): number[] => {
    const th = rnd() * 6.2832;
    const z = rnd() * 2 - 1;
    const r = Math.sqrt(1 - z * z);
    return [r * Math.cos(th), z, r * Math.sin(th)];
  };
  const land = (x: number, y: number, z: number) =>
    Math.sin(x * 2.1 + 1.3) * Math.cos(y * 1.9) + Math.sin(z * 2.4 - 0.7) * Math.cos(x * 1.4 + y * 1.1) + 0.5 * Math.sin((x + y + z) * 3.3);
  const nodes: number[][] = [];
  while (nodes.length < 14) {
    const u = unit();
    if (land(u[0], u[1], u[2]) > 0.6) nodes.push(u);
  }
  const arcs: number[][][] = [];
  for (let i = 0; i < 18; i++) {
    const a = Math.floor(rnd() * nodes.length);
    let b = Math.floor(rnd() * nodes.length);
    if (b === a) b = (a + 1) % nodes.length;
    arcs.push([nodes[a], nodes[b]]);
  }
  for (let i = 0; i < n; i++) {
    const q = rnd();
    let x: number;
    let y: number;
    let z: number;
    if (q < 0.6) {
      // surface: continents are dense, oceans are sparse
      let u = unit();
      for (let t = 0; t < 14 && land(u[0], u[1], u[2]) < 0.45 && rnd() < 0.96; t++) u = unit();
      const rr = R * (1 + gauss() * 0.01);
      x = u[0] * rr;
      y = u[1] * rr;
      z = u[2] * rr;
    } else if (q < 0.88) {
      // traffic arcs rising off the surface
      const [a, b] = arcs[Math.floor(rnd() * arcs.length)];
      const t = rnd();
      const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
      const om = Math.acos(dot);
      const so = Math.sin(om) || 1;
      const f1 = Math.sin((1 - t) * om) / so;
      const f2 = Math.sin(t * om) / so;
      let px = a[0] * f1 + b[0] * f2;
      let py = a[1] * f1 + b[1] * f2;
      let pz = a[2] * f1 + b[2] * f2;
      const len = Math.hypot(px, py, pz) || 1;
      const lift = R * (1.01 + Math.sin(Math.PI * t) * Math.min(om, 1.3) * 0.17);
      px = (px / len) * lift;
      py = (py / len) * lift;
      pz = (pz / len) * lift;
      x = px + gauss() * 0.02;
      y = py + gauss() * 0.02;
      z = pz + gauss() * 0.02;
    } else if (q < 0.94) {
      // faint atmosphere
      const u = unit();
      const rr = R * (1.1 + rnd() * 0.07);
      x = u[0] * rr;
      y = u[1] * rr;
      z = u[2] * rr;
    } else {
      // glowing city clusters
      const c = nodes[Math.floor(rnd() * nodes.length)];
      x = c[0] * R * 1.01 + gauss() * 0.16;
      y = c[1] * R * 1.01 + gauss() * 0.16;
      z = c[2] * R * 1.01 + gauss() * 0.16;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

function buildTargets() {
  const aR = new Float32Array(P * 4);
  for (let i = 0; i < aR.length; i++) aR[i] = rnd();
  return {
    t0: galaxy(P),
    t1: raster(drawSkull, 256, 256, 8.8, 8.8, 1.1, P),
    t2: raster(drawShield, 256, 256, 9.0, 9.0, 0.8, P),
    t3: globe(P),
    aR,
  };
}

const VERT = `
uniform float uS;
uniform float uTime;
uniform vec3 uMouse;
uniform float uMouseOn;
uniform float uSize;
uniform float uPix;
uniform vec3 uColA[4];
uniform vec3 uColB[4];
attribute vec3 aT1;
attribute vec3 aT2;
attribute vec3 aT3;
attribute vec4 aR;
varying vec3 vCol;
varying float vA;

void main() {
  // each particle leaves a little earlier or later, so the morph flows instead of snapping
  float tr0 = sin(3.14159265 * fract(uS));
  float s = clamp(uS + (aR.x - 0.5) * 0.7 * tr0, 0.0, 3.0);
  float tr = sin(3.14159265 * fract(s));

  float w0 = clamp(1.0 - abs(s), 0.0, 1.0);
  float w1 = clamp(1.0 - abs(s - 1.0), 0.0, 1.0);
  float w2 = clamp(1.0 - abs(s - 2.0), 0.0, 1.0);
  float w3 = clamp(1.0 - abs(s - 3.0), 0.0, 1.0);

  // galaxy spins faster near the core
  vec3 t0 = position;
  float rr = length(t0.xz);
  float ga = uTime * 0.35 / (0.5 + rr * 0.6);
  float gc = cos(ga);
  float gs = sin(ga);
  t0 = vec3(t0.x * gc - t0.z * gs, t0.y, t0.x * gs + t0.z * gc);

  vec3 t3 = aT3;
  float a3 = uTime * 0.3;
  t3 = vec3(t3.x * cos(a3) - t3.z * sin(a3), t3.y, t3.x * sin(a3) + t3.z * cos(a3));

  vec3 p = t0 * w0 + aT1 * w1 + aT2 * w2 + t3 * w3;

  // while morphing: burst outward, spiral, shake
  vec3 dir = normalize(aR.yzw - 0.5 + vec3(0.001));
  p += dir * tr * tr * (1.5 + aR.w * 4.5);
  float sw = tr * (aR.z - 0.35) * 5.0;
  float cs = cos(sw);
  float sn = sin(sw);
  p.xz = vec2(p.x * cs - p.z * sn, p.x * sn + p.z * cs);
  vec3 wob = vec3(sin(uTime * 1.3 + aR.x * 40.0), sin(uTime * 1.1 + aR.y * 40.0), sin(uTime * 1.7 + aR.z * 40.0));
  p += wob * (0.025 + tr * 0.25);

  // cursor pushes particles away like a hand through smoke
  vec3 dm = p - uMouse;
  float dist = length(dm.xy);
  float push = uMouseOn * smoothstep(2.2, 0.0, dist);
  p.xy += (dm.xy / (dist + 0.001)) * push * 1.1;
  p.z += push * (aR.x - 0.5) * 2.0;

  vec3 cA = uColA[0] * w0 + uColA[1] * w1 + uColA[2] * w2 + uColA[3] * w3;
  vec3 cB = uColB[0] * w0 + uColB[1] * w1 + uColB[2] * w2 + uColB[3] * w3;
  vec3 col = mix(cA, cB, aR.y);
  col += vec3(1.0, 0.85, 0.7) * tr * 0.4;
  col *= 0.8 + 0.2 * sin(uTime * 2.0 + aR.z * 40.0);
  vCol = col;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float dens = (w0 + (w1 + w2) * 0.85 + w3 * 0.6) * (1.0 - tr * 0.35);
  float szk = w0 + (w1 + w2 + w3) * 0.9;
  vA = (1.0 - smoothstep(13.0, 24.0, -mv.z)) * dens;
  gl_PointSize = min(48.0, max(1.0, uSize * szk * (0.45 + aR.w * 1.1) * (1.0 + tr * 0.4) * uPix / -mv.z));
}
`;

const FRAG = `
uniform float uAlpha;
varying vec3 vCol;
varying float vA;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c) * 4.0;
  float a = exp(-d * 5.5);
  if (a < 0.02) discard;
  gl_FragColor = vec4(vCol, a * vA * uAlpha);
}
`;
/* END PURE */

const LABELS = [
  { n: "01", t: "The noise", d: "Billions of packets, every second." },
  { n: "02", t: "The threat", d: "Every system has a weakness." },
  { n: "03", t: "The defense", d: "Find it before an attacker does." },
  { n: "04", t: "The network", d: "Everything is connected. Everything is a target." },
];

const POSE_RX = [-0.9, 0.05, 0.05, 0.4];
const POSE_RY = [0, -0.4, 0.35, 0];
const POSE_X = [0.17, 0.2, 0.2, 0.2];
const POSE_S = [1.05, 0.95, 0.95, 1.0];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const sm = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function Scene({ onStage }: { onStage: (n: number) => void }) {
  const pointer = usePointer();
  const root = useRef<THREE.Group>(null!);
  const st = useRef({ p: 0, idx: -1, on: 0 });
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const geo = useMemo(() => {
    const T = buildTargets();
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(T.t0, 3));
    g.setAttribute("aT1", new THREE.BufferAttribute(T.t1, 3));
    g.setAttribute("aT2", new THREE.BufferAttribute(T.t2, 3));
    g.setAttribute("aT3", new THREE.BufferAttribute(T.t3, 3));
    g.setAttribute("aR", new THREE.BufferAttribute(T.aR, 4));
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uS: { value: 0 },
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector3(999, 999, 0) },
          uMouseOn: { value: 0 },
          uSize: { value: 0.055 },
          uPix: { value: 800 },
          uAlpha: { value: 0.7 },
          uColA: { value: HEX_A.map((h) => new THREE.Color(h)) },
          uColB: { value: HEX_B.map((h) => new THREE.Color(h)) },
        },
      }),
    []
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const A = st.current;
    const cam = state.camera as THREE.PerspectiveCamera;

    /* scroll progress, smoothed. The morph is finished before the footer. */
    const foot = document.getElementById("footer");
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const usable = Math.max(window.innerHeight, max - (foot ? foot.offsetHeight * 0.85 : 0));
    A.p = damp(A.p, clamp01(window.scrollY / usable), 5, dt);

    /* each shape holds for a while, then breaks into the next */
    const seg = A.p * 3;
    const k = Math.min(2, Math.floor(seg));
    const tf = sm(0.3, 0.75, seg - k);
    const S = k + tf;
    const idx = Math.min(3, Math.round(S));
    if (idx !== A.idx) {
      A.idx = idx;
      onStage(idx);
    }

    /* camera: slow dolly in while you scroll, drifts with the mouse */
    cam.position.x = damp(cam.position.x, pointer.current.x * 0.6, 2, dt);
    cam.position.y = damp(cam.position.y, pointer.current.y * 0.4 + 0.3, 2, dt);
    cam.position.z = damp(cam.position.z, 10.5 - A.p * 1.8, 2, dt);
    cam.lookAt(0, 0, 0);

    /* world size at the object's depth, for placement and the cursor */
    const hh = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z;
    const ww = (hh * state.size.width) / state.size.height;

    const pick = (arr: number[]) => arr[k] + (arr[k + 1] - arr[k]) * tf;
    const g = root.current;
    const narrow = state.size.width < 768;
    g.position.x = damp(g.position.x, (narrow ? 0 : pick(POSE_X)) * ww, 3, dt);
    g.position.y = damp(g.position.y, narrow ? -1.2 : 0, 3, dt);
    g.scale.setScalar(damp(g.scale.x, (narrow ? 0.6 : 1) * pick(POSE_S), 3, dt));
    g.rotation.x = damp(g.rotation.x, pick(POSE_RX) - pointer.current.y * 0.1, 3, dt);
    g.rotation.y = damp(
      g.rotation.y,
      pick(POSE_RY) + Math.sin(t * 0.45) * 0.22 + Math.sin(A.p * Math.PI * 3) * 0.25 + pointer.current.x * 0.2,
      3,
      dt
    );
    g.updateMatrixWorld();

    /* uniforms */
    const u = mat.uniforms;
    u.uS.value = S;
    u.uTime.value = t;
    u.uPix.value = (state.gl.getPixelRatio() * state.size.height) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
    const moved = pointer.current.x !== 0 || pointer.current.y !== 0;
    A.on = damp(A.on, moved ? 1 : 0, 3, dt);
    u.uMouseOn.value = A.on;
    tmp.set((pointer.current.x * ww) / 2, (pointer.current.y * hh) / 2, 0);
    g.worldToLocal(tmp);
    u.uMouse.value.copy(tmp);
  });

  return (
    <group ref={root}>
      <points geometry={geo} material={mat} frustumCulled={false} />
    </group>
  );
}

function Label({ stage }: { stage: number }) {
  const L = LABELS[stage];
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        right: "4vw",
        top: 104,
        textAlign: "right",
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
        pointerEvents: "none",
      }}
    >
      <style>{`@keyframes homeStageIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
      <div key={stage} style={{ animation: "homeStageIn .5s ease-out both" }}>
        <div style={{ color: ACCENT[stage], fontSize: 12, letterSpacing: "0.3em" }}>{L.n} / 04</div>
        <div style={{ color: "#fff", fontSize: 28, fontWeight: 700, marginTop: 4 }}>{L.t}</div>
        <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>{L.d}</div>
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 12 }}>
        {ACCENT.map((c, i) => (
          <span
            key={i}
            style={{
              height: 4,
              width: i === stage ? 28 : 10,
              borderRadius: 2,
              background: i === stage ? c : "rgba(255,255,255,0.2)",
              transition: "all .4s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomeScene() {
  const [stage, setStage] = useState(0);
  return (
    <>
      <Stage camera={[0, 0, 10.5]}>
        <Scene onStage={setStage} />
      </Stage>
      <Label stage={stage} />
    </>
  );
}
