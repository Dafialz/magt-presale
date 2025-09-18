// components/ValueProps.tsx
"use client";

import React from "react";

const items = [
  {
    title: "Ончейн прозорість",
    text: "Усі транзакції відбуваються у мережі TON — без прихованих правил та ручного втручання.",
    icon: "🔗",
  },
  {
    title: "Справедлива ціна",
    text: "Система рівнів (0–19): що раніше купуєш — то вигідніший курс.",
    icon: "⚖️",
  },
  {
    title: "Миттєва доставка",
    text: "MAGT токени надсилаються одразу після підтвердження транзакції у твоєму Jetton Wallet.",
    icon: "⚡",
  },
  {
    title: "Реферальна програма",
    text: "Запроси друзів та отримуй 5% від їх внесків у вигляді бонусних MAGT.",
    icon: "🎁",
  },
];

export default function ValueProps() {
  return (
    <section id="why" className="space-y-6">
      <h3 className="text-3xl font-extrabold">Чому обирають Magic Time?</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((it, i) => (
          <div
            key={i}
            className="card p-4 flex flex-col gap-2 hover:translate-y-[-2px] transition-transform"
          >
            <div className="text-2xl">{it.icon}</div>
            <div className="font-semibold text-lg">{it.title}</div>
            <div className="subtle text-sm">{it.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
