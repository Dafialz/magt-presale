// components/BuyPanel.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { beginCell, Address } from "@ton/core";
import toast from "react-hot-toast";

type Props = {
  priceTonPerMagt: number; // 0.00383
  gasHintMin: number;      // 0.05
  gasHintMax: number;      // 0.1
  saleAddress: string;     // EQ...
};

/* ===== Helpers ===== */
function toNanoStr(tonStr: string): string {
  const s = (tonStr || "0").trim().replace(",", ".");
  if (!s) return "0";
  const [intPart = "0", fracPartRaw = ""] = s.split(".");
  const fracPadded = (fracPartRaw + "000000000").slice(0, 9);
  return (BigInt(intPart) * (10n ** 9n) + BigInt(fracPadded || "0")).toString();
}

// Браузерна base64, з м’яким fallback на Buffer без типозалежностей
function bytesToBase64(arr: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);

  if (typeof btoa === "function") return btoa(bin);

  // fallback на середовище, де є Buffer (наприклад, під час тестів)
  const Buf = (globalThis as any)?.Buffer;
  return Buf ? Buf.from(arr).toString("base64") : bin;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.split("; ").find((x) => x.startsWith(name + "="));
  return m ? decodeURIComponent(m.split("=")[1] || "") : null;
}

const OP_BUY = 0xb0a1cafe as const;

function isFriendlyTonAddress(s: string): boolean {
  // Легка евристика для EQ/UQ friendly-рядків (url-safe)
  return /^[EU]Q[A-Za-z0-9\-_]{46,60}$/.test(s);
}

function buildBuyBodyBase64(refAddress?: string): string {
  const hasRef = !!refAddress;
  const b = beginCell().storeUint(OP_BUY, 32).storeBit(hasRef ? 1 : 0);

  if (hasRef) {
    try {
      const addr = Address.parse(refAddress!); // парсимо friendly (EQ/UQ)
      b.storeAddress(addr);
    } catch {
      // Якщо парс не вдався — відправимо без реферала
      const fallback = beginCell().storeUint(OP_BUY, 32).storeBit(0);
      return bytesToBase64(fallback.endCell().toBoc({ idx: false }));
    }
  }

  return bytesToBase64(b.endCell().toBoc({ idx: false }));
}

