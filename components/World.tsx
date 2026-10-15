"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";

// ---------- rack dimensions ----------
const W = 1.2;
const D = 1.0;
const H = 3.8;
const U = 0.28; // height of one slot
const FRONT = D / 2 - 0.05; // z of the front plates
const FLOOR = -2.1;
const BASE = H / 2 + 0.075; // from the rack centre down to the feet
const FLOOR_LOCAL = -BASE + 0.035; // the floor, in rack space

const UNITS = [
  "ups", "server", "server", "fan", "drawer", "server",
  "switch", "server", "server", "fan", "server", "monitor",
] as const;
const NAMES = ["UPS-01", "SRV-01", "SRV-02", "FAN-A", "SRV-03", "SRV-04", "SW-01", "SRV-05", "SRV-06", "FAN-B", "SRV-07", "MON-01"];
const MODES = ["IDLE", "SCAN", "TRANSFER", "ALERT"];

const unitY = (i: number) => -H / 2 + 0.22 + U / 2 + i * U;
const SERVERS = UNITS.map((t, i) => (t === "server" ? i : -1)).filter((i) => i >= 0);
const FANS = UNITS.map((t, i) => (t === "fan" ? i : -1)).filter((i) => i >= 0);
const SWITCH = UNITS.indexOf("switch");
const DRAWER = UNITS.indexOf("drawer");
const UPS = UNITS.indexOf("ups");
const MONITOR = UNITS.indexOf("monitor");

// values shared between the scene and the rack
type Shared = {
  t: number; // animation time (stops in Calm mode)
  boot: number; // seconds since the power-on sequence started
  mw: number[]; // weight of each mode: idle, scan, transfer, alert
  door: number;
  hover: number; // unit under the mouse, or -1
};
type SRef = MutableRefObject<Shared>;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// ---------- where the rack sits and what it is doing ----------
// mode: 0 idle, 1 scan, 2 transfer, 3 alert
type Pose = { x: number; y: number; s: number; ry: number; rx: number; door: number; mode: number };

const HOME: { at: number; p: Pose }[] = [
  { at: 0.0, p: { x: 0.25, y: 0, s: 1.0, ry: -0.55, rx: 0.05, door: 0, mode: 0 } },
  { at: 0.22, p: { x: -0.26, y: 0, s: 1.0, ry: 0.4, rx: 0.05, door: 1, mode: 1 } },
  { at: 0.38, p: { x: 0.27, y: 0, s: 1.2, ry: -0.15, rx: 0.1, door: 1, mode: 2 } },
  { at: 0.53, p: { x: 0.0, y: 0, s: 1.05, ry: 1.4, rx: 0.05, door: 1, mode: 3 } },
  { at: 0.67, p: { x: 0.27, y: 0, s: 1.0, ry: 2.9, rx: 0.08, door: 0.5, mode: 1 } },
  { at: 0.8, p: { x: -0.27, y: 0, s: 1.0, ry: 4.3, rx: 0.05, door: 1, mode: 2 } },
  { at: 0.91, p: { x: 0.0, y: 0.02, s: 0.75, ry: 5.0, rx: 0.05, door: 0, mode: 0 } },
  { at: 1.0, p: { x: 0.26, y: 0, s: 1.05, ry: 6.0, rx: 0.05, door: 0, mode: 0 } },
];

const PAGE: Record<string, Pose> = {
  about: { x: -0.28, y: 0, s: 0.9, ry: 0.5, rx: 0.05, door: 0.8, mode: 0 },
  experience: { x: 0.28, y: 0, s: 0.9, ry: -0.6, rx: 0.05, door: 1, mode: 2 },
  education: { x: -0.28, y: 0, s: 0.9, ry: 0.9, rx: 0.05, door: 0.6, mode: 1 },
  skills: { x: 0.28, y: 0, s: 0.9, ry: -0.3, rx: 0.05, door: 1, mode: 2 },
  projects: { x: -0.28, y: 0, s: 0.9, ry: 0.4, rx: 0.05, door: 1, mode: 1 },
  contact: { x: 0.0, y: -0.02, s: 0.95, ry: 0.2, rx: 0.05, door: 1, mode: 0 },
};

const mix = (a: number, b: number, f: number) => a + (b - a) * f;
function homePose(s: number): Pose {
  if (s <= HOME[0].at) return HOME[0].p;
  for (let i = 0; i < HOME.length - 1; i++) {
    const a = HOME[i];
    const b = HOME[i + 1];
    if (s <= b.at) {
      const f = THREE.MathUtils.smoothstep((s - a.at) / (b.at - a.at), 0, 1);
      return {
        x: mix(a.p.x, b.p.x, f),
        y: mix(a.p.y, b.p.y, f),
        s: mix(a.p.s, b.p.s, f),
        ry: mix(a.p.ry, b.p.ry, f),
        rx: mix(a.p.rx, b.p.rx, f),
        door: mix(a.p.door, b.p.door, f),
        mode: f < 0.5 ? a.p.mode : b.p.mode,
      };
    }
  }
  return HOME[HOME.length - 1].p;
}

// ---------- cables ----------
type CableDef = { geo: THREE.TubeGeometry; col: string; curve: THREE.CatmullRomCurve3 };

