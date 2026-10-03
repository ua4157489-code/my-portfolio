"use client";

import { useEffect, useRef } from "react";

type Shard = {
  v: [number, number][]; // vertices relative to the shard's own center
  cx: number;
  cy: number; // shard center relative to the object center (unit radius = 1)
  dx: number;
  dy: number; // direction it flies when breaking
  speed: number;
  spin: number;
  delay: number;
  shade: number;
  tint: number;
  px: number;
  py: number;
  e: number; // live position and break amount, filled in every frame
};

const RINGS = 6; // more rings = more, smaller shards
const SECT = 24;
const PAL = [
  [0, 255, 156],
  [0, 200, 255],
  [255, 45, 111],
];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (x: number, a: number, b: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// deterministic pseudo-random so the cracks are the same every load
function hash(a: number, b: number) {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// the outline: a hexagon (return 1 here instead for a perfect circle)
function shapeR(theta: number) {
  const seg = Math.PI / 3;
  const a = (((theta % seg) + seg) % seg) - seg / 2;
  return Math.cos(seg / 2) / Math.cos(a);
}

function buildShards(): Shard[] {
  const pts: [number, number][][] = [];
  for (let k = 0; k <= RINGS; k++) {
    const row: [number, number][] = [];
    if (k === 0) {
      row.push([0, 0]);
    } else {
      for (let j = 0; j < SECT; j++) {
        const inner = k < RINGS; // keep the outer edge clean
        const th = (j / SECT) * Math.PI * 2 + (inner ? (hash(k, j) - 0.5) * 0.12 : 0);
        const rr = k / RINGS + (inner ? (hash(j, k + 7) - 0.5) * 0.07 : 0);
        const r = rr * shapeR(th);
        row.push([Math.cos(th) * r, Math.sin(th) * r]);
      }
    }
    pts.push(row);
  }

  const tris: [number, number][][] = [];
  for (let j = 0; j < SECT; j++) {
    const j2 = (j + 1) % SECT;
    tris.push([pts[0][0], pts[1][j], pts[1][j2]]);
    for (let k = 1; k < RINGS; k++) {
      const a = pts[k][j];
      const b = pts[k][j2];
      const c = pts[k + 1][j2];
      const d = pts[k + 1][j];
      tris.push([a, b, c], [a, c, d]);
    }
  }

  return tris.map((t, i) => {
    const cx = (t[0][0] + t[1][0] + t[2][0]) / 3;
    const cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
    const len = Math.hypot(cx, cy) || 1;
    let dx = cx / len + (hash(i, 1) - 0.5) * 0.9;
    let dy = cy / len + (hash(i, 2) - 0.5) * 0.9;
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl;
    dy /= dl;
    return {
      v: t.map(([x, y]) => [x - cx, y - cy] as [number, number]),
      cx,
      cy,
      dx,
      dy,
      speed: 0.5 + hash(i, 3) * 1.3,
      spin: (hash(i, 4) - 0.5) * 6,
      delay: Math.min(len, 1) * 0.25 + hash(i, 8) * 0.05, // center cracks first
      shade: 0.04 + hash(i, 5) * 0.1,
      tint: hash(i, 6),
      px: 0,
      py: 0,
      e: 0,
    };
  });
}

function shardColor(tint: number, e: number) {
  const base = tint < 0.65 ? PAL[0] : tint < 0.9 ? PAL[1] : PAL[2];
  const m = e * 0.6; // shifts toward hot pink as it breaks
  return [
    Math.round(base[0] + (PAL[2][0] - base[0]) * m),
    Math.round(base[1] + (PAL[2][1] - base[1]) * m),
    Math.round(base[2] + (PAL[2][2] - base[2]) * m),
  ];
}

export default function Shatter2D() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const shards = buildShards();
    const sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    let w = 0;
    let h = 0;
    let dpr = 1;
    let b = 0; // current break amount, 0 = whole, 1 = fully shattered
    let last = performance.now();
    let raf = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      mouse.tx = e.clientX / w - 0.5;
      mouse.ty = e.clientY / h - 0.5;
    };
    window.addEventListener("pointermove", onMove);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;

      // scroll -> break amount (smoothed)
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const s = max > 0 ? window.scrollY / max : 0;
      const target = smooth(s, 0.03, 0.75);
      const prev = b;
      b += (target - b) * (1 - Math.exp(-3.5 * dt));
      const speed = Math.abs(b - prev) / Math.max(dt, 0.001);

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      const R = Math.min(w, h) * 0.34;
      const ox = (w > 900 ? w * 0.72 : w * 0.5) + mouse.x * 30;
      const oy = h * 0.5 + mouse.y * 20;
      const rot = reduce ? 0 : t * 0.08 + b * 0.6;
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // soft glow behind the object
      const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, R * 1.4);
      glow.addColorStop(0, `rgba(0,255,156,${0.1 * (1 - b * 0.7)})`);
      glow.addColorStop(1, "rgba(0,255,156,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // shockwave rings that expand as it breaks
      if (b > 0.02) {
        for (let i = 0; i < 2; i++) {
          const rr = R * (0.5 + b * (1.8 + i * 0.9));
          ctx.beginPath();
          ctx.arc(ox, oy, rr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0,255,156,${0.3 * (1 - b) * (1 - i * 0.4)})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // the shards
      for (const sh of shards) {
        const k = clamp((b - sh.delay) / 0.7, 0, 1);
        const e = 1 - Math.pow(1 - k, 3);
        const rcx = (sh.cx * cosR - sh.cy * sinR) * R;
        const rcy = (sh.cx * sinR + sh.cy * cosR) * R;
        const dist = e * sh.speed * R * 1.6;
        const px = ox + rcx + sh.dx * dist;
        const py = oy + rcy + sh.dy * dist + e * e * R * 0.35; // slight fall
        const ang = rot + e * sh.spin * 1.5;
        const sc = 1 - e * 0.35;
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        sh.px = px;
        sh.py = py;
        sh.e = e;

        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const vx = sh.v[i][0] * R * sc;
          const vy = sh.v[i][1] * R * sc;
          const X = px + vx * ca - vy * sa;
          const Y = py + vx * sa + vy * ca;
          if (i === 0) ctx.moveTo(X, Y);
          else ctx.lineTo(X, Y);
        }
        ctx.closePath();

        const alpha = 1 - e * 0.7;
        const [r, g, bl] = shardColor(sh.tint, e);
        ctx.fillStyle = `rgba(${r},${g},${bl},${(sh.shade * alpha).toFixed(3)})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${r},${g},${bl},${(0.55 * alpha).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // sparks fly off while you are actively scrolling
      if (!reduce && speed > 0.05 && sparks.length < 150) {
        const n = Math.min(6, Math.ceil(speed * 40));
        for (let i = 0; i < n; i++) {
          const sh = shards[Math.floor(Math.random() * shards.length)];
          if (sh.e > 0.02 && sh.e < 0.9) {
            sparks.push({
              x: sh.px,
              y: sh.py,
              vx: sh.dx * (60 + Math.random() * 200) + (Math.random() - 0.5) * 80,
              vy: sh.dy * (60 + Math.random() * 200) + (Math.random() - 0.5) * 80,
              life: 1,
            });
          }
        }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life -= dt * 1.8;
        if (p.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
        ctx.strokeStyle = `rgba(255,255,255,${(p.life * 0.8).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-[1] h-full w-full"
    />
  );
}
