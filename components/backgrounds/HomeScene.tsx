"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Stage, damp, usePointer } from "./shared";

const N = 360; // shards: 20x18 wall = 12x30 tunnel = 18x20 pot
const M = 70; // packets
const FAN_X = [0.5, 1.28];
const UNIT_Y = [1.03, 0, -1.03];
const BAY_X = [0, 1, 2, 3, 4].map((c) => -1.45 + c * 0.29);
const DIRS: [number, number, number][] = [[-1.2, 1.1, 0.6], [1.5, 0.1, 1.1], [-0.5, -1.2, 0.8]];
const ROTS: [number, number, number][] = [[0.8, -1.1, 0.5], [-0.4, 1.3, -0.7], [0.6, 0.9, 1.1]];
const HEX = ["#22d3ee", "#ff6a3d", "#4f8cff", "#fbbf24"];
const COLS = HEX.map((h) => new THREE.Color(h));
const LED_BASE = ["#34d399", "#fbbf24", "#38bdf8"].map((h) => new THREE.Color(h));
const POSE_RY = [-0.55, 0.28, -0.42, 0.45];
const POSE_RX = [0.12, 0, 0.2, 0.28];
const POSE_X = [0.22, 0.24, 0.2, 0.23];
const POSE_S = [1.5, 1.35, 1.3, 1.35];

const LABELS = [
  { n: "01", t: "Server", d: "Where every service lives." },
  { n: "02", t: "Firewall", d: "Filters traffic and blocks attacks." },
  { n: "03", t: "VPN", d: "An encrypted tunnel for safe access." },
  { n: "04", t: "Honeypot", d: "A decoy that traps attackers." },
];

const lerp = THREE.MathUtils.lerp;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const sm = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/* ------------------------------------------------------------------ */
/* shard targets: server skin, firewall wall, VPN tunnel, honeypot      */
/* ------------------------------------------------------------------ */
type Shape = { p: Float32Array; q: THREE.Quaternion[]; s: Float32Array };
const emptyShape = (): Shape => ({
  p: new Float32Array(N * 3),
  q: Array.from({ length: N }, () => new THREE.Quaternion()),
  s: new Float32Array(N * 3),
});

const PROFILE: [number, number][] = [[0, 0.7], [0.07, 1.05], [0.3, 1.5], [0.55, 1.4], [0.78, 0.85], [0.9, 0.7], [1, 0.95]];
function prof(h: number) {
  for (let i = 0; i < PROFILE.length - 1; i++) {
    const [h0, r0] = PROFILE[i];
    const [h1, r1] = PROFILE[i + 1];
    if (h <= h1) return r0 + ((r1 - r0) * (h - h0)) / (h1 - h0);
  }
  return PROFILE[PROFILE.length - 1][1];
}

