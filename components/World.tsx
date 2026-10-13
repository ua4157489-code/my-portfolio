"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";

const R = 2.2; // planet radius

type Preset = { x: number; y: number; s: number; ry: number; tilt: number };

// where the planet sits on each page (x and y are fractions of the screen size)
const PRESETS: Record<string, Preset> = {
  "": { x: 0.2, y: 0.0, s: 1.0, ry: 0.5, tilt: 0.35 },
  about: { x: -0.27, y: -0.02, s: 0.9, ry: 1.6, tilt: 0.25 },
  experience: { x: 0.27, y: 0.0, s: 0.9, ry: 2.6, tilt: 0.4 },
  education: { x: -0.27, y: 0.02, s: 0.9, ry: 3.6, tilt: 0.3 },
  skills: { x: 0.27, y: -0.02, s: 0.9, ry: 4.6, tilt: 0.2 },
  projects: { x: -0.27, y: 0.0, s: 0.9, ry: 5.6, tilt: 0.35 },
  contact: { x: 0.0, y: -0.08, s: 1.1, ry: 0.2, tilt: 0.3 },
};

const PLANET_V = `
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// dark surface, faint latitude/longitude grid, bright rim
const PLANET_F = `
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  float rim = pow(1.0 - max(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0), 2.5);
  vec2 f = abs(fract(vUv * vec2(48.0, 24.0)) - 0.5);
  float line = max(smoothstep(0.46, 0.5, f.x), smoothstep(0.46, 0.5, f.y));
  vec3 col = vec3(0.008, 0.025, 0.06) + vec3(0.05, 0.7, 0.9) * line * 0.16 + vec3(0.1, 0.8, 1.0) * rim * 0.65;
  gl_FragColor = vec4(col, 1.0);
}`;

const ATMO_V = `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// soft glow around the planet
const ATMO_F = `
varying vec3 vNormal;
void main() {
  float i = pow(max(0.0, 0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
  gl_FragColor = vec4(0.13, 0.83, 0.93, 1.0) * i * 1.7;
}`;

// blobby "continents" from a few sine waves (stable, no data files)
const landValue = (x: number, y: number, z: number) =>
  Math.sin(x * 2.3 + 1.1) * Math.cos(y * 2.0 + 0.7) +
  Math.sin(z * 2.7 + 2.0) * Math.cos(x * 1.6 + y * 1.3) +
  0.6 * Math.sin(y * 4.2 + z * 3.1 + 0.5) * Math.cos(x * 3.7);

type TRef = MutableRefObject<number>;

function Planet({ tref, mobile }: { tref: TRef; mobile: boolean }) {
  const { land, nodes } = useMemo(() => {
    const N = mobile ? 6000 : 12000;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const pts: number[] = [];
    const units: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      const x = Math.cos(th) * r;
      const z = Math.sin(th) * r;
      if (landValue(x, y, z) > 0.6) {
        pts.push(x * R * 1.004, y * R * 1.004, z * R * 1.004);
        units.push(new THREE.Vector3(x, y, z));
      }
    }
    // 16 evenly spread "cities" picked from the land points
    const nodes: THREE.Vector3[] = [];
    const step = Math.max(1, Math.floor(units.length / 16));
    for (let i = 0; i < 16 && i * step < units.length; i++) {
      nodes.push(units[i * step].clone().multiplyScalar(R * 1.012));
    }
    return { land: new Float32Array(pts), nodes };
  }, [mobile]);

  const nodePos = useMemo(() => new Float32Array(nodes.flatMap((v) => [v.x, v.y, v.z])), [nodes]);
  const nodeMat = useRef<THREE.PointsMaterial>(null!);

  useFrame(() => {
    if (nodeMat.current) nodeMat.current.size = 0.075 + Math.sin(tref.current * 3) * 0.02;
  });

  return (
    <>
      <mesh>
        <sphereGeometry args={[R, 96, 96]} />
        <shaderMaterial vertexShader={PLANET_V} fragmentShader={PLANET_F} />
      </mesh>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[land, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.022}
          color="#22d3ee"
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodePos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={nodeMat}
          size={0.075}
          color="#ff4d9d"
          transparent
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <Arcs nodes={nodes} tref={tref} />
    </>
  );
}

// curved links between cities with a bright packet travelling along each one
function Arcs({ nodes, tref }: { nodes: THREE.Vector3[]; tref: TRef }) {
  const data = useMemo(() => {
    const group = new THREE.Group();
    const curves: THREE.QuadraticBezierCurve3[] = [];
    const n = nodes.length;
    for (let i = 0; i < n; i++) {
      const j = (i * 5 + 3) % n;
      if (j === i) continue;
      const a = nodes[i].clone().normalize();
      const b = nodes[j].clone().normalize();
      const ang = a.angleTo(b);
      if (ang > 3) continue;
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R + 0.25 + ang * 0.75);
      const curve = new THREE.QuadraticBezierCurve3(
        a.clone().multiplyScalar(R * 1.012),
        mid,
        b.clone().multiplyScalar(R * 1.012)
      );
      curves.push(curve);
      group.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)),
          new THREE.LineBasicMaterial({
            color: "#22d3ee",
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        )
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(curves.length * 3), 3));
    const packets = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: "#ffffff",
        size: 0.1,
        transparent: true,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    return { group, curves, packets };
  }, [nodes]);

  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const attr = data.packets.geometry.getAttribute("position") as THREE.BufferAttribute;
    data.curves.forEach((c, k) => {
      c.getPoint((tref.current * 0.12 + k * 0.173) % 1, tmp);
      attr.setXYZ(k, tmp.x, tmp.y, tmp.z);
    });
    attr.needsUpdate = true;
  });

  return (
    <>
      <primitive object={data.group} />
      <primitive object={data.packets} />
    </>
  );
}

