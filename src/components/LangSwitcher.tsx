import React from "react";
import { LANGS, getSavedLang, saveLang, FLAG_ICON } from "../lib/i18n";
import type { LangCode } from "../lib/i18n";

export function LangSwitcher({
  value,
  onChange,
}: {
  value: LangCode;
  onChange: (v: LangCode) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = LANGS.find((l) => l.code === value)!;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
        aria-label="Language"
      >
        <img
          src={FLAG_ICON[value]}
          alt={value}
          className="h-5 w-5 rounded-full"
        />
        <span className="font-semibold">{current.label}</span>
        <span className="ml-1 text-zinc-400">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-lg">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                saveLang(l.code);
                onChange(l.code);
                setOpen(false);
              }}
              className={[
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-900",
                l.code === value ? "bg-zinc-900/60" : "",
              ].join(" ")}
            >
              <img
                src={FLAG_ICON[l.code]}
                alt={l.code}
                className="h-5 w-5 rounded-full"
              />
              <span className="text-zinc-200">{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function useLang() {
  const [lang, setLang] = React.useState<LangCode>(() => {
    try {
      return getSavedLang();
    } catch {
      return "en";
    }
  });

  return { lang, setLang };
}
