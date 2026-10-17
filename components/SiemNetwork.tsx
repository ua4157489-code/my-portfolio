"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const rnd = Math.random;
const sstep = THREE.MathUtils.smoothstep;
const EDGE = "#9ccfff";
const CYCLE = 10;
const RW = 0.9;
const RH = 3.0;
const RD = 0.8;
const RACK_X = [-1.5, -0.5, 0.5, 1.5];
const MGR = new THREE.Vector3(2.5, -0.55, -1.7);
const NP = 14;

const STREAMS = [
  { name: "aggressive scan", S: new THREE.Vector3(7.5, 2.6, -1.0), E: new THREE.Vector3(2.0, 1.6, 0.2), speed: 0.24, off: 0.0 },
  { name: "DDoS", S: new THREE.Vector3(7.5, 1.3, -1.6), E: new THREE.Vector3(2.0, 0.6, -0.1), speed: 0.3, off: 0.35 },
  { name: "Meterpreter", S: new THREE.Vector3(7.5, -0.6, 0.8), E: new THREE.Vector3(2.0, -0.4, 0.35), speed: 0.14, off: 0.6 },
  { name: "system intrusion", S: new THREE.Vector3(7.5, -1.5, 0.3), E: new THREE.Vector3(2.0, -1.2, 0.3), speed: 0.18, off: 0.15 },
];

const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _c = new THREE.Color();
const _o = new THREE.Object3D();
const RED = new THREE.Color("#ff6b81");
const CYAN = new THREE.Color("#5eead4");
const GREY = new THREE.Color("#475569");
const LEDC = new THREE.Color("#22d3ee");
const MG0 = new THREE.Color("#64748b");
const MG1 = new THREE.Color("#7dd3fc");

