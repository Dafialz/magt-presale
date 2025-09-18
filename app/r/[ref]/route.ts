// app/r/[ref]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { ref: string } }) {
  const ref = params.ref;

  // Перенаправляємо на /api/ref?ref=... щоб записати cookie
  const apiUrl = new URL(`${req.nextUrl.origin}/api/ref`);
  apiUrl.searchParams.set("ref", ref);

  // Робимо бекенд-запит, щоб він встановив cookie
  const res = await fetch(apiUrl, { cache: "no-store" });

  // І потім перенаправляємо на головну сторінку
  const redirect = NextResponse.redirect(new URL("/", req.url));
  // перенесемо cookie з /api/ref у цей редірект
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) redirect.headers.set("set-cookie", setCookie);

  return redirect;
}
