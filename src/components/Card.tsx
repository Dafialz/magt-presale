import React from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 " + className}>
      {children}
    </div>
  );
}
