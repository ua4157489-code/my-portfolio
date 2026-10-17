"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import * as THREE from "three";

type Shared = MutableRefObject<{ p: number; mx: number; my: number }>;

const R = 2.0;

const NODES: { n: string; c: string }[] = [
  { n: "Linux", c: "#fb923c" },
  { n: "Python", c: "#facc15" },
  { n: "Bash", c: "#facc15" },
  { n: "Docker", c: "#fb923c" },
  { n: "Kubernetes", c: "#fb923c" },
  { n: "Git", c: "#fb923c" },
  { n: "Nmap", c: "#22d3ee" },
  { n: "Burp Suite", c: "#22d3ee" },
  { n: "Wireshark", c: "#22d3ee" },
  { n: "OWASP Top 10", c: "#a78bfa" },
  { n: "MITRE ATT&CK", c: "#a78bfa" },
  { n: "Recon", c: "#34d399" },
  { n: "Enumeration", c: "#34d399" },
  { n: "Reporting", c: "#34d399" },
];
const EDGES: [string, string][] = [
  ["Linux", "Bash"], ["Linux", "Docker"], ["Docker", "Kubernetes"], ["Python", "Bash"], ["Python", "Git"],
  ["Python", "Recon"], ["Recon", "Nmap"], ["Recon", "Enumeration"], ["Enumeration", "Nmap"], ["Wireshark", "Nmap"],
  ["Enumeration", "Burp Suite"], ["Burp Suite", "OWASP Top 10"], ["OWASP Top 10", "Reporting"],
  ["MITRE ATT&CK", "Reporting"], ["MITRE ATT&CK", "Recon"], ["Linux", "Nmap"],
];

/* evenly spread points on a sphere (fibonacci), with a little jitter in radius */
export function fib(n: number, radius: number) {
  const out: THREE.Vector3[] = [];
  const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - ((i + 0.5) / n) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = i * g;
    const k = radius * (0.92 + ((i * 37) % 10) / 62);
    out.push(new THREE.Vector3(Math.cos(a) * r * k, y * k, Math.sin(a) * r * k));
  }
  return out;
}

