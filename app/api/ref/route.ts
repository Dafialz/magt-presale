// app/api/ref/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const COOKIE_NAME = "magt_ref";
const TEN_YEARS_SEC = 60 * 60 * 24 * 365 * 10;

function isFriendlyTonAddress(s: string): boolean {
  return /^[EU]Q[A-Za-z0-9\-_]{46,60}$/.test(s);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  // підтримуємо ?ref=... та ?a=... (на випадок коротких токенів у промо)
  const cand = (url.searchParams.get("ref") || url.searchParams.get("a") || "").trim();

  // Якщо cookie вже існує — не переписуємо (перший реферал «прикріплюється» назавжди)
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  if (existing) {
    return NextResponse.json(
      { ok: true, ref: existing, locked: true },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }

  if (!cand || !isFriendlyTonAddress(cand)) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid 'ref' (friendly TON address expected: EQ…/UQ…)" },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }

  const res = NextResponse.json(
    { ok: true, ref: cand, locked: false },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );

  // HttpOnly не ставимо, якщо плануєш читати cookie на фронті; якщо ТІЛЬКИ бек — можеш увімкнути httpOnly: true.
  res.cookies.set({
    name: COOKIE_NAME,
    value: cand,
    maxAge: TEN_YEARS_SEC,
    path: "/",
    sameSite: "lax",
    secure: true,
    httpOnly: false,
  });

  return res;
}
