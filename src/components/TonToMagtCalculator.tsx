import React from "react";
import { Card } from "./Card";
import { clampNum, toNumberSafe } from "../lib/format";
import { priceUsd } from "../lib/presale";

export function TonToMagtCalculator({
  currentRound,
}: {
  currentRound: number; // 0..19
}) {
  const [usdt, setUsdt] = React.useState("50");

  const usdtNum = toNumberSafe(usdt);
  const usd = Math.max(0, usdtNum); // USDT ≈ USD
  const tokenPrice = priceUsd(currentRound); // USD per MAGT
  const magt = tokenPrice > 0 ? usd / tokenPrice : 0;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold">Calculator</div>
          <div className="mt-1 text-sm text-zinc-400">
            USDT → MAGT using current round price
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
          <div className="mt-1 text-sm font-semibold">USDT</div>

          <input
            value={usdt}
            onChange={(e) => setUsdt(clampNum(e.target.value, 2))}
            className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-600"
            inputMode="decimal"
            placeholder="0.00"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <QuickBtn onClick={() => setUsdt("50")}>50</QuickBtn>
            <QuickBtn onClick={() => setUsdt("100")}>100</QuickBtn>
            <QuickBtn onClick={() => setUsdt("250")}>250</QuickBtn>
            <QuickBtn onClick={() => setUsdt("500")}>500</QuickBtn>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs text-zinc-400">Estimated value</div>
          <div className="mt-1 text-sm font-semibold">USD</div>
          <div className="mt-3 text-2xl font-semibold">
            ${usd.toFixed(2)}
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            USDT is treated as USD (1:1)
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
