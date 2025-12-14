import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import { shortAddr } from "../lib/format";
import { LangSwitcher } from "./LangSwitcher";
import type { LangCode } from "../lib/i18n";

import brandIcon from "../assets/favicon.png";

export function Header({
  lang,
  onLangChange,
}: {
  lang: LangCode;
  onLangChange: (v: LangCode) => void;
}) {
  const addr = useTonAddress();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-900 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-3">
          <img
            src={brandIcon}
            alt="MAGIC TIME"
            className="h-9 w-9 rounded-xl"
          />

          <div>
            <div className="text-base font-semibold">MAGIC TIME Presale</div>
            <div className="text-xs text-zinc-400">
              {addr ? `Wallet: ${shortAddr(addr)}` : "Connect wallet to participate"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LangSwitcher value={lang} onChange={onLangChange} />
          <TonConnectButton />
        </div>
      </div>
    </header>
  );
}
