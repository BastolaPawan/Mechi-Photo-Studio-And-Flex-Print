import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { SESSION_COOKIE, validSessionValue } from "@/lib/auth";

function allowed(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)mechi_admin_session=([^;]+)/);
  return !!match && validSessionValue(decodeURIComponent(match[1]));
}

function validateBody(body: Record<string, unknown>) {
  const allowedKeys = ["number","slug","name","category","icon","targetCustomer","price","originalPrice","cost","included","bonus","scarcityText","guarantee","upsell","status","featured","badge","seasonTags","slotsLimit","slotsClaimed","startsAt","endsAt","sortOrder"];
  const unknown = Object.keys(body).filter((key) => !allowedKeys.includes(key));
  if (unknown.length) throw new Error("Unexpected fields");
  if (typeof body.slug !== "string" || !/^[a-z0-9-]+$/.test(body.slug)) throw new Error("Invalid slug");
  for (const key of ["name","category","icon","targetCustomer","included","bonus","scarcityText","guarantee","upsell"]) {
    if (typeof body[key] !== "string" || (body[key] as string).length > 10000) throw new Error(`Invalid ${key}`);
  }
  for (const key of ["number","price","cost","sortOrder"]) if (!Number.isInteger(body[key]) || (body[key] as number) < 0) throw new Error(`Invalid ${key}`);
  if ((body.price as number) > 1000000 || (body.cost as number) > 1000000) throw new Error("Amount too large");
  if (!["live","draft","archived"].includes(body.status as string)) throw new Error("Invalid status");
  if (!Array.isArray(body.seasonTags) || body.seasonTags.some((tag) => typeof tag !== "string")) throw new Error("Invalid tags");
  if (typeof body.featured !== "boolean") throw new Error("Invalid featured");
  return body;
}

export async function GET() {
  const store = cookies();
  if (!validSessionValue(store.get(SESSION_COOKIE)?.value)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabaseUrl()) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const offers = await prisma.offer.findMany({ orderBy: [{ sortOrder: "asc" }, { number: "asc" }] });
  return NextResponse.json(offers, { headers: { "X-Robots-Tag": "noindex" } });
}

export async function POST(request: Request) {
  if (!allowed(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabaseUrl()) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); body = validateBody(body); } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid input" }, { status: 400 });
  }
  try {
    const offer = await prisma.offer.create({
      data: {
        ...body,
        originalPrice: body.originalPrice == null ? null : Number(body.originalPrice),
        slotsLimit: body.slotsLimit == null ? null : Number(body.slotsLimit),
        slotsClaimed: 0,
        startsAt: body.startsAt ? new Date(body.startsAt as string) : null,
        endsAt: body.endsAt ? new Date(body.endsAt as string) : null,
      } as never,
    });
    return NextResponse.json(offer);
  } catch { return NextResponse.json({ error: "Offer number or slug already exists" }, { status: 409 }); }
}
