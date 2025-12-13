import React from "react";
import { lerp } from "../lib/animate";

export function ProgressBar({
  value,
  max,
  label,
  animate = true,
  durationMs = 650,
}: {
  value: number;
  max: number;
  label?: string;
  animate?: boolean;
  durationMs?: number;
}) {
  const safeMax = Math.max(1, max);
  const target = Math.max(0, Math.min(value, safeMax));

  const [display, setDisplay] = React.useState(target);

  React.useEffect(() => {
    if (!animate) {
      setDisplay(target);
      return;
    }

    const start = display;
    const startTs = performance.now();

    let raf = 0;
    const tick = (ts: number) => {
      const t = Math.min(1, (ts - startTs) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(lerp(start, target, eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const percent = Math.min(100, (display / safeMax) * 100);

  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-xs text-zinc-400">
          <span>{label}</span>
          <span>{percent.toFixed(2)}%</span>
        </div>
      )}

      <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
