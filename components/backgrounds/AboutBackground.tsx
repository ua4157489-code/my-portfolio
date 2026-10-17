"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Stage } from "./shared";

/* A calm, cinematic backdrop for the whole About page:
   a night sky (stars + slow aurora) over a glowing data landscape.
   Scrolling the page flies you forward over the terrain and slowly shifts the colours. */

const TERRAIN_VERT = /* glsl */ `
  uniform float uT; uniform float uScroll;
  varying vec3 vW; varying float vH; varying float vD;
  float hgt(vec2 p, float t){
    float a = smoothstep(2.5, 14.0, abs(p.x));
    float h = sin(p.x * 0.23 + t * 0.25) * cos(p.y * 0.19 - t * 0.18) * 1.6
            + sin(p.x * 0.55 + p.y * 0.41 + t * 0.4) * 0.45
            + sin(p.y * 0.8 - t * 0.5) * 0.12;
    return h * a * 1.3;
  }
  void main(){
    vec3 p = position;
    vec2 w = vec2(p.x, p.z - uScroll);
    p.y += hgt(w, uT);
    vW = vec3(w.x, 0.0, w.y);
    vH = p.y;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vD = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const TERRAIN_FRAG = /* glsl */ `
  uniform vec3 uA; uniform vec3 uB; uniform float uGain;
  varying vec3 vW; varying float vH; varying float vD;
  void main(){
    vec2 c = vW.xz / 1.2;
    vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
    float line = 1.0 - min(min(g.x, g.y), 1.0);
    float fade = (1.0 - smoothstep(12.0, 44.0, vD)) * smoothstep(1.5, 5.0, vD);
    vec3 col = mix(uA, uB, clamp(vH * 0.35 + 0.5, 0.0, 1.0));
    float a = (line * 0.75 + 0.03) * fade * uGain;
    gl_FragColor = vec4(col * (0.6 + vH * 0.12), a);
  }`;

const AURORA_VERT = /* glsl */ `
  uniform float uT; uniform float uPh;
  varying vec2 vUv;
  void main(){
    vUv = uv;
    vec3 p = position;
    p.y += sin(p.x * 0.2 + uT * 0.4 + uPh) * 1.2;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const AURORA_FRAG = /* glsl */ `
  uniform float uT; uniform float uPh; uniform vec3 uA; uniform vec3 uB; uniform float uAlpha;
  varying vec2 vUv;
  void main(){
    float v = vUv.y;
    float edge = pow(1.0 - v, 1.6) * smoothstep(0.0, 0.08, v);
    float wave = 0.55 + 0.45 * sin(vUv.x * 10.0 + uT * 0.6 + uPh);
    float side = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
    vec3 col = mix(uA, uB, vUv.x);
    gl_FragColor = vec4(col, edge * wave * side * uAlpha);
  }`;
const HAZE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const HAZE_FRAG = /* glsl */ `
  uniform vec3 uA; uniform vec3 uB;
  varying vec2 vUv;
  void main(){
    float d = vUv.y - 0.5;
    float band = exp(-pow(d * 6.0, 2.0));
    float wide = exp(-pow(d * 2.2, 2.0)) * 0.35;
    vec3 col = mix(uB, uA, smoothstep(0.0, 1.0, vUv.x));
    gl_FragColor = vec4(col, (band * 0.32 + wide * 0.14));
  }`;

// colour story as you scroll: cyan/violet -> violet/magenta -> green/cyan
const PAL = [
  [new THREE.Color("#22d3ee"), new THREE.Color("#a78bfa")],
  [new THREE.Color("#a78bfa"), new THREE.Color("#e879f9")],
  [new THREE.Color("#34d399"), new THREE.Color("#22d3ee")],
];

function Scene() {
  const stars = useRef<THREE.Group>(null!);
  const aur = useRef<THREE.Group>(null!);
  const cA = useMemo(() => new THREE.Color(), []);
  const cB = useMemo(() => new THREE.Color(), []);
  const sc = useRef(0);
  const ptr = useRef({ x: 0, y: 0 });

  const terrainGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(60, 70, 150, 160);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const uTerrain = useMemo(() => ({ uT: { value: 0 }, uScroll: { value: 0 }, uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uGain: { value: 1 } }), []);
  const uHaze = useMemo(() => ({ uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() } }), []);
  const uAur = useMemo(
    () => [0, 2.1, 4.2].map((ph) => ({ uT: { value: 0 }, uPh: { value: ph }, uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uAlpha: { value: 0.16 } })),
    []
  );
  const starPos = useMemo(() => {
    const N = 1700, a = new Float32Array(N * 3);
    let s = 3;
    const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < N; i++) {
      const th = r() * Math.PI * 2, ph = Math.acos(1 - r() * 1.05); // upper hemisphere
      a[i * 3] = 70 * Math.sin(ph) * Math.cos(th);
      a[i * 3 + 1] = 70 * Math.cos(ph) - 2;
      a[i * 3 + 2] = 70 * Math.sin(ph) * Math.sin(th) - 20;
    }
    return a;
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const el = document.documentElement;
    const max = Math.max(1, el.scrollHeight - window.innerHeight);
    const target = Math.min(1, Math.max(0, window.scrollY / max));
    sc.current = THREE.MathUtils.damp(sc.current, target, 4, dt);
    const p = sc.current;

    // palette along the page
    const f = p * (PAL.length - 1), i0 = Math.min(PAL.length - 2, Math.floor(f)), k = f - i0;
    cA.copy(PAL[i0][0]).lerp(PAL[i0 + 1][0], k);
    cB.copy(PAL[i0][1]).lerp(PAL[i0 + 1][1], k);
    uTerrain.uA.value.copy(cA);
    uTerrain.uB.value.copy(cB);
    uHaze.uA.value.copy(cA);
    uHaze.uB.value.copy(cB);
    uAur.forEach((u, i) => {
      u.uA.value.copy(i % 2 ? cB : cA);
      u.uB.value.copy(i % 2 ? cA : cB);
    });

    uTerrain.uT.value = t;
    uTerrain.uScroll.value = p * 70 + t * 0.6; // always drifting, scroll flies you forward
    uAur.forEach((u) => (u.uT.value = t));
    stars.current.rotation.y = t * 0.004 + p * 0.5;

    // gentle camera parallax
    const cam = state.camera;
    const dm = THREE.MathUtils.damp;
    cam.position.x = dm(cam.position.x, ptr.current.x * 0.9, 2.5, dt);
    cam.position.y = dm(cam.position.y, 0.2 + ptr.current.y * 0.35 + p * 0.5, 2.5, dt);
    cam.position.z = 4;
    cam.lookAt(0, 1.2, -20);
  });

  // pointer (window-level so it works under the page content)
  useMemo(() => {
    if (typeof window === "undefined") return;
    window.addEventListener(
      "pointermove",
      (e) => {
        ptr.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        ptr.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
      },
      { passive: true }
    );
  }, []);

  return (
    <>
      {/* horizon haze */}
      <mesh position={[0, 0, -46]}>
        <planeGeometry args={[140, 60]} />
        <shaderMaterial vertexShader={HAZE_VERT} fragmentShader={HAZE_FRAG} uniforms={uHaze} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* stars */}
      <group ref={stars}>
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[starPos, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.16} color="#cfe6ff" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
        </points>
      </group>

      {/* aurora ribbons */}
      <group ref={aur}>
        {uAur.map((u, i) => (
          <mesh key={i} position={[(i - 1) * 9, 7 + i * 2.2, -30 - i * 4]} rotation={[0.1, (i - 1) * 0.25, (i - 1) * 0.05]}>
            <planeGeometry args={[44, 7, 60, 1]} />
            <shaderMaterial vertexShader={AURORA_VERT} fragmentShader={AURORA_FRAG} uniforms={u} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* data landscape */}
      <mesh geometry={terrainGeo} position={[0, -3.4, -20]} frustumCulled={false}>
        <shaderMaterial vertexShader={TERRAIN_VERT} fragmentShader={TERRAIN_FRAG} uniforms={uTerrain} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
}

export default function AboutBackground() {
  return (
    <Stage camera={[0, 0.2, 4]}>
      <Scene />
    </Stage>
  );
}
