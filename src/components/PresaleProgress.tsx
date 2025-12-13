import { Card } from "./Card";
import { ProgressBar } from "./ProgressBar";
import {
  TOTAL_SUPPLY,
  ROUND_TOKENS,
  priceUsd,
} from "../lib/presale";

export function PresaleProgress({
  currentRound,
  soldTotal,
  soldInRound,
}: {
  currentRound: number;
  soldTotal: number;
  soldInRound: number;
}) {
  const roundMax = ROUND_TOKENS[currentRound];

  return (
    <Card>
      <div className="text-lg font-semibold">Presale Progress</div>

      {/* TOTAL */}
      <div className="mt-4">
        <ProgressBar
          label="Total presale"
          value={soldTotal}
          max={TOTAL_SUPPLY}
        />
        <div className="mt-1 text-xs text-zinc-400">
          {soldTotal.toLocaleString()} / {TOTAL_SUPPLY.toLocaleString()} MAGT
        </div>
      </div>

      {/* ROUND */}
      <div className="mt-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold">
            Round {currentRound + 1}
          </span>
          <span className="text-zinc-400">
            ${priceUsd(currentRound).toFixed(4)} / MAGT
          </span>
        </div>

        <ProgressBar
          value={soldInRound}
          max={roundMax}
        />

        <div className="mt-1 text-xs text-zinc-400">
          {soldInRound.toLocaleString()} / {roundMax.toLocaleString()} MAGT
        </div>
      </div>
    </Card>
  );
}
