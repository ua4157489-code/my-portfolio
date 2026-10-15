"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { NAME } from "@/data/content";

// ---------- where the sculpture sits and which shape it takes ----------
// shape: 0 shield, 1 padlock, 2 knot, 3 globe, 4 galaxy, 5 your name
type Pose = { x: number; y: number; s: number; shape: number; a: number };

// Home page: one pose per part of the page (x is a fraction of the screen width)
const HOME: { at: number; p: Pose }[] = [
  { at: 0.0, p: { x: 0.25, y: 0, s: 1.0, shape: 0, a: 1 } },
  { at: 0.16, p: { x: -0.26, y: 0, s: 1.0, shape: 1, a: 1 } },
  { at: 0.34, p: { x: 0.26, y: 0, s: 1.0, shape: 2, a: 1 } },
  { at: 0.52, p: { x: 0.0, y: 0, s: 1.25, shape: 3, a: 0.45 } },
  { at: 0.68, p: { x: 0.27, y: 0, s: 1.0, shape: 4, a: 1 } },
  { at: 0.83, p: { x: -0.27, y: 0, s: 1.0, shape: 4, a: 1 } },
  { at: 0.93, p: { x: 0.0, y: 0, s: 1.1, shape: 5, a: 0.6 } },
  { at: 1.0, p: { x: 0.24, y: 0, s: 0.6, shape: 5, a: 1 } },
];

const PAGE: Record<string, Pose> = {
  about: { x: -0.28, y: 0, s: 0.95, shape: 0, a: 1 },
  experience: { x: 0.28, y: 0, s: 0.95, shape: 1, a: 1 },
  education: { x: -0.28, y: 0, s: 0.95, shape: 3, a: 1 },
  skills: { x: 0.28, y: 0, s: 0.95, shape: 2, a: 1 },
  projects: { x: -0.28, y: 0, s: 0.95, shape: 4, a: 1 },
  contact: { x: 0.22, y: 0, s: 0.6, shape: 5, a: 1 },
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
        shape: mix(a.p.shape, b.p.shape, f),
        a: mix(a.p.a, b.p.a, f),
      };
    }
  }
  return HOME[HOME.length - 1].p;
}