function labelTex(text: string, color: string) {
  const cv = document.createElement("canvas");
  cv.width = 320;
  cv.height = 64;
  const ctx = cv.getContext("2d")!;
  ctx.font = "600 28px ui-monospace, Menlo, Consolas, 'DejaVu Sans Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.fillText(text, 160, 33);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function glowTex() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

export default function SkillsStation({ sh }: { sh: Shared }) {
  const root = useRef<THREE.Group>(null!);
  const sweep = useRef<THREE.Mesh>(null!);
  const sweepMat = useRef<THREE.MeshBasicMaterial>(null!);
  const pulses = useRef<THREE.Points>(null!);
  const core = useRef<THREE.Mesh>(null!);
  const nodeG = useRef<(THREE.Group | null)[]>([]);
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  const glows = useRef<(THREE.SpriteMaterial | null)[]>([]);
  const labels = useRef<(THREE.Sprite | null)[]>([]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const base = useMemo(() => fib(NODES.length, R), []);
  const idx = useMemo(() => Object.fromEntries(NODES.map((n, i) => [n.n, i])), []);
  const gTex = useMemo(() => glowTex(), []);
  const lTex = useMemo(() => NODES.map((n) => labelTex(n.n, "#e6f2ff")), []);

  const edgeGeo = useMemo(() => {
    const p: number[] = [];
    EDGES.forEach(([a, b]) => {
      const A = base[idx[a]], B = base[idx[b]];
      p.push(A.x, A.y, A.z, B.x, B.y, B.z);
    });
    // a few faint spokes to the core
    ["Linux", "Python", "Recon", "Reporting"].forEach((n) => {
      const A = base[idx[n]];
      p.push(0, 0, 0, A.x, A.y, A.z);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(p), 3));
    return g;
  }, [base, idx]);

  const pulseCount = 22;
  const pulseGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pulseCount * 3), 3));
    return g;
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const damp = THREE.MathUtils.damp;
    root.current.rotation.y = t * 0.14 + sh.current.mx * 0.5;
    root.current.rotation.x = damp(root.current.rotation.x, 0.22 - sh.current.my * 0.25, 3, dt);
    root.current.position.y = Math.sin(t * 0.7) * 0.06;

    // the scan ring sweeps top to bottom through the sphere
    const cyc = (t % 6) / 6;
    const sy = R * (1 - cyc * 2);
    const sr = Math.sqrt(Math.max(0.02, R * R - sy * sy));
    sweep.current.position.y = sy;
    sweep.current.scale.set(sr, sr, 1);
    sweepMat.current.opacity = 0.55 * Math.sin(Math.PI * cyc);

    // per-node: depth fade + brightness when the ring passes
    base.forEach((b, i) => {
      tmp.copy(b).applyEuler(root.current.rotation);
      const depth = (tmp.z + R) / (2 * R); // 0 back .. 1 front
      const hit = Math.exp(-Math.pow((tmp.y + root.current.position.y - sy) / 0.28, 2));
      const lab = labels.current[i];
      if (lab) {
        const m = lab.material as THREE.SpriteMaterial;
        m.opacity = Math.min(1, 0.22 + 0.78 * depth + hit * 0.6);
        const s = 0.8 + depth * 0.3 + hit * 0.18;
        lab.scale.set(s * 1.0, s * 0.2, 1);
      }
      const gl = glows.current[i];
      if (gl) gl.opacity = 0.25 + depth * 0.35 + hit * 0.7;
      const d = dots.current[i];
      if (d) d.scale.setScalar(0.8 + depth * 0.5 + hit * 0.9);
    });
    core.current.rotation.y = t * 0.6;
    core.current.rotation.x = t * 0.35;
    core.current.scale.setScalar(1 + Math.sin(t * 2) * 0.08);

    // pulses travelling along the connections
    const arr = (pulses.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < pulseCount; i++) {
      const [a, b] = EDGES[i % EDGES.length];
      const u = (t * 0.32 + i * 0.37) % 1;
      const A = base[idx[a]], B = base[idx[b]];
      arr[i * 3] = A.x + (B.x - A.x) * u;
      arr[i * 3 + 1] = A.y + (B.y - A.y) * u;
      arr[i * 3 + 2] = A.z + (B.z - A.z) * u;
    }
    pulses.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group scale={1.05}>
      <group ref={root}>
        {/* connections */}
        <lineSegments geometry={edgeGeo}>
          <lineBasicMaterial color="#6fb8ff" transparent opacity={0.28} />
        </lineSegments>
        <points ref={pulses} geometry={pulseGeo} frustumCulled={false}>
          <pointsMaterial color="#cfeaff" size={0.07} transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
        </points>

        {/* core */}
        <mesh ref={core}>
          <icosahedronGeometry args={[0.28, 1]} />
          <meshBasicMaterial color="#67e8f9" wireframe transparent opacity={0.9} />
        </mesh>
        <sprite scale={[1.6, 1.6, 1]}>
          <spriteMaterial map={gTex} color="#22d3ee" transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>

        {/* skills */}
        {NODES.map((n, i) => (
          <group key={n.n} ref={(el) => { nodeG.current[i] = el; }} position={base[i]}>
            <mesh ref={(el) => { dots.current[i] = el; }}>
              <sphereGeometry args={[0.07, 16, 12]} />
              <meshBasicMaterial color={n.c} />
            </mesh>
            <sprite scale={[0.55, 0.55, 1]}>
              <spriteMaterial ref={(el) => { glows.current[i] = el; }} map={gTex} color={n.c} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
            <sprite ref={(el) => { labels.current[i] = el; }} position={[0, 0.2, 0]} scale={[0.9, 0.18, 1]}>
              <spriteMaterial map={lTex[i]} transparent opacity={0.9} depthWrite={false} />
            </sprite>
          </group>
        ))}
      </group>

      {/* scan ring */}
      <mesh ref={sweep} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.985, 1.0, 96]} />
        <meshBasicMaterial ref={sweepMat} color="#67e8f9" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
