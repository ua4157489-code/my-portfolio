"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

const GRID = 160; // sampling resolution: higher = more particles
const WHITE_CUT = 228; // pixels brighter than this on every channel are skipped

type Data = {
  target: Float32Array;
  start: Float32Array;
  rand: Float32Array;
  lum: Float32Array;
};

function usePhotoData(src: string) {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = GRID;
      c.height = GRID;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, GRID, GRID);
      const px = ctx.getImageData(0, 0, GRID, GRID).data;

      const t: number[] = [], st: number[] = [], r: number[] = [], l: number[] = [];
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          const i = (y * GRID + x) * 4;
          const R = px[i], G = px[i + 1], B = px[i + 2], A = px[i + 3];
          if (A < 20 || Math.min(R, G, B) > WHITE_CUT) continue;
          const lum = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
          const jx = (Math.random() - 0.5) * 0.9;
          const jy = (Math.random() - 0.5) * 0.9;
          t.push(((x + jx) / GRID - 0.5) * 4, (0.5 - (y + jy) / GRID) * 4, (lum - 0.35) * 1.2);
          const a = Math.random() * Math.PI * 2;
          const b = Math.acos(2 * Math.random() - 1);
          const d = 3 + Math.random() * 4;
          st.push(d * Math.sin(b) * Math.cos(a), d * Math.sin(b) * Math.sin(a), d * Math.cos(b));
          r.push(Math.random());
          l.push(lum);
        }
      }
      setData({
        target: Float32Array.from(t),
        start: Float32Array.from(st),
        rand: Float32Array.from(r),
        lum: Float32Array.from(l),
      });
    };
  }, [src]);

  return data;
}

const vert = /* glsl */ `
attribute vec3 aStart; attribute float aRand; attribute float aLum;
uniform float uTime, uAssemble, uScatter, uPx; uniform vec2 uMouse;
varying float vLum; varying float vA;
void main(){
  float k = smoothstep(0.0, 1.0, clamp(uAssemble * 1.6 - aRand * 0.6, 0.0, 1.0));
  vec3 p = mix(aStart, position, k);
  p.z += sin(uTime * 0.8 + position.x * 1.5 + position.y * 1.2) * 0.06;
  p.xy += vec2(sin(uTime * 0.6 + aRand * 30.0), cos(uTime * 0.5 + aRand * 25.0)) * 0.015;
  vec3 dir = normalize(vec3(aRand - 0.5, fract(aRand * 7.3) - 0.5, fract(aRand * 3.1) - 0.2));
  p += dir * uScatter * (1.0 + aRand * 2.0);
  vec2 d = p.xy - uMouse;
  float f = smoothstep(0.9, 0.0, length(d));
  p.xy += normalize(d + 0.0001) * f * 0.5;
  p.z += f * 0.5;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (2.2 + aLum * 2.0) * uPx * (6.0 / -mv.z);
  vLum = aLum;
  vA = 1.0 - clamp(uScatter * 0.25, 0.0, 0.8);
}`;

const frag = /* glsl */ `
varying float vLum; varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 1.5);
  vec3 col = mix(vec3(0.02, 0.35, 0.5), vec3(0.6, 0.98, 1.0), clamp(vLum * 1.2, 0.0, 1.0));
  gl_FragColor = vec4(col * 1.2, a * vA * 0.95);
}`;

function Cloud({ data, wrap }: { data: Data; wrap: RefObject<HTMLDivElement | null> }) {
  const mat = useRef<THREE.ShaderMaterial>(null!);
  const group = useRef<THREE.Group>(null!);
  const asm = useRef(0);
  const sc = useRef(3);
  const m = useRef({ x: 99, y: 99 });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.target, 3));
    g.setAttribute("aStart", new THREE.BufferAttribute(data.start, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(data.rand, 1));
    g.setAttribute("aLum", new THREE.BufferAttribute(data.lum, 1));
    return g;
  }, [data]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAssemble: { value: 0 },
      uScatter: { value: 3 },
      uPx: { value: 1 },
      uMouse: { value: new THREE.Vector2(99, 99) },
    }),
    []
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const r = wrap.current?.getBoundingClientRect();
      if (!r) return;
      m.current.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      m.current.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [wrap]);

  useFrame((state, delta) => {
    const el = wrap.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const off = Math.abs(r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
    const targetScatter = THREE.MathUtils.smoothstep(off, 0.3, 0.95) * 3;
    sc.current = THREE.MathUtils.damp(sc.current, targetScatter, 2, delta);
    asm.current = THREE.MathUtils.damp(asm.current, 1, 1.2, delta);

    const u = mat.current.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uAssemble.value = asm.current;
    u.uScatter.value = sc.current;
    u.uPx.value = state.gl.getPixelRatio();
    u.uMouse.value.set(
      (m.current.x * state.viewport.width) / 2,
      (m.current.y * state.viewport.height) / 2
    );

    const g = group.current;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, m.current.x * 0.25, 3, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -m.current.y * 0.12, 3, delta);
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

export default function PhotoParticles({
  src = "/me.png",
  className = "",
}: {
  src?: string;
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const data = usePhotoData(src);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: "100px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} aria-hidden className={`pointer-events-none ${className}`}>
      {data && (
        <Canvas
          frameloop={inView ? "always" : "never"}
          camera={{ position: [0, 0, 6], fov: 40 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: false }}
        >
          <Cloud data={data} wrap={wrap} />
        </Canvas>
      )}
    </div>
  );
}
