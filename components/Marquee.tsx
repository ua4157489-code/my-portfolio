import React from "react";

const Marquee = () => {
  const items = ["Security", "Next.js", "React", "TypeScript", "Penetration Testing", "Web Development"];

  return (
    <div className="overflow-hidden whitespace-nowrap py-4 bg-black border-y border-green-500/30">
      <div className="inline-block animate-marquee">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="mx-8 text-green-400 font-mono text-sm">
            {item} <span className="text-green-600">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
