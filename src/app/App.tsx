import { Header } from "../components/Header";
import { PresaleWidget } from "../components/PresaleWidget";
import { PresaleProgress } from "../components/PresaleProgress";
import { TonToMagtCalculator } from "../components/TonToMagtCalculator";
import { TrustSection } from "../components/TrustSection";
import { Tokenomics } from "../components/Tokenomics";
import { Roadmap } from "../components/Roadmap";
import { FAQ } from "../components/FAQ";
import { SiteFooter } from "../components/SiteFooter";
import { ReferralButton } from "../components/ReferralButton";
import { useLang } from "../components/LangSwitcher";
import { useTonAddress } from "@tonconnect/ui-react";

import logo from "../assets/favicon.png";
import hero from "../assets/og-600x315.png";
import bg from "../assets/bg.png";

export default function App() {
  const { lang, setLang } = useLang();
  const addr = useTonAddress();

  // 🔧 DEMO-СТАНИ (потім заміниш на бекенд)
  const currentRound = 0; // 0..19
  const soldTotal = 128_500_000; // всього продано
  const soldInRound = 12_300_000; // продано в поточному раунді

  return (
    <div className="min-h-screen">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10 opacity-50"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="fixed inset-0 -z-10 bg-zinc-950/70" />

      <Header lang={lang} onLangChange={setLang} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* HERO */}
        <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} className="h-10 w-10 rounded-xl" alt="logo" />
              <div className="text-sm text-zinc-400">MAGIC TIME</div>
            </div>

            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              MAGIC TIME Presale
            </h1>
            <p className="mt-3 max-w-xl text-zinc-300">
              Купуй токени до лістингу. Обмежена кількість у кожному раунді.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <Badge label="Network" value="TON" />
              <Badge label="Pay" value="TON / USDT" />
              <Badge label="Token" value="MAGT" />
            </div>

            <div className="mt-5">
              <ReferralButton lang={lang} address={addr} />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
            <img src={hero} className="w-full rounded-xl" alt="MAGIC TIME" />
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mt-10">
          <PresaleProgress
            currentRound={currentRound}
            soldTotal={soldTotal}
            soldInRound={soldInRound}
          />
        </div>

        {/* CALCULATOR (USDT -> MAGT) */}
        <div className="mt-8">
          <TonToMagtCalculator currentRound={currentRound} />
        </div>

        {/* BUY */}
        <div className="mt-8">
          <PresaleWidget />
        </div>

        {/* TRUST + TOKENOMICS + ROADMAP + FAQ */}
        <div className="mt-10 grid gap-8">
          <TrustSection lang={lang} />
          <Tokenomics lang={lang} />
          <Roadmap lang={lang} />
          <FAQ lang={lang} />
        </div>

        <div className="mt-10">
          <SiteFooter />
        </div>
      </main>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
