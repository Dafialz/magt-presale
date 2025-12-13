import { Card } from "./Card";
import type { LangCode } from "../lib/i18n";
import { t } from "../lib/i18n";

export function Roadmap({ lang }: { lang: LangCode }) {
  const steps = [
    { q: "Q1", title: "Presale + Community" },
    { q: "Q2", title: "DEX Listing + Liquidity" },
    { q: "Q3", title: "Product launch" },
    { q: "Q4", title: "Ecosystem expansion" },
  ];

  return (
    <Card>
      <div className="text-lg font-semibold">{t(lang, "roadmap_title")}</div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {steps.map((s) => (
          <div
            key={s.q}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4"
          >
            <div className="text-xs text-zinc-400">{s.q}</div>
            <div className="mt-1 text-sm font-semibold">{s.title}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
