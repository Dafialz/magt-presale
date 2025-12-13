import { Header } from "../components/Header";
import { PresaleWidget } from "../components/PresaleWidget";
import { PresaleProgress } from "../components/PresaleProgress";
import { TonToMagtCalculator } from "../components/TonToMagtCalculator";

import logo from "../assets/favicon.png";
import hero from "../assets/og-600x315.png";
import bg from "../assets/bg.png";

export default function App() {
  // 🔧 DEMO-СТАНИ (потім заміниш на бекенд)
  const currentRound = 0; // 0..19
  const soldTotal = 128_500_000; // всього продано
  const soldInRound = 12_300_000; // продано в поточному раунді
  const tonUsdRate = 6.5; // 1 TON ≈ $6.5

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

      <Header />

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

        {/* CALCULATOR */}
        <div className="mt-8">
          <TonToMagtCalculator
            currentRound={currentRound}
            tonUsdRate={tonUsdRate}
          />
        </div>

        {/* BUY WIDGET */}
        <div className="mt-8">
          <PresaleWidget />
        </div>

        <footer className="mt-12 text-xs text-zinc-500">
          © {new Date().getFullYear()} MAGIC TIME
        </footer>
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
