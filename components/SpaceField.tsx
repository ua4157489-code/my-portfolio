"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import * as THREE from "three";

type Shared = MutableRefObject<{ p: number; mx: number; my: number }>;
const fadeOf = (p: number) => THREE.MathUtils.smoothstep(p, 0.003, 0.06);

/* ───────── tiny deterministic helpers ───────── */
function rngOf(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(x: number, y: number, s: number) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x: number, y: number, s: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number, s: number) {
  let t = 0, a = 0.5;
  for (let i = 0; i < 5; i++) {
    t += a * vnoise(x, y, s + i);
    x *= 2;
    y *= 2;
    a *= 0.5;
  }
  return t;
}

/* ───────── procedural textures ───────── */
function cloudTexture(seed: number, c1: number[], c2: number[]) {
  const S = 192;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const ctx = cv.getContext("2d")!;
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = (x / S - 0.5) * 2, dy = (y / S - 0.5) * 2;
      const mk = Math.pow(Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)), 1.4);
      const n = fbm((x / S) * 3.2, (y / S) * 3.2, seed);
      const m = fbm((x / S) * 2 + 9, (y / S) * 2 + 3, seed + 9);
      const a = Math.min(1, Math.max(0, (n - 0.36) * 2.3)) * mk;
      const boost = 1 + n * n * 0.8;
      const i = (y * S + x) * 4;
      img.data[i] = Math.min(255, (c1[0] + (c2[0] - c1[0]) * m) * boost);
      img.data[i + 1] = Math.min(255, (c1[1] + (c2[1] - c1[1]) * m) * boost);
      img.data[i + 2] = Math.min(255, (c1[2] + (c2[2] - c1[2]) * m) * boost);
      img.data[i + 3] = a * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ───────── star shader ───────── */
const STAR_VERT = /* glsl */ `
  attribute float aS; attribute vec3 aC; attribute float aP;
  uniform float uT; uniform float uPix; uniform float uFade;
  varying vec3 vC; varying float vA;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float tw = 0.72 + 0.28 * sin(uT * (0.8 + aP * 2.2) + aP * 40.0);
    vC = aC; vA = tw * uFade;
    gl_PointSize = clamp(aS * uPix * 26.0 / -mv.z, 1.0 * uPix, 15.0 * uPix);
  }`;
const STAR_FRAG = /* glsl */ `
  varying vec3 vC; varying float vA;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = exp(-d * d * 30.0);
    gl_FragColor = vec4(vC, a * vA);
  }`;

