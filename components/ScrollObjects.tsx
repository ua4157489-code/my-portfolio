"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import HackerDesk from "./HackerDesk";

const N = 6000;
const rnd = Math.random;

function build(fn: (i: number) => [number, number, number]) {
  const a = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) a.set(fn(i), i * 3);
  return a;
}

function shapes() {
  const globe = build((i) => {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), t = i * 2.39996;
    return [Math.cos(t) * r * 1.6, y * 1.6, Math.sin(t) * r * 1.6];
  });
  const cube = build(() => {
    const f = Math.floor(rnd() * 6), u = (rnd() - 0.5) * 2.6, v = (rnd() - 0.5) * 2.6, h = f % 2 ? 1.3 : -1.3;
    return f < 2 ? [h, u, v] : f < 4 ? [u, h, v] : [u, v, h];
  });
  const helix = build(() => {
    const u = rnd(), a = u * Math.PI * 6, s = rnd() < 0.5 ? 0 : Math.PI;
    return [Math.cos(a + s) * 1, (u - 0.5) * 4, Math.sin(a + s) * 1];
  });
  const lock = build(() => {
    if (rnd() < 0.35) { // shackle
      const a = rnd() * Math.PI, r = 0.8 + (rnd() - 0.5) * 0.12;
      return [Math.cos(a) * r, 0.7 + Math.sin(a) * r, (rnd() - 0.5) * 0.2];
    }
    return [(rnd() - 0.5) * 2.2, -0.2 - rnd() * 1.4, (rnd() - 0.5) * 0.9];
  });
  const knot = build(() => {
    const t = rnd() * Math.PI * 2, r = 2 + Math.cos(3 * t);
    return [r * Math.cos(2 * t) * 0.6, r * Math.sin(2 * t) * 0.6, Math.sin(3 * t) * 0.9];
  });
  return [lock, globe, cube, helix, knot];
}

const vert = /* glsl */ `
attribute vec3 s0; attribute vec3 s1; attribute vec3 s2; attribute vec3 s3; attribute vec3 s4;
attribute float aRand;
uniform float uIdx, uTime, uRot, uPx;
varying float vY; varying float vR;
vec3 pick(float i){ if(i<0.5) return s0; if(i<1.5) return s1; if(i<2.5) return s2; if(i<3.5) return s3; return s4; }
void main(){
  float i = clamp(uIdx, 0.0, 3.9999);
  float a = floor(i), fr = fract(i);
  float ff = smoothstep(0.0, 1.0, clamp(fr * 1.6 - aRand * 0.6, 0.0, 1.0));
  vec3 p = mix(pick(a), pick(a + 1.0), ff);
  p += normalize(p + 0.001) * sin(fr * 3.14159) * (0.4 + aRand) * 1.1;
  p += vec3(sin(uTime + aRand * 20.0), cos(uTime * 0.8 + aRand * 17.0), sin(uTime * 0.9 + aRand * 13.0)) * 0.03;
  float c = cos(uRot), s = sin(uRot);
  p = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.5 + aRand * 2.2) * uPx * (7.0 / -mv.z);
  vY = p.y; vR = aRand;
}`;

const frag = /* glsl */ `
uniform float uAlpha;
varying float vY; varying float vR;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 2.0);
  vec3 col = mix(vec3(0.13, 0.83, 0.93), vec3(0.65, 0.55, 0.98), clamp(vY * 0.25 + 0.5 + vR * 0.3, 0.0, 1.0));
  gl_FragColor = vec4(col * 1.3, a * 0.9 * uAlpha);
}`;

