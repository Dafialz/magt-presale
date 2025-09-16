// app/page.tsx
"use client";

import Image from "next/image";
import { TonConnectButton, useTonConnectUI } from "@tonconnect/ui-react";
import React, { useEffect, useMemo, useState } from "react";

// ===== Types =====
type AllocResp = { ok: true; amount: string } | { ok: false; error: string };

// ===== ENV =====
const SALE_ADDRESS = process.env.NEXT_PUBLIC_SALE_ADDRESS || "";     // EQ... (bounceable)
const DECIMALS = Number(process.env.NEXT_PUBLIC_MAGT_DECIMALS || 9);

// ===== Utils =====
function formatAmount(nano: string, decimals: number) {
  const big = BigInt(nano || "0");
  const base = BigInt(10) ** BigInt(decimals); // без BigInt-літералів
  const int = big / base;
  const frac = (big % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return frac.length ? `${int}.${frac}` : `${int}`;
}

function toNanoStr(tonStr: string): string {
  const s = (tonStr || "0").trim();
  if (!s) return "0";
  const [intPart = "0", fracPartRaw = ""] = s.split(".");
  const fracPadded = (fracPartRaw + "000000000").slice(0, 9);
  return (
    BigInt(intPart) * (BigInt(10) ** BigInt(9)) +
    BigInt(fracPadded || "0")
  ).toString();
}

// ===== Page =====
export default function Page() {
  const [tonConnectUI] = useTonConnectUI();
  const [userAddr, setUserAddr] = useState<string>("");
  const [alloc, setAlloc] = useState<string>("0");
  const [loading, setLoading] = useState<boolean>(false);
  const [amountTON, setAmountTON] = useState<string>("0.20");
  const connected = useMemo(() => !!tonConnectUI?.account, [tonConnectUI?.account]);

  useEffect(() => {
    setUserAddr(tonConnectUI?.account?.address ?? "");
  }, [tonConnectUI?.account?.address]);

  async function refreshAlloc() {
    if (!userAddr) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/alloc?user=${encodeURIComponent(userAddr)}`, { cache: "no-store" });
      const j: AllocResp = await r.json();
      if (j.ok) setAlloc(j.amount);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAlloc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddr]);

  async function handleBuy() {
    if (!connected || !userAddr) return;
    if (!SALE_ADDRESS) return alert("NEXT_PUBLIC_SALE_ADDRESS is not set");

    const amt = Number(amountTON || "0");
    if (amt < 0.1) return alert("Введи суму ≥ 0.1 TON");

    try {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{ address: SALE_ADDRESS, amount: toNanoStr(amountTON) }],
      });
      alert("Транзакцію надіслано. Перевір історію у гаманці/експлорері.");
    } catch {
      alert("Покупка скасована або не вдалася.");
    }
  }

  function handleClaimStub() {
    alert("Claim підключимо після деплою ClaimManager. Зараз це заглушка.");
  }

  return (
    <main className="container space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="MAGT" width={36} height={36} priority />
          <h1 className="h1">Magic Time (MAGT) — Presale</h1>
        </div>
        <TonConnectButton />
      </header>

      <section className="grid md:grid-cols-2 gap-6">
        {/* Left card: Sale parameters (placeholder) */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Параметри пресейлу</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-[var(--border)]/60">
              <div className="subtle text-xs">Поточний рівень</div>
              <div className="text-xl font-semibold">1</div>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border)]/60">
              <div className="subtle text-xs">Ціна (за 1 MAGT)</div>
              <div className="text-xl font-semibold">0.003830 TON</div>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border)]/60">
              <div className="subtle text-xs">Залишок</div>
              <div className="text-xl font-semibold">— MAGT</div>
            </div>
          </div>
          <div className="subtle text-sm">Прогрес збору — скоро підчепимо ончейн дані.</div>
        </div>

        {/* Right card: Purchase */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Купити MAGT за TON (MVP)</h2>
          <p className="subtle text-sm">
            Мінімум 0.1 TON (контракт резервує газ для видачі токенів). Для тесту достатньо 0.20 TON.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0.1"
              step="0.01"
              value={amountTON}
              onChange={(e) => setAmountTON(e.target.value)}
              className="input"
              placeholder="0.20"
            />
            <button className="btn btn-primary" onClick={handleBuy} disabled={!connected}>
              Купити
            </button>
          </div>
          <div className="subtle text-xs">
            Адреса сейлу: <code>{SALE_ADDRESS || "-"}</code>
          </div>
        </div>
      </section>

      {/* Wallet/alloc info */}
      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">Стан гаманця</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <div className="subtle text-xs">Статус</div>
            <div className="text-base">{connected ? "Підключено" : "Відключено"}</div>
          </div>
          <div className="md:col-span-2 break-all">
            <div className="subtle text-xs">Адреса</div>
            <div className="text-base">{userAddr || "-"}</div>
          </div>
        </div>
        <div>
          <div className="subtle text-xs">Розподілення (MAGT)</div>
          <div className="text-base">{formatAmount(alloc, DECIMALS)}</div>
        </div>
        <div className="flex gap-2 pt-1">
          <button className="btn" onClick={refreshAlloc} disabled={!connected || loading}>
            Оновити розподілення
          </button>
          <button className="btn" onClick={handleClaimStub} disabled={!connected}>
            Claim (скоро)
          </button>
        </div>
        <div className="subtle text-xs">
          Backend alloc endpoint: <code>/api/alloc?user=&lt;your-friendly&gt;</code>
        </div>
      </section>
    </main>
  );
}