/* ---------- helpers ---------- */
function labelTex(title: string, sub: string | null, accent: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 150;
  const x = c.getContext("2d")!;
  x.fillStyle = "rgba(6,12,22,0.86)";
  x.fillRect(0, 0, 512, 150);
  x.fillStyle = accent;
  x.fillRect(0, 0, 8, 150);
  x.textAlign = "center";
  x.fillStyle = "#f1f5f9";
  x.font = "bold 50px ui-sans-serif, system-ui, sans-serif";
  x.fillText(title, 264, sub ? 66 : 92);
  if (sub) {
    x.font = "30px ui-monospace, monospace";
    x.fillStyle = accent;
    x.fillText(sub, 264, 118);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function glowTex() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.4, "rgba(255,255,255,0.25)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function lines(build: (seg: (a: number, b: number, c: number, d: number) => void, rect: (cx: number, cy: number, w: number, h: number) => void) => void, z: number) {
  const pts: number[] = [];
  const seg = (x1: number, y1: number, x2: number, y2: number) => {
    pts.push(x1, y1, z, x2, y2, z);
  };
  const rect = (cx: number, cy: number, w: number, h: number) => {
    seg(cx - w / 2, cy - h / 2, cx + w / 2, cy - h / 2);
    seg(cx + w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
    seg(cx + w / 2, cy + h / 2, cx - w / 2, cy + h / 2);
    seg(cx - w / 2, cy + h / 2, cx - w / 2, cy - h / 2);
  };
  build(seg, rect);
  return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
}

function rackDetail(seed: number) {
  return lines((seg, rect) => {
    for (let i = 0; i < 22; i++) {
      const y = -RH / 2 + 0.18 + i * ((RH - 0.36) / 21);
      seg(-RW / 2 + 0.16, y, RW / 2 - 0.08, y);
    }
    seg(-RW / 2 + 0.09, -RH / 2 + 0.08, -RW / 2 + 0.09, RH / 2 - 0.08);
    seg(RW / 2 - 0.05, -RH / 2 + 0.08, RW / 2 - 0.05, RH / 2 - 0.08);
    rect(0.05, -0.6 + (seed % 3) * 0.5, 0.55, 0.16);
    rect(0.05, 0.5 + (seed % 2) * 0.3, 0.55, 0.12);
    if (seed % 2 === 1) for (let i = 0; i < 12; i++) {
      const x = -RW / 2 + 0.2 + i * 0.045;
      seg(x, -1.3, x, -0.2);
    }
  }, RD / 2 + 0.003);
}

function doorLines() {
  return lines((seg, rect) => {
    rect(0, 0, 0.38, 1.4);
    for (let i = 0; i < 13; i++) {
      const y = -0.62 + i * 0.103;
      seg(-0.15, y, 0.15, y);
    }
  }, 0);
}

function MiniFan({ x, y, boost }: { x: number; y: number; boost: React.RefObject<number> }) {
  const spin = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    spin.current.rotation.z += dt * (6 + (boost.current ?? 0) * 22);
  });
  return (
    <group position={[x, y, -0.22]}>
      <mesh>
        <torusGeometry args={[0.15, 0.008, 6, 32]} />
        <meshBasicMaterial color={EDGE} />
      </mesh>
      <group ref={spin}>
        {Array.from({ length: 6 }, (_, b) => (
          <group key={b} rotation-z={(b / 6) * Math.PI * 2}>
            <mesh position={[0.075, 0, 0]} rotation-x={0.7}>
              <boxGeometry args={[0.1, 0.045, 0.004]} />
              <meshBasicMaterial color={EDGE} transparent opacity={0.8} />
            </mesh>
          </group>
        ))}
        <mesh>
          <circleGeometry args={[0.025, 12]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- the scene ---------- */
export default function SiemNetwork() {
  const root = useRef<THREE.Group>(null!);
  const labelMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const rackLabelMat = useRef<THREE.MeshBasicMaterial>(null!);
  const atkLabelMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const atk = useRef<THREE.InstancedMesh>(null!);
  const ripples = useRef<(THREE.Mesh | null)[]>([]);
  const rippleMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const arcMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const pulses = useRef<(THREE.Mesh | null)[]>([]);
  const ledMat = useRef<THREE.PointsMaterial>(null!);
  const mgrEdge = useRef<THREE.LineBasicMaterial>(null!);
  const mgrGlow = useRef<THREE.MeshBasicMaterial>(null!);
  const doorL = useRef<THREE.Group>(null!);
  const doorR = useRef<THREE.Group>(null!);
  const debrisRefs = useRef<(THREE.Group | null)[]>([]);
  const dust = useRef<THREE.Points>(null!);
  const boost = useRef(0);
  const watchedPrev = useRef(false);

  const L = useMemo(
    () => ({
      rack: [labelTex("Unwatched LAN", "no agents reporting", "#94a3b8"), labelTex("Monitored LAN", "4 agents reporting", "#34d399")],
      mgr: labelTex("Wazuh Manager", "SIEM · XDR", "#22d3ee"),
      atk: STREAMS.map((s) => [labelTex(s.name, null, "#ff6b81"), labelTex(s.name, "✓ detected", "#34d399")]),
    }),
    []
  );
  const glow = useMemo(glowTex, []);
  const rackEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(RW, RH, RD)), []);
  const details = useMemo(() => RACK_X.map((_, i) => rackDetail(i)), []);
  const door = useMemo(doorLines, []);
  const mgrEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.9, 1.5, 0.6)), []);
  const plank = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 0.08, 0.5)), []);
  const cube = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.4, 0.4, 0.4)), []);
  const ledGeo = useMemo(() => {
    const p: number[] = [];
    for (let i = 0; i < 10; i++) p.push(-RW / 2 + 0.05, -RH / 2 + 0.3 + i * 0.27, RD / 2 + 0.012);
    return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  }, []);
  const streaks = useMemo(() => {
    const p: number[] = [];
    for (let i = 0; i < 36; i++) {
      const x = -5 + rnd() * 13;
      const y = -3 + rnd() * 6;
      const z = -3.5 + rnd();
      const dx = 0.8 + rnd() * 1.2;
      p.push(x, y, z, x + dx, y - dx * 0.12, z);
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  }, []);
  const dustPos = useMemo(() => {
    const a = new Float32Array(140 * 3);
    for (let i = 0; i < 140; i++) {
      a[i * 3] = -4 + rnd() * 12;
      a[i * 3 + 1] = -3 + rnd() * 6;
      a[i * 3 + 2] = -3 + rnd() * 4;
    }
    return a;
  }, []);
  const debris = useMemo(
    () =>
      Array.from({ length: 9 }, () => ({
        p: [-3 + rnd() * 10, (rnd() - 0.5) * 5, -2 + rnd() * 3] as [number, number, number],
        s: 0.25 + rnd() * 0.35,
        isPlank: rnd() < 0.5,
        sp: 0.1 + rnd() * 0.2,
        r: [rnd(), rnd(), rnd()] as [number, number, number],
        ph: rnd() * 6,
      })),
    []
  );
  const arcs = useMemo(
    () =>
      RACK_X.map((x, i) => {
        const a = new THREE.Vector3(x, RH / 2, 0.1);
        const b = new THREE.Vector3(MGR.x - 0.2 + i * 0.13, MGR.y + 0.78, MGR.z);
        const mid = a.clone().lerp(b, 0.5);
        mid.y += 1.5 - i * 0.2;
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        return { curve, tube: new THREE.TubeGeometry(curve, 40, 0.007, 6, false) };
      }),
    []
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const lt = t % CYCLE;
    const m = sstep(lt, 5.5, 7.0) * (1 - sstep(lt, 12.6, 13.8));
    const watched = m > 0.5;
    boost.current = m;

    root.current.rotation.y = -0.45 + Math.sin(t * 0.3) * 0.06;
    root.current.getWorldQuaternion(_q);
    _q.invert().multiply(state.camera.quaternion);
    labelMeshes.current.forEach((l) => l && l.quaternion.copy(_q));

    if (watched !== watchedPrev.current) {
      watchedPrev.current = watched;
      rackLabelMat.current.map = L.rack[watched ? 1 : 0];
      atkLabelMats.current.forEach((mat, i) => {
        if (mat) mat.map = L.atk[i][watched ? 1 : 0];
      });
    }

    // rack LEDs
    ledMat.current.color.copy(GREY).lerp(LEDC, m);
    ledMat.current.opacity = 0.35 + m * 0.65 * (0.5 + 0.5 * Math.sin(t * 7));

    // manager: edges, glow, doors
    mgrEdge.current.color.copy(MG0).lerp(MG1, m);
    mgrGlow.current.opacity = m * 0.75;
    const open = 0.25 + 0.65 * m;
    doorL.current.rotation.y = -open;
    doorR.current.rotation.y = open;

    // arcs and event pulses
    arcMats.current.forEach((mat) => {
      if (mat) mat.opacity = 0.15 + 0.5 * m;
    });
    pulses.current.forEach((p, j) => {
      if (!p) return;
      const arc = arcs[j >> 1];
      arc.curve.getPoint((t * 0.35 + j * 0.37) % 1, p.position);
      p.visible = m > 0.05;
      p.scale.setScalar(Math.max(0.001, m));
    });

    // attack streams
    _c.copy(RED).lerp(CYAN, m);
    STREAMS.forEach((s, i) => {
      const head = (t * s.speed + s.off) % 1.35;
      for (let k = 0; k < NP; k++) {
        const u = head - k * 0.026;
        const vis = u >= 0 && u <= 1;
        _v.lerpVectors(s.S, s.E, vis ? u : 0);
        _v.y += Math.sin(u * 14 + t * 3 + i) * 0.03;
        _o.position.copy(_v);
        _o.scale.setScalar(vis ? 1 - (k / NP) * 0.85 : 0);
        _o.updateMatrix();
        atk.current.setMatrixAt(i * NP + k, _o.matrix);
        atk.current.setColorAt(i * NP + k, _c);
      }
      const rp = ripples.current[i];
      const rm = rippleMats.current[i];
      if (rp && rm) {
        if (head > 1) {
          const k = (head - 1) / 0.35;
          rp.visible = true;
          rp.scale.setScalar(1 + k * 4);
          rm.opacity = Math.max(0, 1 - k) * 0.8;
          rm.color.copy(_c);
        } else rp.visible = false;
      }
    });
    atk.current.instanceMatrix.needsUpdate = true;
    if (atk.current.instanceColor) atk.current.instanceColor.needsUpdate = true;

    // drifting debris and dust
    debrisRefs.current.forEach((g, i) => {
      if (!g) return;
      const d = debris[i];
      g.position.x -= dt * d.sp;
      if (g.position.x < -4.5) g.position.x = 8;
      g.position.y = d.p[1] + Math.sin(t * 0.4 + d.ph) * 0.15;
      g.rotation.x += dt * 0.3 * d.r[0];
      g.rotation.y += dt * 0.3 * d.r[1];
      g.rotation.z += dt * 0.3 * d.r[2];
    });
    const arr = dust.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < 140; i++) {
      arr[i * 3] -= dt * 0.12;
      if (arr[i * 3] < -4) arr[i * 3] = 8;
    }
    dust.current.geometry.attributes.position.needsUpdate = true;
  });

  const mid = (i: number) => STREAMS[i].S.clone().lerp(STREAMS[i].E, 0.5);

  return (
    <group scale={0.95}>
      <group ref={root}>
        <lineSegments geometry={streaks}>
          <lineBasicMaterial color={EDGE} transparent opacity={0.12} />
        </lineSegments>

        {/* racks */}
        {RACK_X.map((x, i) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh>
              <boxGeometry args={[RW, RH, RD]} />
              <meshBasicMaterial color="#0a1626" transparent opacity={0.65} />
            </mesh>
            <lineSegments geometry={rackEdges}>
              <lineBasicMaterial color={EDGE} transparent opacity={0.8} />
            </lineSegments>
            <lineSegments geometry={details[i]}>
              <lineBasicMaterial color={EDGE} transparent opacity={0.4} />
            </lineSegments>
            <points geometry={ledGeo}>
              {i === 0 ? (
                <pointsMaterial ref={ledMat} size={0.07} color="#475569" transparent opacity={0.4} depthWrite={false} sizeAttenuation />
              ) : (
                <pointsMaterial size={0.07} color="#22d3ee" transparent opacity={0} depthWrite={false} sizeAttenuation />
              )}
            </points>
          </group>
        ))}

        {/* Wazuh manager cabinet */}
        <group position={MGR}>
          <mesh position={[0, 0, -0.04]}>
            <planeGeometry args={[3.0, 3.0]} />
            <meshBasicMaterial ref={mgrGlow} map={glow} color="#22d3ee" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.9, 1.5, 0.6]} />
            <meshBasicMaterial color="#0a1626" transparent opacity={0.6} />
          </mesh>
          <lineSegments geometry={mgrEdges}>
            <lineBasicMaterial ref={mgrEdge} color="#64748b" transparent opacity={0.9} />
          </lineSegments>
          <lineSegments geometry={door} position={[-0.21, 0, -0.27]}>
            <lineBasicMaterial color={EDGE} transparent opacity={0.35} />
          </lineSegments>
          <lineSegments geometry={door} position={[0.21, 0, -0.27]}>
            <lineBasicMaterial color={EDGE} transparent opacity={0.35} />
          </lineSegments>
          <MiniFan x={-0.2} y={0.45} boost={boost} />
          <MiniFan x={0.2} y={0.45} boost={boost} />
          <group ref={doorL} position={[-0.45, 0, 0.3]}>
            <lineSegments geometry={door} position={[0.21, 0, 0]}>
              <lineBasicMaterial color={EDGE} transparent opacity={0.85} />
            </lineSegments>
          </group>
          <group ref={doorR} position={[0.45, 0, 0.3]}>
            <lineSegments geometry={door} position={[-0.21, 0, 0]}>
              <lineBasicMaterial color={EDGE} transparent opacity={0.85} />
            </lineSegments>
          </group>
        </group>

        {/* arcs rack -> manager */}
        {arcs.map((a, i) => (
          <mesh key={i} geometry={a.tube}>
            <meshBasicMaterial ref={(m) => { arcMats.current[i] = m; }} color="#7dd3fc" transparent opacity={0.15} depthWrite={false} />
          </mesh>
        ))}
        {Array.from({ length: arcs.length * 2 }, (_, j) => (
          <mesh key={j} ref={(m) => { pulses.current[j] = m; }} visible={false}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshBasicMaterial color="#a5f3fc" toneMapped={false} />
          </mesh>
        ))}

        {/* attacks */}
        <instancedMesh ref={atk} args={[undefined, undefined, STREAMS.length * NP]} frustumCulled={false}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </instancedMesh>
        {STREAMS.map((s, i) => (
          <mesh key={s.name} ref={(m) => { ripples.current[i] = m; }} position={s.E} rotation-y={Math.PI / 2} visible={false}>
            <ringGeometry args={[0.14, 0.18, 32]} />
            <meshBasicMaterial ref={(m) => { rippleMats.current[i] = m; }} color="#ff6b81" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* debris + dust */}
        {debris.map((d, i) => (
          <group key={i} ref={(g) => { debrisRefs.current[i] = g; }} position={d.p} scale={d.s}>
            <lineSegments geometry={d.isPlank ? plank : cube}>
              <lineBasicMaterial color={EDGE} transparent opacity={0.45} />
            </lineSegments>
          </group>
        ))}
        <points ref={dust} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[dustPos, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.04} color="#bfe3ff" transparent opacity={0.55} depthWrite={false} sizeAttenuation />
        </points>

        {/* labels (always face the camera) */}
        <mesh ref={(m) => { labelMeshes.current[0] = m; }} position={[0, 2.15, 0.4]} renderOrder={5}>
          <planeGeometry args={[1.7, 1.7 * 0.293]} />
          <meshBasicMaterial ref={rackLabelMat} map={L.rack[0]} transparent depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh ref={(m) => { labelMeshes.current[1] = m; }} position={[MGR.x, MGR.y + 1.25, MGR.z + 0.3]} renderOrder={5}>
          <planeGeometry args={[1.5, 1.5 * 0.293]} />
          <meshBasicMaterial map={L.mgr} transparent depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
        {STREAMS.map((s, i) => {
          const p = mid(i);
          return (
            <mesh key={s.name} ref={(m) => { labelMeshes.current[2 + i] = m; }} position={[p.x, p.y + 0.32, p.z]} renderOrder={5}>
              <planeGeometry args={[1.2, 1.2 * 0.293]} />
              <meshBasicMaterial ref={(m) => { atkLabelMats.current[i] = m; }} map={L.atk[i][0]} transparent depthTest={false} depthWrite={false} toneMapped={false} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
