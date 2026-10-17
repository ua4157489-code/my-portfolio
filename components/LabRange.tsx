"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const R = 2.2;
const CYCLE = 5.2;
const rnd = Math.random;
const _q = new THREE.Quaternion();

const LABS = [
  { name: "DVWA", tag: "web vulnerabilities", color: "#22d3ee" },
  { name: "Juice Shop", tag: "OWASP Top 10", color: "#fbbf24" },
  { name: "Docker", tag: "containers", color: "#38bdf8" },
  { name: "Kubernetes", tag: "clusters", color: "#a78bfa" },
  { name: "MITRE ATT&CK", tag: "adversary techniques", color: "#f472b6" },
];

const STATUS: Record<string, string> = {
  ONLINE: "#34d399",
  SCANNING: "#22d3ee",
  EXPLOITED: "#ff2d55",
  PATCHED: "#a3e635",
};

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLabel(ctx: CanvasRenderingContext2D, name: string, tag: string, color: string, status: string) {
  const W = 512;
  const H = 170;
  const sc = STATUS[status];
  ctx.clearRect(0, 0, W, H);
  ctx.shadowColor = sc;
  ctx.shadowBlur = 16;
  rr(ctx, 8, 8, W - 16, H - 16, 18);
  ctx.fillStyle = "rgba(4,8,16,0.85)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = sc;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = "bold 46px ui-monospace, monospace";
  ctx.fillStyle = "#f1f5f9";
  ctx.fillText(name, 28, 66);
  ctx.font = "24px ui-monospace, monospace";
  ctx.fillStyle = color;
  ctx.fillText(tag, 28, 100);
  ctx.font = "bold 28px ui-monospace, monospace";
  ctx.fillStyle = sc;
  ctx.fillText("● " + status, 28, 144);
}

function kaliTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 130;
  const ctx = c.getContext("2d")!;
  ctx.shadowColor = "#ff2d55";
  ctx.shadowBlur = 14;
  rr(ctx, 8, 8, 496, 114, 18);
  ctx.fillStyle = "rgba(20,4,10,0.85)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#ff2d55";
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = "bold 44px ui-monospace, monospace";
  ctx.fillStyle = "#ffe4ea";
  ctx.fillText("KALI", 28, 64);
  ctx.font = "24px ui-monospace, monospace";
  ctx.fillStyle = "#ff7a93";
  ctx.fillText("attacker, authorized lab", 28, 100);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export default function LabRange() {
  const plat = useRef<THREE.Group>(null!);
  const radar = useRef<THREE.Group>(null!);
  const core = useRef<THREE.Group>(null!);
  const alertLight = useRef<THREE.PointLight>(null!);
  const podRefs = useRef<(THREE.Group | null)[]>([]);
  const labels = useRef<(THREE.Mesh | null)[]>([]);
  const pulses = useRef<(THREE.Mesh | null)[]>([]);
  const trail = useRef<(THREE.Mesh | null)[]>([]);
  const kali = useRef<THREE.Mesh>(null!);
  const ripple = useRef<THREE.Mesh>(null!);
  const rippleMat = useRef<THREE.MeshBasicMaterial>(null!);
  const shield = useRef<THREE.Group>(null!);
  const shieldMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const dust = useRef<THREE.Points>(null!);
  const last = useRef<string[]>(LABS.map(() => "ONLINE"));

  const podBox = useMemo(() => new THREE.BoxGeometry(0.9, 0.7, 0.9), []);
  const podEdges = useMemo(() => new THREE.EdgesGeometry(podBox), [podBox]);
  const kaliTex = useMemo(kaliTexture, []);
  const red = useMemo(() => new THREE.Color("#ff2d55"), []);
  const dustPos = useMemo(() => {
    const a = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) {
      const ang = rnd() * Math.PI * 2;
      const r = rnd() * 3;
      a[i * 3] = Math.cos(ang) * r;
      a[i * 3 + 1] = rnd() * 3;
      a[i * 3 + 2] = Math.sin(ang) * r;
    }
    return a;
  }, []);

  const pods = useMemo(
    () =>
      LABS.map((lab, k) => {
        const a = -Math.PI / 2 + (k / LABS.length) * Math.PI * 2;
        const pos = new THREE.Vector3(Math.cos(a) * R, 0.35, Math.sin(a) * R);
        const c = document.createElement("canvas");
        c.width = 512;
        c.height = 170;
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        const ctx = c.getContext("2d")!;
        drawLabel(ctx, lab.name, lab.tag, lab.color, "ONLINE");
        tex.needsUpdate = true;
        const arc = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(0, 0.7, 0),
          new THREE.Vector3(pos.x * 0.5, 1.7, pos.z * 0.5),
          new THREE.Vector3(pos.x, 0.95, pos.z)
        );
        const cable = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.05, 0),
          new THREE.Vector3(pos.x * 0.5, 0.05, pos.z * 0.5),
          new THREE.Vector3(pos.x, 0.05, pos.z),
        ]);
        return {
          lab, pos, tex, ctx, arc, cable,
          cableGeo: new THREE.TubeGeometry(cable, 24, 0.014, 6, false),
          col: new THREE.Color(lab.color),
          bandMat: new THREE.MeshBasicMaterial({ color: lab.color }),
          edgeMat: new THREE.LineBasicMaterial({ color: lab.color }),
        };
      }),
    []
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const n = pods.length;
    const target = Math.floor(t / CYCLE) % n;
    const prev = (target + n - 1) % n;
    const lt = t % CYCLE;

    plat.current.rotation.y += dt * 0.07;
    plat.current.getWorldQuaternion(_q);
    _q.invert().multiply(state.camera.quaternion);
    radar.current.rotation.y -= dt * 0.9;
    core.current.rotation.y += dt * 0.8;
    core.current.rotation.x += dt * 0.35;
    if (kali.current) kali.current.quaternion.copy(_q);

    let hitAny = 0;
    pods.forEach((p, i) => {
      let status = "ONLINE";
      if (i === target) status = lt < 2.4 ? "SCANNING" : lt < 3.4 ? "EXPLOITED" : "PATCHED";
      else if (i === prev && lt < 1.5) status = "PATCHED";
      if (last.current[i] !== status) {
        last.current[i] = status;
        drawLabel(p.ctx, p.lab.name, p.lab.tag, p.lab.color, status);
        p.tex.needsUpdate = true;
      }
      const hit = status === "EXPLOITED";
      const g = podRefs.current[i];
      if (g) g.position.x = p.pos.x + (hit ? Math.sin(t * 70) * 0.025 : 0);
      p.bandMat.color.copy(hit ? red : p.col);
      p.edgeMat.color.copy(hit ? red : p.col);
      if (hit) {
        alertLight.current.position.set(p.pos.x, 1.2, p.pos.z);
        hitAny = 1;
      }
      const L = labels.current[i];
      if (L) L.quaternion.copy(_q);
      const pu = pulses.current[i];
      if (pu) p.cable.getPointAt((t * 0.4 + i * 0.2) % 1, pu.position);
    });
    alertLight.current.intensity = hitAny * (14 + Math.sin(t * 40) * 6);

    // attack packet with trail
    const flying = lt > 1.0 && lt < 2.4;
    const u = (lt - 1.0) / 1.4;
    trail.current.forEach((m, j) => {
      if (!m) return;
      m.visible = flying;
      if (flying) {
        pods[target].arc.getPoint(Math.max(0, u - j * 0.05), m.position);
        m.scale.setScalar(1 - j * 0.14);
      }
    });

    // scan ripple on the floor
    const rp = ripple.current;
    if (lt < 1.2) {
      rp.visible = true;
      rp.position.set(pods[target].pos.x, 0.03, pods[target].pos.z);
      const k = lt / 1.2;
      rp.scale.setScalar(0.4 + k * 2.4);
      rippleMat.current.opacity = (1 - k) * 0.7;
    } else rp.visible = false;

    // shield dome after the patch
    const sh = shield.current;
    if (lt > 3.4 && lt < 5.0) {
      const k = Math.min((lt - 3.4) / 0.7, 1);
      const e = 1 - Math.pow(1 - k, 3);
      const fade = lt > 4.5 ? (5.0 - lt) / 0.5 : 1;
      sh.visible = true;
      sh.position.set(pods[target].pos.x, 0, pods[target].pos.z);
      sh.scale.setScalar(0.3 + 0.75 * e);
      shieldMats.current.forEach((m, j) => {
        if (m) m.opacity = (j === 0 ? 0.18 : 0.5) * fade;
      });
    } else sh.visible = false;

    // rising data particles
    const arr = dust.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < 90; i++) {
      arr[i * 3 + 1] += dt * 0.5;
      if (arr[i * 3 + 1] > 3) arr[i * 3 + 1] = 0.05;
    }
    dust.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group scale={0.82}>
      <group rotation={[0.5, 0.3, 0]}>
        <group ref={plat}>
          <pointLight position={[0, 3, 0]} intensity={10} color="#22d3ee" distance={8} />
          <pointLight ref={alertLight} position={[0, 1.2, 0]} intensity={0} color="#ff2d55" distance={6} />

          {/* platform */}
          <mesh position={[0, -0.07, 0]}>
            <cylinderGeometry args={[3.2, 3.3, 0.14, 64]} />
            <meshStandardMaterial color="#070d18" metalness={0.7} roughness={0.45} />
          </mesh>
          <mesh rotation-x={Math.PI / 2} position={[0, 0.005, 0]}>
            <torusGeometry args={[3.22, 0.025, 8, 128]} />
            <meshBasicMaterial color="#22d3ee" />
          </mesh>
          {[0.8, 1.6, 2.4].map((r) => (
            <mesh key={r} rotation-x={-Math.PI / 2} position={[0, 0.006, 0]}>
              <ringGeometry args={[r - 0.012, r + 0.012, 96]} />
              <meshBasicMaterial color="#0e7490" transparent opacity={0.6} />
            </mesh>
          ))}
          <group ref={radar}>
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.008, 0]}>
              <circleGeometry args={[3.1, 48, 0, 0.7]} />
              <meshBasicMaterial color="#22d3ee" transparent opacity={0.13} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
          </group>
          <mesh ref={ripple} rotation-x={-Math.PI / 2} visible={false}>
            <ringGeometry args={[0.9, 1.0, 48]} />
            <meshBasicMaterial ref={rippleMat} color="#22d3ee" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>

          {/* Kali attacker core */}
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.28, 0.4, 0.5, 16]} />
            <meshStandardMaterial color="#1a0d14" metalness={0.7} roughness={0.4} />
          </mesh>
          <group ref={core} position={[0, 0.85, 0]}>
            <mesh>
              <octahedronGeometry args={[0.38, 0]} />
              <meshBasicMaterial color="#ff4d6d" wireframe />
            </mesh>
            <mesh scale={0.5}>
              <octahedronGeometry args={[0.38, 0]} />
              <meshBasicMaterial color="#ff2d55" />
            </mesh>
          </group>
          <mesh ref={kali} position={[0, 1.7, 0]}>
            <planeGeometry args={[1.3, 0.33]} />
            <meshBasicMaterial map={kaliTex} transparent depthWrite={false} toneMapped={false} />
          </mesh>

          {/* attack packet + trail */}
          {[0, 1, 2, 3, 4, 5].map((j) => (
            <mesh key={j} ref={(m) => { trail.current[j] = m; }} visible={false}>
              <sphereGeometry args={[0.075, 12, 12]} />
              <meshBasicMaterial color={j === 0 ? "#ffffff" : "#ff2d55"} transparent opacity={1 - j * 0.14} toneMapped={false} />
            </mesh>
          ))}

          {/* shield dome */}
          <group ref={shield} visible={false}>
            <mesh>
              <sphereGeometry args={[1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshBasicMaterial ref={(m) => { shieldMats.current[0] = m; }} color="#a3e635" transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
            <mesh>
              <sphereGeometry args={[1.002, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshBasicMaterial ref={(m) => { shieldMats.current[1] = m; }} color="#d9f99d" wireframe transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
          </group>

          {/* cables, pulses, pods */}
          {pods.map((p, i) => (
            <group key={p.lab.name}>
              <mesh geometry={p.cableGeo}>
                <meshBasicMaterial color="#0e7490" />
              </mesh>
              <mesh ref={(m) => { pulses.current[i] = m; }}>
                <sphereGeometry args={[0.045, 10, 10]} />
                <meshBasicMaterial color="#67e8f9" toneMapped={false} />
              </mesh>

              <group ref={(g) => { podRefs.current[i] = g; }} position={p.pos}>
                <mesh geometry={podBox}>
                  <meshStandardMaterial color="#14203a" metalness={0.6} roughness={0.42} />
                </mesh>
                <lineSegments geometry={podEdges} material={p.edgeMat} />
                {[0.12, -0.2].map((y) => (
                  <mesh key={y} position={[0, y, 0]} material={p.bandMat}>
                    <boxGeometry args={[0.93, 0.045, 0.93]} />
                  </mesh>
                ))}
                {[1, -1].map((sg) =>
                  [0, 1, 2].map((s) => (
                    <group key={`${sg}${s}`}>
                      <mesh position={[0, -0.02 - s * 0.08, sg * 0.455]}>
                        <boxGeometry args={[0.6, 0.025, 0.02]} />
                        <meshBasicMaterial color="#03060c" />
                      </mesh>
                      <mesh position={[sg * 0.455, -0.02 - s * 0.08, 0]}>
                        <boxGeometry args={[0.02, 0.025, 0.6]} />
                        <meshBasicMaterial color="#03060c" />
                      </mesh>
                    </group>
                  ))
                )}
                <mesh position={[0, 0.4, 0]}>
                  <boxGeometry args={[0.62, 0.1, 0.62]} />
                  <meshStandardMaterial color="#0c1424" metalness={0.8} roughness={0.35} />
                </mesh>
                <mesh position={[0.24, 0.47, 0.24]}>
                  <sphereGeometry args={[0.04, 10, 10]} />
                  <meshBasicMaterial color={p.lab.color} toneMapped={false} />
                </mesh>
                <mesh position={[-0.2, 0.65, -0.2]}>
                  <cylinderGeometry args={[0.01, 0.01, 0.5, 6]} />
                  <meshBasicMaterial color="#64748b" />
                </mesh>
                <mesh position={[-0.2, 0.92, -0.2]}>
                  <sphereGeometry args={[0.035, 10, 10]} />
                  <meshBasicMaterial color="#ff2d55" toneMapped={false} />
                </mesh>
                <mesh position={[0, 0.95, 0]}>
                  <cylinderGeometry args={[0.008, 0.008, 0.7, 6]} />
                  <meshBasicMaterial color={p.lab.color} transparent opacity={0.5} />
                </mesh>
                <mesh ref={(m) => { labels.current[i] = m; }} position={[0, 1.55, 0]}>
                  <planeGeometry args={[1.5, 0.5]} />
                  <meshBasicMaterial map={p.tex} transparent depthWrite={false} toneMapped={false} />
                </mesh>
              </group>
            </group>
          ))}

          <points ref={dust} frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[dustPos, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.045} color="#a5f3fc" transparent opacity={0.75} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
          </points>
        </group>
      </group>
    </group>
  );
}
