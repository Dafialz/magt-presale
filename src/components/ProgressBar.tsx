export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const percent = Math.min(100, (value / max) * 100);

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
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
