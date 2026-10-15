"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import HackerDesk from "./HackerDesk";

function Rig() {
  const g = useRef<THREE.Group>(null!);

  useFrame((state, delta) => {
    const { viewport, pointer, size } = state;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? THREE.MathUtils.clamp(window.scrollY / max, 0, 1) : 0;
    const narrow = size.width < 768;
    const d = THREE.MathUtils.damp;

    const tx = narrow ? 0 : 0.26 * viewport.width;
    const ty = narrow ? 0.12 * viewport.height - 1.0 : -1.55;
    const sc = narrow ? 0.62 : 1.2;

    g.current.position.x = d(g.current.position.x, tx, 3, delta);
    g.current.position.y = d(g.current.position.y, ty, 3, delta);
    g.current.scale.setScalar(d(g.current.scale.x, sc, 3, delta));
    g.current.rotation.y = d(g.current.rotation.y, 0.5 + pointer.x * 0.25 + p * 0.6, 3, delta);
  });

  return (
    <group ref={g}>
      <HackerDesk x={0} z={0} floorY={0} scale={1} rotY={0} />
      {/* floor glow under the setup */}
      <mesh rotation-x={-Math.PI / 2} position={[-0.3, 0.01, -0.2]}>
        <circleGeometry args={[2.8, 48]} />
        <meshBasicMaterial color="#0b3a4a" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function HackerScene() {
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
          <Rig />
        </Canvas>
      </div>
    </>
  );
}
