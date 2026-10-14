"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";

// ---------- rack dimensions ----------
const W = 1.2;
const D = 1.0;
const H = 3.8;
const U = 0.28; // height of one server slot
const FRONT = D / 2 - 0.05; // z of the front plates
const FLOOR = -2.1;
const BASE = H / 2 + 0.075; // distance from the rack centre down to its feet

const UNITS = [
  "server", "server", "server", "fan", "server", "server",
  "switch", "server", "server", "fan", "server", "server",
] as const;

const unitY = (i: number) => -H / 2 + 0.22 + U / 2 + i * U;
const SERVERS = UNITS.map((t, i) => (t === "server" ? i : -1)).filter((i) => i >= 0);
const FANS = UNITS.map((t, i) => (t === "fan" ? i : -1)).filter((i) => i >= 0);
const SWITCH = UNITS.indexOf("switch");

type TRef = MutableRefObject<number>;

// ---------- where the rack sits ----------
type Pose = { x: number; y: number; s: number; ry: number; rx: number; door: number };

// Home page: one pose per section as you scroll down (x is a fraction of screen width)
const HOME: { at: number; p: Pose }[] = [
  { at: 0.0, p: { x: 0.24, y: 0, s: 1.0, ry: -0.55, rx: 0.05, door: 0 } },
  { at: 0.14, p: { x: -0.26, y: 0, s: 1.0, ry: 0.4, rx: 0.05, door: 1 } },
  { at: 0.29, p: { x: 0.27, y: 0, s: 1.25, ry: -0.15, rx: 0.1, door: 1 } },
  { at: 0.43, p: { x: -0.27, y: 0, s: 1.0, ry: 1.4, rx: 0.05, door: 0.3 } },
  { at: 0.57, p: { x: 0.27, y: 0, s: 1.0, ry: 2.9, rx: 0.08, door: 0 } },
  { at: 0.71, p: { x: -0.27, y: 0, s: 1.0, ry: 4.3, rx: 0.05, door: 0.6 } },
  { at: 0.85, p: { x: 0.0, y: 0.02, s: 0.75, ry: 5.0, rx: 0.05, door: 0 } },
  { at: 1.0, p: { x: 0.26, y: 0, s: 1.05, ry: 6.0, rx: 0.05, door: 0 } },
];

// other pages: a fixed pose each (the rack still turns a little as you scroll)
const PAGE: Record<string, Pose> = {
  about: { x: -0.28, y: 0, s: 0.9, ry: 0.5, rx: 0.05, door: 0.8 },
  experience: { x: 0.28, y: 0, s: 0.9, ry: -0.6, rx: 0.05, door: 0.5 },
  education: { x: -0.28, y: 0, s: 0.9, ry: 0.9, rx: 0.05, door: 0.3 },
  skills: { x: 0.28, y: 0, s: 0.9, ry: -0.3, rx: 0.05, door: 1 },
  projects: { x: -0.28, y: 0, s: 0.9, ry: 0.4, rx: 0.05, door: 0.6 },
  contact: { x: 0.0, y: -0.02, s: 0.95, ry: 0.2, rx: 0.05, door: 1 },
};

const mix = (a: number, b: number, f: number) => a + (b - a) * f;
const mixPose = (a: Pose, b: Pose, f: number): Pose => ({
  x: mix(a.x, b.x, f),
  y: mix(a.y, b.y, f),
  s: mix(a.s, b.s, f),
  ry: mix(a.ry, b.ry, f),
  rx: mix(a.rx, b.rx, f),
  door: mix(a.door, b.door, f),
});

function homePose(s: number): Pose {
  if (s <= HOME[0].at) return HOME[0].p;
  for (let i = 0; i < HOME.length - 1; i++) {
    const a = HOME[i];
    const b = HOME[i + 1];
    if (s <= b.at) {
      const f = THREE.MathUtils.smoothstep((s - a.at) / (b.at - a.at), 0, 1);
      return mixPose(a.p, b.p, f);
    }
  }
  return HOME[HOME.length - 1].p;
}

