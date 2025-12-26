import React from "react";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { beginCell, Address } from "@ton/core";
import { Card } from "./Card";
import { clampNum, toNumberSafe } from "../lib/format";
import { nowPlus, toNanoTon } from "../lib/ton";
import { PRESALE_CONTRACT, TOKEN_SYMBOL } from "../lib/config";

function bytesToBase64(bytes: Uint8Array) {
  // safe for browser (no Buffer dependency)
  let binary = "";
  const chunk = 0x8000; // avoid call stack limits
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function buildRefPayloadBase64(): string | undefined {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref) return undefined;

    const refAddr = Address.parse(ref);

    // Contract expects: body.loadAddress()
    const cell = beginCell().storeAddress(refAddr).endCell();
    const boc = cell.toBoc(); // Uint8Array
    return bytesToBase64(boc);
  } catch {
    return undefined;
  }
}

export function PresaleWidget() {
  const addr = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const [tonAmount, setTonAmount] = React.useState("1");
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  const refPayload = React.useMemo(() => buildRefPayloadBase64(), []);

  async function buyWithTon() {
    if (!addr) return setMsg("Спочатку підключи гаманець");

    const ton = toNumberSafe(tonAmount);
    if (ton <= 0) return setMsg("Введи суму TON більше 0");

    setLoading(true);
    setMsg("");

    try {
      await tonConnectUI.sendTransaction({
        // nowPlus() у тебе в хвилинах
        validUntil: nowPlus(10),
        messages: [
          {
            address: PRESALE_CONTRACT,
            amount: toNanoTon(ton),
            // ✅ referral (якщо є ?ref=... у посиланні)
            ...(refPayload ? { payload: refPayload } : {}),
          },
        ],
      });

      setMsg(refPayload ? "✅ Транзакція відправлена (TON + referral)" : "✅ Транзакція відправлена (TON)");
    } catch (e: any) {
      setMsg(e?.message ?? "Помилка транзакції");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="text-lg font-semibold">Buy {TOKEN_SYMBOL}</div>
      <div className="mt-1 text-sm text-zinc-400">
        TON buy вже з referral payload. USDT додамо наступним кроком.
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">Buy with TON</div>
            <div className="text-[11px] text-zinc-500">
              {refPayload ? "Referral: ✅" : "Referral: —"}
            </div>
          </div>

          <label className="mt-3 block text-xs text-zinc-400">Amount (TON)</label>
          <input
            value={tonAmount}
            onChange={(e) => setTonAmount(clampNum(e.target.value, 4))}
            className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-600"
            inputMode="decimal"
          />

          <button
            disabled={loading || !addr}
            onClick={buyWithTon}
            className="mt-4 w-full rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
            title={!addr ? "Підключи гаманець" : undefined}
          >
            {loading ? "Sending…" : addr ? "Buy with TON" : "Connect wallet"}
          </button>

          {msg ? <div className="mt-3 text-xs text-zinc-300">{msg}</div> : null}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-sm font-semibold">Buy with USDT</div>
          <div className="mt-2 text-xs text-zinc-400">
            Тут буде Jetton transfer з forward_payload (ref) і відправкою на USDT jetton-wallet пресейлу.
          </div>

          <button
            onClick={() => setMsg("USDT: додамо, коли підключиш jetton transfer")}
            className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-900"
            type="button"
          >
            Coming soon
          </button>
        </div>
      </div>

      <div className="mt-5 text-xs text-zinc-500 break-all">Contract: {PRESALE_CONTRACT}</div>
    </Card>
  );
}
