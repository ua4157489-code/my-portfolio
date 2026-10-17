"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// A cyber energy core. A dark glass sphere with plasma inside, wrapped in a dense glowing 3D web
// (a geodesic mesh with light pulses running along every thread), a second web turning the other
// way inside it, lightning arcs jumping through the middle, gyroscope rings with sparks, a halo of
// drifting particles, and a ripple that spreads out from a random node every few seconds.
//
// Use it inside a react-three-fiber <Canvas>:   <NetworkWeb radius={1.5} />
type Props = { radius?: number; opacity?: number; nodes?: number };

function rngOf(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────── shaders ───────── */
const NOISE3 = /* glsl */ `
  float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float n3(vec3 x){
    vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h3(i + vec3(0.0,0.0,0.0)), h3(i + vec3(1.0,0.0,0.0)), f.x),
                   mix(h3(i + vec3(0.0,1.0,0.0)), h3(i + vec3(1.0,1.0,0.0)), f.x), f.y),
               mix(mix(h3(i + vec3(0.0,0.0,1.0)), h3(i + vec3(1.0,0.0,1.0)), f.x),
                   mix(h3(i + vec3(0.0,1.0,1.0)), h3(i + vec3(1.0,1.0,1.0)), f.x), f.y), f.z);
  }
  float fbm3(vec3 p){
    float s = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++){ s += a * n3(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
    return s;
  }
`;

// dark glass ball with moving plasma and a bright rim: it gives the web a dark backdrop so it stays visible
const GLASS_VERT = /* glsl */ `
  varying vec3 vN; varying vec3 vV; varying vec3 vL;
  void main(){
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = -mv.xyz;
    vL = position;
    gl_Position = projectionMatrix * mv;
  }`;
const GLASS_FRAG = /* glsl */ `
  uniform float uT; uniform float uOp; uniform float uFlash;
  varying vec3 vN; varying vec3 vV; varying vec3 vL;
  ${NOISE3}
  void main(){
    vec3 n = normalize(vN);
    vec3 v = normalize(vV);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 2.5);
    float p1 = fbm3(vL * 2.2 + vec3(0.0, uT * 0.25, uT * 0.1));
    float p2 = fbm3(vL * 4.5 - vec3(uT * 0.2, 0.0, uT * 0.15));
    float plasma = smoothstep(0.35, 0.85, p1 * 0.6 + p2 * 0.6);
    vec3 col = vec3(0.01, 0.04, 0.09)
             + vec3(0.05, 0.35, 0.6) * plasma * (0.55 + uFlash * 0.8)
             + vec3(0.1, 0.8, 1.0) * fres * 0.9
             + vec3(0.5, 0.2, 0.9) * plasma * fres * 0.4;
    float a = uOp * clamp(0.64 + fres * 0.4 + plasma * 0.1, 0.0, 0.95);
    gl_FragColor = vec4(col, a);
  }`;

const COMMON = /* glsl */ `
  uniform float uT; uniform float uOp; uniform vec3 uWC; uniform float uWR; uniform float uDrift;
  vec3 drift(vec3 ph, float t){
    return vec3(sin(t * 0.6 + ph.x * 6.2831), cos(t * 0.5 + ph.y * 6.2831), sin(t * 0.7 + ph.z * 6.2831)) * uDrift;
  }
  float waveAt(vec3 p){
    float d = (length(p - uWC) - uWR) / 0.3;
    return exp(-d * d);
  }
`;

const LINE_VERT = /* glsl */ `
  attribute vec3 aPh; attribute float aEnd; attribute float aEdge; attribute float aHub;
  ${COMMON}
  varying float vAlong; varying float vE; varying float vWave; varying float vHub; varying float vFront;
  void main(){
    vAlong = aEnd; vE = aEdge; vHub = aHub;
    vWave = waveAt(position);
    vec3 p = position + drift(aPh, uT);
    vec3 vn = normalize(mat3(modelViewMatrix) * position);
    vFront = smoothstep(-0.35, 0.75, vn.z);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const LINE_FRAG = /* glsl */ `
  uniform float uT; uniform float uOp; uniform vec3 uC1; uniform vec3 uC2;
  varying float vAlong; varying float vE; varying float vWave; varying float vHub; varying float vFront;
  void main(){
    float u = fract(uT * 0.24 + vE);
    float d = (vAlong - u) * 7.0;
    float pulse = exp(-d * d);
    vec3 col = mix(uC1, uC2, vHub) + vWave * vec3(0.7, 0.25, 0.4) + pulse * 0.4;
    float a = uOp * (0.26 + pulse * 1.1 + vWave * 1.0) * mix(0.28, 1.0, vFront);
    gl_FragColor = vec4(col, a);
  }`;

const NODE_VERT = /* glsl */ `
  attribute vec3 aPh; attribute float aHub;
  uniform float uScale; uniform float uPix; uniform float uRad;
  ${COMMON}
  varying vec3 vCol; varying float vA;
  void main(){
    vec3 p = position + drift(aPh, uT);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vec3 vn = normalize(mat3(modelViewMatrix) * position);
    float front = smoothstep(-0.35, 0.75, vn.z);
    float wave = waveAt(position);
    float tw = 0.75 + 0.25 * sin(uT * (1.5 + aPh.x * 2.0) + aPh.y * 20.0);
    float size = (0.028 + aHub * 0.05 + wave * 0.07) * uRad * tw;
    gl_PointSize = clamp(size * uScale / -mv.z, 1.5 * uPix, 26.0 * uPix);
    vCol = mix(vec3(0.35, 0.95, 1.0), vec3(1.0, 0.75, 1.0), aHub) + wave * vec3(0.6, 0.2, 0.3);
    vA = uOp * (0.5 + wave * 0.6) * mix(0.3, 1.0, front);
  }`;
const DOT_FRAG = /* glsl */ `
  varying vec3 vCol; varying float vA;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = exp(-d * d * 22.0);
    gl_FragColor = vec4(vCol, a * vA);
  }`;

// halo of drifting particles
const HALO_VERT = /* glsl */ `
  attribute float aS;
  uniform float uT; uniform float uOp; uniform float uScale; uniform float uPix; uniform float uRad;
  varying vec3 vCol; varying float vA;
  void main(){
    float ang = uT * (0.08 + aS * 0.2);
    float c = cos(ang); float s = sin(ang);
    vec3 b = position;
    vec3 p = vec3(c * b.x - s * b.z, b.y + sin(uT * 0.6 + aS * 6.2831) * 0.05, s * b.x + c * b.z);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = (0.014 + aS * 0.03) * uRad;
    gl_PointSize = clamp(size * uScale / -mv.z, 1.0 * uPix, 10.0 * uPix);
    vCol = mix(vec3(0.4, 0.9, 1.0), vec3(0.8, 0.6, 1.0), aS);
    vA = uOp * (0.35 + 0.5 * (0.5 + 0.5 * sin(uT * (1.0 + aS * 2.0) + aS * 30.0)));
  }`;

/* ───────── geometry helpers ───────── */
function glowTexture(inner: string, mid: string, outer: string) {
  const S = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.3, mid);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(cv);
}
function ringTexture() {
  const S = 256;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const ctx = cv.getContext("2d")!;
  ctx.strokeStyle = "rgba(170,240,255,1)";
  ctx.lineWidth = 6;
  ctx.shadowColor = "rgba(80,220,255,1)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 22, 0, Math.PI * 2);
  ctx.stroke();
  return new THREE.CanvasTexture(cv);
}

// geodesic web: nodes on a sphere joined by threads (detail 1 is sparse, 3 is dense)
function geodesic(detail: number, seed: number) {
  const ico = new THREE.IcosahedronGeometry(1, detail);
  const pos = ico.attributes.position as THREE.BufferAttribute;
  const idx = ico.index;
  const verts: THREE.Vector3[] = [];
  const index = new Map<string, number>();
  const key = (v: THREE.Vector3) => `${Math.round(v.x * 1e3)},${Math.round(v.y * 1e3)},${Math.round(v.z * 1e3)}`;
  const idOf = (i: number) => {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    const k = key(v);
    let id = index.get(k);
    if (id === undefined) {
      id = verts.length;
      verts.push(v);
      index.set(k, id);
    }
    return id;
  };
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  const tri = (idx ? idx.count : pos.count) / 3;
  const vid = (n: number) => idOf(idx ? idx.getX(n) : n);
  for (let f = 0; f < tri; f++) {
    const t = [vid(f * 3), vid(f * 3 + 1), vid(f * 3 + 2)];
    for (let e = 0; e < 3; e++) {
      const a = t[e];
      const b = t[(e + 1) % 3];
      const k = a < b ? a + "-" + b : b + "-" + a;
      if (!seen.has(k)) {
        seen.add(k);
        edges.push([a, b]);
      }
    }
  }
  const deg = new Array(verts.length).fill(0);
  edges.forEach(([a, b]) => {
    deg[a]++;
    deg[b]++;
  });
  const hub = deg.map((d) => (d <= 5 ? 1 : 0));
  const r = rngOf(seed);
  const ph = verts.map(() => [r(), r(), r()]);

  const lp = new Float32Array(edges.length * 6);
  const lph = new Float32Array(edges.length * 6);
  const lend = new Float32Array(edges.length * 2);
  const ledge = new Float32Array(edges.length * 2);
  const lhub = new Float32Array(edges.length * 2);
  edges.forEach(([a, b], e) => {
    const phase = r();
    [a, b].forEach((n, k) => {
      const v = e * 2 + k;
      lp.set([verts[n].x, verts[n].y, verts[n].z], v * 3);
      lph.set(ph[n], v * 3);
      lend[v] = k;
      ledge[v] = phase;
      lhub[v] = hub[n];
    });
  });
  const lines = new THREE.BufferGeometry();
  lines.setAttribute("position", new THREE.BufferAttribute(lp, 3));
  lines.setAttribute("aPh", new THREE.BufferAttribute(lph, 3));
  lines.setAttribute("aEnd", new THREE.BufferAttribute(lend, 1));
  lines.setAttribute("aEdge", new THREE.BufferAttribute(ledge, 1));
  lines.setAttribute("aHub", new THREE.BufferAttribute(lhub, 1));

  const np = new Float32Array(verts.length * 3);
  const nph = new Float32Array(verts.length * 3);
  verts.forEach((p, i) => {
    np.set([p.x, p.y, p.z], i * 3);
    nph.set(ph[i], i * 3);
  });
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute("position", new THREE.BufferAttribute(np, 3));
  nodeGeo.setAttribute("aPh", new THREE.BufferAttribute(nph, 3));
  nodeGeo.setAttribute("aHub", new THREE.BufferAttribute(Float32Array.from(hub), 1));
  return { verts, lines, nodeGeo };
}

type Uni = Record<string, { value: number | THREE.Vector3 | THREE.Color }>;

export default function NetworkWeb({ radius = 1.5, opacity = 1 }: Props) {
  const group = useRef<THREE.Group>(null!);
  const outerRef = useRef<THREE.Group>(null!);
  const innerRef = useRef<THREE.Group>(null!);
  const ringsRef = useRef<THREE.Group>(null!);
  const core = useRef<THREE.Sprite>(null!);
  const shock = useRef<THREE.Sprite>(null!);
  const time = useRef(0);
  const wave = useRef({ next: 1.2, t0: -99 });

  const outer = useMemo(() => geodesic(3, 31), []);
  const inner = useMemo(() => geodesic(1, 77), []);

  const mkUniforms = (c1: THREE.Color, c2: THREE.Color, drift: number): Uni => ({
    uT: { value: 0 },
    uOp: { value: opacity },
    uWC: { value: new THREE.Vector3() },
    uWR: { value: -10 },
    uDrift: { value: drift },
    uScale: { value: 1000 },
    uPix: { value: 1 },
    uRad: { value: radius },
    uC1: { value: c1 },
    uC2: { value: c2 },
  });
  const outerU = useMemo(() => mkUniforms(new THREE.Color("#22d3ee"), new THREE.Color("#c4b5fd"), 0.012), [opacity, radius]); // eslint-disable-line react-hooks/exhaustive-deps
  const innerU = useMemo(() => mkUniforms(new THREE.Color("#a78bfa"), new THREE.Color("#ff7ac6"), 0.035), [opacity, radius]); // eslint-disable-line react-hooks/exhaustive-deps

  const mats = useMemo(() => {
    const mk = (v: string, f: string, u: Uni) =>
      new THREE.ShaderMaterial({
        vertexShader: v,
        fragmentShader: f,
        uniforms: u,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
    return {
      outerLine: mk(LINE_VERT, LINE_FRAG, outerU),
      outerNode: mk(NODE_VERT, DOT_FRAG, outerU),
      innerLine: mk(LINE_VERT, LINE_FRAG, innerU),
      innerNode: mk(NODE_VERT, DOT_FRAG, innerU),
    };
  }, [outerU, innerU]);

  const glassU = useMemo(() => ({ uT: { value: 0 }, uOp: { value: opacity }, uFlash: { value: 0 } }), [opacity]);

  // particle halo
  const halo = useMemo(() => {
    const N = 520, r = rngOf(9);
    const pos = new Float32Array(N * 3);
    const s = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = r() * Math.PI * 2;
      const b = Math.acos(2 * r() - 1);
      const k = 1.15 + r() * 0.8;
      pos[i * 3] = Math.sin(b) * Math.cos(a) * k;
      pos[i * 3 + 1] = Math.cos(b) * k;
      pos[i * 3 + 2] = Math.sin(b) * Math.sin(a) * k;
      s[i] = r();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aS", new THREE.BufferAttribute(s, 1));
    return geo;
  }, []);
  const haloU = useMemo(
    () => ({ uT: { value: 0 }, uOp: { value: opacity }, uScale: { value: 1000 }, uPix: { value: 1 }, uRad: { value: radius } }),
    [opacity, radius]
  );
  const haloMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: HALO_VERT,
        fragmentShader: DOT_FRAG,
        uniforms: haloU,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [haloU]
  );

  // lightning arcs through the middle
  const arcs = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(24 * 3), 3));
        const mat = new THREE.LineBasicMaterial({
          color: "#c8f7ff",
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        return { line: new THREE.Line(geo, mat), a: new THREE.Vector3(), b: new THREE.Vector3(), t0: -99, life: 0.5, next: 0.4 + i * 0.35, last: 0 };
      }),
    []
  );

  // gyroscope rings with sparks running around them
  const rings = useMemo(
    () =>
      [
        { r: 1.32, tx: 1.2, tz: 0.2, sp: 0.5 },
        { r: 1.55, tx: 0.4, tz: -0.9, sp: -0.35 },
        { r: 1.78, tx: -0.8, tz: 0.5, sp: 0.22 },
      ].map((c) => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 128; i++) {
          const a = (i / 128) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * c.r, 0, Math.sin(a) * c.r));
        }
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: "#8be9ff", transparent: true, opacity: 0.3 * opacity, depthWrite: false, blending: THREE.AdditiveBlending })
        );
        const sparkGeo = new THREE.BufferGeometry();
        sparkGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(9), 3));
        const sparks = new THREE.Points(
          sparkGeo,
          new THREE.PointsMaterial({ color: "#ffffff", size: 0.07 * radius, transparent: true, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending })
        );
        const g = new THREE.Group();
        g.rotation.set(c.tx, 0, c.tz);
        g.add(line, sparks);
        return { ...c, g, sparkGeo };
      }),
    [opacity, radius]
  );

  const coreTex = useMemo(() => glowTexture("rgba(230,252,255,1)", "rgba(80,200,255,0.35)", "rgba(40,120,255,0)"), []);
  const shockTex = useMemo(() => ringTexture(), []);

  useFrame((state, dt) => {
    const calm = document.documentElement.dataset.motion === "calm";
    if (!calm) time.current += dt;
    const t = time.current;
    const pix = state.gl.getPixelRatio();
    const cam = state.camera as THREE.PerspectiveCamera;
    const fov = typeof cam.fov === "number" ? cam.fov : 50;
    const scale = (state.size.height * pix) / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));

    // a ripple spreads out from a random node every few seconds
    const w = wave.current;
    if (t > w.next) {
      const o = outer.verts[Math.floor(Math.random() * outer.verts.length)];
      (outerU.uWC.value as THREE.Vector3).copy(o);
      (innerU.uWC.value as THREE.Vector3).copy(o);
      w.t0 = t;
      w.next = t + 4.5 + Math.random() * 3;
    }
    const age = t - w.t0;
    const wr = age >= 0 && age < 2.6 ? age * 1.1 : -10;
    const flash = age >= 0 && age < 0.9 ? Math.sin((age / 0.9) * Math.PI) : 0;

    [outerU, innerU].forEach((u) => {
      u.uT.value = t;
      u.uWR.value = wr;
      u.uScale.value = scale;
      u.uPix.value = pix;
    });
    glassU.uT.value = t;
    glassU.uFlash.value = flash;
    haloU.uT.value = t;
    haloU.uScale.value = scale;
    haloU.uPix.value = pix;

    // motion: outer web turns one way, inner web the other, rings tumble, the whole thing breathes
    const px = state.pointer.x;
    const py = state.pointer.y;
    group.current.scale.setScalar(radius * (1 + 0.025 * Math.sin(t * 0.9) + flash * 0.035));
    group.current.rotation.set(Math.sin(t * 0.23) * 0.2 + py * 0.22, px * 0.35, Math.sin(t * 0.17) * 0.06);
    outerRef.current.rotation.set(0.1, t * 0.14, 0);
    innerRef.current.rotation.set(-t * 0.1, -t * 0.32, t * 0.08);
    ringsRef.current.rotation.y = t * 0.12;

    rings.forEach((rg) => {
      const a = rg.sparkGeo.attributes.position as THREE.BufferAttribute;
      for (let k = 0; k < 3; k++) {
        const ang = t * rg.sp * 2 + k * 2.094;
        a.setXYZ(k, Math.cos(ang) * rg.r, 0, Math.sin(ang) * rg.r);
      }
      a.needsUpdate = true;
    });

    // lightning arcs
    arcs.forEach((arc) => {
      if (t > arc.next) {
        const v = outer.verts;
        arc.a.copy(v[Math.floor(Math.random() * v.length)]).multiplyScalar(0.98);
        for (let k = 0; k < 8; k++) {
          arc.b.copy(v[Math.floor(Math.random() * v.length)]).multiplyScalar(0.98);
          if (arc.a.angleTo(arc.b) > 1.3) break;
        }
        arc.t0 = t;
        arc.life = 0.35 + Math.random() * 0.5;
        arc.next = t + arc.life + 0.4 + Math.random() * 2.2;
      }
      const ag = t - arc.t0;
      const mat = arc.line.material as THREE.LineBasicMaterial;
      if (ag >= 0 && ag < arc.life) {
        mat.opacity = opacity * Math.sin((ag / arc.life) * Math.PI) * (0.6 + 0.4 * Math.random());
        if (t - arc.last > 0.05) {
          arc.last = t;
          const p = arc.line.geometry.attributes.position as THREE.BufferAttribute;
          for (let k = 0; k < 24; k++) {
            const s = k / 23;
            const amp = Math.sin(Math.PI * s) * 0.16;
            p.setXYZ(
              k,
              arc.a.x + (arc.b.x - arc.a.x) * s + (Math.random() - 0.5) * amp * 2,
              arc.a.y + (arc.b.y - arc.a.y) * s + (Math.random() - 0.5) * amp * 2,
              arc.a.z + (arc.b.z - arc.a.z) * s + (Math.random() - 0.5) * amp * 2
            );
          }
          p.needsUpdate = true;
        }
      } else mat.opacity = 0;
    });

    // glowing core and the shock ring that follows each ripple
    const cs = 0.9 + 0.15 * Math.sin(t * 2.2) + flash * 0.5;
    core.current.scale.set(cs, cs, 1);
    (core.current.material as THREE.SpriteMaterial).opacity = 0.55 * opacity;
    const sa = age >= 0 && age < 1.4 ? age / 1.4 : 1;
    const ss = 1.2 + sa * 2.2;
    shock.current.scale.set(ss, ss, 1);
    (shock.current.material as THREE.SpriteMaterial).opacity = sa < 1 ? (1 - sa) * 0.5 * opacity : 0;
  });

  return (
    <group ref={group}>
      {/* dark glass ball with plasma: draws first so the web always has something dark behind it */}
      <mesh renderOrder={-1}>
        <sphereGeometry args={[0.97, 64, 48]} />
        <shaderMaterial vertexShader={GLASS_VERT} fragmentShader={GLASS_FRAG} uniforms={glassU} transparent depthWrite={false} />
      </mesh>

      <sprite ref={core} scale={[0.9, 0.9, 1]}>
        <spriteMaterial map={coreTex} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite ref={shock} scale={[1.2, 1.2, 1]}>
        <spriteMaterial map={shockTex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      {/* outer web (dense) with the lightning arcs inside it */}
      <group ref={outerRef}>
        <lineSegments frustumCulled={false} geometry={outer.lines} material={mats.outerLine} />
        <points frustumCulled={false} geometry={outer.nodeGeo} material={mats.outerNode} />
        {arcs.map((a, i) => (
          <primitive key={i} object={a.line} />
        ))}
      </group>

      {/* inner web turning the other way */}
      <group ref={innerRef} scale={0.58}>
        <lineSegments frustumCulled={false} geometry={inner.lines} material={mats.innerLine} />
        <points frustumCulled={false} geometry={inner.nodeGeo} material={mats.innerNode} />
      </group>

      <group ref={ringsRef}>
        {rings.map((rg, i) => (
          <primitive key={i} object={rg.g} />
        ))}
      </group>

      <points frustumCulled={false} geometry={halo} material={haloMat} />
    </group>
  );
}
