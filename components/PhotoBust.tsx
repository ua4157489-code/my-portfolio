"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

type Fade = RefObject<{ w: number }>;

const SRC = "/umar.jpg";
const WIDTH = 3.9; // portrait width in 3D units
const DEPTH = 1.1; // how far the face pops out
const CUTOFF = 0.12; // lower keeps more of the photo, higher removes more background
const MAP = 256; // depth-map resolution

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function blur(src: Float32Array, w: number, h: number) {
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          s += src[yy * w + xx];
          n++;
        }
      }
      out[y * w + x] = s / n;
    }
  }
  return out;
}

// builds a depth + mask map from the photo (brightness + a rounded head shape)
function buildMaps(img: HTMLImageElement) {
  const gw = MAP;
  const gh = Math.round((MAP * img.naturalHeight) / img.naturalWidth);
  const c = document.createElement("canvas");
  c.width = gw;
  c.height = gh;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, gw, gh);
  const px = ctx.getImageData(0, 0, gw, gh).data;

  // background color = average of the top corners
  let br = 0;
  let bg = 0;
  let bb = 0;
  let n = 0;
  for (let y = 0; y < 8; y++) {
    for (const x0 of [0, gw - 8]) {
      for (let x = x0; x < x0 + 8; x++) {
        const i = (y * gw + x) * 4;
        br += px[i];
        bg += px[i + 1];
        bb += px[i + 2];
        n++;
      }
    }
  }
  br /= n * 255;
  bg /= n * 255;
  bb /= n * 255;

  let depth = new Float32Array(gw * gh);
  const mask = new Float32Array(gw * gh);
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const k = y * gw + x;
      const i = k * 4;
      const r = px[i] / 255;
      const g = px[i + 1] / 255;
      const b = px[i + 2] / 255;
      const nx = x / gw;
      const ny = y / gh;

      // keep what differs from the background, only around the head and neck
      const m = clamp((Math.hypot(r - br, g - bg, b - bb) - CUTOFF) / 0.08, 0, 1);
      const inside = clamp((1 - Math.hypot((nx - 0.5) / 0.36, (ny - 0.44) / 0.52)) / 0.25, 0, 1);
      mask[k] = m * inside;

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const e2 = ((nx - 0.5) / 0.3) ** 2 + ((ny - 0.38) / 0.42) ** 2;
      const dome = Math.sqrt(Math.max(0, 1 - e2));
      depth[k] = clamp(0.6 * dome + 0.4 * lum, 0, 1);
    }
  }
  depth = blur(blur(depth, gw, gh), gw, gh);

  // texture rows start at the bottom, so flip while writing
  const data = new Uint8Array(gw * gh * 4);
  for (let y = 0; y < gh; y++) {
    const row = gh - 1 - y;
    for (let x = 0; x < gw; x++) {
      const k = y * gw + x;
      const o = (row * gw + x) * 4;
      data[o] = Math.round(depth[k] * 255);
      data[o + 1] = Math.round(mask[k] * 255);
      data[o + 2] = 0;
      data[o + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, gw, gh, THREE.RGBAFormat);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return { tex, aspect: gh / gw };
}

const VERT = /* glsl */ `
uniform sampler2D uDepth;
uniform float uDepthScale;
varying vec2 vUv;
varying float vMask;
varying float vY;
void main() {
  vUv = uv;
  vec4 d = texture2D(uDepth, uv);
  vMask = d.g;
  vY = position.y;
  vec3 p = position;
  p.z += (d.r - 0.3) * uDepthScale;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

// the solid face: real photo colors + green hologram tint, scanlines and a moving scan band
const FRAG_SOLID = /* glsl */ `
uniform sampler2D uPhoto;
uniform float uTime;
uniform float uScan;
uniform float uOpacity;
varying vec2 vUv;
varying float vMask;
varying float vY;
void main() {
  float a = smoothstep(0.4, 0.6, vMask);
  if (a < 0.01) discard;
  vec3 photo = texture2D(uPhoto, vUv).rgb;
  float lum = dot(photo, vec3(0.299, 0.587, 0.114));
  vec3 tint = mix(vec3(0.0, 0.22, 0.12), vec3(0.45, 1.0, 0.8), lum);
  vec3 col = mix(photo * vec3(0.7, 1.0, 0.85), tint, 0.35);
  float lines = 0.8 + 0.2 * sin(vUv.y * 380.0 - uTime * 5.0);
  float band = exp(-pow((vY - uScan) * 2.5, 2.0));
  col = col * lines + vec3(0.1, 1.0, 0.7) * band * 0.6;
  float bottom = smoothstep(0.02, 0.38, vUv.y);
  gl_FragColor = vec4(col, a * uOpacity * bottom);
}
`;

// the green wireframe laid over the face
const FRAG_WIRE = /* glsl */ `
uniform float uOpacity;
varying vec2 vUv;
varying float vMask;
void main() {
  if (vMask < 0.5) discard;
  float bottom = smoothstep(0.05, 0.4, vUv.y);
  gl_FragColor = vec4(0.0, 1.0, 0.62, 0.22 * uOpacity * bottom);
}
`;

export default function PhotoBust({ fade }: { fade: Fade }) {
  const [aspect, setAspect] = useState<number | null>(null);
  const group = useRef<THREE.Group>(null!);
  const haloA = useRef<THREE.Mesh>(null!);
  const haloB = useRef<THREE.Mesh>(null!);
  const haloMatA = useRef<THREE.MeshBasicMaterial>(null!);
  const haloMatB = useRef<THREE.MeshBasicMaterial>(null!);
  const baseMat = useRef<THREE.MeshBasicMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uPhoto: { value: null as THREE.Texture | null },
      uDepth: { value: null as THREE.Texture | null },
      uTime: { value: 0 },
      uScan: { value: 0 },
      uOpacity: { value: 0 },
      uDepthScale: { value: DEPTH },
    }),
    []
  );

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const { tex, aspect: a } = buildMaps(img);
      const photo = new THREE.Texture(img);
      photo.needsUpdate = true;
      uniforms.uPhoto.value = photo;
      uniforms.uDepth.value = tex;
      setAspect(a);
    };
    img.onerror = () => console.warn("PhotoBust: could not load " + SRC);
    img.src = SRC;
  }, [uniforms]);

  const solidGeo = useMemo(
    () =>
      aspect
        ? new THREE.PlaneGeometry(WIDTH, WIDTH * aspect, 128, Math.round(128 * aspect))
        : null,
    [aspect]
  );
  const wireGeo = useMemo(
    () =>
      aspect
        ? new THREE.PlaneGeometry(WIDTH, WIDTH * aspect, 48, Math.round(48 * aspect))
        : null,
    [aspect]
  );

  useFrame((state) => {
    const w = fade.current.w;
    const t = state.clock.elapsedTime;

    uniforms.uTime.value = t;
    uniforms.uScan.value = Math.sin(t * 0.9) * 1.9;
    uniforms.uOpacity.value = w;

    group.current.rotation.y = Math.sin(t * 0.4) * 0.2 + state.pointer.x * 0.45;
    group.current.rotation.x = -state.pointer.y * 0.15;
    group.current.position.y = Math.sin(t * 0.8) * 0.05;

    haloA.current.rotation.z = t * 0.4;
    haloB.current.rotation.z = -t * 0.25;
    haloMatA.current.opacity = 0.7 * w;
    haloMatB.current.opacity = 0.45 * w;
    baseMat.current.opacity = 0.5 * w;
  });

  return (
    <group ref={group}>
      {solidGeo && wireGeo && (
        <>
          <mesh geometry={solidGeo} position={[0, 0.5, 0]}>
            <shaderMaterial
              vertexShader={VERT}
              fragmentShader={FRAG_SOLID}
              uniforms={uniforms}
              transparent
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh geometry={wireGeo} position={[0, 0.5, 0.01]}>
            <shaderMaterial
              vertexShader={VERT}
              fragmentShader={FRAG_WIRE}
              uniforms={uniforms}
              transparent
              wireframe
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </>
      )}

      {/* HUD arcs behind the head */}
      <mesh ref={haloA} position={[0, 0.5, -0.9]}>
        <torusGeometry args={[2.6, 0.012, 6, 120, 4.2]} />
        <meshBasicMaterial
          ref={haloMatA}
          color="#00c8ff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={haloB} position={[0, 0.5, -0.9]}>
        <torusGeometry args={[3.0, 0.01, 6, 120, 3.0]} />
        <meshBasicMaterial
          ref={haloMatB}
          color="#00ff9c"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* glowing base ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.75, 0]}>
        <ringGeometry args={[1.5, 1.56, 64]} />
        <meshBasicMaterial
          ref={baseMat}
          color="#00ff9c"
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
