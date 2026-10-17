"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// A living 3D web: glowing nodes joined by threads. Light pulses run along the threads,
// the nodes drift and twinkle, hubs glow brighter, and every few seconds a ripple spreads
// out from a random node. The whole web turns slowly, breathes, and leans toward the mouse.
//
// Use it inside a react-three-fiber <Canvas>:   <NetworkWeb radius={1.6} />
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

const COMMON = /* glsl */ `
  uniform float uT; uniform float uOp; uniform vec3 uWC; uniform float uWR;
  vec3 drift(vec3 ph, float t){
    return vec3(sin(t * 0.6 + ph.x * 6.2831), cos(t * 0.5 + ph.y * 6.2831), sin(t * 0.7 + ph.z * 6.2831)) * 0.07;
  }
  float waveAt(vec3 p){
    float d = (length(p - uWC) - uWR) / 0.28;
    return exp(-d * d);
  }
`;

const LINE_VERT = /* glsl */ `
  attribute vec3 aPh; attribute float aEnd; attribute float aEdge; attribute float aHub;
  ${COMMON}
  varying float vAlong; varying float vE; varying float vWave; varying float vHub;
  void main(){
    vAlong = aEnd; vE = aEdge; vHub = aHub;
    vWave = waveAt(position);
    vec3 p = position + drift(aPh, uT);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const LINE_FRAG = /* glsl */ `
  uniform float uT; uniform float uOp;
  varying float vAlong; varying float vE; varying float vWave; varying float vHub;
  void main(){
    float u = fract(uT * 0.22 + vE);
    float d = (vAlong - u) * 7.0;
    float pulse = exp(-d * d);
    vec3 col = mix(vec3(0.13, 0.83, 0.93), vec3(0.65, 0.55, 0.98), vHub) + vWave * vec3(0.7, 0.2, 0.35);
    float a = uOp * (0.14 + pulse * 0.95 + vWave * 0.9);
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
    float wave = waveAt(position);
    float tw = 0.75 + 0.25 * sin(uT * (1.5 + aPh.x * 2.0) + aPh.y * 20.0);
    float size = (0.05 + aHub * 0.06 + wave * 0.08) * uRad * tw;
    gl_PointSize = clamp(size * uScale / -mv.z, 1.5 * uPix, 30.0 * uPix);
    vCol = mix(vec3(0.3, 0.9, 1.0), vec3(0.8, 0.65, 1.0), aHub) + wave * vec3(0.6, 0.2, 0.3);
    vA = uOp * (0.65 + wave * 0.6);
  }`;
const NODE_FRAG = /* glsl */ `
  varying vec3 vCol; varying float vA;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = exp(-d * d * 22.0);
    gl_FragColor = vec4(vCol, a * vA);
  }`;

function glowTexture() {
  const S = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(120,230,255,0.9)");
  g.addColorStop(0.3, "rgba(60,170,230,0.25)");
  g.addColorStop(1, "rgba(30,120,220,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(cv);
}

export default function NetworkWeb({ radius = 1.6, opacity = 1, nodes = 64 }: Props) {
  const group = useRef<THREE.Group>(null!);
  const time = useRef(0);
  const wave = useRef({ next: 1.5, t0: -99 });

  const web = useMemo(() => {
    const r = rngOf(31);
    const golden = Math.PI * (3 - Math.sqrt(5));
    const P: THREE.Vector3[] = [];
    // nodes on a rough sphere, plus a few inside
    for (let i = 0; i < nodes; i++) {
      const y = 1 - (i / (nodes - 1)) * 2;
      const rr = Math.sqrt(1 - y * y);
      const th = golden * i;
      const k = 0.72 + r() * 0.28;
      P.push(new THREE.Vector3(Math.cos(th) * rr * k, y * k, Math.sin(th) * rr * k));
    }
    for (let i = 0; i < 10; i++) {
      const a = r() * Math.PI * 2;
      const b = Math.acos(2 * r() - 1);
      const k = 0.15 + r() * 0.4;
      P.push(new THREE.Vector3(Math.sin(b) * Math.cos(a) * k, Math.cos(b) * k, Math.sin(b) * Math.sin(a) * k));
    }
    const N = P.length;

    // threads: each node joins its nearest neighbours
    const edges = new Set<string>();
    const list: [number, number][] = [];
    const deg = new Array(N).fill(0);
    for (let i = 0; i < N; i++) {
      const near = P.map((q, j) => ({ j, d: P[i].distanceTo(q) }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, i >= nodes ? 4 : 3);
      near.forEach((o) => {
        const key = Math.min(i, o.j) + "-" + Math.max(i, o.j);
        if (!edges.has(key)) {
          edges.add(key);
          list.push([i, o.j]);
          deg[i]++;
          deg[o.j]++;
        }
      });
    }
    const hub = deg.map((d) => (d >= 6 ? 1 : 0));
    const ph = P.map(() => [r(), r(), r()]);

    // line geometry: two vertices per thread
    const lp = new Float32Array(list.length * 6);
    const lph = new Float32Array(list.length * 6);
    const lend = new Float32Array(list.length * 2);
    const ledge = new Float32Array(list.length * 2);
    const lhub = new Float32Array(list.length * 2);
    list.forEach(([a, b], e) => {
      const ends = [a, b];
      const phase = r();
      ends.forEach((n, k) => {
        const v = e * 2 + k;
        lp.set([P[n].x, P[n].y, P[n].z], v * 3);
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

    // node geometry
    const np = new Float32Array(N * 3);
    const nph = new Float32Array(N * 3);
    P.forEach((p, i) => {
      np.set([p.x, p.y, p.z], i * 3);
      nph.set(ph[i], i * 3);
    });
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(np, 3));
    nodeGeo.setAttribute("aPh", new THREE.BufferAttribute(nph, 3));
    nodeGeo.setAttribute("aHub", new THREE.BufferAttribute(Float32Array.from(hub), 1));

    return { P, lines, nodeGeo };
  }, [nodes]);

  const uniforms = useMemo(
    () => ({
      uT: { value: 0 },
      uOp: { value: opacity },
      uWC: { value: new THREE.Vector3() },
      uWR: { value: -10 },
      uScale: { value: 1000 },
      uPix: { value: 1 },
      uRad: { value: radius },
    }),
    [opacity, radius]
  );

  const lineMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: LINE_VERT,
        fragmentShader: LINE_FRAG,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms]
  );
  const nodeMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: NODE_VERT,
        fragmentShader: NODE_FRAG,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms]
  );
  const glow = useMemo(() => glowTexture(), []);

  useFrame((state, dt) => {
    const calm = document.documentElement.dataset.motion === "calm";
    if (!calm) time.current += dt;
    const t = time.current;

    // a ripple spreads out from a random node every few seconds
    const w = wave.current;
    if (t > w.next) {
      uniforms.uWC.value.copy(web.P[Math.floor(Math.random() * web.P.length)]);
      w.t0 = t;
      w.next = t + 5 + Math.random() * 3;
    }
    const age = t - w.t0;
    uniforms.uWR.value = age >= 0 && age < 2.6 ? age * 0.95 : -10;

    uniforms.uT.value = t;
    uniforms.uPix.value = state.gl.getPixelRatio();
    const cam = state.camera as THREE.PerspectiveCamera;
    const fov = typeof cam.fov === "number" ? cam.fov : 50;
    uniforms.uScale.value = (state.size.height * state.gl.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(fov) / 2));

    const g = group.current;
    g.scale.setScalar(radius * (1 + 0.03 * Math.sin(t * 0.9)));
    g.rotation.y = t * 0.16 + state.pointer.x * 0.4;
    g.rotation.x = Math.sin(t * 0.23) * 0.25 + state.pointer.y * 0.25;
  });

  return (
    <group ref={group}>
      <sprite scale={[2.8, 2.8, 1]}>
        <spriteMaterial map={glow} transparent opacity={0.28 * opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <lineSegments frustumCulled={false} geometry={web.lines} material={lineMat} />
      <points frustumCulled={false} geometry={web.nodeGeo} material={nodeMat} />
    </group>
  );
}