/* ===== Component ===== */
export default function BuyPanel({
  priceTonPerMagt,
  gasHintMin,
  gasHintMax,
  saleAddress,
}: Props) {
  const [tonConnectUI] = useTonConnectUI();
  const connected = useMemo(() => !!tonConnectUI?.account, [tonConnectUI?.account]);

  // калькулятор
  const [calcMode, setCalcMode] = useState<"ton2magt" | "magt2ton">("ton2magt");
  const [amountTON, setAmountTON] = useState<string>("100");
  const [amountMAGT, setAmountMAGT] = useState<string>("");

  // згода
  const [agree, setAgree] = useState<boolean>(false);

  // реферал
  const [referral, setReferral] = useState<string>("");
  const [lockedRef, setLockedRef] = useState<boolean>(false);

  // 1) Один раз читаємо: cookie -> URL -> localStorage (і лочимо якщо знайшли)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const KEY = "magt_ref";

    // 1.1 cookie вже існує — пріоритет №1
    const cookieRef = getCookie(KEY);
    if (cookieRef && isFriendlyTonAddress(cookieRef)) {
      setReferral(cookieRef);
      setLockedRef(true);
      return;
    }

    // 1.2 ?ref= або ?r= в URL — встановлюємо cookie через API, лочимо
    const url = new URL(window.location.href);
    const ref = (url.searchParams.get("ref") || url.searchParams.get("r") || "").trim();
    if (ref && isFriendlyTonAddress(ref)) {
      // Встановлюємо cookie на бекові
      fetch(`/api/ref?ref=${encodeURIComponent(ref)}`, { method: "GET", cache: "no-store" })
        .catch(() => void 0)
        .finally(() => {
          // дублюємо локально (як бекап) і лочимо
          try {
            localStorage.setItem(KEY, ref);
          } catch {}
          setReferral(ref);
          setLockedRef(true);
          toast.success("Реферал закріплено назавжди (цей браузер).");
        });
      return;
    }

    // 1.3 fallback: localStorage — як запасний варіант
    try {
      const stored = localStorage.getItem(KEY) || "";
      if (stored && isFriendlyTonAddress(stored)) {
        setReferral(stored);
        setLockedRef(true);
      }
    } catch {}
  }, []);

  // 2) Синхронізація калькулятора
  useEffect(() => {
    if (calcMode !== "ton2magt") return;
    const ton = Number((amountTON || "0").replace(",", "."));
    if (!isFinite(ton) || ton <= 0) {
      setAmountMAGT("");
      return;
    }
    const magt = ton / priceTonPerMagt;
    setAmountMAGT(new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 }).format(magt));
  }, [amountTON, calcMode, priceTonPerMagt]);

  useEffect(() => {
    if (calcMode !== "magt2ton") return;
    const magt = Number((amountMAGT || "0").toString().replace(/\s/g, "").replace(",", "."));
    if (!isFinite(magt) || magt <= 0) {
      setAmountTON("");
      return;
    }
    const ton = magt * priceTonPerMagt;
    setAmountTON(String(Number(ton.toFixed(2))));
  }, [amountMAGT, calcMode, priceTonPerMagt]);

  const magtPreview = useMemo(() => {
    const ton = Number((amountTON || "0").replace(",", "."));
    if (!isFinite(ton) || ton <= 0) return "0";
    const magt = ton / priceTonPerMagt;
    return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 }).format(magt);
  }, [amountTON, priceTonPerMagt]);

  async function handleBuy() {
    if (!connected) return toast.error("Підключи гаманець TON");
    if (!saleAddress) return toast.error("NEXT_PUBLIC_SALE_ADDRESS не налаштована");
    if (!agree) return toast("Підтвердь правила пресейлу", { icon: "⚠️" });

    const amt = Number((amountTON || "0").replace(",", "."));
    if (!isFinite(amt) || amt < 0.1) return toast.error("Введи суму ≥ 0.1 TON");

    const refToUse = referral && isFriendlyTonAddress(referral) ? referral : undefined;

    try {
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: saleAddress,
            amount: toNanoStr(String(amt)),
            payload: buildBuyBodyBase64(refToUse),
          },
        ],
      });
      toast.success("Транзакцію надіслано. Перевір історію у гаманці/експлорері.");
    } catch {
      toast.error("Покупка скасована або не вдалася.");
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-lg font-semibold">Купити MAGT за TON</h3>
        <span className="badge">
          Реферальна програма — 5% <small className="subtle">(Beta)</small>
        </span>
      </div>

      {/* Реферальний адрес */}
      <label className="subtle text-sm">
        Реферальний адрес {lockedRef && <>(закріплено)</>}
      </label>
      <input
        className="input"
        placeholder="EQ... (адрес друга у TON)"
        value={referral}
        onChange={(e) => setReferral(e.target.value.trim())}
        disabled={lockedRef}
      />
      {!lockedRef && referral && !isFriendlyTonAddress(referral) && (
        <div className="subtle text-xs" style={{ color: "#fca5a5" }}>
          Невірний friendly-адрес TON (очікуємо EQ…/UQ…)
        </div>
      )}
      {lockedRef && (
        <div className="subtle text-xs">Реферал збережений (cookie + localStorage).</div>
      )}

      {/* Перемикач режиму калькулятора */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn"
          onClick={() => setCalcMode("ton2magt")}
          aria-pressed={calcMode === "ton2magt"}
        >
          TON → MAGT
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setCalcMode("magt2ton")}
          aria-pressed={calcMode === "magt2ton"}
        >
          MAGT → TON
        </button>
      </div>

      {/* Поля введення */}
      {calcMode === "ton2magt" ? (
        <>
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
            <button className="btn" onClick={() => setAmountTON("100")} type="button">
              MAX
            </button>
          </div>
          <div className="subtle text-sm">
            Отримаєш ≈ <b>{magtPreview}</b> MAGT
          </div>
        </>
      ) : (
        <>
          <label className="subtle text-sm">Скільки хочеш MAGT</label>
          <input
            type="number"
            min="1"
            step="1"
            value={(amountMAGT || "").toString().replace(/\s/g, "")}
            onChange={(e) => setAmountMAGT(e.target.value)}
            className="input"
            placeholder="10000"
          />
          <div className="subtle text-sm">
            Потрібно TON ≈{" "}
            <b>{Number(amountTON || 0).toLocaleString("uk-UA", { maximumFractionDigits: 2 })}</b>
          </div>
        </>
      )}

      {/* Попередження про комісію */}
      <div className="notice">
        Мінімум 0.1 TON. Врахуйте мережеву комісію ~{gasHintMin}–{gasHintMax} TON
        (видача токенів і системні виклики).
      </div>

      {/* Згода */}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        Погоджуюсь з правилами пресейлу (безпека, блокування, обмеження)
      </label>

      {/* CTA */}
      <button className="btn btn-primary" onClick={handleBuy} disabled={!connected || !agree}>
        Купити
      </button>

      <div className="subtle text-xs">
        Адреса сейлу: <code className="opacity-90">{saleAddress || "-"}</code>
      </div>
    </div>
  );
}
