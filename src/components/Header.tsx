import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import { shortAddr } from "../lib/format";

export function Header() {
  const addr = useTonAddress();

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-900 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div>
          <div className="text-base font-semibold">MAGIC TIME Presale</div>
          <div className="text-xs text-zinc-400">
            {addr ? `Wallet: ${shortAddr(addr)}` : "Connect wallet to participate"}
          </div>
        </div>

        <TonConnectButton />
      </div>
    </header>
  );
}
