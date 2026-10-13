"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";

const N = 9000;
const SHAPE_OF: Record<string, number> = {
  "/": 0, "/about": 1, "/experience": 2, "/education": 3, "/skills": 4, "/projects": 1, "/contact": 0,
};
const POSE: Record<string, [number, number, number]> = {
  "/": [0.27, 0, 1.05], "/about": [0.3, 0, 0.7], "/experience": [-0.3, 0, 0.7],
  "/education": [0.3, 0, 0.7], "/skills": [-0.3, 0, 0.7], "/projects": [0.3, 0, 0.7], "/contact": [0, 0, 0.9],
};

const rnd = Math.random;

function build(fn: (i: number) => [number, number, number]) {
  const a = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) a.set(fn(i), i * 3);
  return a;
}

function makeShapes() {
  const sphere = build((i) => {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), t = i * 2.39996;
    return [Math.cos(t) * r * 2, y * 2, Math.sin(t) * r * 2];
  });
  const knot = build(() => {
    const t = rnd() * Math.PI * 2, r = 2 + Math.cos(3 * t), j = 0.18;
    return [r * Math.cos(2 * t) * 0.6 + (rnd() - 0.5) * j, r * Math.sin(2 * t) * 0.6 + (rnd() - 0.5) * j, Math.sin(3 * t) * 0.9 + (rnd() - 0.5) * j];
  });
  const helix = build(() => {
    const u = rnd(), a = u * Math.PI * 7, strand = rnd() < 0.5 ? 0 : Math.PI;
    if (rnd() < 0.12) { // rungs
      const k = rnd(), ang = Math.floor(u * 14) / 14 * Math.PI * 7;
      return [Math.cos(ang) * (1 - 2 * k) * 1.2, (u - 0.5) * 5, Math.sin(ang) * (1 - 2 * k) * 1.2];
    }
    return [Math.cos(a + strand) * 1.2 + (rnd() - 0.5) * 0.12, (u - 0.5) * 5, Math.sin(a + strand) * 1.2 + (rnd() - 0.5) * 0.12];
  });
  const cube = build(() => {
    const f = Math.floor(rnd() * 6), u = (rnd() - 0.5) * 3.2, v = (rnd() - 0.5) * 3.2, h = f % 2 ? 1.6 : -1.6;
    return f < 2 ? [h, u, v] : f < 4 ? [u, h, v] : [u, v, h];
  });
  const galaxy = build((i) => {
    const r = Math.pow(rnd(), 0.6) * 3, arm = (i % 3) * ((Math.PI * 2) / 3), a = r * 1.6 + arm + (rnd() - 0.5) * 0.5;
    return [Math.cos(a) * r, (rnd() - 0.5) * 0.25 * (3.2 - r) * 0.5, Math.sin(a) * r];
  });
  return [sphere, knot, helix, cube, galaxy];
}

const vert = /* glsl */ `
attribute vec3 s0; attribute vec3 s1; attribute vec3 s2; attribute vec3 s3; attribute vec3 s4;
attribute float aRand;
uniform float uIdx, uTime, uPush, uRotY, uRotX, uPx; uniform vec3 uMouse;
varying float vMix; varying float vY;
vec3 pick(float i){ if(i<0.5) return s0; if(i<1.5) return s1; if(i<2.5) return s2; if(i<3.5) return s3; return s4; }
void main(){
  float i = clamp(uIdx, 0.0, 3.9999);
  float a = floor(i);
  float fr = fract(i);
  float ff = smoothstep(0.0, 1.0, clamp(fr * 1.7 - aRand * 0.7, 0.0, 1.0));
  vec3 p = mix(pick(a), pick(a + 1.0), ff);
  float tr = sin(fr * 3.14159);
  p += normalize(p + 0.001) * tr * (0.5 + aRand) * 1.4;
  p += vec3(sin(uTime*0.6 + aRand*20.0), cos(uTime*0.5 + aRand*17.0), sin(uTime*0.7 + aRand*13.0)) * 0.035;
  p *= 1.0 + uPush * aRand * 0.9;
  float cy = cos(uRotY), sy = sin(uRotY);
  p = vec3(p.x*cy + p.z*sy, p.y, -p.x*sy + p.z*cy);
  float cx = cos(uRotX), sx = sin(uRotX);
  p = vec3(p.x, p.y*cx - p.z*sx, p.y*sx + p.z*cx);
  vec2 d = p.xy - uMouse.xy;
  float force = smoothstep(1.5, 0.0, length(d));
  p.xy += normalize(d + 0.0001) * force * 0.7;
  p.z += force * 0.6;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (2.4 + aRand * 3.0) * uPx * (7.0 / -mv.z);
  vMix = aRand; vY = p.y;
}`;

