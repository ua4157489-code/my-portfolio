"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

type Fade = RefObject<{ w: number }>;
type Cloud = { pos: Float32Array; col: Float32Array };

const SRC = "/umar.jpg";
const GRID = 120; // points across; raise for more detail (heavier)
const WIDTH = 4; // size in 3D units
const DEPTH = 1.3; // how far the face pops out
const CUTOFF = 0.13; // how different from the background a pixel must be to be kept

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function hash(a: number, b: number) {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// turns the photo into a cloud of 3D points: brightness + a dome shape give the depth
function buildCloud(img: HTMLImageElement): Cloud {
  const gw = GRID;
  const gh = Math.round((GRID * img.naturalHeight) / img.naturalWidth);
  const c = document.createElement("canvas");
  c.width = gw;
  c.height = gh;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, gw, gh);
  const d = ctx.getImageData(0, 0, gw, gh).data;

  // background color = average of the top corners
  let br = 0;
  let bg = 0;
  let bb = 0;
  let n = 0;
  for (let y = 0; y < 6; y++) {
    for (const x0 of [0, gw - 6]) {
      for (let x = x0; x < x0 + 6; x++) {
        const i = (y * gw + x) * 4;
        br += d[i];
        bg += d[i + 1];
        bb += d[i + 2];
        n++;
      }
    }
  }
  br /= n * 255;
  bg /= n * 255;
  bb /= n * 255;

  const pos: number[] = [];
  const col: number[] = [];
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const i = (y * gw + x) * 4;
      const r = d[i] / 255;
      const g = d[i + 1] / 255;
      const b = d[i + 2] / 255;
      if (Math.hypot(r - br, g - bg, b - bb) < CUTOFF) continue; // background / white shirt

      const nx = (x / gw - 0.5) * 2;
      const ny = (y / gh - 0.5) * 2;

      // dissolve into particles toward the bottom
      const fadeY = 1 - clamp((ny - 0.45) / 0.55, 0, 1);
      if (hash(x, y) > fadeY + 0.05) continue;

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const dome = Math.sqrt(Math.max(0, 1 - nx * nx * 0.9 - ny * ny * 0.6));
      const z = (0.55 * dome + 0.65 * lum) * DEPTH - DEPTH * 0.5;

      pos.push(nx * (WIDTH / 2), -ny * (WIDTH / 2) * (gh / gw), z);
      const k = 0.3 + 0.7 * lum;
      col.push(0.1 * k, 0.35 + 0.65 * k, 0.2 + 0.5 * k);
    }
  }
  return { pos: new Float32Array(pos), col: new Float32Array(col) };
}

export default function PhotoCloud({ fade }: { fade: Fade }) {
  const [cloud, setCloud] = useState<Cloud | null>(null);
  const group = useRef<THREE.Group>(null!);
  const mat = useRef<THREE.PointsMaterial>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null!);
  const ring2Mat = useRef<THREE.MeshBasicMaterial>(null!);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setCloud(buildCloud(img));
    img.src = SRC;
  }, []);

  // soft round dot for each point
  const dot = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 32;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }, []);

  const geo = useMemo(() => {
    if (!cloud) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(cloud.pos, 3));
    const colors = new THREE.BufferAttribute(new Float32Array(cloud.col), 3);
    colors.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("color", colors);
    return g;
  }, [cloud]);

  useFrame((state) => {
    const w = fade.current.w;
    const t = state.clock.elapsedTime;

    group.current.rotation.y = Math.sin(t * 0.4) * 0.25 + state.pointer.x * 0.5;
    group.current.rotation.x = -state.pointer.y * 0.2;

    if (mat.current) mat.current.opacity = w;
    if (ringMat.current) ringMat.current.opacity = 0.6 * w;
    if (ring2Mat.current) ring2Mat.current.opacity = 0.3 * w;
    if (ring.current) ring.current.rotation.z = t * 0.5;

    // a bright scan band sweeping up and down the face
    if (cloud && geo && w > 0.02) {
      const attr = geo.getAttribute("color") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      const sy = Math.sin(t * 0.9) * 2;
      const count = cloud.pos.length / 3;
      for (let i = 0; i < count; i++) {
        const dy = cloud.pos[i * 3 + 1] - sy;
        const boost = 1 + 2.2 * Math.exp(-(dy * dy) / 0.04);
        arr[i * 3] = Math.min(1, cloud.col[i * 3] * boost);
        arr[i * 3 + 1] = Math.min(1, cloud.col[i * 3 + 1] * boost);
        arr[i * 3 + 2] = Math.min(1, cloud.col[i * 3 + 2] * boost);
      }
      attr.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      {geo && (
        <points geometry={geo}>
          <pointsMaterial
            ref={mat}
            size={0.04}
            vertexColors
            map={dot}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            sizeAttenuation
          />
        </points>
      )}

      {/* hologram base rings */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.35, 0]}>
        <ringGeometry args={[1.5, 1.56, 64]} />
        <meshBasicMaterial
          ref={ringMat}
          color="#00ff9c"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.35, 0]}>
        <ringGeometry args={[1.9, 1.92, 64]} />
        <meshBasicMaterial
          ref={ring2Mat}
          color="#00c8ff"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
