// components/HeaderBar.tsx
"use client";

import Image from "next/image";
import React from "react";

/**
 * Липка шапка з логотипом зліва і будь-яким контентом справа (children).
 * Використовує клас .sticky-header з globals.css.
 */
export default function HeaderBar({ children }: { children?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between sticky-header">
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="MAGT" width={28} height={28} priority />
        <div className="h1">Magic Time</div>
      </div>
      {children}
    </header>
  );
}
