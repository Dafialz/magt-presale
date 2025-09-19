// app/page.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { TonConnectButton } from "@tonconnect/ui-react";
import toast from "react-hot-toast";

// Компоненти
import HeaderBar from "../components/HeaderBar";
import HeroSection from "../components/HeroSection";
import BuyPanel from "../components/BuyPanel";
import ValueProps from "../components/ValueProps";
import Tokenomics from "../components/Tokenomics";
import Roadmap from "../components/Roadmap";

/* ========= Types ========= */
type SaleApiResp =
  | {
      ok: true;
      data: {
        raisedTon: number;
        targetTon: number;
        level: number;
        priceTonPerToken: number;
        leftOnLevel: number;
        updatedAt: string;
      };
    }
  | { ok: false; error?: string };

/* ========= ENV / CONST ========= */
const SALE_ADDRESS = process.env.NEXT_PUBLIC_SALE_ADDRESS || ""; // EQ...
const PRICE_TON_PER_MAGT_FALLBACK = 0.00383;
const TARGET_TON_FALLBACK = 6_500_000;
const GAS_HINT_MIN = 0.05;
const GAS_HINT_MAX = 0.1;
const REFRESH_MS = Number(process.env.NEXT_PUBLIC_SALE_REFRESH_MS || 20000);

/* ========= Utils ========= */
function isAbortError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "name" in err && (err as { name?: string }).name === "AbortError";
}

export default function Page() {
  const [raisedTon, setRaisedTon] = useState<number>(0);
  const [targetTon, setTargetTon] = useState<number>(TARGET_TON_FALLBACK);
  const [level, setLevel] = useState<number>(1);
  const [price, setPrice] = useState<number>(PRICE_TON_PER_MAGT_FALLBACK);
  const [leftOnLevel, setLeftOnLevel] = useState<number>(0);

  const pollTimerRef = useRef<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const lastToastAtRef = useRef<number>(0);

  const fetchSaleOnce = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;

    try {
      const r = await fetch("/api/sale", { cache: "no-store", signal: ctrl.signal });
      const j: SaleApiResp = await r.json();
      if ("ok" in j && j.ok) {
        const d = j.data;
        setRaisedTon(d.raisedTon ?? 0);
        setTargetTon(d.targetTon ?? TARGET_TON_FALLBACK);
        setLevel(d.level ?? 1);
        setPrice(d.priceTonPerToken ?? PRICE_TON_PER_MAGT_FALLBACK);
        setLeftOnLevel(d.leftOnLevel ?? 0);
      } else {
        const now = Date.now();
        if (now - lastToastAtRef.current > 60_000) {
          toast.error(j?.error || "Не вдалося завантажити дані сейлу");
          lastToastAtRef.current = now;
        }
      }
    } catch (e: unknown) {
      if (isAbortError(e)) return;
      const now = Date.now();
      if (now - lastToastAtRef.current > 60_000) {
        toast.error("Проблема з мережею під час отримання даних сейлу");
        lastToastAtRef.current = now;
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchSaleOnce();

    function startPolling() {
      if (!mounted) return;
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = window.setInterval(fetchSaleOnce, Math.max(5000, REFRESH_MS));
    }
    function stopPolling() {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    const onVis = () => {
      if (document.visibilityState === "visible") {
        fetchSaleOnce();
        startPolling();
      } else {
        stopPolling();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVis);
    }

    startPolling();

    return () => {
      mounted = false;
      stopPolling();
      controllerRef.current?.abort();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVis);
      }
    };
  }, [fetchSaleOnce]);

  const progressPct = Math.min(100, Math.max(0, (raisedTon / targetTon) * 100));

  return (
    <main className="container space-y-10">
      <HeaderBar>
        <nav className="flex items-center gap-3">
          <a className="subtle hidden md:inline-block" href="#buy">Купити</a>
          <a className="subtle hidden md:inline-block" href="#why">Чому ми</a>
          <a className="subtle hidden md:inline-block" href="#token">Токеноміка</a>
          <a className="subtle hidden md:inline-block" href="#roadmap">Дорожня карта</a>
          <a className="subtle hidden md:inline-block" href="#faq">FAQ</a>
          <a className="btn btn-primary hidden md:inline-block" href="#buy">Купити MAGT</a>
          <TonConnectButton />
        </nav>
      </HeaderBar>

      <HeroSection
        targetTon={targetTon}
        raisedTon={raisedTon}
        progressPct={progressPct}
        actionLeft={<a href="#buy" className="btn btn-primary">Купити зараз</a>}
        actionRight={<a href="/whitepaper.pdf" className="btn" target="_blank" rel="noreferrer">Whitepaper</a>}
      />

      <section className="grid md:grid-cols-2 gap-8" id="buy">
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-2 border border-0 border-b border-[var(--border)]/60">
            <h3 className="text-lg font-semibold">Параметри пресейлу</h3>
            <span className="badge">Ціль: {targetTon.toLocaleString("uk-UA")} TON</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-[var(--border)]/60">
              <div className="subtle text-xs">Поточний рівень</div>
              <div className="text-xl font-semibold">{level}</div>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border)]/60">
              <div className="subtle text-xs">Ціна (за 1 MAGT)</div>
              <div className="text-xl font-semibold">
                {price.toLocaleString("uk-UA", { minimumFractionDigits: 6 })} TON
              </div>
            </div>
            <div className="p-3 rounded-lg border border-[var(--border)]/60">
              <div className="subtle text-xs">Залишок</div>
              <div className="text-xl font-semibold">
                {leftOnLevel ? leftOnLevel.toLocaleString("uk-UA") : "—"} MAGT
              </div>
            </div>
          </div>

          <div className="subtle text-sm">Прогрес збору</div>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number(progressPct.toFixed(2))}>
            <span style={{ width: `${progressPct}%` }} />
          </div>
          <div className="subtle text-xs">
            {raisedTon.toLocaleString("uk-UA")} / {targetTon.toLocaleString("uk-UA")} TON
          </div>
        </div>

        <BuyPanel
          priceTonPerMagt={price || PRICE_TON_PER_MAGT_FALLBACK}
          gasHintMin={GAS_HINT_MIN}
          gasHintMax={GAS_HINT_MAX}
          saleAddress={SALE_ADDRESS}
        />
      </section>

      <ValueProps />
      <Tokenomics />
      <Roadmap />

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
        <details className="rounded-lg border border-[var(--border)]/60 p-4">
          <summary className="font-medium cursor-pointer">Чи можна купити з біржі?</summary>
          <p className="subtle text-sm mt-2">
            Рекомендуємо купувати безпосередньо на цій сторінці пресейлу. Після лістингу на DEX з’являться торгові пули.
          </p>
        </details>
        <details className="rounded-lg border border-[var(--border)]/60 p-4">
          <summary className="font-medium cursor-pointer">Як працює реферальна програма?</summary>
          <p className="subtle text-sm mt-2">
            Вкажи адресу друга у полі «Реферальний адрес». Система нарахує 5% бонусів згідно з умовами програми.
          </p>
        </details>
      </section>

      <footer className="pt-2 pb-8 flex flex-col md:flex-row items-start md:items-center justify_between gap-3">
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
