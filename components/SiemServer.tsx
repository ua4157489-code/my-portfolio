"use client";

import { useFrame } from "@react-three/fiber";
import type { MutableRefObject } from "react";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const rnd = Math.random;
const _q = new THREE.Quaternion();
const RED = new THREE.Color("#ff2d55");
const R = 3.2;

type Row = { lvl: number; text: string; time: string };
const EVENTS = [
  { lvl: 3, text: "sshd: authentication success" },
  { lvl: 3, text: "Agent connected" },
  { lvl: 4, text: "CIS benchmark check failed" },
  { lvl: 5, text: "sshd: authentication failed" },
  { lvl: 6, text: "Vulnerability detected in package" },
  { lvl: 7, text: "FIM: /etc/passwd modified" },
  { lvl: 9, text: "Web attack: SQL injection pattern" },
  { lvl: 10, text: "sshd: brute force attempt" },
  { lvl: 12, text: "Rootcheck: possible rootkit" },
];
const AGENTS = [
  { name: "linux", a: 1.0, col: "#22d3ee" },
  { name: "windows", a: 1.65, col: "#38bdf8" },
  { name: "cloud", a: 2.25, col: "#a78bfa" },
  { name: "docker", a: 2.85, col: "#34d399" },
  { name: "k8s", a: 3.4, col: "#f472b6" },
];

const lvlColor = (l: number) => (l >= 9 ? "#ff2d55" : l >= 5 ? "#fbbf24" : "#22d3ee");
const nowTime = () => new Date().toISOString().slice(11, 19);
const pick = () => EVENTS[Math.floor(rnd() * EVENTS.length)];

function drawScreen(ctx: CanvasRenderingContext2D, rows: Row[], eps: number, bars: number[], flash: number, alerts: number) {
  const W = 512;
  const H = 288;
  const hot = flash > 0.05;
  ctx.fillStyle = "#03121a";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = hot ? `rgba(255,45,85,${0.15 + flash * 0.3})` : "#0b2a38";
  ctx.fillRect(0, 0, W, 34);
  ctx.font = "bold 18px ui-monospace, monospace";
  ctx.fillStyle = "#67e8f9";
  ctx.fillText("WAZUH MANAGER", 12, 23);
  ctx.font = "13px ui-monospace, monospace";
  ctx.fillStyle = "#4b7a8c";
  ctx.fillText("simulated", W - 82, 22);

  const stats: [string, string, string][] = [
    ["EVENTS/s", String(Math.round(eps)), "#22d3ee"],
    ["AGENTS", "5", "#34d399"],
    ["ALERTS", String(alerts), hot ? "#ff2d55" : "#fbbf24"],
  ];
  stats.forEach(([k, v, c], i) => {
    const x = 12 + i * 112;
    ctx.fillStyle = "#071d28";
    ctx.fillRect(x, 44, 104, 50);
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillStyle = "#4b7a8c";
    ctx.fillText(k, x + 8, 60);
    ctx.font = "bold 24px ui-monospace, monospace";
    ctx.fillStyle = c;
    ctx.fillText(v, x + 8, 86);
  });

  const bx = 358, by = 44, bw = 142, bh = 50;
  ctx.fillStyle = "#071d28";
  ctx.fillRect(bx, by, bw, bh);
  const n = bars.length;
  bars.forEach((b, i) => {
    const h = Math.min(b, 1) * (bh - 8);
    ctx.fillStyle = i === n - 1 && hot ? "#ff2d55" : "#22d3ee";
    ctx.fillRect(bx + 4 + (i * (bw - 8)) / n, by + bh - 4 - h, (bw - 8) / n - 2, h);
  });

  ctx.font = "14px ui-monospace, monospace";
  rows.slice(0, 8).forEach((r, i) => {
    const y = 118 + i * 21;
    ctx.fillStyle = lvlColor(r.lvl);
    ctx.fillText("L" + String(r.lvl).padStart(2, "0"), 12, y);
    ctx.fillStyle = "#4b7a8c";
    ctx.fillText(r.time, 56, y);
    ctx.fillStyle = r.lvl >= 9 ? "#ffd1da" : "#cbd5e1";
    ctx.fillText(r.text.slice(0, 32), 128, y);
  });
  ctx.fillStyle = "rgba(255,255,255,0.035)";
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
}

function labelTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 150;
  const x = c.getContext("2d")!;
  x.textAlign = "center";
  x.shadowColor = "#22d3ee";
  x.shadowBlur = 18;
  x.font = "bold 76px ui-monospace, monospace";
  x.fillStyle = "#f1f5f9";
  x.fillText("WAZUH", 256, 78);
  x.shadowBlur = 0;
  x.font = "26px ui-monospace, monospace";
  x.fillStyle = "#67e8f9";
  x.fillText("SIEM · XDR · open source", 256, 122);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Fan({ r, speed, boost }: { r: number; speed: number; boost: MutableRefObject<number> }) {
  const spin = useRef<THREE.Group>(null!);
  const led = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame((state, dt) => {
    spin.current.rotation.z += dt * speed * (1 + boost.current * 0.9);
    led.current.color.setHSL((state.clock.elapsedTime * 0.12 + r) % 1, 1, 0.55);
  });
  return (
    <group>
      <mesh>
        <circleGeometry args={[r * 1.02, 32]} />
        <meshBasicMaterial color="#020409" />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <torusGeometry args={[r, r * 0.05, 8, 40]} />
        <meshBasicMaterial ref={led} color="#22d3ee" toneMapped={false} />
      </mesh>
      <group ref={spin} position={[0, 0, 0.02]}>
        {Array.from({ length: 9 }, (_, b) => (
          <group key={b} rotation-z={(b / 9) * Math.PI * 2}>
            <mesh position={[r * 0.5, 0, 0]} rotation-x={0.6}>
              <boxGeometry args={[r * 0.62, r * 0.3, 0.012]} />
              <meshStandardMaterial color="#2a3753" metalness={0.6} roughness={0.45} />
            </mesh>
          </group>
        ))}
        <mesh rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[r * 0.22, r * 0.22, 0.05, 20]} />
          <meshStandardMaterial color="#0d1119" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.045]}>
        <circleGeometry args={[r * 0.95, 32]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.05} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function SiemServer() {
  const yRot = useRef<THREE.Group>(null!);
  const label = useRef<THREE.Mesh>(null!);
  const alertLight = useRef<THREE.PointLight>(null!);
  const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);
  const boost = useRef(0);
  const S = useRef({
    rows: Array.from({ length: 6 }, () => {
      const e = pick();
      return { lvl: e.lvl, text: e.text, time: nowTime() };
    }) as Row[],
    eps: 800,
    bars: Array.from({ length: 24 }, () => 0.25 + rnd() * 0.4),
    nextEv: 0.8,
    flash: 0,
    alerts: 3,
    agentAlert: new Float32Array(AGENTS.length),
    phase: new Float32Array(AGENTS.length),
    barT: 0,
    drawT: 0,
    dirty: true,
  });

  const scr = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 288;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { ctx: c.getContext("2d")!, tex };
  }, []);
  const lab = useMemo(labelTexture, []);
  const ledMats = useMemo(
    () => Array.from({ length: 8 }, () => new THREE.MeshBasicMaterial({ color: "#22ff99", toneMapped: false })),
    []
  );
  const lidEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(3.0, 0.04, 2.2)), []);
  const agentEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.5, 0.34, 0.4)), []);
  const agents = useMemo(
    () =>
      AGENTS.map((a) => {
        const pos = new THREE.Vector3(Math.cos(a.a) * R, -0.45, Math.sin(a.a) * R);
        const end = new THREE.Vector3(pos.x * 0.46, -0.35, pos.z * 0.46);
        const mid = pos.clone().lerp(end, 0.5);
        mid.y += 0.55;
        const curve = new THREE.CatmullRomCurve3([pos.clone(), mid, end]);
        return {
          ...a,
          pos,
          curve,
          tube: new THREE.TubeGeometry(curve, 32, 0.012, 6, false),
          col3: new THREE.Color(a.col),
          pulseMat: new THREE.MeshBasicMaterial({ color: a.col, toneMapped: false }),
          lightMat: new THREE.MeshBasicMaterial({ color: a.col, toneMapped: false }),
        };
      }),
    []
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const s = S.current;
    yRot.current.rotation.y = -0.4 + Math.sin(t * 0.35) * 0.28;

    // incoming events
    s.nextEv -= dt;
    if (s.nextEv <= 0) {
      s.nextEv = 0.45 + rnd() * 0.8;
      const e = pick();
      s.rows.unshift({ lvl: e.lvl, text: e.text, time: nowTime() });
      if (s.rows.length > 8) s.rows.pop();
      s.dirty = true;
      const ag = Math.floor(rnd() * AGENTS.length);
      if (e.lvl >= 9) {
        s.agentAlert[ag] = 1;
        s.flash = 1;
        s.alerts++;
      } else s.agentAlert[ag] = Math.max(s.agentAlert[ag], 0.3);
    }
    s.flash = Math.max(0, s.flash - dt * 0.7);
    boost.current = s.flash;
    for (let i = 0; i < AGENTS.length; i++) s.agentAlert[i] = Math.max(0, s.agentAlert[i] - dt * 0.5);

    s.barT += dt;
    if (s.barT > 0.4) {
      s.barT = 0;
      s.bars.push(0.25 + rnd() * 0.45 + s.flash * 0.3);
      s.bars.shift();
      s.dirty = true;
    }
    s.eps = 820 + Math.sin(t * 1.3) * 140 + s.flash * 420;
    s.drawT += dt;
    if (s.dirty || s.drawT > 0.25) {
      drawScreen(scr.ctx, s.rows, s.eps, s.bars, s.flash, s.alerts);
      scr.tex.needsUpdate = true;
      s.dirty = false;
      s.drawT = 0;
    }

    // drive LEDs: green blinking, red strobe on alert
    ledMats.forEach((m, i) => {
      if (s.flash > 0.05) {
        const k = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 18 + i));
        m.color.setRGB(k * 1.6, 0.05, 0.1);
      } else {
        const on = Math.sin(t * (4 + i * 1.7) + i * 3) * Math.sin(t * (1.3 + i * 0.4)) > 0.15;
        m.color.setRGB(on ? 0.15 : 0.02, on ? 1.4 : 0.12, on ? 0.5 : 0.06);
      }
    });
    alertLight.current.intensity = s.flash * (10 + Math.sin(t * 30) * 4);

    // agents: status light + data pulses toward the manager
    agents.forEach((a, i) => {
      const al = s.agentAlert[i];
      const hot = al > 0.5;
      a.pulseMat.color.copy(hot ? RED : a.col3);
      a.lightMat.color.copy(hot ? RED : a.col3);
      s.phase[i] += dt * (0.3 + i * 0.05) * (1 + al * 2);
      for (let k = 0; k < 2; k++) {
        const m = pulseRefs.current[i * 2 + k];
        if (!m) continue;
        a.curve.getPointAt((s.phase[i] + k * 0.5) % 1, m.position);
        m.scale.setScalar(1 + al * 1.3);
      }
    });

    // label always faces the camera
    const L = label.current;
    L.parent!.getWorldQuaternion(_q);
    _q.invert().multiply(state.camera.quaternion);
    L.quaternion.copy(_q);
  });

  const shell = <meshStandardMaterial color="#121b2c" metalness={0.85} roughness={0.38} />;
  const dark = <meshStandardMaterial color="#0a0f19" metalness={0.7} roughness={0.45} />;

  return (
    <group scale={0.75}>
      <mesh ref={label} position={[0, 2.4, 0]}>
        <planeGeometry args={[2.6, 0.76]} />
        <meshBasicMaterial map={lab} transparent depthWrite={false} toneMapped={false} />
      </mesh>

      <group rotation-x={0.6}>
        <group ref={yRot}>
          <pointLight position={[0, 2, 2]} intensity={9} color="#22d3ee" distance={9} />
          <pointLight ref={alertLight} position={[0, 0.6, 1.8]} intensity={0} color="#ff2d55" distance={7} />

          {/* floor */}
          <mesh position={[0, -0.68, 0]}>
            <cylinderGeometry args={[4.3, 4.4, 0.1, 64]} />
            <meshStandardMaterial color="#070d18" metalness={0.7} roughness={0.45} />
          </mesh>
          <mesh rotation-x={Math.PI / 2} position={[0, -0.62, 0]}>
            <torusGeometry args={[4.32, 0.03, 8, 128]} />
            <meshBasicMaterial color="#22d3ee" />
          </mesh>
          {[1.9, 3.0].map((r) => (
            <mesh key={r} rotation-x={-Math.PI / 2} position={[0, -0.625, 0]}>
              <ringGeometry args={[r - 0.015, r + 0.015, 96]} />
              <meshBasicMaterial color="#0e7490" transparent opacity={0.5} />
            </mesh>
          ))}

          {/* chassis shell */}
          <mesh position={[0, -0.56, 0]}><boxGeometry args={[3.0, 0.08, 2.2]} />{shell}</mesh>
          {[-1.47, 1.47].map((x) => (
            <mesh key={x} position={[x, 0, 0]}><boxGeometry args={[0.06, 1.2, 2.2]} />{shell}</mesh>
          ))}
          <mesh position={[0, 0, -1.07]}><boxGeometry args={[3.0, 1.2, 0.06]} />{shell}</mesh>
          <mesh position={[0, 0, 1.12]}><boxGeometry args={[3.0, 1.2, 0.08]} />{shell}</mesh>
          {[[-1.3, 0.95], [1.3, 0.95], [-1.3, -0.95], [1.3, -0.95]].map(([x, z]) => (
            <mesh key={`${x}${z}`} position={[x, -0.615, z]}>
              <boxGeometry args={[0.25, 0.03, 0.25]} />
              <meshStandardMaterial color="#05070a" />
            </mesh>
          ))}
          {[0.25, 0.1, -0.05, -0.2].map((y) => (
            <mesh key={y} position={[1.505, y, 0]}>
              <boxGeometry args={[0.01, 0.04, 1.5]} />
              <meshBasicMaterial color="#03060c" />
            </mesh>
          ))}

          {/* glass lid */}
          <mesh position={[0, 0.6, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[3.0, 2.2]} />
            <meshPhysicalMaterial color="#9fdcff" transparent opacity={0.1} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <lineSegments position={[0, 0.6, 0]} geometry={lidEdges}>
            <lineBasicMaterial color="#22d3ee" transparent opacity={0.8} />
          </lineSegments>

          {/* interior */}
          <mesh position={[0, -0.5, 0]}>
            <boxGeometry args={[2.9, 0.03, 2.05]} />
            <meshStandardMaterial color="#0a1f1a" roughness={0.6} />
          </mesh>
          {[-1.05, -0.35, 0.35, 1.05].map((x, i) => (
            <group key={x} position={[x, 0, 0.62]}>
              <mesh position={[0, -0.25, 0]}>
                <boxGeometry args={[0.64, 0.5, 0.64]} />
                {dark}
              </mesh>
              <group position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
                <Fan r={0.27} speed={19 + i * 2} boost={boost} />
              </group>
            </group>
          ))}
          {[-0.7, 0.7].map((x) => (
            <group key={x} position={[x, -0.3, -0.2]}>
              <mesh>
                <boxGeometry args={[0.6, 0.14, 0.6]} />
                <meshStandardMaterial color="#2a3345" metalness={0.8} roughness={0.35} />
              </mesh>
              {Array.from({ length: 9 }, (_, k) => (
                <mesh key={k} position={[0, 0.2, -0.26 + k * 0.065]}>
                  <boxGeometry args={[0.58, 0.3, 0.018]} />
                  <meshStandardMaterial color="#8b97ad" metalness={0.9} roughness={0.3} />
                </mesh>
              ))}
            </group>
          ))}
          {[-1, 1].map((sx) =>
            [0, 1, 2, 3].map((k) => (
              <group key={`${sx}${k}`} position={[sx * (1.12 + k * 0.06), -0.33, -0.2]}>
                <mesh>
                  <boxGeometry args={[0.035, 0.32, 0.55]} />
                  <meshStandardMaterial color="#1b5e4a" roughness={0.5} />
                </mesh>
                <mesh position={[0, 0.165, 0]}>
                  <boxGeometry args={[0.03, 0.01, 0.5]} />
                  <meshBasicMaterial color="#22d3ee" toneMapped={false} />
                </mesh>
              </group>
            ))
          )}
          <mesh position={[0, -0.27, -0.78]}>
            <boxGeometry args={[1.2, 0.45, 0.5]} />
            <meshStandardMaterial color="#151c2b" metalness={0.8} roughness={0.4} />
          </mesh>
          <mesh position={[0.45, -0.27, -0.525]}>
            <boxGeometry args={[0.05, 0.05, 0.01]} />
            <meshBasicMaterial color="#34d399" toneMapped={false} />
          </mesh>

          {/* front panel: drive bays */}
          {[0, 1].map((r) =>
            [0, 1, 2, 3].map((c) => {
              const idx = r * 4 + c;
              return (
                <group key={idx} position={[-1.28 + c * 0.4, 0.2 - r * 0.38, 1.17]}>
                  <mesh>
                    <boxGeometry args={[0.34, 0.3, 0.03]} />
                    {dark}
                  </mesh>
                  <mesh position={[0, -0.1, 0.02]}>
                    <boxGeometry args={[0.2, 0.02, 0.015]} />
                    <meshStandardMaterial color="#3d4558" metalness={0.8} roughness={0.4} />
                  </mesh>
                  <mesh position={[0.13, 0.1, 0.022]} material={ledMats[idx]}>
                    <boxGeometry args={[0.04, 0.04, 0.01]} />
                  </mesh>
                </group>
              );
            })
          )}

          {/* front panel: Wazuh screen, power, vents */}
          <mesh position={[0.78, 0.18, 1.17]}>
            <boxGeometry args={[1.36, 0.79, 0.02]} />
            <meshStandardMaterial color="#05070c" metalness={0.8} roughness={0.4} />
          </mesh>
          <mesh position={[0.78, 0.18, 1.182]}>
            <planeGeometry args={[1.3, 0.73]} />
            <meshBasicMaterial map={scr.tex} toneMapped={false} />
          </mesh>
          <mesh position={[0.25, -0.4, 1.165]}>
            <torusGeometry args={[0.05, 0.01, 8, 24]} />
            <meshBasicMaterial color="#22d3ee" toneMapped={false} />
          </mesh>
          {[0.5, 0.64].map((x) => (
            <mesh key={x} position={[x, -0.4, 1.165]}>
              <boxGeometry args={[0.1, 0.04, 0.02]} />
              <meshBasicMaterial color="#03060c" />
            </mesh>
          ))}
          {[0, 1, 2, 3, 4].map((k) => (
            <mesh key={k} position={[1.05 + k * 0.08, -0.4, 1.165]}>
              <boxGeometry args={[0.02, 0.14, 0.02]} />
              <meshBasicMaterial color="#03060c" />
            </mesh>
          ))}

          {/* agents and their links */}
          {agents.map((a, i) => (
            <group key={a.name}>
              <mesh geometry={a.tube}>
                <meshBasicMaterial color={a.col} transparent opacity={0.45} />
              </mesh>
              {[0, 1].map((k) => (
                <mesh
                  key={k}
                  ref={(m) => {
                    pulseRefs.current[i * 2 + k] = m;
                  }}
                  material={a.pulseMat}
                >
                  <sphereGeometry args={[0.055, 10, 10]} />
                </mesh>
              ))}
              <group position={a.pos}>
                <mesh>
                  <boxGeometry args={[0.5, 0.34, 0.4]} />
                  <meshStandardMaterial color="#101a2e" metalness={0.6} roughness={0.45} />
                </mesh>
                <lineSegments geometry={agentEdges}>
                  <lineBasicMaterial color={a.col} />
                </lineSegments>
                <mesh position={[0, 0.22, 0]} material={a.lightMat}>
                  <sphereGeometry args={[0.05, 10, 10]} />
                </mesh>
                <mesh position={[0, 0.5, 0]}>
                  <cylinderGeometry args={[0.008, 0.008, 0.5, 6]} />
                  <meshBasicMaterial color={a.col} transparent opacity={0.5} />
                </mesh>
              </group>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}
