import { Card } from "./Card";

const MILESTONES = [
  { label: "0$", value: 0 },
  { label: "500.000$", value: 500_000 },
  { label: "5.000.000$", value: 5_000_000 },
  { label: "15.000.000$", value: 15_000_000 },
] as const;

export function ProjectsSection({
  raisedUsd,
}: {
  raisedUsd: number; // скільки зібрано в $
}) {
  const progressPct = milestoneProgressPercent(raisedUsd);

  return (
    <Card>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Наші проєкти</div>
          <div className="mt-1 text-sm text-zinc-400">
            Запущені та майбутні продукти екосистеми MAGIC TIME
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-zinc-400">Raised</div>
          <div className="text-sm font-semibold">${formatMoney(raisedUsd)}</div>
        </div>
      </div>

      {/* МІТКИ */}
      <div className="mt-5">
        <div className="grid grid-cols-4 gap-2 text-center text-xs text-zinc-300">
          {MILESTONES.map((m) => (
            <div
              key={m.value}
              className="rounded-xl border border-zinc-800 bg-zinc-950/40 py-2"
            >
              {m.label}
            </div>
          ))}
        </div>

        {/* ПРОГРЕС ЛІНІЯ */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-[width] duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Підписи сегментів */}
        <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
          <span>Seed</span>
          <span>Grow</span>
          <span>Scale</span>
          <span>Ecosystem</span>
        </div>
      </div>

      {/* КАРТКИ */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <a
          href="https://magic-time-tap.netlify.app/"
          target="_blank"
          rel="noreferrer"
          className="group rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5 transition hover:border-zinc-600"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">MAGIC TIME TAP</div>
            <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] text-emerald-300">
              Live
            </span>
          </div>
          <div className="mt-2 text-sm text-zinc-400">
            Готовий продукт — натисни, щоб відкрити.
          </div>
          <div className="mt-4 text-xs text-zinc-500 group-hover:text-zinc-300">
            Open →
          </div>
        </a>

        <BlurCard title="Project #2" subtitle="Coming soon" />
        <BlurCard title="Project #3" subtitle="Coming soon" />
        <BlurCard title="Project #4" subtitle="Coming soon" />
      </div>
    </Card>
  );
}

function milestoneProgressPercent(raisedUsd: number) {
  const x = Math.max(0, Number.isFinite(raisedUsd) ? raisedUsd : 0);

  // 3 сегменти однакової ширини: [0..500k], [500k..5M], [5M..15M]
  const seg = [
    { a: 0, b: 500_000 },
    { a: 500_000, b: 5_000_000 },
    { a: 5_000_000, b: 15_000_000 },
  ] as const;

  const segWidth = 100 / 3;

  if (x <= seg[0].b) {
    return (x / seg[0].b) * segWidth;
  }
  if (x <= seg[1].b) {
    const t = (x - seg[1].a) / (seg[1].b - seg[1].a);
    return segWidth + t * segWidth;
  }
  if (x <= seg[2].b) {
    const t = (x - seg[2].a) / (seg[2].b - seg[2].a);
    return 2 * segWidth + t * segWidth;
  }
  return 100;
}

function BlurCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      <div className="pointer-events-none select-none blur-[3px]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">{title}</div>
          <span className="rounded-full bg-zinc-700/30 px-2 py-1 text-[11px] text-zinc-300">
            Locked
          </span>
        </div>
        <div className="mt-2 text-sm text-zinc-400">{subtitle}</div>
        <div className="mt-4 h-2 w-2/3 rounded-full bg-zinc-800" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 py-2 text-xs text-zinc-200">
          🔒 Coming soon
        </div>
      </div>
    </div>
  );
}

function formatMoney(n: number) {
  const x = Math.max(0, Number.isFinite(n) ? n : 0);
  if (x >= 1_000_000) return (x / 1_000_000).toFixed(2) + "M";
  if (x >= 1_000) return (x / 1_000).toFixed(2) + "K";
  return x.toFixed(0);
}
