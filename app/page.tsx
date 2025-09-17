// app/page.tsx
"use client";

import Image from "next/image";
import { TonConnectButton, useTonConnectUI } from "@tonconnect/ui-react";
import React, { useEffect, useMemo, useState } from "react";
import { beginCell } from "@ton/core";

/* ========= Types ========= */
type AllocResp = { ok: true; amount: string } | { ok: false; error: string };

/* ========= ENV ========= */
const SALE_ADDRESS = process.env.NEXT_PUBLIC_SALE_ADDRESS || ""; // EQ... (bounceable)
const DECIMALS = Number(process.env.NEXT_PUBLIC_MAGT_DECIMALS || 9);

/* ========= Constants (UI calc only) ========= */
const PRICE_TON_PER_MAGT = 0.00383; // візуальний розрахунок; реальна ціна береться з контракту
const TARGET_TON = 6_500_000; // ✅ ціль у TON

/* ========= Utils ========= */
function formatAmount(nano: string, decimals: number) {
  const big = BigInt(nano || "0");
  const base = BigInt(10) ** BigInt(decimals);
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

// ---- base64 helper для браузера (без Buffer) ----
function bytesToBase64(arr: Uint8Array): string {
  if (typeof window === "undefined") {
    // @ts-ignore (на сервері Buffer є)
    return Buffer.from(arr).toString("base64");
  }
  let bin = "";
  arr.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

// ---- OP_BUY payload для контракту сейлу ----
const OP_BUY = 0xb0a1cafe as const;
function buildBuyBodyBase64(refAddress?: string): string {
  const hasRef = !!refAddress;
  const cell = beginCell()
    .storeUint(OP_BUY, 32) // opcode
    .storeBit(hasRef ? 1 : 0); // біт реферала
  // якщо буде потрібно — можна додати адрес реферала через .storeAddress(...)
  return bytesToBase64(cell.endCell().toBoc({ idx: false }));
}

/* ========= Page ========= */
export default function Page() {
  const [tonConnectUI] = useTonConnectUI();
  const [userAddr, setUserAddr] = useState<string>("");
  const [alloc, setAlloc] = useState<string>("0");
  const [loading, setLoading] = useState<boolean>(false);

  const [amountTON, setAmountTON] = useState<string>("100"); // як на скріні — поле суми
  const [agree, setAgree] = useState<boolean>(false);
  const [referral, setReferral] = useState<string>(""); // опціонально
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
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    refreshAlloc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddr]);

  const magtPreview = (() => {
    const ton = Number(amountTON || "0");
    if (!isFinite(ton) || ton <= 0) return "0";
    const magt = ton / PRICE_TON_PER_MAGT;
    return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 }).format(magt);
  })();

  async function handleBuy() {
    if (!connected || !userAddr) return alert("Підключи гаманець TON");
    if (!SALE_ADDRESS) return alert("NEXT_PUBLIC_SALE_ADDRESS is not set");
    if (!agree) return alert("Підтвердь правила пресейлу");
    const amt = Number(amountTON || "0");
    if (!isFinite(amt) || amt < 0.1) return alert("Введи суму ≥ 0.1 TON");

    try {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: SALE_ADDRESS,
            amount: toNanoStr(String(amt)),
            payload: buildBuyBodyBase64(referral || undefined),
          },
        ],
      });
      alert("Транзакцію надіслано. Перевір історію у гаманці/експлорері.");
    } catch {
      alert("Покупка скасована або не вдалася.");
    }
  }

  return (
    <main className="container space-y-10">
      {/* Top bar */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="MAGT" width={32} height={32} priority />
          <div className="h1">Magic Time</div>
        </div>
        <nav className="flex items-center gap-3">
          <a className="subtle hidden md:inline-block" href="#buy">Купити</a>
          <a className="subtle hidden md:inline-block" href="#token">Токеноміка</a>
          <a className="subtle hidden md:inline-block" href="#roadmap">Дорожня карта</a>
          <a className="subtle hidden md:inline-block" href="#faq">FAQ</a>
          <TonConnectButton />
        </nav>
      </header>

      {/* Hero */}
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-5">
          <div className="badge">MAGIC TIME (MAGT) — Presale</div>
          <h2 className="hero-title">Купуй MAGT швидко, прозоро, ончейн</h2>
          <p className="subtle text-base">
            Оплата: <b>TON</b>. Мінімальний внесок — <b>0.1 TON</b>. Контракт автоматично
            доставляє MAGT на твій Jetton Wallet.
          </p>
          <div className="flex gap-3">
            <a href="#buy" className="btn btn-primary">Купити MAGT</a>
            <a href="#token" className="btn">Деталі токеноміки</a>
          </div>
        </div>
        <div className="card p-6">
          <Image src="/bg.png" alt="Magic Time" width={800} height={480} className="rounded-2xl" />
        </div>
      </section>

      {/* Main two panels */}
      <section className="grid md:grid-cols-2 gap-8" id="buy">
        {/* Left: пресейл параметри */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-2 border border-0 border-b border-[var(--border)]/60">
            <h3 className="text-lg font-semibold">Параметри пресейлу</h3>
            <span className="badge">Ціль: {TARGET_TON.toLocaleString("uk-UA")} TON</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-[var(--border)]/60">
              <div className="subtle text-xs">Поточний рівень</div>
              <div className="text-xl font-semibold">1</div>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border)]/60">
              <div className="subtle text-xs">Ціна (за 1 MAGT)</div>
              <div className="text-xl font-semibold">
                {PRICE_TON_PER_MAGT.toLocaleString("uk-UA", { minimumFractionDigits: 6 })} TON
              </div>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border)]/60">
              <div className="subtle text-xs">Залишок</div>
              <div className="text-xl font-semibold">— MAGT</div>
            </div>
          </div>

          <div className="subtle text-sm">Прогрес збору</div>
          <div className="progress"><span /></div>
          <div className="subtle text-xs">— / {TARGET_TON.toLocaleString("uk-UA")} TON</div>
        </div>

        {/* Right: покупка */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-lg font-semibold">Купити MAGT за TON</h3>
            <span className="badge">Реферальна програма — 5% <small className="subtle">(Beta)</small></span>
          </div>

          <label className="subtle text-sm">Реферальний адрес (необов’язково)</label>
          <input
            className="input"
            placeholder="EQ... (адрес друга у TON)"
            value={referral}
            onChange={(e) => setReferral(e.target.value.trim())}
          />

          <label className="subtle text-sm">Сума у TON</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0.1"
              step="0.01"
              value={amountTON}
              onChange={(e) => setAmountTON(e.target.value)}
              className="input"
              placeholder="100"
            />
            <button
              className="btn"
              onClick={() => setAmountTON("100")}
              type="button"
            >
              MAX
            </button>
          </div>

          <div className="subtle text-sm">Отримаєш ≈ <b>{magtPreview}</b> MAGT</div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            Погоджуюсь з правилами пресейлу (безпека, блокування, обмеження)
          </label>

          <button
            className="btn btn-primary"
            onClick={handleBuy}
            disabled={!connected || !agree}
          >
            Купити
          </button>

          <div className="subtle text-xs">
            Адреса сейлу: <code className="opacity-90">{SALE_ADDRESS || "-"}</code>
          </div>
        </div>
      </section>

      {/* Wallet/alloc */}
      <section className="card space-y-3">
        <h3 className="text-lg font-semibold">Стан гаманця</h3>
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
          <div className="subtle text-xs">Твій алокейт (MAGT)</div>
          <div className="text-base">{formatAmount(alloc, DECIMALS)}</div>
        </div>
        <div className="flex gap-2 pt-1">
          <button className="btn" onClick={refreshAlloc} disabled={!connected || loading}>
            Оновити розподілення
          </button>
        </div>
      </section>

      {/* Tokenomics */}
      <section id="token" className="card space-y-3">
        <h3 className="text-lg font-semibold">Токеноміка (скорочено)</h3>
        <div className="grid md:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded-lg border border-[var(--border)]/60">
            <div className="subtle text-xs">Всього</div>
            <div className="text-base font-semibold">10 000 000 000 MAGT</div>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border)]/60">
            <div className="subtle text-xs">Пресейл</div>
            <div className="text-base font-semibold">TBA</div>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border)]/60">
            <div className="subtle text-xs">Ліквідність</div>
            <div className="text-base font-semibold">TBA</div>
          </div>
          <div className="p-3 rounded-lg border border-[var(--border)]/60">
            <div className="subtle text-xs">Резерв</div>
            <div className="text-base font-semibold">TBA</div>
          </div>
        </div>
        <p className="subtle text-sm">Детальні діаграми та вестинг додамо після фіналізації параметрів рівнів.</p>
      </section>

      {/* FAQ */}
      <section id="faq" className="card space-y-4">
        <h3 className="text-lg font-semibold">FAQ</h3>
        <details className="rounded-lg border border-[var(--border)]/60 p-4">
          <summary className="font-medium cursor-pointer">Токени не прийшли — що робити?</summary>
          <p className="subtle text-sm mt-2">
            Переконайся, що платив на правильну адресу сейлу, сума ≥ 0.1 TON і створено Jetton Wallet.
            Якщо що — напиши нам із хешем транзакції.
          </p>
        </details>
        <details className="rounded-lg border border-[var(--border)]/60 p-4">
          <summary className="font-medium cursor-pointer">Чи є мінімальна сума?</summary>
          <p className="subtle text-sm mt-2">Так, 0.1 TON. Для першого тесту рекомендуємо 0.20 TON.</p>
        </details>
      </section>

      {/* Footer */}
      <footer className="pt-2 pb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>© {new Date().getFullYear()} Magic Time. Усі права захищено.</div>
        <div className="flex gap-4">
          <a className="hover:underline" href="https://t.me/" target="_blank" rel="noreferrer">Telegram</a>
          <a className="hover:underline" href="mailto:support@magtcoin.com">Email</a>
          <a className="hover:underline" href="/whitepaper.pdf" target="_blank" rel="noreferrer">Whitepaper</a>
        </div>
      </footer>
    </main>
  );
}