function Rig({ home }: { home: boolean }) {
  const hacker = useRef<THREE.Group>(null!);
  const obj = useRef<THREE.Group>(null!);
  const mat = useRef<THREE.ShaderMaterial>(null!);
  const sv = useRef(0);
  const idx = useRef(0);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const sh = shapes();
    sh.forEach((arr, k) => g.setAttribute(`s${k}`, new THREE.BufferAttribute(arr, 3)));
    g.setAttribute("position", new THREE.BufferAttribute(sh[0], 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(Float32Array.from({ length: N }, rnd), 1));
    return g;
  }, []);
  const uniforms = useMemo(() => ({ uIdx: { value: 0 }, uTime: { value: 0 }, uRot: { value: 0 }, uPx: { value: 1 }, uAlpha: { value: 0 } }), []);

  useFrame((state, delta) => {
    const { viewport, pointer, size } = state;
    const d = THREE.MathUtils.damp;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? THREE.MathUtils.clamp(window.scrollY / max, 0, 1) : 0;
    sv.current = d(sv.current, p, 3, delta);
    const narrow = size.width < 768;
    const vh = window.innerHeight;
    const y = window.scrollY;

    // hacker: only in the hero, rises and fades as you scroll away
    const hero = home ? THREE.MathUtils.clamp(1 - y / (vh * 0.6), 0, 1) : 0;
    const h = hacker.current;
    h.visible = hero > 0.01;
    h.position.x = narrow ? 0 : 0.26 * viewport.width;
    h.position.y = (narrow ? -0.4 : -1.55) + (1 - hero) * 3.2;
    h.scale.setScalar((narrow ? 0.62 : 1.2) * (0.6 + 0.4 * hero));
    h.rotation.y = 0.5 + pointer.x * 0.25 + (1 - hero) * 1.2;

    // 3D object: appears after the hero, morphs per scroll, alternates sides
    const start = home ? 0.12 : 0;
    const q = THREE.MathUtils.clamp((sv.current - start) / (1 - start), 0, 1);
    const target = q * 3.999;
    idx.current = d(idx.current, target, 2.2, delta);
    const appear = home ? THREE.MathUtils.smoothstep(sv.current, 0.05, 0.16) : 1;
    const side = Math.cos(idx.current * Math.PI * 0.5 + 0.4);
    const o = obj.current;
    o.position.x = narrow ? 0 : d(o.position.x, -side * 0.27 * viewport.width, 2.5, delta);
    o.position.y = narrow ? 0.9 : Math.sin(state.clock.elapsedTime * 0.6) * 0.15;
    o.scale.setScalar(d(o.scale.x, (narrow ? 0.55 : 1.2) * appear, 3, delta));
    o.visible = appear > 0.01;

    const u = mat.current.uniforms;
    u.uIdx.value = idx.current;
    u.uTime.value = state.clock.elapsedTime;
    u.uRot.value = state.clock.elapsedTime * 0.2 + sv.current * Math.PI * 2;
    u.uPx.value = state.gl.getPixelRatio();
    u.uAlpha.value = appear;
  });

  return (
    <>
      <group ref={hacker}>
        <HackerDesk x={0} z={0} floorY={0} scale={1} rotY={0} />
        <mesh rotation-x={-Math.PI / 2} position={[-0.3, 0.01, -0.2]}>
          <circleGeometry args={[2.8, 48]} />
          <meshBasicMaterial color="#0b3a4a" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      </group>
      <group ref={obj}>
        <points geometry={geo} frustumCulled={false}>
          <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
      </group>
    </>
  );
}

export default function ScrollObjects() {
  const path = usePathname();
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_72%_60%,rgba(14,116,144,0.20),transparent_60%),#03050a]"
      />
      <div className="pointer-events-none fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0.4, 9], fov: 34 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={0.55} />
          <directionalLight position={[3, 4, 5]} intensity={1} color="#cfe8ff" />
          <pointLight position={[-3, 1, 3]} intensity={10} color="#22d3ee" distance={9} />
          <pointLight position={[4, 0, 2]} intensity={8} color="#a855f7" distance={9} />
          <Rig home={path === "/"} />
        </Canvas>
      </div>
    </>
  );
}