const DISK_VERT = /* glsl */ `
  varying vec2 vP;
  void main(){
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const DISK_FRAG = /* glsl */ `
  uniform float uT; uniform float uFade; uniform float uIn; uniform float uOut; uniform float uGain;
  varying vec2 vP;
  void main(){
    float r = length(vP);
    float t = clamp((r - uIn) / (uOut - uIn), 0.0, 1.0);
    float ang = atan(vP.y, vP.x);
    float sw  = sin(ang * 6.0  - uT * 1.4 / (0.3 + t) + t * 14.0) * 0.5 + 0.5;
    float sw2 = sin(ang * 13.0 - uT * 2.2 / (0.3 + t) - t * 22.0) * 0.5 + 0.5;
    float stripes = 0.55 + 0.35 * sw + 0.25 * sw2 * (1.0 - t);
    float dop = 0.5 + 0.5 * cos(ang - 0.6);          // one side beamed brighter
    vec3 hot = vec3(1.0, 0.93, 0.8), mid = vec3(1.0, 0.55, 0.18), cold = vec3(0.5, 0.1, 0.05);
    vec3 col = mix(hot, mid, smoothstep(0.0, 0.35, t));
    col = mix(col, cold, smoothstep(0.35, 1.0, t));
    float edge = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.65, 1.0, t));
    float a = edge * stripes * (0.3 + 0.9 * dop) * (1.2 - t * 0.6) * uGain;
    gl_FragColor = vec4(col * 1.5, a * uFade);
  }`;

function glowTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,170,80,0.9)");
  g.addColorStop(0.25, "rgba(255,110,40,0.35)");
  g.addColorStop(1, "rgba(255,80,20,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}
function cometTexture() {
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 16;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, "rgba(120,190,255,0)");
  g.addColorStop(0.7, "rgba(170,215,255,0.35)");
  g.addColorStop(0.97, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(128, 8, 128, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(cv);
}

/* ───────── the whole space scene ───────── */
export default function SpaceField({ sh }: { sh: Shared }) {
  const root = useRef<THREE.Group>(null!);
  const starMat = useRef<THREE.ShaderMaterial>(null!);
  const nebula = useRef<THREE.Group>(null!);

  /* stars: many sizes, real colour temperatures, deep z range */
  const stars = useMemo(() => {
    const N = 3900, r = rngOf(7);
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), siz = new Float32Array(N), ph = new Float32Array(N);
    const temps = [[0.62, 0.74, 1], [0.85, 0.9, 1], [1, 1, 1], [1, 0.9, 0.72], [1, 0.72, 0.52]];
    for (let i = 0; i < N; i++) {
      const band = i < 1100; // faint milky-way band, tilted
      const dust = i >= N - 260; // sparse motes near the flight path
      if (band) {
        const x = (r() - 0.5) * 100;
        pos[i * 3] = x;
        pos[i * 3 + 1] = x * 0.32 + (r() + r() + r() - 1.5) * 7;
        pos[i * 3 + 2] = -30 - r() * 60;
      } else if (dust) {
        pos[i * 3] = (r() - 0.5) * 16;
        pos[i * 3 + 1] = (r() - 0.5) * 9;
        pos[i * 3 + 2] = 8 - r() * 64;
      } else {
        pos[i * 3] = (r() - 0.5) * 90;
        pos[i * 3 + 1] = (r() - 0.5) * 52;
        pos[i * 3 + 2] = 12 - r() * 100;
      }
      const t = temps[Math.floor(Math.pow(r(), 1.4) * temps.length)];
      const b = (0.5 + r() * 0.5) * (band ? 0.55 : dust ? 0.35 : 1);
      col[i * 3] = t[0] * b;
      col[i * 3 + 1] = t[1] * b;
      col[i * 3 + 2] = t[2] * b;
      siz[i] = dust ? 0.3 + r() * 0.3 : band ? 0.3 + r() * 0.5 : r() < 0.04 ? 1.6 + r() * 1.6 : 0.35 + r() * 0.9; // a few bright ones
      ph[i] = r();
    }
    return { pos, col, siz, ph };
  }, []);

  /* nebula clouds (procedural fbm textures, additive) */
  const clouds = useMemo(() => {
    const r = rngOf(21);
    const pals = [
      [[10, 90, 120], [30, 170, 200]],
      [[70, 30, 140], [150, 80, 230]],
      [[130, 25, 90], [230, 80, 170]],
      [[15, 50, 130], [60, 130, 230]],
    ];
    return Array.from({ length: 10 }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      const pal = pals[i % pals.length];
      return {
        tex: cloudTexture(30 + i * 7, pal[0], pal[1]),
        pos: [side * (6 + r() * 9), (r() - 0.5) * 12, 2 - i * 7.5] as [number, number, number],
        scale: 22 + r() * 14,
        op: 0.15 + r() * 0.12,
        spin: (r() - 0.5) * 0.02,
      };
    });
  }, []);


  /* black hole */
  const bh = useRef<THREE.Group>(null!);
  const diskMat = useRef<THREE.ShaderMaterial>(null!);
  const haloMat = useRef<THREE.ShaderMaterial>(null!);
  const holeMat = useRef<THREE.MeshBasicMaterial>(null!);
  const glowMat = useRef<THREE.SpriteMaterial>(null!);
  const gTex = useMemo(() => glowTexture(), []);

  /* comets */
  const cometGroup = useRef<THREE.Group>(null!);
  const cTex = useMemo(() => cometTexture(), []);
  const comets = useRef(
    Array.from({ length: 4 }, (_, i) => ({ t: -1 - i * 2.2, life: 0.9, x: 0, y: 0, z: 0, a: 0, sp: 24 }))
  );

  useFrame((state, dt) => {
    const f = fadeOf(sh.current.p);
    root.current.visible = f > 0.01;
    if (f <= 0.01) return;
    const t = state.clock.elapsedTime;

    starMat.current.uniforms.uT.value = t;
    starMat.current.uniforms.uFade.value = f;
    starMat.current.uniforms.uPix.value = state.gl.getPixelRatio();

    nebula.current.children.forEach((c, i) => {
      const sp = c as THREE.Sprite;
      sp.material.opacity = clouds[i].op * f;
      sp.material.rotation += clouds[i].spin * dt;
    });

    diskMat.current.uniforms.uT.value = t;
    diskMat.current.uniforms.uFade.value = f;
    haloMat.current.uniforms.uT.value = t;
    haloMat.current.uniforms.uFade.value = f;
    holeMat.current.opacity = f;
    glowMat.current.opacity = 0.28 * f;
    bh.current.rotation.z = Math.sin(t * 0.1) * 0.06;

    comets.current.forEach((c, i) => {
      const sp = cometGroup.current.children[i] as THREE.Sprite;
      const wasWaiting = c.t < 0;
      c.t += dt;
      if (c.t < 0) {
        sp.visible = false;
        return;
      }
      if (wasWaiting) {
        const camZ = state.camera.position.z;
        c.z = camZ - 22 - Math.random() * 18;
        c.x = (Math.random() - 0.5) * 22;
        c.y = (Math.random() - 0.15) * 7;
        c.a = (Math.random() < 0.5 ? -0.55 : -Math.PI + 0.55) + (Math.random() - 0.5) * 0.4;
      }
      if (c.t >= c.life) {
        c.t = -(3 + Math.random() * 7);
        sp.visible = false;
        return;
      }
      sp.visible = true;
      sp.position.set(c.x + Math.cos(c.a) * c.sp * c.t, c.y + Math.sin(c.a) * c.sp * c.t, c.z);
      sp.material.rotation = c.a;
      sp.material.opacity = Math.sin((Math.PI * c.t) / c.life) * 0.9 * f;
    });

  });

  return (
    <group ref={root}>
      {/* stars */}
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars.pos, 3]} />
          <bufferAttribute attach="attributes-aC" args={[stars.col, 3]} />
          <bufferAttribute attach="attributes-aS" args={[stars.siz, 1]} />
          <bufferAttribute attach="attributes-aP" args={[stars.ph, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={starMat}
          vertexShader={STAR_VERT}
          fragmentShader={STAR_FRAG}
          uniforms={{ uT: { value: 0 }, uPix: { value: 1 }, uFade: { value: 0 } }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* nebula */}
      <group ref={nebula}>
        {clouds.map((c, i) => (
          <sprite key={i} position={c.pos} scale={[c.scale, c.scale, 1]}>
            <spriteMaterial map={c.tex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        ))}
      </group>

      {/* black hole */}
      <group ref={bh} position={[20, 8, -62]}>
        <mesh>
          <sphereGeometry args={[1.6, 48, 32]} />
          <meshBasicMaterial ref={holeMat} color="#000000" transparent opacity={0} />
        </mesh>
        <sprite scale={[16, 16, 1]}>
          <spriteMaterial ref={glowMat} map={gTex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        {/* tilted accretion disk */}
        <mesh rotation={[Math.PI / 2 - 0.2, 0, 0]}>
          <ringGeometry args={[1.9, 6.5, 128, 4]} />
          <shaderMaterial
            ref={diskMat}
            vertexShader={DISK_VERT}
            fragmentShader={DISK_FRAG}
            uniforms={{ uT: { value: 0 }, uFade: { value: 0 }, uIn: { value: 1.9 }, uOut: { value: 6.5 }, uGain: { value: 1 } }}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* lensed halo: light bent over and under the hole */}
        <mesh>
          <ringGeometry args={[1.65, 2.5, 96, 2]} />
          <shaderMaterial
            ref={haloMat}
            vertexShader={DISK_VERT}
            fragmentShader={DISK_FRAG}
            uniforms={{ uT: { value: 0 }, uFade: { value: 0 }, uIn: { value: 1.65 }, uOut: { value: 2.5 }, uGain: { value: 0.75 } }}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* comets */}
      <group ref={cometGroup}>
        {comets.current.map((_, i) => (
          <sprite key={i} scale={[3.4, 0.05, 1]} visible={false}>
            <spriteMaterial map={cTex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        ))}
      </group>
    </group>
  );
}