// ---------- the rack ----------
function Rack({ tref, door }: { tref: TRef; door: MutableRefObject<number> }) {
  const doorGroup = useRef<THREE.Group>(null!);
  const fanRefs = useRef<THREE.Group[]>([]);
  const scan = useRef<THREE.Mesh>(null!);
  const bays = useRef<THREE.InstancedMesh>(null!);
  const ports = useRef<THREE.InstancedMesh>(null!);
  const grooves = useRef<THREE.InstancedMesh>(null!);
  const ledColor = useRef<THREE.BufferAttribute>(null!);

  const mats = useMemo(
    () => ({
      frame: new THREE.MeshStandardMaterial({ color: "#0b1016", metalness: 0.85, roughness: 0.35 }),
      chassis: new THREE.MeshStandardMaterial({ color: "#141a23", metalness: 0.8, roughness: 0.4 }),
      plate: new THREE.MeshStandardMaterial({ color: "#1d2430", metalness: 0.6, roughness: 0.5 }),
      plateSwitch: new THREE.MeshStandardMaterial({ color: "#0f2331", metalness: 0.6, roughness: 0.5 }),
      dark: new THREE.MeshStandardMaterial({ color: "#06090d", metalness: 0.3, roughness: 0.8 }),
      bay: new THREE.MeshStandardMaterial({ color: "#2f3a4a", metalness: 0.5, roughness: 0.55 }),
      panel: new THREE.MeshStandardMaterial({ color: "#10151d", metalness: 0.6, roughness: 0.55 }),
      glow: new THREE.MeshBasicMaterial({ color: "#22d3ee", toneMapped: false }),
      glass: new THREE.MeshPhysicalMaterial({
        color: "#0a2a3a",
        transparent: true,
        opacity: 0.16,
        roughness: 0.05,
        metalness: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    }),
    []
  );

  // blinking lights: 3 per server and 24 on the switch
  const leds = useMemo(() => {
    const pos: number[] = [];
    const kind: number[] = [];
    SERVERS.forEach((i) => {
      const y = unitY(i) + 0.06;
      pos.push(0.46, y, FRONT + 0.035);
      kind.push(0);
      pos.push(0.41, y, FRONT + 0.035);
      kind.push(1);
      pos.push(0.36, y, FRONT + 0.035);
      kind.push(2);
    });
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 12; c++) {
        pos.push(-0.48 + c * 0.088, unitY(SWITCH) + (r ? -0.058 : 0.058) + 0.04, FRONT + 0.035);
        kind.push(3);
      }
    }
    return { pos: new Float32Array(pos), kind, colors: new Float32Array(kind.length * 3) };
  }, []);

  // patch cables hanging from the switch to the servers
  const cables = useMemo(() => {
    const defs = [
      { c: 1, to: 7, tx: 0.4, col: "#22d3ee" },
      { c: 3, to: 8, tx: 0.3, col: "#ff4d9d" },
      { c: 5, to: 5, tx: 0.2, col: "#fbbf24" },
      { c: 7, to: 4, tx: 0.1, col: "#a78bfa" },
      { c: 9, to: 10, tx: 0.0, col: "#34d399" },
      { c: 11, to: 11, tx: -0.1, col: "#22d3ee" },
    ];
    return defs.map((d) => {
      const sx = -0.48 + d.c * 0.088;
      const sy = unitY(SWITCH) + 0.058;
      const ex = d.tx;
      const ey = unitY(d.to) - 0.06;
      const z0 = FRONT + 0.04;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sx, sy, z0),
        new THREE.Vector3(sx + 0.08, sy + (ey - sy) * 0.35, z0 + 0.16),
        new THREE.Vector3(ex - 0.05, sy + (ey - sy) * 0.7, z0 + 0.16),
        new THREE.Vector3(ex, ey, z0),
      ]);
      return { geo: new THREE.TubeGeometry(curve, 40, 0.011, 6, false), col: d.col };
    });
  }, []);

  // place the repeated parts (drive bays, switch ports, side grooves)
  useEffect(() => {
    const d = new THREE.Object3D();
    let k = 0;
    SERVERS.forEach((i) => {
      for (let b = 0; b < 8; b++) {
        d.position.set(-0.46 + b * 0.085, unitY(i), FRONT + 0.022);
        d.updateMatrix();
        bays.current.setMatrixAt(k++, d.matrix);
      }
    });
    bays.current.instanceMatrix.needsUpdate = true;

    k = 0;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 12; c++) {
        d.position.set(-0.48 + c * 0.088, unitY(SWITCH) + (r ? -0.058 : 0.058), FRONT + 0.022);
        d.updateMatrix();
        ports.current.setMatrixAt(k++, d.matrix);
      }
    }
    ports.current.instanceMatrix.needsUpdate = true;

    k = 0;
    [-1, 1].forEach((side) => {
      for (let g = 0; g < 14; g++) {
        d.position.set(side * (W / 2 + 0.002), -H / 2 + 0.5 + g * 0.22, 0);
        d.updateMatrix();
        grooves.current.setMatrixAt(k++, d.matrix);
      }
    });
    grooves.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(() => {
    const t = tref.current;

    doorGroup.current.rotation.y = -door.current * 1.9;

    fanRefs.current.forEach((g, k) => {
      if (g) g.rotation.z = t * (14 + k * 2) * (k % 2 ? -1 : 1);
    });

    scan.current.position.y = Math.sin(t * 0.5) * (H / 2 - 0.45);

    const attr = ledColor.current;
    const arr = attr.array as Float32Array;
    leds.kind.forEach((kd, i) => {
      let r = 0;
      let g = 0;
      let b = 0;
      let v = 0;
      if (kd === 0) {
        v = 0.85 + Math.sin(t * 2 + i) * 0.1;
        r = 0.2; g = 1; b = 0.4;
      } else if (kd === 1) {
        v = Math.sin(t * (5 + (i % 7)) + i * 2.1) > 0.35 ? 1 : 0.12;
        r = 0.13; g = 0.83; b = 0.93;
      } else if (kd === 2) {
        v = Math.sin(t * 0.7 + i) > 0.9 ? 1 : 0.08;
        r = 1; g = 0.72; b = 0.14;
      } else {
        v = Math.sin(t * (3 + (i % 5)) + i) > 0.15 ? 1 : 0.15;
        r = 0.2; g = 1; b = 0.5;
      }
      arr[i * 3] = r * v;
      arr[i * 3 + 1] = g * v;
      arr[i * 3 + 2] = b * v;
    });
    attr.needsUpdate = true;
  });

  return (
    <group>
      {/* frame: four posts, top and bottom caps, feet */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`p${sx}${sz}`} position={[sx * (W / 2 - 0.03), 0, sz * (D / 2 - 0.03)]} material={mats.frame}>
            <boxGeometry args={[0.06, H, 0.06]} />
          </mesh>
        ))
      )}
      <mesh position={[0, H / 2 - 0.05, 0]} material={mats.frame}>
        <boxGeometry args={[W, 0.1, D]} />
      </mesh>
      <mesh position={[0, -H / 2 + 0.05, 0]} material={mats.frame}>
        <boxGeometry args={[W, 0.1, D]} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`f${sx}${sz}`} position={[sx * (W / 2 - 0.1), -H / 2 - 0.035, sz * (D / 2 - 0.1)]} material={mats.dark}>
            <boxGeometry args={[0.1, 0.08, 0.1]} />
          </mesh>
        ))
      )}

      {/* side and back panels */}
      {[-1, 1].map((side) => (
        <mesh key={`s${side}`} position={[side * (W / 2 - 0.01), 0, 0]} material={mats.panel}>
          <boxGeometry args={[0.02, H - 0.2, D - 0.1]} />
        </mesh>
      ))}
      <mesh position={[0, 0, -D / 2 + 0.02]} material={mats.panel}>
        <boxGeometry args={[W - 0.1, H - 0.2, 0.03]} />
      </mesh>
      <instancedMesh ref={grooves} args={[undefined, undefined, 28]} material={mats.dark}>
        <boxGeometry args={[0.004, 0.02, D - 0.3]} />
      </instancedMesh>

      {/* glowing edge strips on the front posts */}
      {[-1, 1].map((side) => (
        <mesh key={`g${side}`} position={[side * (W / 2 - 0.065), 0, D / 2 - 0.015]} material={mats.glow}>
          <boxGeometry args={[0.012, H - 0.3, 0.012]} />
        </mesh>
      ))}

      {/* the units */}
      {UNITS.map((type, i) => (
        <group key={i} position={[0, unitY(i), 0]}>
          <mesh material={mats.chassis}>
            <boxGeometry args={[W - 0.12, U - 0.03, D - 0.1]} />
          </mesh>
          <mesh
            position={[0, 0, FRONT]}
            material={type === "fan" ? mats.dark : type === "switch" ? mats.plateSwitch : mats.plate}
          >
            <boxGeometry args={[W - 0.12, U - 0.03, 0.03]} />
          </mesh>

          {type === "fan" &&
            [-1, 1].map((side) => {
              const fi = FANS.indexOf(i) * 2 + (side > 0 ? 1 : 0);
              return (
                <group key={side} position={[side * 0.28, 0, FRONT + 0.02]}>
                  <mesh material={mats.frame}>
                    <torusGeometry args={[0.115, 0.012, 8, 36]} />
                  </mesh>
                  <mesh position={[0, 0, -0.004]} material={mats.dark}>
                    <circleGeometry args={[0.11, 32]} />
                  </mesh>
                  <group
                    ref={(el) => {
                      if (el) fanRefs.current[fi] = el;
                    }}
                  >
                    <mesh material={mats.bay}>
                      <cylinderGeometry args={[0.022, 0.022, 0.012, 16]} />
                    </mesh>
                    {Array.from({ length: 7 }).map((_, b) => (
                      <group key={b} rotation={[0, 0, (b / 7) * Math.PI * 2]}>
                        <mesh position={[0.06, 0, 0]} rotation={[0.55, 0, 0]} material={mats.bay}>
                          <boxGeometry args={[0.075, 0.035, 0.004]} />
                        </mesh>
                      </group>
                    ))}
                  </group>
                </group>
              );
            })}
        </group>
      ))}

      <instancedMesh ref={bays} args={[undefined, undefined, SERVERS.length * 8]} material={mats.bay}>
        <boxGeometry args={[0.07, U * 0.6, 0.02]} />
      </instancedMesh>
      <instancedMesh ref={ports} args={[undefined, undefined, 24]} material={mats.dark}>
        <boxGeometry args={[0.06, 0.05, 0.02]} />
      </instancedMesh>

      {/* blinking lights (round glows) */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[leds.pos, 3]} />
          <bufferAttribute ref={ledColor} attach="attributes-color" args={[leds.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.09}
          vertexColors
          transparent
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* a scanning light sweeping over the front */}
      <mesh ref={scan} position={[0, 0, FRONT + 0.05]}>
        <planeGeometry args={[W - 0.15, 0.025]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* patch cables */}
      {cables.map((c, k) => (
        <mesh key={k} geometry={c.geo}>
          <meshStandardMaterial color={c.col} emissive={c.col} emissiveIntensity={0.35} roughness={0.5} />
        </mesh>
      ))}

      {/* glass door, hinged on the left: it swings open as you scroll */}
      <group ref={doorGroup} position={[-W / 2, 0, D / 2 + 0.25]}>
        <group position={[W / 2, 0, 0]}>
          <mesh position={[0, H / 2 - 0.12, 0]} material={mats.frame}>
            <boxGeometry args={[W, 0.06, 0.04]} />
          </mesh>
          <mesh position={[0, -H / 2 + 0.12, 0]} material={mats.frame}>
            <boxGeometry args={[W, 0.06, 0.04]} />
          </mesh>
          <mesh position={[-W / 2 + 0.03, 0, 0]} material={mats.frame}>
            <boxGeometry args={[0.06, H - 0.2, 0.04]} />
          </mesh>
          <mesh position={[W / 2 - 0.03, 0, 0]} material={mats.frame}>
            <boxGeometry args={[0.06, H - 0.2, 0.04]} />
          </mesh>
          <mesh material={mats.glass}>
            <planeGeometry args={[W - 0.1, H - 0.3]} />
          </mesh>
          <mesh position={[W / 2 - 0.1, 0, 0.04]} material={mats.bay}>
            <boxGeometry args={[0.02, 0.4, 0.03]} />
          </mesh>
        </group>
      </group>

      {/* soft glow inside the rack */}
      <pointLight color="#22d3ee" intensity={8} distance={5} decay={2} position={[0, 0, 0.9]} />
    </group>
  );
}

