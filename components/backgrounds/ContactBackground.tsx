"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Stage, damp, usePointer } from "./shared";

const R = 2.6;
const CITIES: [number, number][] = [
  [40, -74], [51, 0], [35, 139], [-33, 151], [-23, -46], [30, 31], [1, 103], [37, -122],
];

const ll = (lat: number, lon: number, r = R) => {
  const phi = (lat * Math.PI) / 180;
  const th = (lon * Math.PI) / 180;
  return new THREE.Vector3(
    r * Math.cos(phi) * Math.cos(th),
    r * Math.sin(phi),
    -r * Math.cos(phi) * Math.sin(th)
  );
};

function Globe() {
  const g = useRef<THREE.Group>(null);
  const heads = useRef<THREE.Points>(null);
  const pointer = usePointer();

  const { dots, arcs, lines, headPos } = useMemo(() => {
    const N = 900;
    const dots = new Float32Array(N * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rr = Math.sqrt(1 - y * y);
      const th = golden * i;
      dots.set([Math.cos(th) * rr * R, y * R, Math.sin(th) * rr * R], i * 3);
    }
    const arcs = CITIES.map((c, i) => {
      const a = ll(...c);
      const b = ll(...CITIES[(i + 3) % CITIES.length]);
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * 1.7);
      return new THREE.QuadraticBezierCurve3(a, mid, b);
    });
    const lines = arcs.map(
      (curve) =>
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)),
          new THREE.LineBasicMaterial({ color: "#22d3ee", transparent: true, opacity: 0.35 })
        )
    );
    return { dots, arcs, lines, headPos: new Float32Array(arcs.length * 3) };
  }, []);

  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame((st, d) => {
    const dt = Math.min(d, 0.05);
    const o = g.current;
    if (!o) return;
    o.rotation.y += dt * 0.12;
    o.rotation.x = damp(o.rotation.x, 0.25 - pointer.current.y * 0.25, 2.5, dt);
    o.position.x = damp(o.position.x, 3.2 + pointer.current.x * 0.3, 2.5, dt);
    arcs.forEach((curve, i) => {
      curve.getPoint((st.clock.elapsedTime * 0.25 + i / arcs.length) % 1, v);
      headPos.set([v.x, v.y, v.z], i * 3);
    });
    if (heads.current) heads.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group ref={g} position={[3.2, 0, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dots, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#7dd3fc" transparent opacity={1} sizeAttenuation />
      </points>
      {lines.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
      <points ref={heads}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[headPos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.24} color="#ffffff" sizeAttenuation />
      </points>
    </group>
  );
}

export default function ContactBackground() {
  return (
    <Stage>
      <Globe />
    </Stage>
  );
}
