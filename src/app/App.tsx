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
import { ProjectsSection } from "../components/ProjectsSection";

import logo from "../assets/favicon.png";
import neonLogo from "../assets/logo-presale.png";
import bg from "../assets/bg.png";

export default function App() {
  const { lang, setLang } = useLang();
  const addr = useTonAddress();

  // 🔧 DEMO-СТАНИ
  const currentRound = 0;
  const soldTotal = 128_500_000;
  const soldInRound = 12_300_000;

  // ✅ DEMO: Raised USD (потім заміниш на бекенд/розрахунок)
  const raisedUsd = 1_250_000;

  // ✅ DEMO: Баланси (потім підтягнеш з бекенду/контракту)
  const boughtMagt = 2_450_000.5; // скільки куплено MAGT
  const referralMagt = 184_200.25; // скільки принесли реферали (MAGT)

  return (
    <div className="min-h-screen text-white">
      {/* 🌌 REAL BACKGROUND */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <Header lang={lang} onLangChange={setLang} />

      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* HERO */}
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} className="h-10 w-10 rounded-xl" alt="logo" />
              <div className="text-sm text-zinc-200">MAGIC TIME</div>
            </div>

            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              MAGIC TIME Presale
            </h1>

            <p className="mt-3 max-w-xl text-zinc-100">
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

            {/* ✅ ТУТ 2 БАЛАНСИ (як на твоєму скріні в червоній зоні) */}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <BalanceCard
                title="Your MAGT"
                value={`${formatNum(boughtMagt)} MAGT`}
                hint={addr ? "Connected wallet" : "Connect wallet to see"}
              />
              <BalanceCard
                title="Referral MAGT"
                value={`${formatNum(referralMagt)} MAGT`}
                hint="Earned from referrals"
              />
            </div>
          </div>

          {/* LOGO */}
          <div className="flex justify-center">
            <img
              src={neonLogo}
              alt="MAGIC TIME Logo"
              className="max-w-sm w-full drop-shadow-[0_0_45px_rgba(80,180,255,0.95)]"
            />
          </div>
        </div>

        {/* PROGRESS */}
        <div className="mt-12">
          <PresaleProgress
            currentRound={currentRound}
            soldTotal={soldTotal}
            soldInRound={soldInRound}
          />
        </div>

        {/* CALCULATOR */}
        <div className="mt-10">
          <TonToMagtCalculator currentRound={currentRound} />
        </div>

        {/* BUY */}
        <div className="mt-10">
          <PresaleWidget />
        </div>

        {/* PROJECTS */}
        <div className="mt-14">
          <ProjectsSection raisedUsd={raisedUsd} />
        </div>

        {/* TRUST + TOKENOMICS + ROADMAP + FAQ */}
        <div className="mt-14 grid gap-10">
          <TrustSection lang={lang} />
          <Tokenomics lang={lang} />
          <Roadmap lang={lang} />
          <FAQ lang={lang} />
        </div>

        <div className="mt-14">
          <SiteFooter />
        </div>
      </main>
    </div>
  );
}

/**
 * ✅ КРАЩЕ "GLASS" (читабельно на яскравому фоні)
 */
function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-10 left-0 h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="absolute -bottom-10 right-0 h-24 w-24 rounded-full bg-purple-400/20 blur-2xl" />
      </div>

      <div className="relative">
        <div className="text-xs text-zinc-300">{label}</div>
        <div className="mt-1 font-semibold tracking-wide text-white">
          {value}
        </div>
      </div>
    </div>
  );
}

function BalanceCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/55 p-4 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-10 -left-10 h-24 w-24 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="absolute -bottom-10 -right-10 h-24 w-24 rounded-full bg-purple-400/20 blur-2xl" />
      </div>

      <div className="relative">
        <div className="text-xs text-zinc-300">{title}</div>
        <div className="mt-1 text-xl font-semibold tracking-wide">{value}</div>
        {hint ? <div className="mt-1 text-xs text-zinc-400">{hint}</div> : null}
      </div>
    </div>
  );
}

function formatNum(n: number) {
  try {
    if (!Number.isFinite(n)) return "0";
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return String(n);
  }
}