function buildShapes() {
  const eul = new THREE.Euler();
  const S0 = emptyShape();
  const S1 = emptyShape();
  const S2 = emptyShape();
  const S3 = emptyShape();

  // 0: random points on the server's surface (hidden until the break)
  const dim = [3.4, 3.1, 1.9];
  for (let i = 0; i < N; i++) {
    const f = Math.floor(Math.random() * 6);
    const ax = f >> 1;
    const sg = f & 1 ? 1 : -1;
    const v = [(Math.random() - 0.5) * dim[0], (Math.random() - 0.5) * dim[1], (Math.random() - 0.5) * dim[2]];
    v[ax] = (sg * dim[ax]) / 2;
    S0.p.set(v, i * 3);
    S0.s.set([0.22, 0.22, 0.22], i * 3);
    S0.q[i].setFromEuler(eul.set(Math.random() * 6, Math.random() * 6, Math.random() * 6));
  }

  // 1: firewall, a staggered brick wall
  const cols = 20;
  const rows = 18;
  const bw = 0.23;
  const bh = 0.2;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x = (c - (cols - 1) / 2) * bw + (r % 2 ? bw / 2 : 0) - bw / 4;
      const y = (r - (rows - 1) / 2) * bh;
      S1.p.set([x, y, (Math.random() - 0.5) * 0.03], i * 3);
      S1.s.set([bw * 0.92, bh * 0.86, 0.14], i * 3);
    }

  // 2: VPN, rings of tiles around a tunnel axis
  const rings = 12;
  const per = 30;
  for (let ring = 0; ring < rings; ring++)
    for (let k = 0; k < per; k++) {
      const i = ring * per + k;
      const a = (k / per) * Math.PI * 2 + ring * 0.2;
      const R = 1.35;
      S2.p.set([Math.cos(a) * R, Math.sin(a) * R, (ring - (rings - 1) / 2) * 0.62], i * 3);
      S2.q[i].setFromEuler(eul.set(0, 0, a + Math.PI / 2));
      S2.s.set([((Math.PI * 2 * R) / per) * 0.88, 0.07, 0.3], i * 3);
    }

  // 3: honeypot, tiles on a pot-shaped surface of revolution
  const prow = 18;
  const pper = 20;
  for (let row = 0; row < prow; row++) {
    const h = row / (prow - 1);
    const y = -1.7 + h * 3.4;
    const R = prof(h);
    for (let k = 0; k < pper; k++) {
      const i = row * pper + k;
      const a = (k / pper) * Math.PI * 2 + (row % 2) * (Math.PI / pper);
      S3.p.set([Math.cos(a) * R, y, Math.sin(a) * R], i * 3);
      S3.q[i].setFromEuler(eul.set(0, -a - Math.PI / 2, 0));
      S3.s.set([((Math.PI * 2 * R) / pper) * 0.92, (3.4 / (prow - 1)) * 0.95, 0.07], i * 3);
    }
  }

  const burst = new Float32Array(N * 3);
  const spin = new Float32Array(N * 3);
  const delay = new Float32Array(N);
  const bright = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const m = 1.8 + Math.random() * 2.4;
    burst[i * 3] = (Math.random() - 0.5) * 2 * m;
    burst[i * 3 + 1] = (Math.random() - 0.5) * 2 * m;
    burst[i * 3 + 2] = Math.random() * m;
    for (let j = 0; j < 3; j++) spin[i * 3 + j] = (Math.random() - 0.5) * 10;
    delay[i] = Math.random() * 0.38;
    bright[i] = 0.7 + Math.random() * 0.6;
  }
  return { shapes: [S0, S1, S2, S3], burst, spin, delay, bright };
}

/* ------------------------------------------------------------------ */
/* shared server resources                                              */
/* ------------------------------------------------------------------ */
function makeRes() {
  const W = 3.4;
  const H = 0.95;
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2, -H / 2);
  shape.lineTo(W / 2, -H / 2);
  shape.lineTo(W / 2, H / 2);
  shape.lineTo(-W / 2, H / 2);
  shape.closePath();
  FAN_X.forEach((x) => {
    const hole = new THREE.Path();
    hole.absarc(x, 0, 0.37, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  });

  const b = new THREE.Shape();
  b.moveTo(0.06, -0.03);
  b.bezierCurveTo(0.14, -0.085, 0.27, -0.1, 0.33, -0.04);
  b.bezierCurveTo(0.35, 0.02, 0.3, 0.075, 0.2, 0.085);
  b.bezierCurveTo(0.13, 0.085, 0.09, 0.06, 0.06, 0.035);
  b.closePath();

  return {
    panel: new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: false, curveSegments: 48 }),
    blade: new THREE.ExtrudeGeometry(b, { depth: 0.006, bevelEnabled: false }),
    rim: new THREE.TorusGeometry(0.37, 0.012, 8, 64),
    grille: [0.12, 0.22, 0.33].map((r) => new THREE.TorusGeometry(r, 0.004, 6, 48)),
    spoke: new THREE.BoxGeometry(0.68, 0.006, 0.006),
    hub: new THREE.CylinderGeometry(0.07, 0.07, 0.04, 20),
    cap: new THREE.CircleGeometry(0.045, 20),
    bay: new THREE.BoxGeometry(0.26, 0.34, 0.03),
    handle: new THREE.BoxGeometry(0.2, 0.022, 0.02),
    led: new THREE.BoxGeometry(0.045, 0.045, 0.02),
    mPanel: new THREE.MeshStandardMaterial({ color: "#161d2b", metalness: 0.8, roughness: 0.38 }),
    mBody: new THREE.MeshStandardMaterial({ color: "#0d1220", metalness: 0.8, roughness: 0.45 }),
    mBlade: new THREE.MeshStandardMaterial({ color: "#34415a", metalness: 0.55, roughness: 0.42, side: THREE.DoubleSide }),
    mMetal: new THREE.MeshStandardMaterial({ color: "#5a667d", metalness: 0.9, roughness: 0.3 }),
    mHub: new THREE.MeshStandardMaterial({ color: "#0b0f17", metalness: 0.9, roughness: 0.3 }),
    mBay: new THREE.MeshStandardMaterial({ color: "#0a0e17", metalness: 0.6, roughness: 0.5 }),
    mHandle: new THREE.MeshStandardMaterial({ color: "#2c3548", metalness: 0.9, roughness: 0.3 }),
    mAccent: new THREE.MeshBasicMaterial({ color: "#22d3ee", toneMapped: false }),
    mLed: LED_BASE.map((c) => new THREE.MeshBasicMaterial({ color: c.clone(), toneMapped: false })),
  };
}
type Res = ReturnType<typeof makeRes>;

