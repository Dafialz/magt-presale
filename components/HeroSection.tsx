// components/HeroSection.tsx
"use client";

import React from "react";

type HeroSectionProps = {
  targetTon: number;       // 6_500_000
  raisedTon: number;       // поточна сума
  progressPct: number;     // 0..100
  actionLeft?: React.ReactNode;
  actionRight?: React.ReactNode;
  media?: React.ReactNode; // слот під зображення/анімацію праворуч
};

export default function HeroSection({
  targetTon,
  raisedTon,
  progressPct,
  actionLeft,
  actionRight,
  media,
}: HeroSectionProps) {
  const pct = Math.min(100, Math.max(0, progressPct));

  return (
    <section className="grid md:grid-cols-2 gap-8 items-center">
      <div className="space-y-5">
        <div className="badge">MAGIC TIME (MAGT) — Presale</div>
        <h2 className="hero-title">Купи MAGT на ранньому етапі</h2>
        <p className="subtle text-base">
          Прозорий ончейн-пресейл у мережі TON. Оплата: <b>TON</b>. Мінімальний внесок — <b>0.1 TON</b>.
        </p>

        <div className="flex gap-3">
          {actionLeft}
          {actionRight}
        </div>

        {/* Ціль + прогрес */}
        <div className="card" role="region" aria-labelledby="sale-progress">
          <div className="flex items-center justify-between pb-2">
            <span id="sale-progress" className="badge">
              Ціль: {targetTon.toLocaleString("uk-UA")} TON
            </span>
            <span className="subtle text-sm">
              Зібрано: <b>{raisedTon.toLocaleString("uk-UA")}</b> TON
            </span>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Number(pct.toFixed(2))}
          >
            <span style={{ width: `${pct}%` }} />
          </div>
          <div className="subtle text-xs" style={{ marginTop: 6 }}>
            {pct.toFixed(2)}% • {raisedTon.toLocaleString("uk-UA")} / {targetTon.toLocaleString("uk-UA")} TON
          </div>
        </div>
      </div>

      {media}
    </section>
  );
}
