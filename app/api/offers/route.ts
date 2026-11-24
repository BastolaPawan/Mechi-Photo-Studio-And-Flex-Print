import { NextResponse } from "next/server";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { publicOffer } from "@/lib/offers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasDatabaseUrl()) {
    return NextResponse.json([], {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "X-Database-Status": "not-configured",
      },
    });
  }
  const now = new Date();
  let offers: Awaited<ReturnType<typeof prisma.offer.findMany>> = [];
  try {
    offers = await prisma.offer.findMany({
      where: { status: "live", OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      orderBy: [{ sortOrder: "asc" }, { number: "asc" }],
    });
  } catch (error) {
    console.error("Could not load public offers:", error);
    offers = [];
  }
  const visible = offers
    .filter((offer) => !offer.endsAt || offer.endsAt >= now)
    .filter((offer) => offer.slotsLimit == null || offer.slotsLimit - offer.slotsClaimed > 0)
    .map((offer) => publicOffer(offer as unknown as Record<string, unknown>));

  return new NextResponse(JSON.stringify(visible), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
