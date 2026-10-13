"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

export default function DepthBackdrop() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const gridY = useTransform(scrollY, (v) => `${(v * 0.35) % 64}px`);
  const orbA = useTransform(scrollY, [0, 4000], [0, -500]);
  const orbB = useTransform(scrollY, [0, 4000], [0, -150]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      <motion.div
        style={{ y: reduce ? 0 : orbA }}
        className="absolute -left-40 top-1/4 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(0,255,156,0.5),transparent_65%)] blur-2xl"
      />
      <motion.div
        style={{ y: reduce ? 0 : orbB }}
        className="absolute -right-40 top-2/3 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(0,200,255,0.45),transparent_65%)] blur-2xl"
      />

      {/* perspective grid floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55%]"
        style={{
          perspective: "500px",
          maskImage: "linear-gradient(to top, black 10%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to top, black 10%, transparent 95%)",
        }}
      >
        <motion.div
          style={{
            backgroundPositionY: reduce ? 0 : gridY,
            transform: "rotateX(62deg)",
            transformOrigin: "50% 100%",
            backgroundImage:
              "linear-gradient(rgba(0,255,156,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,156,0.7) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
          className="absolute -inset-x-1/2 bottom-0 h-[200%]"
        />
      </div>
    </div>
  );
}
