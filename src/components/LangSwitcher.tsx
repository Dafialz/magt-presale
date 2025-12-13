import React from "react";
import { LANGS, getSavedLang, saveLang } from "../lib/i18n";
import type { LangCode } from "../lib/i18n";

export function LangSwitcher({
  value,
  onChange,
}: {
  value: LangCode;
  onChange: (v: LangCode) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const v = e.target.value as LangCode;
        saveLang(v);
        onChange(v);
      }}
      className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none hover:bg-zinc-900"
      aria-label="Language"
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
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