type Reg = React.MutableRefObject<(THREE.Group | null)[]>;
type RegM = React.MutableRefObject<(THREE.Mesh | null)[]>;

function Fan({ x, idx, res, fans, blurs }: { x: number; idx: number; res: Res; fans: Reg; blurs: RegM }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh geometry={res.rim} material={res.mMetal} position={[0, 0, 0.14]} />
      {res.grille.map((g, i) => (
        <mesh key={i} geometry={g} material={res.mMetal} position={[0, 0, 0.125]} />
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={i} geometry={res.spoke} material={res.mMetal} position={[0, 0, 0.125]} rotation-z={(i * Math.PI) / 3} />
      ))}
      <mesh
        ref={(el) => {
          blurs.current[idx] = el;
        }}
        position={[0, 0, 0.1]}
      >
        <circleGeometry args={[0.33, 40]} />
        <meshBasicMaterial color="#9fb4d0" transparent opacity={0.08} depthWrite={false} />
      </mesh>
      <group
        ref={(el) => {
          fans.current[idx] = el;
        }}
        position={[0, 0, 0.06]}
      >
        {Array.from({ length: 9 }, (_, b) => (
          <group key={b} rotation-z={(b / 9) * Math.PI * 2}>
            <mesh geometry={res.blade} material={res.mBlade} rotation-x={0.55} />
          </group>
        ))}
        <mesh geometry={res.hub} material={res.mHub} rotation-x={Math.PI / 2} />
        <mesh geometry={res.cap} material={res.mMetal} position={[0, 0, 0.022]} />
      </group>
    </group>
  );
}

