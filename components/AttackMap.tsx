"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

// One background for the About page, and it tells the story of the job:
// a network of hosts is mapped (recon), its weak spots are marked (vulnerability assessment),
// a red-team attacker moves through it host by host (offensive security), and then the defenders'
// wave sweeps out from the SOC and fixes everything. Then it starts again.
// Everything is simulated: the hosts, the attack and the numbers are made up for the picture.

const CYCLE = 24;
const T = { scan0: 0.4, scan1: 6.0, vuln0: 6.5, vuln1: 10.7, comp0: 11.3, patch0: 18.0, patch1: 22.0, fade0: 22.6, fade1: 23.8 };

function rngOf(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/* ───────── the network ───────── */
// kind: 0 workstation, 1 server, 2 crown jewel (database), 3 attacker, 4 SOC
const SIZE = [0.075, 0.105, 0.15, 0.17, 0.17];

function buildNet() {
  const r = rngOf(2025);
  const centers: [number, number, number][] = [
    [-5.2, 0.6, 0.5], [-3.6, -1.4, -1.8], [-3.2, 1.6, 1.6], [-1.2, 0.2, -0.4], [-0.6, -1.8, 1.4],
    [0.8, 1.8, -1.2], [1.8, -0.6, 1.0], [3.4, 1.2, -0.4], [4.2, -1.2, 1.2], [5.4, 0.4, -1.0],
  ];
  const pos: THREE.Vector3[] = [];
  const kind: number[] = [];
  const cluster: number[] = [];
  centers.forEach((c, ci) => {
    const n = 8 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const a = r() * Math.PI * 2;
      const b = Math.acos(2 * r() - 1);
      const rad = 0.35 + r() * 0.6;
      pos.push(new THREE.Vector3(c[0] + Math.sin(b) * Math.cos(a) * rad, c[1] + Math.cos(b) * rad * 0.75, c[2] + Math.sin(b) * Math.sin(a) * rad));
      kind.push(r() < 0.22 ? 1 : 0);
      cluster.push(ci);
    }
  });
  const jewel = cluster.indexOf(centers.length - 1);
  kind[jewel] = 2;
  const attacker = pos.length;
  pos.push(new THREE.Vector3(-8.2, 0.2, 0.2));
  kind.push(3);
  cluster.push(-1);
  const soc = pos.length;
  pos.push(new THREE.Vector3(0.4, 3.4, -0.6));
  kind.push(4);
  cluster.push(-2);

  // links
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  const link = (a: number, b: number) => {
    if (a === b) return;
    const k = a < b ? a + "-" + b : b + "-" + a;
    if (seen.has(k)) return;
    seen.add(k);
    edges.push([a, b]);
  };
  const members = (ci: number) => pos.map((_, i) => i).filter((i) => cluster[i] === ci);
  for (let i = 0; i < pos.length; i++) {
    if (cluster[i] < 0) continue;
    members(cluster[i])
      .filter((j) => j !== i)
      .sort((a, b) => pos[i].distanceTo(pos[a]) - pos[i].distanceTo(pos[b]))
      .slice(0, 2)
      .forEach((j) => link(i, j));
  }
  const nearestPair = (ca: number, cb: number, count: number) => {
    const pairs: [number, number, number][] = [];
    members(ca).forEach((a) => members(cb).forEach((b) => pairs.push([a, b, pos[a].distanceTo(pos[b])])));
    pairs.sort((p, q) => p[2] - q[2]).slice(0, count).forEach(([a, b]) => link(a, b));
  };
  for (let ci = 0; ci < centers.length - 1; ci++) nearestPair(ci, ci + 1, 2);
  for (let a = 0; a < centers.length; a++) {
    for (let b = a + 2; b < centers.length; b++) {
      const d = new THREE.Vector3(...centers[a]).distanceTo(new THREE.Vector3(...centers[b]));
      if (d < 3.4) nearestPair(a, b, 1);
    }
  }
  members(0)
    .sort((a, b) => pos[attacker].distanceTo(pos[a]) - pos[attacker].distanceTo(pos[b]))
    .slice(0, 2)
    .forEach((j) => link(attacker, j));
  [3, 5, 7].forEach((ci) => {
    const near = members(ci).sort((a, b) => pos[soc].distanceTo(pos[a]) - pos[soc].distanceTo(pos[b]))[0];
    link(soc, near);
  });

  // the attack path: shortest way from the attacker to the database (the SOC links are not used)
  const adj: number[][] = pos.map(() => []);
  edges.forEach(([a, b]) => {
    if (a === soc || b === soc) return;
    adj[a].push(b);
    adj[b].push(a);
  });
  const prev = new Array(pos.length).fill(-1);
  const queue = [attacker];
  prev[attacker] = attacker;
  while (queue.length) {
    const u = queue.shift()!;
    if (u === jewel) break;
    adj[u].forEach((v) => {
      if (prev[v] < 0) {
        prev[v] = u;
        queue.push(v);
      }
    });
  }
  const route: number[] = [];
  for (let u = jewel; u !== attacker && u >= 0; u = prev[u]) route.unshift(u);
  route.unshift(attacker);

  // weak spots: everything on the attack path, plus some others
  const vuln = pos.map(() => false);
  route.slice(1).forEach((i) => (vuln[i] = true));
  const others = pos.map((_, i) => i).filter((i) => !vuln[i] && i !== attacker && i !== soc);
  for (let k = 0; k < 12; k++) vuln[others.splice(Math.floor(r() * others.length), 1)[0]] = true;

  // timings
  const discT = pos.map((p, i) => (i === attacker || i === soc ? 0 : T.scan0 + clamp01((p.x + 6.5) / 13) * (T.scan1 - T.scan0)));
  const vulnList = pos.map((_, i) => i).filter((i) => vuln[i]).sort((a, b) => pos[a].x - pos[b].x);
  const vulnT = pos.map(() => 1e9);
  vulnList.forEach((i, k) => (vulnT[i] = T.vuln0 + (k / Math.max(1, vulnList.length - 1)) * (T.vuln1 - T.vuln0)));
  const hop = Math.min(0.45, 5.4 / Math.max(1, route.length - 1));
  const compT = pos.map(() => 1e9);
  route.forEach((i, k) => (compT[i] = T.comp0 + k * hop));
  const patchT = pos.map((p, i) => (vuln[i] ? T.patch0 + Math.min(1, p.distanceTo(pos[soc]) / 10.5) * (T.patch1 - T.patch0) : 1e9));

  return { pos, kind, edges, vuln, route, attacker, soc, discT, vulnT, compT, patchT, hop };
}
type Net = ReturnType<typeof buildNet>;

