import React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/45 p-6 backdrop-blur-md shadow-[0_12px_50px_rgba(0,0,0,0.45)]">
      {/* cosmic glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent" />
      </div>

      {/* content */}
      <div className="relative">{children}</div>
    </section>
  );
}
