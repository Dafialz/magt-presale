// components/Tokenomics.tsx
"use client";

import React from "react";

type Bucket = {
  key: string;
  label: string;
  percent: number; // 0..100
  note?: string;
};

type Props = {
  totalSupply?: number; // у MAGT (не nano), наприклад 10_000_000_000
  buckets?: Bucket[];
};

const defaultBuckets: Bucket[] = [
  { key: "presale",   label: "Пресейл",    percent: 38, note: "рівні 0–19" },
  { key: "liquidity", label: "Ліквідність", percent: 20, note: "DEX/ринок" },
  { key: "reserve",   label: "Резерв",      percent: 22, note: "стратегічні потреби" },
  { key: "team",      label: "Команда",     percent: 12, note: "вестинг" },
  { key: "mkt",       label: "Маркетинг",   percent: 8,  note: "партнерства/кампанії" },
];

function clampPct(n: number) {
  if (!isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
function sumPct(b: Bucket[]) {
  return b.reduce((s, x) => s + clampPct(x.percent), 0);
}
function formatInt(n: number) {
  return new Intl.NumberFormat("uk-UA").format(n);
}

export default function Tokenomics({
  totalSupply = 10_000_000_000,
  buckets = defaultBuckets,
}: Props) {
  const totalPct = sumPct(buckets);
  const normalized = buckets.map((b) => ({ ...b, percent: clampPct(b.percent) }));

  return (
    <section id="token" className="space-y-4">
      <h3 className="text-3xl font-extrabold">Токеноміка</h3>

      {/* Загальний обсяг */}
      <div className="grid md:grid-cols-4 gap-3 text-sm">
        <div className="p-3 rounded-lg border border-[var(--border)]/60">
          <div className="subtle text-xs">Всього</div>
          <div className="text-base font-semibold">{formatInt(totalSupply)} MAGT</div>
        </div>
        <div className="p-3 rounded-lg border border-[var(--border)]/60">
          <div className="subtle text-xs">Кількість пулів</div>
          <div className="text-base font-semibold">{normalized.length}</div>
        </div>
        <div className="p-3 rounded-lg border border-[var(--border)]/60">
          <div className="subtle text-xs">Сума відсотків</div>
          <div className="text-base font-semibold">{totalPct}%</div>
        </div>
        <div className="p-3 rounded-lg border border-[var(--border)]/60">
          <div className="subtle text-xs">Нотатка</div>
          <div className="text-base font-semibold">Вестинг/деталі TBA</div>
        </div>
      </div>

      {/* Стовпчикова «діаграма» */}
      <div className="card p-4">
        <div className="subtle text-xs pb-2">Розподіл, %</div>
        <div className="grid gap-3">
          {normalized.map((b) => (
            <div key={b.key} className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{b.label}</div>
                <div className="subtle text-sm">
                  {b.percent}% {b.note ? <span className="opacity-80">• {b.note}</span> : null}
                </div>
              </div>
              <div className="progress" aria-hidden>
                <span style={{ width: `${b.percent}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Підсумок */}
        <div className="subtle text-xs" style={{ marginTop: 10 }}>
          Разом: {totalPct}% (можна налаштувати у <code>buckets</code>).
          Якщо підсумок ≠ 100% — решта вважається нерозподіленою/резервною частиною.
        </div>
      </div>

      {/* Пояснення / дисклеймер */}
      <div className="notice">
        Остаточні пропорції, вестинг і локації пулів будуть підтверджені у Whitepaper та смартконтрактах.
      </div>
    </section>
  );
}