const frag = /* glsl */ `
varying float vMix; varying float vY;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 2.0);
  vec3 col = mix(vec3(0.13, 0.83, 0.93), vec3(0.65, 0.55, 0.98), clamp(vY * 0.22 + 0.5 + vMix * 0.35, 0.0, 1.0));
  gl_FragColor = vec4(col * 1.8, a * 0.9);
}`;

function Cloud() {
  const path = usePathname();
  const group = useRef<THREE.Group>(null!);
  const mat = useRef<THREE.ShaderMaterial>(null!);
  const sv = useRef(0), last = useRef(0), push = useRef(0), idx = useRef(0);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const sh = makeShapes();
    sh.forEach((arr, k) => g.setAttribute(`s${k}`, new THREE.BufferAttribute(arr, 3)));
    g.setAttribute("position", new THREE.BufferAttribute(sh[0], 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(Float32Array.from({ length: N }, rnd), 1));
    return g;
  }, []);

  const uniforms = useMemo(() => ({
    uIdx: { value: 0 }, uTime: { value: 0 }, uPush: { value: 0 }, uRotY: { value: 0 },
    uRotX: { value: 0 }, uPx: { value: 1 }, uMouse: { value: new THREE.Vector3(99, 99, 0) },
  }), []);

  useFrame((state, delta) => {
    const { viewport, pointer, size } = state;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? THREE.MathUtils.clamp(window.scrollY / max, 0, 1) : 0;
    sv.current = THREE.MathUtils.damp(sv.current, p, 3, delta);
    const speed = Math.abs(sv.current - last.current) / Math.max(delta, 0.001);
    last.current = sv.current;
    push.current = THREE.MathUtils.damp(push.current, Math.min(speed * 1.2, 1), 4, delta);

    idx.current = THREE.MathUtils.damp(idx.current, SHAPE_OF[path] ?? 0, 1.6, delta);

    const narrow = size.width < 768;
    const [px, py, ps] = POSE[path] ?? [0.3, 0, 0.7];
    const g = group.current;
    const tx = (narrow ? 0 : px) * viewport.width;
    const ty = (narrow ? 0.2 : py) * viewport.height - sv.current * 0.6;
    const ts = narrow ? ps * 0.55 : ps;
    g.position.x = THREE.MathUtils.damp(g.position.x, tx, 2.5, delta);
    g.position.y = THREE.MathUtils.damp(g.position.y, ty, 2.5, delta);
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, ts, 2.5, delta));

    const u = mat.current.uniforms;
    u.uIdx.value = idx.current;
    u.uTime.value = state.clock.elapsedTime;
    u.uPush.value = push.current;
    u.uRotY.value = state.clock.elapsedTime * 0.12 + sv.current * Math.PI * 0.7;
    u.uRotX.value = 0.25 + pointer.y * 0.15 + sv.current * 0.5;
    u.uPx.value = state.gl.getPixelRatio();
    const s = g.scale.x || 1;
    u.uMouse.value.set((pointer.x * viewport.width * 0.5 - g.position.x) / s, (pointer.y * viewport.height * 0.5 - g.position.y) / s, 0);
  });

  return (
    <group ref={group}>
      <points geometry={geo} frustumCulled={false}>
        <shaderMaterial
          ref={mat}
          vertexShader={vert}
          fragmentShader={frag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// far-away dust that moves at a different speed than the main shape (parallax depth)
function Dust() {
  const ref = useRef<THREE.Points>(null!);
  const pos = useMemo(() => Float32Array.from({ length: 1400 * 3 }, (_, i) => (rnd() - 0.5) * (i % 3 === 2 ? 14 : 24)), []);
  useFrame((state) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    ref.current.rotation.y = state.clock.elapsedTime * 0.01 + p * 0.6;
    ref.current.position.y = p * 2.5;
    ref.current.position.x = state.pointer.x * -0.4;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
      <pointsMaterial size={0.025} color="#67e8f9" transparent opacity={0.45} depthWrite={false} sizeAttenuation />
    </points>
  );
}

export default function ParticleScene() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_75%_35%,rgba(34,211,238,0.10),transparent_55%),radial-gradient(ellipse_at_10%_90%,rgba(168,85,247,0.10),transparent_50%),#03050a]"
      />
      <div className="pointer-events-none fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 7], fov: 40 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: false }}>
          <Dust />
          <Cloud />
        </Canvas>
      </div>
    </>
  );
}
