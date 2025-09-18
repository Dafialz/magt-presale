// app/api/sale/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // не кешувати
export const revalidate = 0;

/** Опис відповіді */
type SaleInfo = {
  raisedTon: number;        // скільки зібрано (TON)
  targetTon: number;        // ціль (TON) — з .env або сума по LEVELS
  level: number;            // поточний рівень 0..19
  priceTonPerToken: number; // ціна на поточному рівні (TON за 1 MAGT)
  leftOnLevel: number;      // скільки MAGT лишилося на поточному рівні (human units)
  updatedAt: string;        // ISO час оновлення
  refreshSec?: number;      // (опц.) порада фронту, як часто опитувати
};

/**
 * Таблиця рівнів з твого `scripts/deploy-sale.ts`.
 * tokens — у «людських» одиницях (без десяткових), price — TON за 1 токен.
 */
type LevelLocal = { tokens: number; price: number };

const LEVELS: LevelLocal[] = [
  { tokens: 65225022, price: 0.003734 },
  { tokens: 57039669, price: 0.004369 },
  { tokens: 50370908, price: 0.005112 },
  { tokens: 44326399, price: 0.005981 },
  { tokens: 39007231, price: 0.006998 },
  { tokens: 34326365, price: 0.008187 },
  { tokens: 30207200, price: 0.009578 },
  { tokens: 26582336, price: 0.011207 },
  { tokens: 23392455, price: 0.013112 },
  { tokens: 20585361, price: 0.015342 },
  { tokens: 18115117, price: 0.01795 },
  { tokens: 15941303, price: 0.021001 },
  { tokens: 14028347, price: 0.024571 },
  { tokens: 12344945, price: 0.028748 },
  { tokens: 10863552, price: 0.033636 },
  { tokens: 9559925,  price: 0.039353 },
  { tokens: 8412734,  price: 0.046043 },
  { tokens: 7423267,  price: 0.053871 },
  { tokens: 6514821,  price: 0.063029 },
  { tokens: 5733043,  price: 0.073579 },
];

/** Обчислити сумарну ціль у TON як суму (tokens * price) по всіх рівнях */
function computeTotalTargetTonFromLevels(): number {
  return LEVELS.reduce((sum, L) => sum + L.tokens * L.price, 0);
}

/**
 * За сумою зібраних TON визначити:
 * - поточний рівень
 * - поточну ціну
 * - скільки токенів лишилося на поточному рівні
 */
function computeStateFromRaised(raisedTon: number) {
  // Гарантуємо невід’ємність
  let remainingTon = Math.max(0, raisedTon);

  for (let i = 0; i < LEVELS.length; i++) {
    const { tokens, price } = LEVELS[i];
    const tonNeededForLevel = tokens * price; // TON для повного продажу рівня

    if (remainingTon < tonNeededForLevel) {
      // Ми всередині рівня i
      const tokensSoldOnLevel = Math.floor(remainingTon / price); // скільки токенів «куплено» на цьому рівні
      const leftOnLevel = Math.max(0, tokens - tokensSoldOnLevel);
      return { level: i, priceTonPerToken: price, leftOnLevel };
    }

    // Інакше цей рівень повністю продано — рухаємось далі
    remainingTon -= tonNeededForLevel;
  }

  // Якщо зібране >= суми по всіх рівнях — усе розпродано
  const last = LEVELS[LEVELS.length - 1];
  return { level: LEVELS.length - 1, priceTonPerToken: last.price, leftOnLevel: 0 };
}

export async function GET(req: Request) {
  // --- Параметри керування з .env/квері для локальних тестів ---
  const url = new URL(req.url);
  const mockRaised = url.searchParams.get("mockRaised"); // ?mockRaised=1234.56
  const envRaised = process.env.NEXT_PUBLIC_RAISED_TON;

  // 1) target: з .env або з суми по рівнях (факт)
  const ENV_TARGET = Number(process.env.NEXT_PUBLIC_TARGET_TON || NaN);
  const targetFromLevels = computeTotalTargetTonFromLevels();
  const targetTon = Number.isFinite(ENV_TARGET) ? ENV_TARGET : Math.round(targetFromLevels);

  // 2) raised: з квері (для дебагу) -> з .env -> 0
  const raisedTon =
    mockRaised !== null
      ? Number(mockRaised)
      : envRaised
      ? Number(envRaised)
      : 0;

  // Обчислюємо стан
  const { level, priceTonPerToken, leftOnLevel } = computeStateFromRaised(raisedTon);

  const data: SaleInfo = {
    raisedTon: Number.isFinite(raisedTon) ? Math.max(0, raisedTon) : 0,
    targetTon,
    level,
    priceTonPerToken,
    leftOnLevel,
    updatedAt: new Date().toISOString(),
    // refreshSec можна читати на фронті, щоб підлаштувати інтервал опитування
    refreshSec: Number(process.env.NEXT_PUBLIC_SALE_REFRESH_MS || 20_000) / 1000,
  } as SaleInfo;

  return NextResponse.json(
    { ok: true, data },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}
