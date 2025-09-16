import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user = searchParams.get("user");
    const claim = process.env.NEXT_PUBLIC_CLAIM_ADDRESS;

    if (!user) {
      return Response.json({ ok: false, error: "user param required" }, { status: 400 });
    }
    if (!claim) {
      return Response.json({ ok: false, error: "CLAIM_ADDRESS not set" }, { status: 500 });
    }

    // TODO: тут підключимо runMethod(get_alloc) після того, як надаси адресу/опкоди ClaimManager.
    return Response.json({ ok: true, amount: "0" });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || "unknown" }, { status: 500 });
  }
}
