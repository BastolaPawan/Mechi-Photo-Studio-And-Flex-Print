import { NextResponse } from "next/server";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { validSessionValue } from "@/lib/auth";

function allowed(request: Request) {
  const match = (request.headers.get("cookie") || "").match(/(?:^|;\s*)mechi_admin_session=([^;]+)/);
  return !!match && validSessionValue(decodeURIComponent(match[1]));
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!allowed(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabaseUrl()) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const data: Record<string, unknown> = {};
  const fields = ["number","slug","name","category","icon","targetCustomer","price","originalPrice","cost","included","bonus","scarcityText","guarantee","upsell","status","featured","badge","seasonTags","slotsLimit","slotsClaimed","startsAt","endsAt","sortOrder"];
  for (const key of fields) if (key in body) data[key] = body[key];
  if (typeof data.slug === "string" && !/^[a-z0-9-]+$/.test(data.slug)) return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  if ("startsAt" in data) data.startsAt = data.startsAt ? new Date(data.startsAt as string) : null;
  if ("endsAt" in data) data.endsAt = data.endsAt ? new Date(data.endsAt as string) : null;
  try {
    const offer = await prisma.offer.update({ where: { id: params.id }, data: data as never });
    return NextResponse.json(offer);
  } catch { return NextResponse.json({ error: "Update failed" }, { status: 400 }); }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!allowed(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabaseUrl()) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  await prisma.offer.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