function buildCables(): CableDef[] {
  const out: CableDef[] = [];
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const add = (pts: THREE.Vector3[], col: string, r: number, seg: number) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    out.push({ geo: new THREE.TubeGeometry(curve, seg, r, 8, false), col, curve });
  };

  // patch cables hanging on the front, from the switch to the servers
  const front = [
    { c: 1, to: 7, tx: 0.4, col: "#22d3ee" },
    { c: 3, to: 8, tx: 0.3, col: "#ff4d9d" },
    { c: 5, to: 5, tx: 0.2, col: "#fbbf24" },
    { c: 7, to: 4, tx: 0.1, col: "#a78bfa" },
    { c: 9, to: 10, tx: 0.0, col: "#34d399" },
    { c: 11, to: 11, tx: -0.1, col: "#22d3ee" },
  ];
  front.forEach((d) => {
    const sx = -0.48 + d.c * 0.088;
    const sy = unitY(SWITCH) + 0.058;
    const ex = d.tx;
    const ey = unitY(d.to) - 0.06;
    const z0 = FRONT + 0.04;
    add(
      [
        V(sx, sy, z0),
        V(sx + 0.08, sy + (ey - sy) * 0.35, z0 + 0.16),
        V(ex - 0.05, sy + (ey - sy) * 0.7, z0 + 0.16),
        V(ex, ey, z0),
      ],
      d.col,
      0.011,
      40
    );
  });

  // thick looms: out of the top, over the side, down to the floor and into a junction box
  const looms = [
    { sx: 1, cols: ["#22d3ee", "#ff4d9d", "#fbbf24"], jx: 2.9, jz: 1.2 },
    { sx: -1, cols: ["#a78bfa", "#34d399", "#22d3ee"], jx: -2.9, jz: 0.4 },
  ];
  looms.forEach((l) =>
    l.cols.forEach((col, k) => {
      const o = k * 0.07;
      const s = l.sx;
      add(
        [
          V(s * (0.3 + o), H / 2 - 0.1, -D / 2 + 0.1 + o),
          V(s * (0.5 + o), H / 2 + 0.45 + o, -0.1),
          V(s * (1.2 + o), H / 2 + 0.55, 0.2 + o),
          V(s * (1.9 + o), H / 2 - 0.4, 0.5 + o),
          V(s * (2.05 + o), -0.6, 0.6 + o),
          V(s * (2.0 + o), -H / 2 + 0.3, 0.7 + o),
          V(s * (1.95 + o), FLOOR_LOCAL + 0.02, 0.85 + o),
          V(s * 2.5, FLOOR_LOCAL + 0.02, l.jz - 0.1 + o),
          V(l.jx - s * 0.15, FLOOR_LOCAL + 0.1, l.jz + o * 0.5),
        ],
        col,
        0.03,
        110
      );
    })
  );
  return out;
}

