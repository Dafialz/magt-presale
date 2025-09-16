// app/api/alloc/route.ts
import { NextRequest, NextResponse } from "next/server";

type AllocResp =
  | { ok: true; amount: string }
  | { ok: false; error: string };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get("user");

  if (!user) {
    return NextResponse.json<AllocResp>(
      { ok: false, error: "Missing 'user' query param" },
      { status: 400 }
    );
  }

  // TODO: під’єднати реальний бек/контракт.
  // Поки що повертаємо 0 як заглушку:
  return NextResponse.json<AllocResp>({ ok: true, amount: "0" });
}
