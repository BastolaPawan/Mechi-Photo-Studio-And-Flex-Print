import { NextResponse } from "next/server";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!hasDatabaseUrl()) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  let body: { offerId?: string; type?: string; utm?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!["view", "claim_whatsapp", "claim_email", "share"].includes(body.type || ""))
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const offer = body.offerId ? await prisma.offer.findUnique({ where: { slug: body.offerId }, select: { id: true } }) : null;
  await prisma.offerEvent.create({
    data: { offerId: offer?.id ?? null, type: body.type!, utm: body.utm?.trim().slice(0, 80) || null },
  });
  return NextResponse.json({ ok: true });
}
