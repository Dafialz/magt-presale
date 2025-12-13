import { Card } from "./Card";
import type { LangCode } from "../lib/i18n";
import { t } from "../lib/i18n";

export function FAQ({ lang }: { lang: LangCode }) {
  const items = [
    { q: "What is MAGIC TIME?", a: "MAGIC TIME is a TON-based project with a presale stage." },
    { q: "When will tokens be distributed?", a: "TBA. We will publish distribution details before listing." },
    { q: "Is there vesting?", a: "TBA. Vesting/lockup details will be announced." },
    { q: "Is the contract audited?", a: "Audit status: TBA. Contract is open-source for transparency." },
    { q: "Which wallets are supported?", a: "Tonkeeper, Telegram Wallet, and other TonConnect wallets." },
    { q: "Can I buy with USDT?", a: "Yes (Jetton transfer). Integration can be enabled depending on rollout." },
  ];

  return (
    <Card>
      <div className="text-lg font-semibold">{t(lang, "faq_title")}</div>
      <div className="mt-4 space-y-3">
        {items.map((it, idx) => (
          <details
            key={idx}
            className="group rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 open:bg-zinc-950/60"
          >
            <summary className="cursor-pointer list-none text-sm font-semibold">
              <div className="flex items-center justify-between gap-3">
                <span>{it.q}</span>
                <span className="text-zinc-500 transition group-open:rotate-45">+</span>
              </div>
            </summary>
            <div className="mt-3 text-sm text-zinc-300">{it.a}</div>
          </details>
        ))}
      </div>
    </Card>
  );
}