/* ───────── shaders and textures ───────── */
const DOT_VERT = /* glsl */ `
  attribute vec3 aCol; attribute float aSz; attribute float aA;
  uniform float uScale; uniform float uPix;
  varying vec3 vCol; varying float vA;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSz * uScale / -mv.z, 1.5 * uPix, 44.0 * uPix);
    float depth = clamp((-mv.z - 6.0) / 10.0, 0.0, 1.0);
    vCol = aCol;
    vA = aA * mix(1.0, 0.5, depth);
  }`;
const DOT_FRAG = /* glsl */ `
  varying vec3 vCol; varying float vA;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = exp(-d * d * 16.0) + smoothstep(0.5, 0.2, d) * 0.12;
    gl_FragColor = vec4(vCol, a * vA);
  }`;
const SHELL_VERT = /* glsl */ `
  varying vec3 vN; varying vec3 vV;
  void main(){
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }`;
const SHELL_FRAG = /* glsl */ `
  uniform float uOp;
  varying vec3 vN; varying vec3 vV;
  void main(){
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
    gl_FragColor = vec4(vec3(0.25, 1.0, 0.6) * f * 1.4, f * uOp);
  }`;

function ringTexture() {
  const S = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const ctx = cv.getContext("2d")!;
  ctx.strokeStyle = "rgba(255,255,255,1)";
  ctx.lineWidth = 5;
  ctx.shadowColor = "rgba(255,255,255,1)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 14, 0, Math.PI * 2);
  ctx.stroke();
  return new THREE.CanvasTexture(cv);
}
function scanTexture() {
  const W = 128, H = 256;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, "rgba(34,211,238,0)");
  g.addColorStop(0.85, "rgba(34,211,238,0.25)");
  g.addColorStop(1, "rgba(180,250,255,0.95)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(120,235,255,0.35)";
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 16) {
    ctx.beginPath();
    ctx.moveTo(W * 0.4, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  return new THREE.CanvasTexture(cv);
}

/* ───────── the scene ───────── */
type Ring = { sprite: THREE.Sprite; t0: number };
const CYAN = [0.2, 0.85, 1.0];
const AMBER = [1.0, 0.72, 0.2];
const RED = [1.0, 0.22, 0.3];
const GREEN = [0.3, 1.0, 0.55];

function Scene({ hud }: { hud: RefObject<HTMLPreElement | null> }) {
  const net = useMemo<Net>(() => buildNet(), []);
  const N = net.pos.length;
  const rootRef = useRef<THREE.Group>(null!);
  const scanRef = useRef<THREE.Mesh>(null!);
  const scanMat = useRef<THREE.MeshBasicMaterial>(null!);
  const shellRef = useRef<THREE.Mesh>(null!);
  const shellU = useMemo(() => ({ uOp: { value: 0 } }), []);
  const time = useRef(9.5); // starts in the middle of the story
  const prevC = useRef(9.5);
  const hudAt = useRef(0);
  const ptr = useRef({ x: 0, y: 0 });
  const scrollP = useRef(0);

  // node points
  const nodeData = useMemo(() => {
    const pos = new Float32Array(N * 3);
    net.pos.forEach((p, i) => pos.set([p.x, p.y, p.z], i * 3));
    const col = new Float32Array(N * 3);
    const sz = new Float32Array(N);
    const al = new Float32Array(N);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aCol", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSz", new THREE.BufferAttribute(sz, 1));
    g.setAttribute("aA", new THREE.BufferAttribute(al, 1));
    return { g, col, sz, al };
  }, [net, N]);

  // links
  const edgeData = useMemo(() => {
    const pos = new Float32Array(net.edges.length * 6);
    net.edges.forEach(([a, b], e) => {
      pos.set([net.pos[a].x, net.pos[a].y, net.pos[a].z, net.pos[b].x, net.pos[b].y, net.pos[b].z], e * 6);
    });
    const col = new Float32Array(net.edges.length * 6);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { g, col };
  }, [net]);

  // the attack packet and its trail
  const TRAIL = 14;
  const packet = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    g.setAttribute("aCol", new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    g.setAttribute("aSz", new THREE.BufferAttribute(new Float32Array(TRAIL), 1));
    g.setAttribute("aA", new THREE.BufferAttribute(new Float32Array(TRAIL), 1));
    return g;
  }, []);

  const dotU = useMemo(() => ({ uScale: { value: 1000 }, uPix: { value: 1 } }), []);
  const dotMat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: DOT_VERT, fragmentShader: DOT_FRAG, uniforms: dotU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    [dotU]
  );
  const edgeMat = useMemo(
    () => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    []
  );

  // ping rings that pop out of a host when something happens to it
  const ringTex = useMemo(() => ringTexture(), []);
  const scanTex = useMemo(() => scanTexture(), []);
  const rings = useMemo<Ring[]>(
    () =>
      Array.from({ length: 18 }, () => {
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
        sprite.scale.set(0.1, 0.1, 1);
        return { sprite, t0: -99 };
      }),
    [ringTex]
  );
  const spawn = (p: THREE.Vector3, color: number[], t: number) => {
    const ring = rings.reduce((a, b) => (a.t0 < b.t0 ? a : b));
    ring.t0 = t;
    ring.sprite.position.copy(p);
    (ring.sprite.material as THREE.SpriteMaterial).color.setRGB(color[0], color[1], color[2]);
  };

  // floating dust for depth
  const dust = useMemo(() => {
    const r = rngOf(3);
    const n = typeof window !== "undefined" && window.innerWidth < 768 ? 120 : 320;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) a.set([(r() - 0.5) * 22, (r() - 0.5) * 11, (r() - 0.5) * 12], i * 3);
    return a;
  }, []);
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(40, 40, 0x0e7490, 0x0a2433);
    const m = g.material as THREE.LineBasicMaterial;
    m.transparent = true;
    m.opacity = 0.35;
    return g;
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      ptr.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollP.current = max > 0 ? clamp01(window.scrollY / max) : 0;
    };
    onScroll();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useFrame((state, dt) => {
    const calm = document.documentElement.dataset.motion === "calm";
    if (!calm) time.current += dt;
    const t = time.current;
    const c = t % CYCLE;
    const wrapped = c < prevC.current;
    const pix = state.gl.getPixelRatio();
    const cam = state.camera as THREE.PerspectiveCamera;
    dotU.uScale.value = (state.size.height * pix) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
    dotU.uPix.value = pix;

    const reset = smooth(T.fade0, T.fade1, c);
    let found = 0, vulns = 0, comps = 0, patched = 0;

    for (let i = 0; i < N; i++) {
      const kd = net.kind[i];
      let [r, g, b] = CYAN;
      let size = SIZE[kd];
      let a = mix(0.1, 1, clamp01((c - net.discT[i]) / 0.4));
      if (kd === 3) {
        [r, g, b] = RED;
        a = 1;
      } else if (kd === 4) {
        [r, g, b] = GREEN;
        a = 1;
      } else {
        if (c >= net.discT[i]) found++;
        if (net.vuln[i] && c >= net.vulnT[i]) {
          const k = clamp01((c - net.vulnT[i]) / 0.5);
          r = mix(r, AMBER[0], k); g = mix(g, AMBER[1], k); b = mix(b, AMBER[2], k);
          size *= 1 + 0.25 * k * (0.5 + 0.5 * Math.sin(c * 6 + i));
          vulns++;
        }
        if (c >= net.compT[i] && net.compT[i] < 1e8) {
          const k = clamp01((c - net.compT[i]) / 0.3);
          r = mix(r, RED[0], k); g = mix(g, RED[1], k); b = mix(b, RED[2], k);
          size *= 1 + 0.5 * k * (0.6 + 0.4 * Math.sin(c * 9 + i));
          if (c < net.patchT[i]) comps++;
        }
        if (net.vuln[i] && c >= net.patchT[i]) {
          const k = clamp01((c - net.patchT[i]) / 0.6);
          r = mix(r, GREEN[0], k); g = mix(g, GREEN[1], k); b = mix(b, GREEN[2], k);
          patched++;
        }
      }
      if (kd !== 3 && kd !== 4) {
        r = mix(r, CYAN[0], reset); g = mix(g, CYAN[1], reset); b = mix(b, CYAN[2], reset);
        a = mix(a, 0.1, reset);
        size = mix(size, SIZE[kd], reset);
      }
      nodeData.col.set([r, g, b], i * 3);
      nodeData.sz[i] = size;
      nodeData.al[i] = a;

      // pings when something happens to a host
      if (!wrapped && kd < 3) {
        const p = prevC.current;
        const hit = (when: number) => p < when && c >= when;
        if (hit(net.discT[i])) spawn(net.pos[i], CYAN, t);
        else if (net.vuln[i] && hit(net.vulnT[i])) spawn(net.pos[i], AMBER, t);
        else if (hit(net.compT[i])) spawn(net.pos[i], RED, t);
        else if (net.vuln[i] && hit(net.patchT[i])) spawn(net.pos[i], GREEN, t);
      }
    }
    (nodeData.g.attributes.aCol as THREE.BufferAttribute).needsUpdate = true;
    (nodeData.g.attributes.aSz as THREE.BufferAttribute).needsUpdate = true;
    (nodeData.g.attributes.aA as THREE.BufferAttribute).needsUpdate = true;

    // links take the colour of the hosts they join
    net.edges.forEach(([a, b], e) => {
      const aa = nodeData.al[a], ab = nodeData.al[b];
      const k = 0.14 + 0.38 * Math.min(aa, ab);
      const ra = nodeData.col[a * 3], ga = nodeData.col[a * 3 + 1], ba = nodeData.col[a * 3 + 2];
      const rb = nodeData.col[b * 3], gb = nodeData.col[b * 3 + 1], bb = nodeData.col[b * 3 + 2];
      const hot = ga < 0.4 && gb < 0.4 ? 1.9 : 1;
      edgeData.col.set([ra * k * hot, ga * k * hot, ba * k * hot, rb * k * hot, gb * k * hot, bb * k * hot], e * 6);
    });
    (edgeData.g.attributes.color as THREE.BufferAttribute).needsUpdate = true;

    // the attack packet runs along the route
    const f = (c - T.comp0) / net.hop;
    const pp = packet.attributes.position as THREE.BufferAttribute;
    const pc = packet.attributes.aCol as THREE.BufferAttribute;
    const ps = packet.attributes.aSz as THREE.BufferAttribute;
    const pa = packet.attributes.aA as THREE.BufferAttribute;
    const last = net.route.length - 1;
    for (let k = 0; k < TRAIL; k++) {
      const fk = f - k * 0.18;
      const on = fk >= 0 && fk <= last + 0.4 && c < T.patch0 && reset < 0.5;
      const i0 = Math.min(last, Math.max(0, Math.floor(fk)));
      const i1 = Math.min(last, i0 + 1);
      const u = clamp01(fk - i0);
      const A = net.pos[net.route[i0]], B = net.pos[net.route[i1]];
      pp.setXYZ(k, mix(A.x, B.x, u), mix(A.y, B.y, u), mix(A.z, B.z, u));
      pc.setXYZ(k, 1, 0.35 + 0.4 * (1 - k / TRAIL), 0.3);
      ps.setX(k, on ? 0.2 * (1 - k / TRAIL) + 0.05 : 0);
      pa.setX(k, on ? 1 - k / TRAIL : 0);
    }
    pp.needsUpdate = pc.needsUpdate = ps.needsUpdate = pa.needsUpdate = true;

    // the scanning plane sweeps across during recon
    const sw = (c - T.scan0) / (T.scan1 - T.scan0);
    const scanOn = sw > -0.03 && sw < 1.06;
    scanRef.current.visible = scanOn;
    scanRef.current.position.x = mix(-7.2, 6.8, clamp01(sw));
    scanMat.current.opacity = scanOn ? 0.55 : 0;

    // the defenders' wave grows out of the SOC
    const pr = (c - T.patch0) / (T.patch1 - T.patch0);
    const shellOn = pr > 0 && pr < 1.05;
    shellRef.current.visible = shellOn;
    shellRef.current.position.copy(net.pos[net.soc]);
    shellRef.current.scale.setScalar(Math.max(0.01, clamp01(pr) * 10.8));
    shellU.uOp.value = shellOn ? (1 - clamp01(pr)) * 0.9 : 0;

    // rings
    rings.forEach((rg) => {
      const age = (t - rg.t0) / 0.9;
      const m = rg.sprite.material as THREE.SpriteMaterial;
      if (age >= 0 && age < 1) {
        const s = 0.18 + age * 1.5;
        rg.sprite.scale.set(s, s, 1);
        m.opacity = (1 - age) * 0.8;
      } else m.opacity = 0;
    });

    // the whole network turns slowly and leans toward the mouse
    const g = rootRef.current;
    g.rotation.y = Math.sin(t * 0.07) * 0.5 + scrollP.current * 0.9 + ptr.current.x * 0.2;
    g.rotation.x = 0.12 + ptr.current.y * 0.1;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, ptr.current.x * 0.4, 2, dt);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, 0.6 + ptr.current.y * 0.3, 2, dt);
    cam.lookAt(0, 0.2, 0);

    // the small status panel
    if (hud.current && state.clock.elapsedTime - hudAt.current > 0.2) {
      hudAt.current = state.clock.elapsedTime;
      const phase = c < T.scan1 + 0.2 ? "1/4  RECON     mapping every host" : c < T.comp0 - 0.3 ? "2/4  ASSESS    finding weak spots" : c < T.patch0 ? "3/4  EXPLOIT   red team moves through" : c < T.fade0 ? "4/4  DEFEND    SOC patches the gaps" : "     RESET";
      hud.current.textContent = [
        "RED TEAM SIMULATION (made-up data)",
        "PHASE " + phase,
        "HOSTS FOUND  " + found + "/" + (N - 2),
        "WEAK SPOTS   " + vulns,
        "COMPROMISED  " + comps,
        "PATCHED      " + patched,
      ].join("\n");
    }
    prevC.current = c;
  });

  return (
    <>
      <fog attach="fog" args={["#050912", 10, 26]} />
      <primitive object={grid} position={[0, -3.4, 0]} />
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.03} color="#6fb8d8" transparent opacity={0.35} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <group ref={rootRef}>
        <lineSegments frustumCulled={false} geometry={edgeData.g} material={edgeMat} />
        <points frustumCulled={false} geometry={nodeData.g} material={dotMat} />
        <points frustumCulled={false} geometry={packet} material={dotMat} />
        {rings.map((rg, i) => (
          <primitive key={i} object={rg.sprite} />
        ))}
        <mesh ref={scanRef} rotation={[0, Math.PI / 2, 0]} visible={false}>
          <planeGeometry args={[7, 6]} />
          <meshBasicMaterial ref={scanMat} map={scanTex} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh ref={shellRef} visible={false}>
          <sphereGeometry args={[1, 40, 28]} />
          <shaderMaterial vertexShader={SHELL_VERT} fragmentShader={SHELL_FRAG} uniforms={shellU} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </>
  );
}

export default function AttackMap() {
  const hud = useRef<HTMLPreElement>(null);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_30%_20%,#0a1630_0%,#02050c_70%)]"
    >
      <Canvas camera={{ position: [0, 0.6, 11], fov: 50 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <Scene hud={hud} />
      </Canvas>
      {/* dark edges keep the text easy to read */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />
      <pre
        ref={hud}
        className="absolute bottom-5 left-5 hidden whitespace-pre rounded-lg border border-white/10 bg-black/55 px-4 py-3 font-mono text-[11px] leading-5 text-cyan-100 backdrop-blur-sm md:block"
      />
    </div>
  );
}
