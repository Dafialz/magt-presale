// app/r/[ref]/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = { params: { ref: string } };

export async function GET(req: Request, { params }: RouteContext) {
  const ref = params?.ref ?? "";

  // Викликаємо бекенд-ендпоінт, щоб він встановив cookie
  const apiUrl = new URL("/api/ref", new URL(req.url).origin);
  if (ref) apiUrl.searchParams.set("ref", ref);

  let setCookie: string | null = null;
  try {
    const res = await fetch(apiUrl.toString(), { cache: "no-store" });
    setCookie = res.headers.get("set-cookie");
  } catch {
    // тихо падаємо — все одно редіректимо на головну
  }

  // Редірект на головну
  const redirect = NextResponse.redirect(new URL("/", req.url), { status: 302 });
  redirect.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  if (setCookie) redirect.headers.set("set-cookie", setCookie);

  return redirect;
}
