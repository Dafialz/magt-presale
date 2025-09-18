// components/Roadmap.tsx
"use client";

import React from "react";

type Item = { q: string; title: string; desc?: string; done?: boolean };

const items: Item[] = [
  { q: "Q1", title: "Пресейл MAGT", desc: "Старт рівнів 0–19, валідація попиту", done: true },
  { q: "Q2", title: "Лістинг на DEX", desc: "Запуск пулів ліквідності, початок торгів" },
  { q: "Q3", title: "Запуск продукту", desc: "Magic Time — перші модулі, партнерства" },
  { q: "Q4", title: "DAO / нові фічі", desc: "Говернанс, розширення екосистеми" },
];

export default function Roadmap() {
  return (
    <section id="roadmap" className="space-y-6">
      <h3 className="text-3xl font-extrabold">Дорожня карта</h3>

      <div className="card p-4">
        <ol className="grid gap-4">
          {items.map((it, i) => (
            <li key={i} className="grid gap-2">
              <div className="flex items-center gap-3">
                <span
                  className="badge"
                  style={{ minWidth: 56, justifyContent: "center", fontWeight: 700 }}
                >
                  {it.q}
                </span>
                <div className="text-lg font-semibold">
                  {it.title}{" "}
                  {it.done ? <span className="subtle text-sm">(завершено)</span> : null}
                </div>
              </div>
              {it.desc ? <div className="subtle text-sm" style={{ paddingLeft: 62 }}>{it.desc}</div> : null}
              {i < items.length - 1 ? (
                <div
                  className="border"
                  style={{
                    borderColor: "var(--border)",
                    opacity: 0.5,
                    marginLeft: 62,
                  }}
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
