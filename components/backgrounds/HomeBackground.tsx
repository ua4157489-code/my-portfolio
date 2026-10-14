"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Stage, damp, usePointer } from "./shared";

const VERT = `
uniform float uProgress;
uniform float uTime;
attribute vec3 aCenter;
attribute vec4 aRand;
varying vec3 vN;
varying vec3 vV;
varying float vK;

mat3 rot(vec3 axis, float a) {
  vec3 x = normalize(axis);
  float s = sin(a);
  float c = cos(a);
  float o = 1.0 - c;
  return mat3(
    o*x.x*x.x + c,     o*x.x*x.y + x.z*s, o*x.z*x.x - x.y*s,
    o*x.x*x.y - x.z*s, o*x.y*x.y + c,     o*x.y*x.z + x.x*s,
    o*x.z*x.x + x.y*s, o*x.y*x.z - x.x*s, o*x.z*x.z + c
  );
}

void main() {
  // each shard breaks at a slightly different moment
  float k = smoothstep(0.0, 1.0, clamp(uProgress * 1.3 - aRand.w * 0.3, 0.0, 1.0));
  vec3 radial = normalize(aCenter);
  vec3 dir = normalize(radial + aRand.xyz * 0.7);
  mat3 R = rot(aRand.xyz + vec3(0.2, 0.1, 0.3), k * (3.0 + aRand.w * 6.0));
  vec3 local = (position - aCenter) * (1.0 - k * 0.3);
  float breathe = sin(uTime * 0.9 + aRand.w * 6.2831) * 0.04 * (1.0 - k);
  vec3 p = aCenter + radial * breathe + dir * k * (2.0 + aRand.w * 7.0) + R * local;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalMatrix * (R * radial);
  vV = -mv.xyz;
  vK = k;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = `
uniform vec3 uColA;
uniform vec3 uColB;
uniform float uWire;
uniform float uAlpha;
varying vec3 vN;
varying vec3 vV;
varying float vK;

void main() {
  vec3 n = normalize(vN);
  float fres = pow(1.0 - abs(dot(n, normalize(vV))), 2.0);
  float light = 0.35 + 0.65 * max(dot(n, normalize(vec3(0.4, 0.7, 0.6))), 0.0);
  vec3 base = mix(uColA, uColB, n.y * 0.5 + 0.5) * light * 0.55;
  vec3 solid = base + uColA * fres * 0.9;
  vec3 wire = mix(uColA, vec3(1.0), vK * 0.6) * 1.2;
  vec3 col = uWire > 0.5 ? wire : solid;
  float a = uWire > 0.5 ? 0.9 : 0.8;
  gl_FragColor = vec4(col, a * uAlpha);
}
`;

function Crystal() {
  const group = useRef<THREE.Group>(null);
  const stars = useRef<THREE.Points>(null);
  const pointer = usePointer();
  const target = useRef(0);
  const prog = useRef(0);

  const geometry = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(2.4, 3).toNonIndexed();
    const pos = g.attributes.position;
    const faces = pos.count / 3;
    const center = new Float32Array(pos.count * 3);
    const rand = new Float32Array(pos.count * 4);
    const c = new THREE.Vector3();
    const v = new THREE.Vector3();
    for (let f = 0; f < faces; f++) {
      c.set(0, 0, 0);
      for (let k = 0; k < 3; k++) {
        v.fromBufferAttribute(pos, f * 3 + k);
        c.add(v);
      }
      c.divideScalar(3);
      const r = [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random()];
      for (let k = 0; k < 3; k++) {
        const i = f * 3 + k;
        center.set([c.x, c.y, c.z], i * 3);
        rand.set(r, i * 4);
      }
    }
    g.setAttribute("aCenter", new THREE.BufferAttribute(center, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rand, 4));
    return g;
  }, []);

  const { uniforms, solid, wire } = useMemo(() => {
    const uniforms = {
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uAlpha: { value: 1 },
      uColA: { value: new THREE.Color("#22d3ee") },
      uColB: { value: new THREE.Color("#a78bfa") },
    };
    const make = (w: number) =>
      new THREE.ShaderMaterial({
        uniforms: { ...uniforms, uWire: { value: w } },
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        wireframe: w > 0.5,
      });
    return { uniforms, solid: make(0), wire: make(1) };
  }, []);

  const starPos = useMemo(() => {
    const a = new Float32Array(1400 * 3);
    for (let i = 0; i < a.length; i++) a[i] = (Math.random() - 0.5) * 28;
    return a;
  }, []);

  useEffect(() => {
    const on = () => {
      target.current = Math.min(1, window.scrollY / (window.innerHeight * 1.1));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);

  useFrame((st, d) => {
    const dt = Math.min(d, 0.05);
    // smooth the scroll so the break feels fluid, not steppy
    prog.current = damp(prog.current, target.current, 4, dt);
    const p = prog.current;
    uniforms.uProgress.value = p;
    uniforms.uTime.value = st.clock.elapsedTime;
    uniforms.uAlpha.value = 1 - 0.8 * THREE.MathUtils.smoothstep(p, 0.7, 1);

    const g = group.current;
    if (g) {
      g.rotation.y += dt * (0.12 + p * 0.25);
      g.rotation.x = damp(g.rotation.x, -pointer.current.y * 0.25 + p * 0.4, 3, dt);
      g.position.x = damp(g.position.x, 3.3 - p * 1.2, 3, dt);
      g.scale.setScalar(1 + p * 0.15);
    }
    if (stars.current) stars.current.rotation.y = p * 1.2 + st.clock.elapsedTime * 0.01;
  });

  return (
    <>
      <points ref={stars}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.03} color="#7dd3fc" transparent opacity={0.6} sizeAttenuation />
      </points>
      <group ref={group} position={[3.3, 0, 0]}>
        <mesh geometry={geometry} material={solid} />
        <mesh geometry={geometry} material={wire} />
      </group>
    </>
  );
}

export default function HomeBackground() {
  return (
    <Stage>
      <Crystal />
    </Stage>
  );
}
