import React from "react";
import { Card } from "./Card";
import { clampNum, toNumberSafe } from "../lib/format";
import { priceUsd } from "../lib/presale";

export function TonToMagtCalculator({
  currentRound,
  tonUsdRate,
}: {
  currentRound: number; // 0..19
  tonUsdRate: number;   // наприклад 6.5 (1 TON = 6.5 USD)
}) {
  const [ton, setTon] = React.useState("1");

  const tonNum = toNumberSafe(ton);
  const usd = Math.max(0, tonNum) * (tonUsdRate || 0);
  const tokenPrice = priceUsd(currentRound); // USD per MAGT
  const magt = tokenPrice > 0 ? usd / tokenPrice : 0;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Calculator</div>
          <div className="mt-1 text-sm text-zinc-400">
            TON → MAGT using current round price
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-zinc-400">Round price</div>
          <div className="text-sm font-semibold">
            ${tokenPrice.toFixed(6)} / MAGT
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-400">You pay</div>
          <div className="mt-1 text-sm font-semibold">TON</div>
          <input
            value={ton}
            onChange={(e) => setTon(clampNum(e.target.value, 4))}
            className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-600"
            inputMode="decimal"
            placeholder="0.0"
          />

          <div className="mt-3 flex gap-2">
            <QuickBtn onClick={() => setTon("1")}>1</QuickBtn>
            <QuickBtn onClick={() => setTon("5")}>5</QuickBtn>
            <QuickBtn onClick={() => setTon("10")}>10</QuickBtn>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-400">Estimated value</div>
          <div className="mt-1 text-sm font-semibold">USD</div>
          <div className="mt-3 text-2xl font-semibold">
            ${usd.toFixed(2)}
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Rate: 1 TON ≈ ${tonUsdRate.toFixed(2)}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-400">You receive</div>
          <div className="mt-1 text-sm font-semibold">MAGT</div>
          <div className="mt-3 text-2xl font-semibold">
            {formatBig(magt)}
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            * Estimation. Final amount depends on tx + rounding.
          </div>
        </div>
      </div>
    </Card>
  );
}

function QuickBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-900"
      type="button"
    >
      {children}
    </button>
  );
}

function formatBig(n: number) {
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(n);
}
