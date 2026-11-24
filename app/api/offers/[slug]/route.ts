import { NextResponse } from "next/server";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { publicOffer } from "@/lib/offers";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  if (!hasDatabaseUrl()) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const now = new Date();
  let offer;
  try {
    offer = await prisma.offer.findFirst({
      where: { slug: params.slug, status: "live", OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
    });
  } catch (error) {
    console.error("Could not load public offer:", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  if (!offer || (offer.endsAt && offer.endsAt < now)) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  if (offer.slotsLimit != null && offer.slotsLimit - offer.slotsClaimed <= 0)
    return NextResponse.json({ error: "Offer not available" }, { status: 404 });

  return new NextResponse(JSON.stringify(publicOffer(offer as unknown as Record<string, unknown>)), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
