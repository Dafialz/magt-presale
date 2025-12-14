import React from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "group relative overflow-hidden rounded-3xl",
        "border border-white/10",
        "bg-black/45 p-6",
        "backdrop-blur-md",
        "shadow-[0_12px_50px_rgba(0,0,0,0.45)]",
        "transition-all duration-300",
        "hover:border-cyan-400/40",
        "hover:shadow-[0_20px_80px_rgba(80,180,255,0.25)]",
        className,
      ].join(" ")}
    >
      {/* ✨ NEON GLOW */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="
            absolute -top-24 -left-24 h-60 w-60 rounded-full
            bg-cyan-400/20 blur-3xl
            transition-opacity duration-300
            group-hover:opacity-100 opacity-70
          "
        />
        <div
          className="
            absolute -bottom-28 -right-28 h-72 w-72 rounded-full
            bg-purple-500/20 blur-3xl
            transition-opacity duration-300
            group-hover:opacity-100 opacity-70
          "
        />
      </div>

      {/* 🌫 GLASS GRADIENT */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20" />

      {/* 🎞 NOISE (grain) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-soft-light"
        style={{
          backgroundImage: `
            repeating-radial-gradient(circle at 0 0,
              rgba(255,255,255,0.15),
              rgba(255,255,255,0.15) 1px,
              transparent 1px,
              transparent 2px)
          `,
          backgroundSize: "4px 4px",
        }}
      />

      {/* CONTENT */}
      <div className="relative z-10">{children}</div>
    </section>
  );
}
