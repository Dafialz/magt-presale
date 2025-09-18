// app/api/alloc/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // не кешувати на рівні Next
export const revalidate = 0;

type AllocResp =
  | { ok: true; amount: string }       // amount у мінімальних одиницях (з урахуванням DECIMALS)
  | { ok: false; error: string };

// Дуже проста перевірка friendly-адрес TON (EQ… / UQ…)
function isFriendlyTonAddress(s: string): boolean {
  return /^[EU]Q[A-Za-z0-9\-_]{46,60}$/.test(s);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user = (searchParams.get("user") || "").trim();

  if (!user) {
    return NextResponse.json<AllocResp>(
      { ok: false, error: "Missing 'user' query param" },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }

  if (!isFriendlyTonAddress(user)) {
    return NextResponse.json<AllocResp>(
      { ok: false, error: "Invalid TON friendly address (expected EQ…/UQ…)" },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }

  // TODO: під’єднати реальний бек/контракт і повернути точний баланс алокації користувача.
  // Приклад очікуваного формату:
  //   const amount = await getAllocFromChainOrDb(user);
  //   return NextResponse.json<AllocResp>({ ok: true, amount });

  // Плейсхолдер: повертаємо нульову алокацію.
  return NextResponse.json<AllocResp>(
    { ok: true, amount: "0" },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}
