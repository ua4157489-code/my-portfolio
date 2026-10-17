"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import * as THREE from "three";

type Shared = MutableRefObject<{ p: number; mx: number; my: number }>;

function rngOf(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────── build a real-looking orb web ─────────
   radial spokes (some run past the frame), a capture spiral that sags
   between spokes, a few broken threads, and dew drops at the joints. */
export function buildWeb() {
  const r = rngOf(11);
  const SP = 14, RINGS = 17, R = 2.3, U0 = 0.1, STEP = (1 - U0) / RINGS;
  const angs = Array.from({ length: SP }, (_, i) => (i / SP) * Math.PI * 2 + (r() - 0.5) * 0.28);
  const rad = angs.map(() => R * (0.88 + r() * 0.2));
  const z = (u: number) => -0.5 * Math.pow(Math.abs(u), 1.5);

  const pos: number[] = [], aR: number[] = [], aK: number[] = [], aJ: number[] = [];
  const dropP: number[] = [], dropR: number[] = [], dropJ: number[] = [], dropS: number[] = [];

  const seg = (ax: number, ay: number, az: number, au: number, bx: number, by: number, bz: number, bu: number, k: number, j: number) => {
    pos.push(ax, ay, az, bx, by, bz);
    aR.push(au, bu);
    aK.push(k, k);
    aJ.push(j, j);
  };

  // spokes
  for (let i = 0; i < SP; i++) {
    const umax = i % 3 === 0 ? 1.28 : 1;
    const n = Math.round(20 * umax);
    const j = r();
    for (let s = 0; s < n; s++) {
      const u0 = (s / n) * umax, u1 = ((s + 1) / n) * umax;
      const a = angs[i];
      seg(
        Math.cos(a) * u0 * rad[i], Math.sin(a) * u0 * rad[i], z(u0), u0,
        Math.cos(a) * u1 * rad[i], Math.sin(a) * u1 * rad[i], z(u1), u1,
        0, j
      );
    }
  }

  // capture spiral, sagging between neighbouring spokes
  for (let k = 0; k < RINGS; k++) {
    for (let i = 0; i < SP; i++) {
      const ua = U0 + (k + i / SP) * STEP, ub = ua + STEP / SP;
      if (ub > 0.985) continue;
      if (k > 1 && r() < 0.05) continue; // broken thread
      const a0 = angs[i];
      const a1 = i === SP - 1 ? angs[0] + Math.PI * 2 : angs[i + 1];
      const r0 = rad[i], r1 = rad[(i + 1) % SP];
      const j = r();
      const n = 6;
      let prev: number[] | null = null;
      for (let s = 0; s <= n; s++) {
        const w = s / n;
        const uu = ua + (ub - ua) * w;
        const ang = a0 + (a1 - a0) * w;
        const rr = uu * (r0 + (r1 - r0) * w) * (1 - 0.055 * Math.sin(Math.PI * w));
        const cur = [Math.cos(ang) * rr, Math.sin(ang) * rr, z(uu), uu];
        if (prev) seg(prev[0], prev[1], prev[2], prev[3], cur[0], cur[1], cur[2], cur[3], 1, j);
        prev = cur;
      }
      if (r() < 0.32) {
        const rr = ua * r0;
        dropP.push(Math.cos(a0) * rr, Math.sin(a0) * rr, z(ua) + 0.01);
        dropR.push(ua);
        dropJ.push(r());
        dropS.push(0.55 + r() * 0.8);
      }
    }
  }
  // a few big dew drops
  for (let q = 0; q < 7; q++) {
    const i = Math.floor(r() * SP), u = 0.3 + r() * 0.6, rr = u * rad[i];
    dropP.push(Math.cos(angs[i]) * rr, Math.sin(angs[i]) * rr, z(u) + 0.01);
    dropR.push(u);
    dropJ.push(r());
    dropS.push(1.7 + r() * 0.6);
  }
  const f = (a: number[]) => new Float32Array(a);
  return { pos: f(pos), aR: f(aR), aK: f(aK), aJ: f(aJ), dropP: f(dropP), dropR: f(dropR), dropJ: f(dropJ), dropS: f(dropS) };
}

/* ───────── shaders ───────── */
const DISP = /* glsl */ `
  uniform float uT; uniform float uFront; uniform vec2 uSrc;
  vec4 disp(vec3 p, float aR, float aJ){
    float d = distance(p.xy, uSrc);
    float ring = exp(-pow((d - uFront) / 0.24, 2.0)) * (1.0 - smoothstep(2.0, 4.6, uFront));
    p.z += ring * 0.2 * sin((d - uFront) * 16.0);
    p.z += sin(uT * 0.9 + p.x * 2.0 + p.y * 1.6 + aJ * 6.0) * 0.03 * (0.3 + aR);
    p.xy += 0.012 * vec2(sin(uT * 1.3 + aJ * 9.0), cos(uT * 1.1 + aJ * 7.0)) * aR;
    return vec4(p, ring);
  }`;

const LINE_VERT = DISP + /* glsl */ `
  attribute float aR; attribute float aK; attribute float aJ;
  varying float vB;
  void main(){
    vec4 d = disp(position, aR, aJ);
    vB = 0.42 + 0.3 * aK + d.w * 1.7;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(d.xyz, 1.0);
  }`;
const LINE_FRAG = /* glsl */ `
  uniform float uFade; uniform float uGain;
  varying float vB;
  void main(){
    vec3 c = mix(vec3(0.5, 0.82, 1.0), vec3(1.0), clamp(vB - 0.75, 0.0, 1.0));
    gl_FragColor = vec4(c, clamp(vB, 0.0, 1.0) * 0.85 * uFade * uGain);
  }`;

const DROP_VERT = DISP + /* glsl */ `
  attribute float aR; attribute float aJ; attribute float aS;
  uniform float uPix;
  varying float vB;
  void main(){
    vec4 d = disp(position, aR, aJ);
    vec4 mv = modelViewMatrix * vec4(d.xyz, 1.0);
    gl_Position = projectionMatrix * mv;
    vB = 0.75 + 0.25 * sin(uT * 1.7 + aJ * 30.0) + d.w * 1.5;
    gl_PointSize = clamp(aS * uPix * 34.0 / -mv.z * (1.0 + d.w * 0.8), 1.5 * uPix, 14.0 * uPix);
  }`;
const DROP_FRAG = /* glsl */ `
  uniform float uFade;
  varying float vB;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = exp(-d * d * 60.0);
    float halo = exp(-d * d * 12.0) * 0.35;
    gl_FragColor = vec4(mix(vec3(0.6, 0.9, 1.0), vec3(1.0), core), (core + halo) * clamp(vB, 0.0, 1.4) * uFade);
  }`;

function glow() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.4)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