// a satellite on a tilted orbit (hidden when it passes behind the planet)
function Orbit({
  radius,
  tilt,
  tilt2,
  speed,
  phase,
  tref,
}: {
  radius: number;
  tilt: number;
  tilt2: number;
  speed: number;
  phase: number;
  tref: TRef;
}) {
  const o = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({
        color: "#a78bfa",
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const sat = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 12),
      new THREE.MeshBasicMaterial({ color: "#ffffff" })
    );
    const g = new THREE.Group();
    g.rotation.set(tilt, 0, tilt2);
    g.add(line, sat);
    return { g, sat };
  }, [radius, tilt, tilt2]);

  useFrame(() => {
    const a = tref.current * speed + phase;
    o.sat.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  });

  return <primitive object={o.g} />;
}

function Scene() {
  const pathname = usePathname();
  const key = pathname.split("/")[1] ?? "";

  const presetRef = useRef<Preset>(PRESETS[key] ?? PRESETS[""]);
  useEffect(() => {
    presetRef.current = PRESETS[key] ?? PRESETS[""];
  }, [key]);

  const time = useRef(0);
  const scroll = useRef(0);
  const ptr = useRef({ x: 0, y: 0 });
  const anim = useRef({ ry: 0, x: 0, y: 0, s: 1, tilt: 0.3 });
  const root = useRef<THREE.Group>(null!);
  const spin = useRef<THREE.Group>(null!);
  const starsRef = useRef<THREE.Group>(null!);

  const mobile = useMemo(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false), []);

  // scroll position of the current page (0 to 1) and mouse position (-1 to 1)
  useEffect(() => {
    const readScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scroll.current = max > 0 ? THREE.MathUtils.clamp(window.scrollY / max, 0, 1) : 0;
    };
    const onMove = (e: PointerEvent) => {
      ptr.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    readScroll();
    const t = setTimeout(readScroll, 400);
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, [key]);

  useFrame((state, delta) => {
    // "Calm" in the display settings freezes the automatic motion
    const calm = document.documentElement.dataset.motion === "calm";
    if (!calm) time.current += delta;
    const t = time.current;
    const s = scroll.current;
    const p = presetRef.current;
    const a = anim.current;
    const damp = THREE.MathUtils.damp;

    const vw = state.viewport.width;
    const vh = state.viewport.height;
    const fit = THREE.MathUtils.clamp(vw / 9, 0.55, 1);
    const narrow = vw < 6;

    a.x = damp(a.x, narrow ? 0 : p.x * vw, 2.5, delta);
    a.y = damp(a.y, narrow ? 0.12 * vh : p.y * vh, 2.5, delta);
    a.s = damp(a.s, p.s * fit, 2.5, delta);
    a.tilt = damp(a.tilt, p.tilt, 2.5, delta);
    a.ry = damp(a.ry, p.ry + s * 1.6, 2.2, delta);

    root.current.position.set(a.x, a.y, 0);
    root.current.scale.setScalar(a.s);
    root.current.rotation.set(0.25 + ptr.current.y * 0.08, ptr.current.x * 0.1, a.tilt);
    spin.current.rotation.y = a.ry + t * 0.05;

    starsRef.current.rotation.y = s * 0.5 + t * 0.004;
    starsRef.current.rotation.x = s * 0.15;

    const cam = state.camera;
    cam.position.z = damp(cam.position.z, 7.4 - s * 1.0, 3, delta);
    cam.position.x = damp(cam.position.x, ptr.current.x * 0.4, 2, delta);
    cam.position.y = damp(cam.position.y, ptr.current.y * 0.25, 2, delta);
    cam.lookAt(0, 0, 0);
  });

  return (
    <>
      <group ref={starsRef}>
        <Stars radius={70} depth={50} count={mobile ? 1800 : 4000} factor={3.5} fade speed={0.6} />
      </group>

      <group ref={root}>
        <group ref={spin}>
          <Planet tref={time} mobile={mobile} />
        </group>

        {/* glow around the planet */}
        <mesh>
          <sphereGeometry args={[R * 1.16, 64, 64]} />
          <shaderMaterial
            vertexShader={ATMO_V}
            fragmentShader={ATMO_F}
            side={THREE.BackSide}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <Orbit radius={3.1} tilt={1.1} tilt2={0.2} speed={0.35} phase={0} tref={time} />
        <Orbit radius={3.7} tilt={0.5} tilt2={-0.6} speed={-0.22} phase={2} tref={time} />
        <Orbit radius={4.3} tilt={1.5} tilt2={0.9} speed={0.15} phase={4} tref={time} />
      </group>
    </>
  );
}

export default function World() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_30%_20%,#0a1630_0%,#02040a_65%)]"
    >
      <Canvas camera={{ position: [0, 0, 7.4], fov: 50 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>
      {/* dark edges keep the text easy to read */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.7)_100%)]" />
    </div>
  );
}
