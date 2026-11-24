import { NextResponse } from "next/server";
import { createSessionValue, passwordMatches, SESSION_COOKIE } from "@/lib/auth";

const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET)
    return NextResponse.json({ error: "Admin is not configured" }, { status: 503 });

  let body: { password?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid login" }, { status: 400 }); }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt <= now) attempts.set(ip, { count: 0, resetAt: now + 10 * 60 * 1000 });
  const current = attempts.get(ip)!;
  if (current.count >= 5) return NextResponse.json({ error: "Invalid login" }, { status: 429 });

  const valid = passwordMatches(body.password || "");
  if (!valid) {
    current.count += 1;
    await new Promise((resolve) => setTimeout(resolve, 300));
    return NextResponse.json({ error: "Invalid login" }, { status: 401 });
  }
  attempts.delete(ip);
  const session = createSessionValue();
  if (!session) return NextResponse.json({ error: "Invalid login" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, session, { httpOnly: true, secure: true, sameSite: "strict", expires: new Date(Date.now() + 7 * 86400000), path: "/" });
  return response;
}