function radialTex() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.4, "rgba(255,255,255,0.25)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------------ */
/* the scene                                                            */
/* ------------------------------------------------------------------ */
function Scene({ onStage }: { onStage: (n: number) => void }) {
  const pointer = usePointer();
  const res = useMemo(makeRes, []);
  const data = useMemo(buildShapes, []);
  const haloTex = useMemo(radialTex, []);
  const pArr = useMemo(() => new Float32Array(M * 3), []);
  const pSeed = useMemo(() => Float32Array.from({ length: M * 4 }, () => Math.random()), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmp = useMemo(
    () => ({ qa: new THREE.Quaternion(), qt: new THREE.Quaternion(), eul: new THREE.Euler(), c: new THREE.Color(), sc: new THREE.Color() }),
    []
  );

  const root = useRef<THREE.Group>(null!);
  const serverRef = useRef<THREE.Group>(null!);
  const units = useRef<(THREE.Group | null)[]>([]);
  const fans = useRef<(THREE.Group | null)[]>([]);
  const blurs = useRef<(THREE.Mesh | null)[]>([]);
  const shards = useRef<THREE.InstancedMesh>(null!);
  const shardMat = useRef<THREE.MeshStandardMaterial>(null!);
  const key = useRef<THREE.PointLight>(null!);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null!);
  const wallMat = useRef<THREE.MeshBasicMaterial>(null!);
  const coreMat = useRef<THREE.MeshBasicMaterial>(null!);
  const honeyMat = useRef<THREE.MeshBasicMaterial>(null!);
  const honeyLight = useRef<THREE.PointLight>(null!);
  const pts = useRef<THREE.Points>(null!);
  const pm = useRef<THREE.PointsMaterial>(null!);
  const st = useRef({ p: 0, lastY: 0, vel: 0, idx: -1 });

  useLayoutEffect(() => {
    const m = shards.current;
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const A = st.current;

    /* scroll progress, smoothed. The morph is finished before the footer. */
    const sy = window.scrollY;
    const foot = document.getElementById("footer");
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const usable = Math.max(window.innerHeight, max - (foot ? foot.offsetHeight * 0.85 : 0));
    A.p = damp(A.p, clamp01(sy / usable), 5, dt);
    A.vel = damp(A.vel, Math.abs(sy - A.lastY) / Math.max(dt, 0.001), 6, dt);
    A.lastY = sy;

    /* stage: each object holds, then morphs into the next */
    const seg = A.p * 3;
    const k = Math.min(2, Math.floor(seg));
    const tf = sm(0.3, 0.75, seg - k);
    const S = k + tf;
    const w1 = clamp01(1 - Math.abs(S - 1));
    const w2 = clamp01(1 - Math.abs(S - 2));
    const w3 = clamp01(1 - Math.abs(S - 3));
    const idx = Math.min(3, Math.round(S));
    if (idx !== A.idx) {
      A.idx = idx;
      onStage(idx);
    }

    /* server: units fly apart, then vanish */
    const srv = serverRef.current;
    srv.visible = k === 0;
    const b = k === 0 ? sm(0, 0.6, tf) : 0;
    const sScale = Math.max(0.0001, k === 0 ? 1 - sm(0.35, 0.85, tf) : 0);
    units.current.forEach((g, i) => {
      if (!g) return;
      g.position.set(DIRS[i][0] * b * 4, UNIT_Y[i] + DIRS[i][1] * b * 4, DIRS[i][2] * b * 4);
      g.rotation.set(ROTS[i][0] * b * 2.5, ROTS[i][1] * b * 2.5, ROTS[i][2] * b * 2.5);
      g.scale.setScalar(sScale);
    });

    /* fans: spin faster the faster you scroll */
    const speed = (12 + Math.min(A.vel * 0.012, 28)) * (1 + b * 3);
    fans.current.forEach((f, i) => {
      if (f) f.rotation.z -= dt * speed * (1 + (i % 3) * 0.04);
    });
    const blurOp = Math.min(0.34, 0.05 + speed * 0.007);
    blurs.current.forEach((m) => {
      if (m) (m.material as THREE.MeshBasicMaterial).opacity = blurOp;
    });

    /* LEDs */
    res.mLed[0].color.copy(LED_BASE[0]).multiplyScalar(0.7 + 0.3 * Math.sin(t * 2));
    res.mLed[1].color.copy(LED_BASE[1]).multiplyScalar(Math.sin(t * 13) * Math.sin(t * 5.3) > 0.1 ? 1 : 0.15);
    res.mLed[2].color.copy(LED_BASE[2]).multiplyScalar(0.6 + 0.4 * Math.sin(t * 0.8));

    /* stage colour drives lights, glow and shard emissive */
    tmp.sc.copy(COLS[k]).lerp(COLS[k + 1], tf);
    key.current.color.copy(tmp.sc);
    shardMat.current.emissive.copy(tmp.sc).multiplyScalar(0.16);
    haloMat.current.color.copy(tmp.sc);

    /* shards: break off, tumble, reassemble as the next object */
    const SA = data.shapes[k];
    const SB = data.shapes[k + 1];
    const m = shards.current;
    const ca = m.instanceColor!.array as Float32Array;
    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      const ti = clamp01((tf - data.delay[i]) / 0.62);
      const e = ti * ti * (3 - 2 * ti);
      const arc = Math.sin(Math.PI * ti);
      dummy.position.set(
        SA.p[i3] + (SB.p[i3] - SA.p[i3]) * e + data.burst[i3] * arc,
        SA.p[i3 + 1] + (SB.p[i3 + 1] - SA.p[i3 + 1]) * e + data.burst[i3 + 1] * arc,
        SA.p[i3 + 2] + (SB.p[i3 + 2] - SA.p[i3 + 2]) * e + data.burst[i3 + 2] * arc
      );
      tmp.qa.slerpQuaternions(SA.q[i], SB.q[i], e);
      tmp.eul.set(data.spin[i3] * arc, data.spin[i3 + 1] * arc, data.spin[i3 + 2] * arc);
      tmp.qt.setFromEuler(tmp.eul);
      dummy.quaternion.multiplyQuaternions(tmp.qt, tmp.qa);
      const ap = k === 0 ? sm(0, 0.45, ti) : 1;
      dummy.scale.set(
        lerp(SA.s[i3], SB.s[i3], e) * ap,
        lerp(SA.s[i3 + 1], SB.s[i3 + 1], e) * ap,
        lerp(SA.s[i3 + 2], SB.s[i3 + 2], e) * ap
      );
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      tmp.c.copy(COLS[k]).lerp(COLS[k + 1], e).multiplyScalar(data.bright[i]);
      ca[i3] = tmp.c.r;
      ca[i3 + 1] = tmp.c.g;
      ca[i3 + 2] = tmp.c.b;
    }
    m.instanceMatrix.needsUpdate = true;
    m.instanceColor!.needsUpdate = true;

    /* extras that belong to one object each */
    wallMat.current.opacity = w1 * 0.28;
    coreMat.current.opacity = w2 * 0.7;
    honeyMat.current.opacity = w3 * 0.95;
    honeyLight.current.intensity = w3 * 30;

    /* packets: attackers hit the wall, data flows in the tunnel, bait swirls into the pot */
    const tot = w1 + w2 + w3;
    if (tot > 0.001) {
      for (let i = 0; i < M; i++) {
        const s0 = pSeed[i * 4];
        const s1 = pSeed[i * 4 + 1];
        const s2 = pSeed[i * 4 + 2];
        const s3 = pSeed[i * 4 + 3];
        const u = (t * 0.2 * (0.6 + s1 * 0.8) + s0) % 1;
        let X = 0;
        let Y = 0;
        let Z = 0;
        if (w1 > 0.001) {
          const tx = (s2 - 0.5) * 4.4;
          const ty = (s3 - 0.5) * 3.4;
          let fx: number;
          let fy: number;
          let fz: number;
          if (u < 0.62) {
            const kk = u / 0.62;
            const ee = kk * kk;
            fx = lerp(tx * 1.9, tx, ee);
            fy = lerp(ty * 1.9, ty, ee);
            fz = lerp(6, 0.25, ee);
          } else {
            const kb = (u - 0.62) / 0.38;
            fx = tx * (1 + 0.7 * kb);
            fy = ty * (1 + 0.7 * kb) + kb * (1 - kb) * 0.9;
            fz = 0.25 + kb * 2;
          }
          X += w1 * fx;
          Y += w1 * fy;
          Z += w1 * fz;
        }
        if (w2 > 0.001) {
          const a = s0 * 6.2832 + u * 5;
          const r = 0.2 + s2 * 0.85;
          X += w2 * r * Math.cos(a);
          Y += w2 * r * Math.sin(a);
          Z += w2 * lerp(-3.2, 3.2, u);
        }
        if (w3 > 0.001) {
          const th = s2 * 6.2832;
          const ph = Math.acos(2 * s3 - 1);
          const sx = 4.2 * Math.sin(ph) * Math.cos(th);
          const sy2 = 4.2 * Math.cos(ph) - 1.9;
          const sz = 4.2 * Math.sin(ph) * Math.sin(th);
          const ee = u * u * (3 - 2 * u);
          const ang = u * 3.2;
          const c = Math.cos(ang);
          const sn = Math.sin(ang);
          const mm = 1 - ee;
          X += w3 * (sx * c + sz * sn) * mm;
          Y += w3 * (1.9 + sy2 * mm);
          Z += w3 * (-sx * sn + sz * c) * mm;
        }
        pArr[i * 3] = X / tot;
        pArr[i * 3 + 1] = Y / tot;
        pArr[i * 3 + 2] = Z / tot;
      }
      pts.current.geometry.attributes.position.needsUpdate = true;
      pm.current.color.setRGB(
        (1 * w1 + 0.5 * w2 + 1 * w3) / tot,
        (0.23 * w1 + 0.85 * w2 + 0.75 * w3) / tot,
        (0.36 * w1 + 1 * w2 + 0.15 * w3) / tot
      );
    }
    pm.current.opacity = Math.min(1, tot) * 0.95;

    /* 3D movement of the whole object */
    const pick = (arr: number[]) => arr[k] + (arr[k + 1] - arr[k]) * tf;
    const g = root.current;
    const narrow = state.size.width < 768;
    g.position.x = damp(g.position.x, (narrow ? 0 : pick(POSE_X)) * state.viewport.width, 3, dt);
    g.position.y = damp(g.position.y, (narrow ? -1.2 : 0) + Math.sin(t * 0.6) * 0.12, 3, dt);
    g.scale.setScalar(damp(g.scale.x, (narrow ? 0.62 : 1) * pick(POSE_S), 3, dt));
    g.rotation.y = damp(
      g.rotation.y,
      pick(POSE_RY) + Math.sin(t * 0.4) * 0.12 + Math.sin(A.p * Math.PI * 3) * 0.3 + pointer.current.x * 0.25,
      4,
      dt
    );
    g.rotation.x = damp(g.rotation.x, pick(POSE_RX) - pointer.current.y * 0.15, 4, dt);
  });

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 6]} intensity={1.2} color="#dbeafe" />
      <pointLight ref={key} position={[-4, 3, 6]} intensity={90} distance={26} />
      <pointLight position={[5, -3, 4]} intensity={45} color="#a78bfa" distance={22} />

      <group ref={root}>
        <mesh position={[0, 0, -2.2]}>
          <planeGeometry args={[11, 11]} />
          <meshBasicMaterial
            ref={haloMat}
            map={haloTex}
            color="#22d3ee"
            transparent
            opacity={0.4}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>

        {/* the server: three 2U units with real fans */}
        <group ref={serverRef} position={[0, 0, 0.85]}>
          {UNIT_Y.map((y, ui) => (
            <group
              key={ui}
              ref={(el) => {
                units.current[ui] = el;
              }}
              position={[0, y, 0]}
            >
              <mesh position={[0, 0, -0.95]} material={res.mBody}>
                <boxGeometry args={[3.4, 0.93, 1.9]} />
              </mesh>
              <mesh geometry={res.panel} material={res.mPanel} />
              <mesh position={[0, 0.45, 0.146]} material={res.mAccent}>
                <boxGeometry args={[3.4, 0.012, 0.012]} />
              </mesh>
              {[-1, 1].map((sd) => (
                <mesh key={sd} position={[sd * 1.76, 0, 0.07]} material={res.mHandle}>
                  <boxGeometry args={[0.14, 0.95, 0.14]} />
                </mesh>
              ))}
              {BAY_X.map((bx) =>
                [0.2, -0.2].map((by) => (
                  <group key={`${bx}-${by}`} position={[bx, by, 0.14]}>
                    <mesh geometry={res.bay} material={res.mBay} />
                    <mesh geometry={res.handle} material={res.mHandle} position={[0, 0.12, 0.02]} />
                  </group>
                ))
              )}
              {[0.25, 0, -0.25].map((ly, li) => (
                <mesh key={li} geometry={res.led} material={res.mLed[li]} position={[-0.02, ly, 0.15]} />
              ))}
              {FAN_X.map((fx, fi) => (
                <Fan key={fi} x={fx} idx={ui * 2 + fi} res={res} fans={fans} blurs={blurs} />
              ))}
            </group>
          ))}
        </group>

        {/* shards: they become the wall, the tunnel and the pot */}
        <instancedMesh ref={shards} args={[undefined, undefined, N]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial ref={shardMat} color="#ffffff" metalness={0.55} roughness={0.35} />
        </instancedMesh>

        {/* fire behind the firewall bricks */}
        <mesh position={[0, 0, -0.2]}>
          <planeGeometry args={[4.8, 3.9]} />
          <meshBasicMaterial
            ref={wallMat}
            color="#ff5a2a"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>

        {/* VPN core line */}
        <mesh rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.035, 0.035, 7, 10]} />
          <meshBasicMaterial
            ref={coreMat}
            color="#7dd3fc"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>

        {/* honey */}
        <mesh position={[0, 1.45, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.7, 48]} />
          <meshBasicMaterial ref={honeyMat} color="#fbbf24" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <pointLight ref={honeyLight} position={[0, 1.2, 0]} color="#fbbf24" intensity={0} distance={6} />

        {/* packets */}
        <points ref={pts} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[pArr, 3]} />
          </bufferGeometry>
          <pointsMaterial
            ref={pm}
            size={0.09}
            sizeAttenuation
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            color="#ff3b5c"
          />
        </points>
      </group>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* label showing which object you are looking at                       */
/* ------------------------------------------------------------------ */
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
        <div style={{ color: HEX[stage], fontSize: 12, letterSpacing: "0.3em" }}>{L.n} / 04</div>
        <div style={{ color: "#fff", fontSize: 28, fontWeight: 700, marginTop: 4 }}>{L.t}</div>
        <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>{L.d}</div>
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 12 }}>
        {HEX.map((c, i) => (
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
      <Stage camera={[0, 0, 10]}>
        <Scene onStage={setStage} />
      </Stage>
      <Label stage={stage} />
    </>
  );
}