// ---------- the rack ----------
function Rack({
  sh,
  hits,
}: {
  sh: SRef;
  hits: MutableRefObject<THREE.Mesh[]>;
}) {
  const doorGroup = useRef<THREE.Group>(null!);
  const drawerRef = useRef<THREE.Group>(null!);
  const fanRefs = useRef<THREE.Group[]>([]);
  const fanAng = useRef<number[]>([0, 0, 0, 0]);
  const drawerOut = useRef(0);
  const scan = useRef<THREE.Mesh>(null!);
  const scanMat = useRef<THREE.MeshBasicMaterial>(null!);
  const bays = useRef<THREE.InstancedMesh>(null!);
  const ports = useRef<THREE.InstancedMesh>(null!);
  const grooves = useRef<THREE.InstancedMesh>(null!);
  const ledColor = useRef<THREE.BufferAttribute>(null!);
  const pulseAttr = useRef<THREE.BufferAttribute>(null!);
  const beacon = useRef<THREE.Mesh>(null!);
  const beaconMat = useRef<THREE.MeshBasicMaterial>(null!);
  const beaconLight = useRef<THREE.PointLight>(null!);
  const cage = useRef<THREE.LineSegments>(null!);
  const cageMat = useRef<THREE.LineBasicMaterial>(null!);
  const net = useRef<THREE.Group>(null!);
  const ring1 = useRef<THREE.Group>(null!);
  const ring2 = useRef<THREE.Group>(null!);
  const lastDraw = useRef(-1);
  const hl = useRef<number[]>(UNITS.map(() => 0));
  const junctionLeds = useRef<THREE.MeshBasicMaterial[]>([]);

  const mats = useMemo(
    () => ({
      frame: new THREE.MeshStandardMaterial({ color: "#0b1016", metalness: 0.85, roughness: 0.35 }),
      chassis: new THREE.MeshStandardMaterial({ color: "#141a23", metalness: 0.8, roughness: 0.4 }),
      plate: new THREE.MeshStandardMaterial({ color: "#1d2430", metalness: 0.6, roughness: 0.5 }),
      plateSwitch: new THREE.MeshStandardMaterial({ color: "#0f2331", metalness: 0.6, roughness: 0.5 }),
      plateUps: new THREE.MeshStandardMaterial({ color: "#1a2a22", metalness: 0.6, roughness: 0.5 }),
      dark: new THREE.MeshStandardMaterial({ color: "#06090d", metalness: 0.3, roughness: 0.8 }),
      bay: new THREE.MeshStandardMaterial({ color: "#2f3a4a", metalness: 0.5, roughness: 0.55 }),
      panel: new THREE.MeshStandardMaterial({ color: "#10151d", metalness: 0.6, roughness: 0.55 }),
      board: new THREE.MeshStandardMaterial({ color: "#07261f", metalness: 0.3, roughness: 0.6 }),
      chip: new THREE.MeshStandardMaterial({ color: "#0a0d12", metalness: 0.7, roughness: 0.35 }),
      glow: new THREE.MeshBasicMaterial({ color: "#22d3ee", toneMapped: false }),
      hit: new THREE.MeshBasicMaterial({ visible: false }),
      glass: new THREE.MeshPhysicalMaterial({
        color: "#0a2a3a",
        transparent: true,
        opacity: 0.16,
        roughness: 0.05,
        metalness: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    }),
    []
  );

  // highlight overlay for every unit (lights up when the mouse is over it)
  const hlMats = useMemo(
    () =>
      UNITS.map(
        () =>
          new THREE.MeshBasicMaterial({
            color: "#22d3ee",
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
          })
      ),
    []
  );

  // battery bars on the UPS and two lights on the pull-out drawer
  const segMats = useMemo(() => [0, 1, 2, 3, 4].map(() => new THREE.MeshBasicMaterial({ color: "#000000", toneMapped: false })), []);
  const drawerLeds = useMemo(() => [0, 1].map(() => new THREE.MeshBasicMaterial({ color: "#000000", toneMapped: false })), []);

  // the small status screen: drawn on a canvas, redrawn about 8 times a second
  const screen = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 100;
    const tex = new THREE.CanvasTexture(c);
    (tex as unknown as { colorSpace?: string }).colorSpace = "srgb";
    return { c, ctx: c.getContext("2d"), tex, mat: new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }) };
  }, []);

  // blinking lights: 3 per server and 24 on the switch
  const leds = useMemo(() => {
    const pos: number[] = [];
    const kind: number[] = [];
    const unit: number[] = [];
    const ys: number[] = [];
    SERVERS.forEach((i) => {
      const y = unitY(i) + 0.06;
      [0.46, 0.41, 0.36].forEach((x, k) => {
        pos.push(x, y, FRONT + 0.035);
        kind.push(k);
        unit.push(i);
        ys.push(y);
      });
    });
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 12; c++) {
        const y = unitY(SWITCH) + (r ? -0.058 : 0.058) + 0.04;
        pos.push(-0.48 + c * 0.088, y, FRONT + 0.035);
        kind.push(3);
        unit.push(SWITCH);
        ys.push(y);
      }
    }
    return { pos: new Float32Array(pos), kind, unit, ys, colors: new Float32Array(kind.length * 3) };
  }, []);

  const cables = useMemo(() => buildCables(), []);

  // light pulses that travel along every cable
  const pulses = useMemo(() => {
    const per = 3;
    const col = new Float32Array(cables.length * per * 3);
    cables.forEach((c, i) => {
      const k = new THREE.Color(c.col);
      for (let j = 0; j < per; j++) {
        col[(i * per + j) * 3] = k.r;
        col[(i * per + j) * 3 + 1] = k.g;
        col[(i * per + j) * 3 + 2] = k.b;
      }
    });
    return { per, pos: new Float32Array(cables.length * per * 3), col };
  }, [cables]);

  // wireframe cage and a floating network graph around the rack
  const wire = useMemo(() => {
    const cageGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(W + 0.5, H + 0.5, D + 0.5));
    const rnd = (() => {
      let s = 11;
      return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
      };
    })();
    const nodes: THREE.Vector3[] = [];
    for (let i = 0; i < 22; i++) {
      const a = rnd() * Math.PI * 2;
      const b = Math.acos(2 * rnd() - 1);
      const r = 2.5 + rnd() * 0.5;
      nodes.push(new THREE.Vector3(r * Math.sin(b) * Math.cos(a), r * Math.cos(b) * 0.9, r * Math.sin(b) * Math.sin(a)));
    }
    const segs: number[] = [];
    nodes.forEach((n, i) => {
      nodes
        .map((m, j) => ({ j, d: n.distanceTo(m) }))
        .filter((o) => o.j !== i)
        .sort((p, q) => p.d - q.d)
        .slice(0, 2)
        .forEach((o) => segs.push(n.x, n.y, n.z, nodes[o.j].x, nodes[o.j].y, nodes[o.j].z));
    });
    const circle = (r: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      return new THREE.BufferGeometry().setFromPoints(pts);
    };
    return {
      cageGeo,
      nodePos: new Float32Array(nodes.flatMap((n) => [n.x, n.y, n.z])),
      segPos: new Float32Array(segs),
      ring1: circle(1.9),
      ring2: circle(2.25),
    };
  }, []);

  const tmp = useMemo(() => new THREE.Vector3(), []);

  // place the repeated parts (drive bays, switch ports, side grooves)
  useEffect(() => {
    const d = new THREE.Object3D();
    let k = 0;
    SERVERS.forEach((i) => {
      for (let b = 0; b < 8; b++) {
        d.position.set(-0.46 + b * 0.085, unitY(i), FRONT + 0.022);
        d.updateMatrix();
        bays.current.setMatrixAt(k++, d.matrix);
      }
    });
    bays.current.instanceMatrix.needsUpdate = true;

    k = 0;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 12; c++) {
        d.position.set(-0.48 + c * 0.088, unitY(SWITCH) + (r ? -0.058 : 0.058), FRONT + 0.022);
        d.updateMatrix();
        ports.current.setMatrixAt(k++, d.matrix);
      }
    }
    ports.current.instanceMatrix.needsUpdate = true;

    k = 0;
    [-1, 1].forEach((side) => {
      for (let g = 0; g < 14; g++) {
        d.position.set(side * (W / 2 + 0.002), -H / 2 + 0.5 + g * 0.22, 0);
        d.updateMatrix();
        grooves.current.setMatrixAt(k++, d.matrix);
      }
    });
    grooves.current.instanceMatrix.needsUpdate = true;
  }, []);

  const POOL = [
    "[ OK ] sshd listening on :22",
    "[ OK ] tls handshake complete",
    "[SCAN] sweeping ports 443 8080",
    "[SCAN] 3 services fingerprinted",
    "[XFER] syncing logs to archive",
    "[XFER] backup block verified",
    "[WARN] unusual login pattern",
    "[ OK ] firewall rules loaded",
  ];

  useFrame((state, delta) => {
    const s = sh.current;
    const t = s.t;
    const mw = s.mw;
    const calmDt = s.t - lastDraw.current < 0 ? 0 : 0; // (kept for clarity: motion uses s.t)
    void calmDt;
    const power = (unit: number) => clamp01((s.boot - unit * 0.35) / 0.6);
    const mode = mw.indexOf(Math.max(...mw));

    // glass door
    doorGroup.current.rotation.y = -s.door * 1.9;

    // pull-out drawer: slides out while scanning or on alert, and now and then when idle
    const open = s.door > 0.6;
    const target = !open ? 0 : mw[1] > 0.5 ? 1 : mw[3] > 0.5 ? 0.6 : mw[2] > 0.5 ? 0 : Math.sin(t * 0.3) > 0.9 ? 1 : 0;
    drawerOut.current = THREE.MathUtils.damp(drawerOut.current, target, 2.5, delta);
    drawerRef.current.position.z = drawerOut.current * 0.55;

    // fans spin faster when busy, and spin up during the boot sequence
    FANS.forEach((u, fi) => {
      for (let side = 0; side < 2; side++) {
        const k = fi * 2 + side;
        const speed = (9 + k * 1.2 + mw[2] * 14 + mw[3] * 18) * power(u) * (k % 2 ? -1 : 1);
        fanAng.current[k] += speed * (s.t === lastDraw.current ? 0 : Math.min(delta, 0.05)) * (s.t > 0 ? 1 : 0);
        const g = fanRefs.current[k];
        if (g) g.rotation.z = fanAng.current[k];
      }
    });

    // scanning light
    const scanY = Math.sin(t * (0.5 + mw[1] * 0.9)) * (H / 2 - 0.45);
    scan.current.position.y = scanY;
    scanMat.current.opacity = 0.2 + mw[1] * 0.5;

    // blinking lights
    const attr = ledColor.current;
    const arr = attr.array as Float32Array;
    leds.kind.forEach((kd, i) => {
      const unit = leds.unit[i];
      let r = 0;
      let g = 0;
      let b = 0;
      let v = 0;
      if (kd === 0) {
        v = 0.85 + Math.sin(t * 2 + i) * 0.1;
        r = 0.2; g = 1; b = 0.4;
      } else if (kd === 1) {
        v = Math.sin(t * (5 + (i % 7) * (1 + mw[2] * 2)) + i * 2.1) > 0.35 - mw[2] * 0.4 ? 1 : 0.12;
        r = 0.13; g = 0.83; b = 0.93;
      } else if (kd === 2) {
        v = Math.sin(t * 0.7 + i) > 0.9 ? 1 : 0.08;
        r = 1; g = 0.72; b = 0.14;
      } else {
        v = Math.sin(t * (3 + (i % 5) * (1 + mw[2] * 2)) + i) > 0.15 - mw[2] * 0.3 ? 1 : 0.15;
        r = 0.2; g = 1; b = 0.5;
      }
      if (mw[3] > 0.01) {
        const f = mw[3] * (unit % 2 === 0 ? 1 : 0.4);
        const fl = 0.5 + 0.5 * Math.sin(t * 9 + unit);
        r = r + (1 - r) * f;
        g = g * (1 - f * 0.9);
        b = b * (1 - f * 0.9);
        v = v * (1 - f) + f * fl;
      }
      if (mw[1] > 0.01) v = Math.min(1.6, v + mw[1] * Math.max(0, 1 - Math.abs(leds.ys[i] - scanY) * 2.5) * 1.2);
      v *= power(unit);
      arr[i * 3] = r * v;
      arr[i * 3 + 1] = g * v;
      arr[i * 3 + 2] = b * v;
    });
    attr.needsUpdate = true;

    // UPS battery bars and drawer lights
    const level = 0.62 + 0.3 * Math.sin(t * 0.25);
    segMats.forEach((m, i) => {
      const on = level * 5 > i ? 1 : 0.08;
      const p = power(UPS);
      m.color.setRGB((i > 3 ? 1 : 0.2) * on * p, (i > 3 ? 0.7 : 1) * on * p, 0.35 * on * p);
    });
    drawerLeds[0].color.setRGB(0.2 * power(DRAWER), 1 * power(DRAWER), 0.4 * power(DRAWER));
    const dv = (Math.sin(t * 7) > 0.2 ? 1 : 0.15) * power(DRAWER);
    drawerLeds[1].color.setRGB(0.13 * dv, 0.83 * dv, 0.93 * dv);

    // light pulses running along the cables
    const spd = 0.1 + mw[2] * 0.32 + mw[3] * 0.15 + mw[1] * 0.06;
    const pa = pulseAttr.current.array as Float32Array;
    cables.forEach((c, ci) => {
      for (let j = 0; j < pulses.per; j++) {
        c.curve.getPoint((t * spd + j / pulses.per + ci * 0.137) % 1, tmp);
        const idx = (ci * pulses.per + j) * 3;
        pa[idx] = tmp.x;
        pa[idx + 1] = tmp.y;
        pa[idx + 2] = tmp.z;
      }
    });
    pulseAttr.current.needsUpdate = true;

    // junction box lights
    junctionLeds.current.forEach((m, i) => {
      const v = Math.sin(t * (4 + i) + i * 2) > 0.1 ? 1 : 0.15;
      m.color.setRGB(0.2 * v, 0.9 * v, 0.6 * v);
    });

    // beacon on top: cyan normally, flashing red on alert
    const flash = 0.5 + 0.5 * Math.sin(t * 8);
    const rr = mw[3];
    beaconMat.current.color.setRGB(mix(0.13, 1, rr) * (0.6 + 0.4 * flash), mix(0.83, 0.15, rr) * (0.6 + 0.4 * flash), mix(0.93, 0.25, rr) * (0.6 + 0.4 * flash));
    beaconLight.current.color.copy(beaconMat.current.color);
    beaconLight.current.intensity = 2.5 + 3 * flash * (0.4 + rr);
    beacon.current.scale.setScalar(1 + 0.15 * flash);

    // wireframe cage and network graph: brighter while scanning or transferring
    cageMat.current.opacity = 0.06 + mw[1] * 0.45 + mw[3] * 0.25;
    cage.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.01 + mw[1] * 0.03);
    net.current.rotation.y = t * 0.12;
    net.current.rotation.x = Math.sin(t * 0.2) * 0.15;
    ring1.current.rotation.set(0.5, t * 0.35, 0.2);
    ring2.current.rotation.set(-0.7, -t * 0.25, 0.4);

    // hover highlight
    hl.current.forEach((v, i) => {
      hl.current[i] = THREE.MathUtils.damp(v, s.hover === i ? 1 : 0, 10, delta);
      hlMats[i].opacity = hl.current[i] * 0.28;
    });

    // status screen
    if (screen.ctx && (lastDraw.current < 0 || t - lastDraw.current > 0.12)) {
      lastDraw.current = t;
      const ctx = screen.ctx;
      const col = mode === 3 ? "#ff5c7a" : mode === 2 ? "#34d399" : "#22d3ee";
      ctx.fillStyle = "#02121a";
      ctx.fillRect(0, 0, 512, 100);
      ctx.font = "bold 15px monospace";
      ctx.fillStyle = col;
      ctx.fillText(`RACK-01 ${MODES[mode]}  (simulated)`, 10, 20);
      if (s.hover >= 0) {
        ctx.fillStyle = "#fbbf24";
        ctx.fillText(`> ${NAMES[s.hover]}`, 400, 20);
      }
      ctx.font = "14px monospace";
      const base = Math.floor(t * 1.5);
      for (let r = 0; r < 3; r++) {
        ctx.fillStyle = r === 2 ? "#e6fbff" : "#6fb8c8";
        ctx.fillText(POOL[(base + r) % POOL.length], 10, 46 + r * 22);
      }
      for (let j = 0; j < 14; j++) {
        const h = 6 + 34 * (0.5 + 0.5 * Math.sin(t * 3 + j * 0.9 + mw[2] * j));
        ctx.fillStyle = col;
        ctx.fillRect(330 + j * 12, 92 - h, 8, h);
      }
      screen.tex.needsUpdate = true;
    }
    void state;
  });

  const bay = <boxGeometry args={[0.07, U * 0.6, 0.02]} />;

  return (
    <group>
      {/* frame: four posts, top and bottom caps, feet */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`p${sx}${sz}`} position={[sx * (W / 2 - 0.03), 0, sz * (D / 2 - 0.03)]} material={mats.frame}>
            <boxGeometry args={[0.06, H, 0.06]} />
          </mesh>
        ))
      )}
      <mesh position={[0, H / 2 - 0.05, 0]} material={mats.frame}>
        <boxGeometry args={[W, 0.1, D]} />
      </mesh>
      <mesh position={[0, -H / 2 + 0.05, 0]} material={mats.frame}>
        <boxGeometry args={[W, 0.1, D]} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`f${sx}${sz}`} position={[sx * (W / 2 - 0.1), -H / 2 - 0.035, sz * (D / 2 - 0.1)]} material={mats.dark}>
            <boxGeometry args={[0.1, 0.08, 0.1]} />
          </mesh>
        ))
      )}

      {/* side and back panels */}
      {[-1, 1].map((side) => (
        <mesh key={`s${side}`} position={[side * (W / 2 - 0.01), 0, 0]} material={mats.panel}>
          <boxGeometry args={[0.02, H - 0.2, D - 0.1]} />
        </mesh>
      ))}
      <mesh position={[0, 0, -D / 2 + 0.02]} material={mats.panel}>
        <boxGeometry args={[W - 0.1, H - 0.2, 0.03]} />
      </mesh>
      <instancedMesh ref={grooves} args={[undefined, undefined, 28]} material={mats.dark}>
        <boxGeometry args={[0.004, 0.02, D - 0.3]} />
      </instancedMesh>

      {/* glowing edge strips on the front posts */}
      {[-1, 1].map((side) => (
        <mesh key={`g${side}`} position={[side * (W / 2 - 0.065), 0, D / 2 - 0.015]} material={mats.glow}>
          <boxGeometry args={[0.012, H - 0.3, 0.012]} />
        </mesh>
      ))}

      {/* beacon on top */}
      <mesh ref={beacon} position={[0, H / 2 + 0.12, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial ref={beaconMat} color="#22d3ee" toneMapped={false} />
      </mesh>
      <pointLight ref={beaconLight} color="#22d3ee" intensity={3} distance={4} decay={2} position={[0, H / 2 + 0.2, 0]} />

      {/* the units */}
      {UNITS.map((type, i) => {
        const isDrawer = type === "drawer";
        return (
          <group key={i} position={[0, unitY(i), 0]} ref={isDrawer ? drawerRef : undefined}>
            <mesh material={mats.chassis}>
              <boxGeometry args={[W - 0.12, U - 0.03, D - 0.1]} />
            </mesh>
            <mesh
              position={[0, 0, FRONT]}
              material={
                type === "fan" || type === "monitor"
                  ? mats.dark
                  : type === "switch"
                    ? mats.plateSwitch
                    : type === "ups"
                      ? mats.plateUps
                      : mats.plate
              }
            >
              <boxGeometry args={[W - 0.12, U - 0.03, 0.03]} />
            </mesh>

            {type === "fan" &&
              [-1, 1].map((side) => {
                const k = FANS.indexOf(i) * 2 + (side > 0 ? 1 : 0);
                return (
                  <group key={side} position={[side * 0.28, 0, FRONT + 0.02]}>
                    <mesh material={mats.frame}>
                      <torusGeometry args={[0.115, 0.012, 8, 36]} />
                    </mesh>
                    <mesh position={[0, 0, -0.004]} material={mats.dark}>
                      <circleGeometry args={[0.11, 32]} />
                    </mesh>
                    <group
                      ref={(el) => {
                        if (el) fanRefs.current[k] = el;
                      }}
                    >
                      <mesh material={mats.bay}>
                        <cylinderGeometry args={[0.022, 0.022, 0.012, 16]} />
                      </mesh>
                      {Array.from({ length: 7 }).map((_, b) => (
                        <group key={b} rotation={[0, 0, (b / 7) * Math.PI * 2]}>
                          <mesh position={[0.06, 0, 0]} rotation={[0.55, 0, 0]} material={mats.bay}>
                            <boxGeometry args={[0.075, 0.035, 0.004]} />
                          </mesh>
                        </group>
                      ))}
                    </group>
                  </group>
                );
              })}

            {type === "ups" &&
              segMats.map((m, k) => (
                <mesh key={k} position={[-0.3 + k * 0.13, 0, FRONT + 0.025]} material={m}>
                  <boxGeometry args={[0.1, 0.07, 0.012]} />
                </mesh>
              ))}

            {type === "monitor" && (
              <mesh position={[0, 0, FRONT + 0.02]} material={screen.mat}>
                <planeGeometry args={[W - 0.22, U - 0.07]} />
              </mesh>
            )}

            {isDrawer && (
              <>
                {Array.from({ length: 8 }).map((_, b) => (
                  <mesh key={b} position={[-0.46 + b * 0.085, 0, FRONT + 0.022]} material={mats.bay}>
                    {bay}
                  </mesh>
                ))}
                {drawerLeds.map((m, k) => (
                  <mesh key={k} position={[0.46 - k * 0.05, 0.06, FRONT + 0.03]} material={m}>
                    <boxGeometry args={[0.02, 0.02, 0.01]} />
                  </mesh>
                ))}
                {/* circuit board on top: you see it when the drawer slides out */}
                <group position={[0, (U - 0.03) / 2 + 0.008, 0]}>
                  <mesh material={mats.board}>
                    <boxGeometry args={[W - 0.22, 0.012, D - 0.3]} />
                  </mesh>
                  {[
                    [-0.3, 0.2], [0.1, 0.15], [0.35, -0.05], [-0.15, -0.1], [0.2, 0.3],
                  ].map(([x, z], k) => (
                    <mesh key={k} position={[x, 0.012, z]} material={mats.chip}>
                      <boxGeometry args={[0.12, 0.015, 0.1]} />
                    </mesh>
                  ))}
                  {[
                    [-0.3, 0.1, 0.3], [0.1, 0.05, 0.25], [0.3, 0.15, 0.2], [-0.1, -0.2, 0.35], [0.35, -0.15, 0.25], [-0.4, -0.05, 0.2],
                  ].map(([x, z, len], k) => (
                    <mesh key={k} position={[x, 0.008, z]} material={mats.glow}>
                      <boxGeometry args={[len, 0.002, 0.008]} />
                    </mesh>
                  ))}
                </group>
              </>
            )}

            {/* hover highlight and the invisible box the mouse ray hits */}
            <mesh position={[0, 0, FRONT + 0.045]} material={hlMats[i]}>
              <planeGeometry args={[W - 0.12, U - 0.03]} />
            </mesh>
            <mesh
              material={mats.hit}
              ref={(m) => {
                if (m) hits.current[i] = m;
              }}
            >
              <boxGeometry args={[W - 0.1, U - 0.02, D - 0.1]} />
            </mesh>
          </group>
        );
      })}

      <instancedMesh ref={bays} args={[undefined, undefined, SERVERS.length * 8]} material={mats.bay}>
        {bay}
      </instancedMesh>
      <instancedMesh ref={ports} args={[undefined, undefined, 24]} material={mats.dark}>
        <boxGeometry args={[0.06, 0.05, 0.02]} />
      </instancedMesh>

      {/* blinking lights (round glows) */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[leds.pos, 3]} />
          <bufferAttribute ref={ledColor} attach="attributes-color" args={[leds.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.09} vertexColors transparent sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* scanning light sweeping over the front */}
      <mesh ref={scan} position={[0, 0, FRONT + 0.05]}>
        <planeGeometry args={[W - 0.15, 0.025]} />
        <meshBasicMaterial
          ref={scanMat}
          color="#22d3ee"
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* cables: thin patch cables on the front, thick looms over the side */}
      {cables.map((c, k) => (
        <mesh key={k} geometry={c.geo}>
          <meshStandardMaterial color={c.col} emissive={c.col} emissiveIntensity={0.35} roughness={0.5} />
        </mesh>
      ))}

      {/* light pulses travelling along the cables */}
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute ref={pulseAttr} attach="attributes-position" args={[pulses.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[pulses.col, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.11} vertexColors transparent sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* junction boxes at the end of the looms */}
      {[
        [2.9, 1.2],
        [-2.9, 0.4],
      ].map(([x, z], j) => (
        <group key={j} position={[x, FLOOR_LOCAL + 0.1, z]}>
          <mesh material={mats.chassis}>
            <boxGeometry args={[0.32, 0.2, 0.24]} />
          </mesh>
          {[0, 1, 2, 3].map((k) => (
            <mesh
              key={k}
              position={[-0.1 + k * 0.067, 0.04, 0.125]}
              ref={(m) => {
                if (m) junctionLeds.current[j * 4 + k] = m.material as THREE.MeshBasicMaterial;
              }}
            >
              <boxGeometry args={[0.03, 0.03, 0.01]} />
              <meshBasicMaterial color="#33ffaa" toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}

      {/* glass door, hinged on the left: it swings open as you scroll */}
      <group ref={doorGroup} position={[-W / 2, 0, D / 2 + 0.25]}>
        <group position={[W / 2, 0, 0]}>
          <mesh position={[0, H / 2 - 0.12, 0]} material={mats.frame}>
            <boxGeometry args={[W, 0.06, 0.04]} />
          </mesh>
          <mesh position={[0, -H / 2 + 0.12, 0]} material={mats.frame}>
            <boxGeometry args={[W, 0.06, 0.04]} />
          </mesh>
          <mesh position={[-W / 2 + 0.03, 0, 0]} material={mats.frame}>
            <boxGeometry args={[0.06, H - 0.2, 0.04]} />
          </mesh>
          <mesh position={[W / 2 - 0.03, 0, 0]} material={mats.frame}>
            <boxGeometry args={[0.06, H - 0.2, 0.04]} />
          </mesh>
          <mesh material={mats.glass}>
            <planeGeometry args={[W - 0.1, H - 0.3]} />
          </mesh>
          <mesh position={[W / 2 - 0.1, 0, 0.04]} material={mats.bay}>
            <boxGeometry args={[0.02, 0.4, 0.03]} />
          </mesh>
        </group>
      </group>

      {/* holographic wireframe cage, rings and a floating network graph */}
      <lineSegments ref={cage} geometry={wire.cageGeo}>
        <lineBasicMaterial ref={cageMat} color="#22d3ee" transparent opacity={0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <group ref={ring1}>
        <line_ geometry={wire.ring1}>
          <lineBasicMaterial color="#a78bfa" transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} />
        </line>
      </group>
      <group ref={ring2}>
        <line_ geometry={wire.ring2}>
          <lineBasicMaterial color="#22d3ee" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
        </line>
      </group>
      <group ref={net}>
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[wire.segPos, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#22d3ee" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
        </lineSegments>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[wire.nodePos, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.09} color="#ff4d9d" transparent sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
      </group>

      {/* soft glow inside the rack */}
      <pointLight color="#22d3ee" intensity={8} distance={5} decay={2} position={[0, 0, 0.9]} />
    </group>
  );
}

// a row of racks far behind, with their own blinking lights
function FarRacks({ sh }: { sh: SRef }) {
  const spots = useMemo<[number, number][]>(
    () => [[-7.5, -8], [-4.8, -9.5], [4.6, -9.5], [7.4, -8], [-2.2, -12.5], [2.4, -12.5]],
    []
  );
  const per = 40;
  const group = useMemo(() => {
    const g = new THREE.Group();
    const box = new THREE.BoxGeometry(W, H, D);
    const edges = new THREE.EdgesGeometry(box);
    const body = new THREE.MeshStandardMaterial({ color: "#0b1118", metalness: 0.7, roughness: 0.5 });
    const line = new THREE.LineBasicMaterial({ color: "#22d3ee", transparent: true, opacity: 0.35 });
    spots.forEach(([x, z]) => {
      const m = new THREE.Mesh(box, body);
      m.position.set(x, FLOOR + H / 2 + 0.075, z);
      g.add(m);
      const l = new THREE.LineSegments(edges, line);
      l.position.copy(m.position);
      g.add(l);
    });
    return g;
  }, [spots]);

  const leds = useMemo(() => {
    const pos = new Float32Array(spots.length * per * 3);
    let k = 0;
    let seed = 5;
    const r = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    spots.forEach(([x, z]) => {
      for (let i = 0; i < per; i++) {
        pos[k++] = x + (r() - 0.5) * (W - 0.3);
        pos[k++] = FLOOR + 0.25 + r() * (H - 0.4);
        pos[k++] = z + D / 2 + 0.02;
      }
    });
    return { pos, col: new Float32Array(spots.length * per * 3) };
  }, [spots]);
  const attr = useRef<THREE.BufferAttribute>(null!);

  useFrame(() => {
    const t = sh.current.t;
    const a = attr.current.array as Float32Array;
    for (let i = 0; i < spots.length * per; i++) {
      const on = Math.sin(t * (1 + (i % 5) * 0.7) + i) > 0.45 ? 1 : 0.12;
      const k = i % 3;
      a[i * 3] = (k === 2 ? 1 : 0.15) * on;
      a[i * 3 + 1] = (k === 0 ? 0.85 : 1) * on * (k === 2 ? 0.7 : 1);
      a[i * 3 + 2] = (k === 1 ? 0.4 : 0.9) * on * (k === 2 ? 0.15 : 1);
    }
    attr.current.needsUpdate = true;
  });

  return (
    <>
      <primitive object={group} />
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[leds.pos, 3]} />
          <bufferAttribute ref={attr} attach="attributes-color" args={[leds.col, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.1} vertexColors transparent sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </>
  );
}

// slowly rising dust particles around the rack
function Dust({ sh }: { sh: SRef }) {
  const N = 240;
  const attr = useRef<THREE.BufferAttribute>(null!);
  const seed = useMemo(() => {
    const base = new Float32Array(N * 3);
    const speed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = (n: number) => {
        const x = Math.sin((i + 1) * n) * 43758.5453;
        return x - Math.floor(x);
      };
      base[i * 3] = (r(12.9898) - 0.5) * 3.4;
      base[i * 3 + 1] = r(78.233) * 4.4;
      base[i * 3 + 2] = (r(39.425) - 0.5) * 3.0 + 0.3;
      speed[i] = 0.04 + r(11.13) * 0.08;
    }
    return { base, speed, pos: new Float32Array(base) };
  }, []);

  useFrame(() => {
    const t = sh.current.t;
    const a = attr.current.array as Float32Array;
    for (let i = 0; i < N; i++) {
      a[i * 3] = seed.base[i * 3] + Math.sin(t * 0.3 + i) * 0.05;
      a[i * 3 + 1] = ((seed.base[i * 3 + 1] + t * seed.speed[i]) % 4.4) - 2.2;
      a[i * 3 + 2] = seed.base[i * 3 + 2];
    }
    attr.current.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute ref={attr} attach="attributes-position" args={[seed.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#22d3ee" transparent opacity={0.55} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// soft shadow under the rack
function Shadow() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(0,0,0,0.85)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -BASE + 0.004, 0]}>
      <planeGeometry args={[3.6, 3.2]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

function Scene() {
  const pathname = usePathname();
  const pageRef = useRef(pathname.split("/")[1] ?? "");
  useEffect(() => {
    pageRef.current = pathname.split("/")[1] ?? "";
  }, [pathname]);

  const sh = useRef<Shared>({ t: 0, boot: 0, mw: [1, 0, 0, 0], door: 0, hover: -1 });
  const scroll = useRef(0);
  const ptr = useRef({ x: 0, y: 0 });
  const anim = useRef<Pose>({ ...HOME[0].p, x: 0, s: 0.8 });
  const root = useRef<THREE.Group>(null!);
  const hits = useRef<THREE.Mesh[]>([]);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);

  const grid = useMemo(() => {
    const g = new THREE.GridHelper(44, 66, 0x0e7490, 0x0b2a3a);
    const m = g.material as THREE.LineBasicMaterial;
    m.transparent = true;
    m.opacity = 0.55;
    return g;
  }, []);

  useEffect(() => {
    const readScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scroll.current = max > 0 ? THREE.MathUtils.clamp(window.scrollY / max, 0, 1) : 0;
    };
    const onMove = (e: PointerEvent) => {
      ptr.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    readScroll();
    const t1 = setTimeout(readScroll, 300);
    const t2 = setTimeout(readScroll, 1200);
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, [pathname]);

  useFrame((state, delta) => {
    // "Calm" in the display settings freezes the idle motion (fans, lights, sway)
    const calm = document.documentElement.dataset.motion === "calm";
    const s = sh.current;
    if (!calm) s.t += delta;
    s.boot = calm ? 99 : s.boot + delta;
    const t = s.t;
    const sc = scroll.current;
    const damp = THREE.MathUtils.damp;

    const vw = state.viewport.width;
    const vh = state.viewport.height;
    const fit = THREE.MathUtils.clamp(vw / 10, 0.6, 1);
    const narrow = vw < 6;

    const key = pageRef.current;
    const tg: Pose = key === "" ? homePose(sc) : { ...(PAGE[key] ?? PAGE.about), ry: (PAGE[key] ?? PAGE.about).ry + sc * 0.9 };

    const a = anim.current;
    a.x = damp(a.x, narrow ? 0 : tg.x * vw, 3, delta);
    a.y = damp(a.y, tg.y * vh, 3, delta);
    a.s = damp(a.s, tg.s * fit * (narrow ? 0.75 : 1), 3, delta);
    a.ry = damp(a.ry, tg.ry, 3, delta);
    a.rx = damp(a.rx, tg.rx, 3, delta);
    a.door = damp(a.door, tg.door, 3, delta);
    s.door = a.door;
    s.mw = s.mw.map((w, i) => damp(w, i === tg.mode ? 1 : 0, 2.5, delta));

    const g = root.current;
    g.position.set(a.x, FLOOR + BASE * a.s + a.y + Math.sin(t * 0.8) * 0.02, 0);
    g.scale.setScalar(a.s);
    g.rotation.set(a.rx + ptr.current.y * 0.04, a.ry + Math.sin(t * 0.4) * 0.03 + ptr.current.x * 0.06, 0);

    const cam = state.camera;
    cam.position.x = damp(cam.position.x, ptr.current.x * 0.5, 2, delta);
    cam.position.y = damp(cam.position.y, 0.5 + ptr.current.y * 0.25, 2, delta);
    cam.lookAt(0, 0.3, 0);

    // which unit is the mouse over?
    ndc.set(ptr.current.x, ptr.current.y);
    ray.setFromCamera(ndc, cam);
    const list = hits.current.filter(Boolean);
    const hit = list.length ? ray.intersectObjects(list, false)[0] : undefined;
    s.hover = hit ? hits.current.indexOf(hit.object as THREE.Mesh) : -1;
  });

  return (
    <>
      <fog attach="fog" args={["#02040a", 8, 28]} />
      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#7fd7ff", "#050a14", 0.7]} />
      <directionalLight color="#dff6ff" intensity={2.2} position={[3, 6, 6]} />
      <pointLight color="#22d3ee" intensity={40} distance={14} decay={2} position={[-4, 1.5, 4]} />
      <pointLight color="#ff4d9d" intensity={30} distance={14} decay={2} position={[4, 2, -3]} />

      <primitive object={grid} position={[0, FLOOR, 0]} />
      <FarRacks sh={sh} />

      <group ref={root}>
        <Rack sh={sh} hits={hits} />
        <Dust sh={sh} />
        <Shadow />
      </group>
    </>
  );
}

export default function World() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_30%_20%,#0a1630_0%,#02040a_65%)]"
    >
      <Canvas camera={{ position: [0, 0.5, 8.5], fov: 45 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>
      {/* dark edges keep the text easy to read */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)]" />
    </div>
  );
}