// slowly rising dust particles around the rack
function Dust({ tref }: { tref: TRef }) {
  const N = 240;
  const attr = useRef<THREE.BufferAttribute>(null!);
  const seed = useMemo(() => {
    const base = new Float32Array(N * 3);
    const speed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const r = (n: number) => {
        const x = Math.sin((i + 1) * n) * 43758.5453;
        return x - Math.floor(x);
      };
      base[i * 3] = (r(12.9898) - 0.5) * 3.4;
      base[i * 3 + 1] = r(78.233) * 4.4;
      base[i * 3 + 2] = (r(39.425) - 0.5) * 3.0 + 0.3;
      speed[i] = 0.04 + r(11.13) * 0.08;
    }
    return { base, speed, pos: new Float32Array(base) };
  }, []);

  useFrame(() => {
    const t = tref.current;
    const a = attr.current.array as Float32Array;
    for (let i = 0; i < N; i++) {
      a[i * 3] = seed.base[i * 3] + Math.sin(t * 0.3 + i) * 0.05;
      a[i * 3 + 1] = ((seed.base[i * 3 + 1] + t * seed.speed[i]) % 4.4) - 2.2;
      a[i * 3 + 2] = seed.base[i * 3 + 2];
    }
    attr.current.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute ref={attr} attach="attributes-position" args={[seed.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#22d3ee"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// soft shadow under the rack
function Shadow() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(0,0,0,0.85)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -BASE + 0.004, 0]}>
      <planeGeometry args={[3.6, 3.2]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

function Scene() {
  const pathname = usePathname();
  const key = pathname.split("/")[1] ?? "";
  const pageRef = useRef(key);
  useEffect(() => {
    pageRef.current = key;
  }, [key]);

  const time = useRef(0);
  const scroll = useRef(0);
  const ptr = useRef({ x: 0, y: 0 });
  const door = useRef(0);
  const anim = useRef<Pose>({ ...HOME[0].p, x: 0, s: 0.8 });
  const root = useRef<THREE.Group>(null!);

  const grid = useMemo(() => {
    const g = new THREE.GridHelper(44, 66, 0x0e7490, 0x0b2a3a);
    const m = g.material as THREE.LineBasicMaterial;
    m.transparent = true;
    m.opacity = 0.55;
    return g;
  }, []);

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
    const t1 = setTimeout(readScroll, 300);
    const t2 = setTimeout(readScroll, 1200);
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, [key]);

  useFrame((state, delta) => {
    // "Calm" in the display settings freezes the idle motion (fans, lights, sway)
    const calm = document.documentElement.dataset.motion === "calm";
    if (!calm) time.current += delta;
    const t = time.current;
    const s = scroll.current;
    const damp = THREE.MathUtils.damp;

    const vw = state.viewport.width;
    const vh = state.viewport.height;
    const fit = THREE.MathUtils.clamp(vw / 10, 0.6, 1);
    const narrow = vw < 6;

    let target: Pose;
    if (key_of(pageRef.current) === "") {
      target = homePose(s);
    } else {
      const p = PAGE[pageRef.current] ?? PAGE.about;
      target = { ...p, ry: p.ry + s * 0.9 };
    }

    const a = anim.current;
    a.x = damp(a.x, narrow ? 0 : target.x * vw, 3, delta);
    a.y = damp(a.y, target.y * vh, 3, delta);
    a.s = damp(a.s, target.s * fit * (narrow ? 0.75 : 1), 3, delta);
    a.ry = damp(a.ry, target.ry, 3, delta);
    a.rx = damp(a.rx, target.rx, 3, delta);
    a.door = damp(a.door, target.door, 3, delta);
    door.current = a.door;

    const g = root.current;
    g.position.set(a.x, FLOOR + BASE * a.s + a.y + Math.sin(t * 0.8) * 0.02, 0);
    g.scale.setScalar(a.s);
    g.rotation.set(a.rx + ptr.current.y * 0.04, a.ry + Math.sin(t * 0.4) * 0.03 + ptr.current.x * 0.06, 0);

    const cam = state.camera;
    cam.position.x = damp(cam.position.x, ptr.current.x * 0.5, 2, delta);
    cam.position.y = damp(cam.position.y, 0.5 + ptr.current.y * 0.25, 2, delta);
    cam.lookAt(0, 0.3, 0);
  });

  return (
    <>
      <fog attach="fog" args={["#02040a", 8, 26]} />
      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#7fd7ff", "#050a14", 0.7]} />
      <directionalLight color="#dff6ff" intensity={2.2} position={[3, 6, 6]} />
      <pointLight color="#22d3ee" intensity={40} distance={14} decay={2} position={[-4, 1.5, 4]} />
      <pointLight color="#ff4d9d" intensity={30} distance={14} decay={2} position={[4, 2, -3]} />

      <primitive object={grid} position={[0, FLOOR, 0]} />

      <group ref={root}>
        <Rack tref={time} door={door} />
        <Dust tref={time} />
        <Shadow />
      </group>
    </>
  );
}

const key_of = (k: string) => k;

export default function World() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_30%_20%,#0a1630_0%,#02040a_65%)]"
    >
      <Canvas camera={{ position: [0, 0.5, 8.5], fov: 45 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>
      {/* dark edges keep the text easy to read */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)]" />
    </div>
  );
}