// ---------- the six shapes, as clouds of points ----------
function rng(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type R = () => number;

function shieldPts(n: number, r: R) {
  const out = new Float32Array(n * 3);
  const half = (y: number) =>
    y >= 0 ? 1.05 - 0.1 * Math.max(0, (y - 0.8) / 0.5) : 1.05 * Math.pow(Math.max(0, 1 + y / 1.5), 0.8);
  const check = [
    [-0.5, -0.05],
    [-0.15, -0.45],
    [0.55, 0.4],
  ];
  for (let i = 0; i < n; i++) {
    let x = 0;
    let y = 0;
    let z = 0;
    const mode = r();
    if (mode > 0.88) {
      const seg = r() < 0.4 ? 0 : 1;
      const t = r();
      x = check[seg][0] + (check[seg + 1][0] - check[seg][0]) * t + (r() - 0.5) * 0.1;
      y = check[seg][1] + (check[seg + 1][1] - check[seg][1]) * t + (r() - 0.5) * 0.1;
      z = 0.25 + (r() - 0.5) * 0.08;
    } else {
      do {
        x = (r() - 0.5) * 2.1;
        y = -1.5 + r() * 2.8;
      } while (Math.abs(x) > half(y));
      if (mode < 0.35) x = Math.sign(x || 1) * half(y) * (0.93 + r() * 0.07);
      z = (r() - 0.5) * 0.2 + 0.28 * (1 - (x * x) / 1.21);
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y + 0.1;
    out[i * 3 + 2] = z;
  }
  return out;
}

function lockPts(n: number, r: R) {
  const out = new Float32Array(n * 3);
  const dx = 1.7;
  const dy = 1.2;
  const dz = 0.7;
  const areas = [dy * dz * 2, dx * dz * 2, dx * dy * 2];
  const sum = areas[0] + areas[1] + areas[2];
  for (let i = 0; i < n; i++) {
    let x = 0;
    let y = 0;
    let z = 0;
    const m = r();
    if (m < 0.68) {
      const f = r() * sum;
      if (f < areas[0]) {
        x = (r() < 0.5 ? -1 : 1) * (dx / 2);
        y = (r() - 0.5) * dy;
        z = (r() - 0.5) * dz;
      } else if (f < areas[0] + areas[1]) {
        y = (r() < 0.5 ? -1 : 1) * (dy / 2);
        x = (r() - 0.5) * dx;
        z = (r() - 0.5) * dz;
      } else {
        z = (r() < 0.5 ? -1 : 1) * (dz / 2);
        x = (r() - 0.5) * dx;
        y = (r() - 0.5) * dy;
      }
      y -= 0.6;
    } else if (m < 0.94) {
      const phi = r() * Math.PI;
      const psi = r() * Math.PI * 2;
      const rad = 0.55 + 0.13 * Math.cos(psi);
      x = rad * Math.cos(phi);
      y = rad * Math.sin(phi);
      z = 0.13 * Math.sin(psi);
    } else {
      const a = r() * Math.PI * 2;
      const rr = Math.sqrt(r()) * 0.14;
      if (r() < 0.6) {
        x = rr * Math.cos(a);
        y = -0.55 + rr * Math.sin(a);
      } else {
        x = (r() - 0.5) * 0.08;
        y = -0.62 - r() * 0.25;
      }
      z = 0.37;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y + 0.26;
    out[i * 3 + 2] = z;
  }
  return out;
}

function knotPts(n: number, r: R) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = r() * Math.PI * 2;
    const rr = Math.cos(3 * t) + 2;
    const x = rr * Math.cos(2 * t);
    const y = rr * Math.sin(2 * t);
    const z = -Math.sin(3 * t);
    const u = r() * Math.PI * 2;
    const v = r() * 2 - 1;
    const s = Math.sqrt(1 - v * v);
    out[i * 3] = (x + s * Math.cos(u) * 0.28) * 0.58;
    out[i * 3 + 1] = (y + s * Math.sin(u) * 0.28) * 0.58;
    out[i * 3 + 2] = (z + v * 0.28) * 0.58;
  }
  return out;
}

function globePts(n: number, r: R) {
  const out = new Float32Array(n * 3);
  const R0 = 1.7;
  for (let i = 0; i < n; i++) {
    let lat: number;
    let lon: number;
    if (r() < 0.55) {
      lon = Math.floor(r() * 24) * ((Math.PI * 2) / 24);
      lat = (r() - 0.5) * Math.PI;
    } else {
      lat = (Math.floor(r() * 11) - 5) * (Math.PI / 12);
      lon = r() * Math.PI * 2;
    }
    const k = R0 * (1 + (r() - 0.5) * 0.01);
    out[i * 3] = k * Math.cos(lat) * Math.cos(lon);
    out[i * 3 + 1] = k * Math.sin(lat);
    out[i * 3 + 2] = k * Math.cos(lat) * Math.sin(lon);
  }
  return out;
}

function galaxyPts(n: number, r: R) {
  const out = new Float32Array(n * 3);
  const tilt = 0.9;
  for (let i = 0; i < n; i++) {
    let x: number;
    let y: number;
    let z: number;
    if (r() < 0.15) {
      const k = Math.pow(r(), 2) * 0.5;
      const a = r() * Math.PI * 2;
      const b = Math.acos(2 * r() - 1);
      x = k * Math.sin(b) * Math.cos(a);
      y = k * Math.cos(b);
      z = k * Math.sin(b) * Math.sin(a);
    } else {
      const rad = Math.pow(r(), 0.6) * 2.6 + 0.1;
      const arm = Math.floor(r() * 3);
      const th = (arm * Math.PI * 2) / 3 + rad * 2.2 + (r() - 0.5) * 0.55;
      x = rad * Math.cos(th);
      z = rad * Math.sin(th);
      y = (r() - 0.5) * 0.3 * (1 - rad / 3);
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y * Math.cos(tilt) - z * Math.sin(tilt);
    out[i * 3 + 2] = y * Math.sin(tilt) + z * Math.cos(tilt);
  }
  return out;
}

function spherePts(n: number, r: R) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const b = Math.acos(2 * r() - 1);
    out[i * 3] = 1.7 * Math.sin(b) * Math.cos(a);
    out[i * 3 + 1] = 1.7 * Math.cos(b);
    out[i * 3 + 2] = 1.7 * Math.sin(b) * Math.sin(a);
  }
  return out;
}

