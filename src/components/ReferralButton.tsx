import React from "react";
import type { LangCode } from "../lib/i18n";
import { t } from "../lib/i18n";

export function ReferralButton({
  lang,
  address,
}: {
  lang: LangCode;
  address?: string | null;
}) {
  const [copied, setCopied] = React.useState(false);

  const link = React.useMemo(() => {
    const base = window.location.origin;
    // ref=адреса гаманця (або твій refId з бекенду)
    const ref = address ? encodeURIComponent(address) : "";
    return ref ? `${base}/?ref=${ref}` : `${base}/`;
  }, [address]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }

  return (
    <button
      onClick={copy}
      className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900"
      type="button"
    >
      {copied ? t(lang, "copied") : t(lang, "copy_ref")}
    </button>
  );
}
