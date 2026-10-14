"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";

export function usePointer() {
  const p = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const m = (e: PointerEvent) => {
      p.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      p.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", m);
    return () => window.removeEventListener("pointermove", m);
  }, []);
  return p;
}

// frame-rate independent smoothing
export const damp = (a: number, b: number, lambda: number, dt: number) =>
  a + (b - a) * (1 - Math.exp(-lambda * dt));

export function Stage({
  children,
  camera = [0, 0, 9],
}: {
  children: ReactNode;
  camera?: [number, number, number];
}) {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0 }}>
      <Canvas
        camera={{ position: camera, fov: 60 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        {children}
      </Canvas>
    </div>
  );
}
