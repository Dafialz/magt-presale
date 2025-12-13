import { Card } from "./Card";
import type { LangCode } from "../lib/i18n";
import { t } from "../lib/i18n";

export function TrustSection({ lang }: { lang: LangCode }) {
  const items = [
    { title: "🔒 Smart contract on TON", text: "Runs on The Open Network." },
    { title: "🔍 Open-source contract (GitHub)", text: "Code is available publicly." },
    { title: "📜 No mint after presale", text: "Supply rules are transparent." },
    { title: "🔑 Liquidity lock (TBA)", text: "Lock details will be published." },
  ];

  return (
    <Card>
      <div className="text-lg font-semibold">{t(lang, "trust_title")}</div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.map((it) => (
          <div
            key={it.title}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4"
          >
            <div className="text-sm font-semibold">{it.title}</div>
            <div className="mt-2 text-xs text-zinc-400">{it.text}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