// the particles spell your name
function namePts(n: number, r: R) {
  try {
    const W = 1024;
    const H = 256;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    if (!g) return spherePts(n, r);
    const text = NAME.toUpperCase();
    g.font = '900 200px "Arial Black", Arial, sans-serif';
    const w = g.measureText(text).width;
    const size = Math.floor(200 * Math.min(1, 940 / Math.max(1, w)));
    g.font = `900 ${size}px "Arial Black", Arial, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "#fff";
    g.fillText(text, W / 2, H / 2);
    const data = g.getImageData(0, 0, W, H).data;
    const hits: number[] = [];
    for (let i = 3; i < data.length; i += 4) if (data[i] > 140) hits.push((i - 3) / 4);
    if (hits.length < 50) return spherePts(n, r);
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const px = hits[Math.floor(r() * hits.length)];
      out[i * 3] = ((px % W) / W - 0.5) * 5.4;
      out[i * 3 + 1] = -(Math.floor(px / W) / H - 0.5) * 1.35;
      out[i * 3 + 2] = (r() - 0.5) * 0.18;
    }
    return out;
  } catch {
    return spherePts(n, r);
  }
}

function buildShapes(n: number) {
  const r = rng(7);
  const shapes = [shieldPts(n, r), lockPts(n, r), knotPts(n, r), globePts(n, r), galaxyPts(n, r), namePts(n, r)];
  const rand = new Float32Array(n * 3);
  for (let i = 0; i < rand.length; i++) rand[i] = r();
  return { shapes, rand };
}

// ---------- shaders ----------
const VERT = `
attribute vec3 aP0; attribute vec3 aP1; attribute vec3 aP2;
attribute vec3 aP3; attribute vec3 aP4; attribute vec3 aP5;
attribute vec3 aR;
uniform float uA; uniform float uTime; uniform float uPulse;
uniform float uSize; uniform float uScale; uniform float uAlpha;
uniform vec3 uMouse;
varying vec3 vCol;
varying float vA;
void main() {
  float base = floor(uA);
  float f = uA - base;
  float ff = smoothstep(aR.x * 0.5, 0.5 + aR.x * 0.5, f);
  float u = base + ff;
  vec3 p = aP0 * max(0.0, 1.0 - abs(u - 0.0))
         + aP1 * max(0.0, 1.0 - abs(u - 1.0))
         + aP2 * max(0.0, 1.0 - abs(u - 2.0))
         + aP3 * max(0.0, 1.0 - abs(u - 3.0))
         + aP4 * max(0.0, 1.0 - abs(u - 4.0))
         + aP5 * max(0.0, 1.0 - abs(u - 5.0));
  float tr = sin(ff * 3.14159265);
  vec3 sw = vec3(sin(uTime * 0.8 + aR.y * 6.2831), cos(uTime * 0.6 + aR.z * 6.2831), sin(uTime * 0.7 + aR.x * 6.2831));
  p += sw * tr * 1.4 * (0.4 + aR.y);
  p += sw * 0.025;
  p *= 1.0 + uPulse * 0.1 * aR.z;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec2 d = wp.xy - uMouse.xy;
  float m = smoothstep(1.4, 0.0, length(d));
  wp.xy += normalize(d + vec2(0.0001)) * m * 0.55;
  wp.z += m * 0.5;
  vec4 mv = viewMatrix * wp;
  gl_Position = projectionMatrix * mv;
  float size = uSize * (0.6 + aR.y * 0.9) * (1.0 + m * 0.8) * (1.0 + uPulse * 0.6);
  gl_PointSize = size * uScale / -mv.z;
  float h = smoothstep(-1.6, 1.6, p.y);
  vec3 cA = vec3(0.13, 0.83, 0.93);
  vec3 cB = vec3(0.65, 0.55, 0.98);
  vec3 cC = vec3(1.0, 0.3, 0.6);
  vCol = mix(cA, cB, h);
  vCol = mix(vCol, cC, step(0.965, aR.z) * 0.9);
  vCol += m * vec3(0.4, 0.3, 0.2);
  vA = uAlpha * (0.5 + 0.5 * aR.y);
}`;

const FRAG = `
varying vec3 vCol;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d);
  gl_FragColor = vec4(vCol, a * vA);
}`;

function Scene() {
  const pathname = usePathname();
  const pageRef = useRef(pathname.split("/")[1] ?? "");
  useEffect(() => {
    pageRef.current = pathname.split("/")[1] ?? "";
  }, [pathname]);

  const mobile = useMemo(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false), []);
  const N = mobile ? 12000 : 28000;
  const data = useMemo(() => buildShapes(N), [N]);

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
          uA: { value: 0 },
          uTime: { value: 0 },
          uPulse: { value: 0 },
          uSize: { value: 0.022 },
          uScale: { value: 1000 },
          uAlpha: { value: 1 },
          uMouse: { value: new THREE.Vector3(99, 99, 0) },
        },
      }),
    []
  );

  const dust = useMemo(() => {
    const r = rng(99);
    const arr = new Float32Array(1600 * 3);
    for (let i = 0; i < 1600; i++) {
      const a = r() * Math.PI * 2;
      const b = Math.acos(2 * r() - 1);
      const k = 14 + r() * 26;
      arr[i * 3] = k * Math.sin(b) * Math.cos(a);
      arr[i * 3 + 1] = k * Math.cos(b);
      arr[i * 3 + 2] = k * Math.sin(b) * Math.sin(a);
    }
    return arr;
  }, []);

  const grp = useRef<THREE.Group>(null!);
  const dustRef = useRef<THREE.Points>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null!);

  const time = useRef(0);
  const scroll = useRef(0);
  const ptr = useRef({ x: 0, y: 0 });
  const anim = useRef({ x: 0, y: 0, s: 0.6, shape: 0, a: 0 });
  const lastShape = useRef(0);
  const pulse = useRef(0);
  const ring = useRef(1);

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
    const t2 = setTimeout(readScroll, 1500);
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
    // "Calm" in the display settings freezes the idle motion
    const calm = document.documentElement.dataset.motion === "calm";
    if (!calm) time.current += delta;
    const t = time.current;
    const s = scroll.current;
    const damp = THREE.MathUtils.damp;

    const vw = state.viewport.width;
    const vh = state.viewport.height;
    const narrow = vw < 6;
    const fit = THREE.MathUtils.clamp(vw / 10, 0.55, 1);

    const key = pageRef.current;
    const tg = key === "" ? homePose(s) : PAGE[key] ?? PAGE.about;
    const a = anim.current;
    a.x = damp(a.x, narrow ? 0 : tg.x * vw, 2.6, delta);
    a.y = damp(a.y, tg.y * vh + (narrow ? 0.12 * vh : 0), 2.6, delta);
    a.s = damp(a.s, tg.s * fit * (narrow ? 0.8 : 1), 2.6, delta);
    a.shape = damp(a.shape, tg.shape, 2.2, delta);
    a.a = damp(a.a, tg.a * (narrow ? 0.6 : 1), 2.6, delta);

    const rs = Math.round(tg.shape);
    if (rs !== lastShape.current) {
      lastShape.current = rs;
      pulse.current = 1;
      ring.current = 0;
    }
    pulse.current = damp(pulse.current, 0, 2.5, delta);
    ring.current = Math.min(1, ring.current + delta * 0.8);

    const cam = state.camera as THREE.PerspectiveCamera;
    const h = state.size.height * state.viewport.dpr;
    const u = mat.uniforms;
    u.uA.value = THREE.MathUtils.clamp(a.shape, 0, 5);
    u.uTime.value = t;
    u.uPulse.value = pulse.current;
    u.uAlpha.value = a.a;
    u.uScale.value = h / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
    (u.uMouse.value as THREE.Vector3).set((ptr.current.x * vw) / 2, (ptr.current.y * vh) / 2, 0);

    // the name shape faces the camera so it can be read
    const face = 1 - THREE.MathUtils.clamp(a.shape - 4, 0, 1);
    const g = grp.current;
    g.position.set(a.x, a.y, 0);
    g.scale.setScalar(a.s);
    g.rotation.y = (t * 0.18 + s * 2.0) * face + ptr.current.x * 0.25;
    g.rotation.x = -ptr.current.y * 0.12;

    ringRef.current.position.set(a.x, a.y, 0);
    ringRef.current.scale.setScalar(a.s * (1 + ring.current * 4.5));
    ringMat.current.opacity = (1 - ring.current) * 0.45 * a.a;

    dustRef.current.rotation.y = t * 0.01 + s * 0.4 + ptr.current.x * 0.05;
    dustRef.current.rotation.x = ptr.current.y * 0.03;

    cam.position.x = damp(cam.position.x, ptr.current.x * 0.4, 2, delta);
    cam.position.y = damp(cam.position.y, ptr.current.y * 0.25, 2, delta);
    cam.lookAt(0, 0, 0);
  });

  return (
    <>
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.07}
          color="#9fe8ff"
          transparent
          opacity={0.5}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <mesh ref={ringRef}>
        <ringGeometry args={[1.7, 1.74, 128]} />
        <meshBasicMaterial
          ref={ringMat}
          color="#22d3ee"
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <group ref={grp}>
        <points frustumCulled={false} material={mat}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[data.shapes[0], 3]} />
            {data.shapes.map((arr, i) => (
              <bufferAttribute key={i} attach={`attributes-aP${i}`} args={[arr, 3]} />
            ))}
            <bufferAttribute attach="attributes-aR" args={[data.rand, 3]} />
          </bufferGeometry>
        </points>
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
      <Canvas camera={{ position: [0, 0, 8.5], fov: 45 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>
      {/* dark edges keep the text easy to read */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.6)_100%)]" />
    </div>
  );
}