/* ───────── the station ───────── */
export default function WebStation({ sh }: { sh: Shared }) {
  const root = useRef<THREE.Group>(null!);
  const prey = useRef<THREE.Group>(null!);
  const preyGlow = useRef<THREE.SpriteMaterial>(null!);

  const web = useMemo(() => buildWeb(), []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(web.pos, 3));
    g.setAttribute("aR", new THREE.BufferAttribute(web.aR, 1));
    g.setAttribute("aK", new THREE.BufferAttribute(web.aK, 1));
    g.setAttribute("aJ", new THREE.BufferAttribute(web.aJ, 1));
    return g;
  }, [web]);
  const dropGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(web.dropP, 3));
    g.setAttribute("aR", new THREE.BufferAttribute(web.dropR, 1));
    g.setAttribute("aJ", new THREE.BufferAttribute(web.dropJ, 1));
    g.setAttribute("aS", new THREE.BufferAttribute(web.dropS, 1));
    return g;
  }, [web]);

  const base = useMemo(
    () => ({ uT: { value: 0 }, uFront: { value: 9 }, uSrc: { value: new THREE.Vector2(0.55, -0.35) }, uFade: { value: 1 }, uPix: { value: 1 } }),
    []
  );
  const uMain = useMemo(() => ({ ...base, uGain: { value: 1 } }), [base]);
  const uBack = useMemo(() => ({ ...base, uGain: { value: 0.32 } }), [base]);
  const gTex = useMemo(() => glow(), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const phase = t % 3.6; // a struggle every few seconds sends a wave through the web
    base.uT.value = t;
    base.uFront.value = phase * 1.5;
    base.uPix.value = state.gl.getPixelRatio();

    const damp = THREE.MathUtils.damp;
    root.current.rotation.y = damp(root.current.rotation.y, sh.current.mx * 0.45 + Math.sin(t * 0.25) * 0.2, 3, dt);
    root.current.rotation.x = damp(root.current.rotation.x, 0.08 - sh.current.my * 0.2, 3, dt);

    const k = Math.exp(-phase * 2.2);
    prey.current.scale.setScalar(1 + 0.18 * Math.sin(t * 16) * k);
    preyGlow.current.opacity = 0.3 + 0.5 * k;
  });

  return (
    <group ref={root} scale={0.92}>
      {/* the web: main layer + a fainter one behind for depth */}
      <lineSegments geometry={geo} frustumCulled={false}>
        <shaderMaterial vertexShader={LINE_VERT} fragmentShader={LINE_FRAG} uniforms={uMain} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <lineSegments geometry={geo} frustumCulled={false} position={[0, 0, -0.75]} scale={1.2} rotation={[0, 0, 0.22]}>
        <shaderMaterial vertexShader={LINE_VERT} fragmentShader={LINE_FRAG} uniforms={uBack} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>

      {/* dew drops */}
      <points geometry={dropGeo} frustumCulled={false}>
        <shaderMaterial vertexShader={DROP_VERT} fragmentShader={DROP_FRAG} uniforms={base} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* the caught "vulnerability" */}
      <group ref={prey} position={[0.55, -0.35, -0.06]}>
        <mesh>
          <icosahedronGeometry args={[0.085, 1]} />
          <meshBasicMaterial color="#ff3355" />
        </mesh>
        <sprite scale={[0.75, 0.75, 1]}>
          <spriteMaterial ref={preyGlow} map={gTex} color="#ff2d55" transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
    </group>
  );
}
