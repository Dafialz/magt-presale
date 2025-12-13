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
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => {
          const v = e.target.value as LangCode;
          saveLang(v);
          onChange(v);
        }}
        className="appearance-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 pr-10 text-sm text-zinc-200 outline-none hover:bg-zinc-900"
        aria-label="Language"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>

      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
        <img
          src={FLAG_ICON[value]}
          alt={value}
          className="h-5 w-5 rounded-full"
        />
      </div>
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
