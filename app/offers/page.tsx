import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import OffersPage from "@/components/OffersPage";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Mangsir Wedding Season Offers | Mechi Photo Studio",
  description: "Live photography, framing and wedding offers from Mechi Photo Studio in Birtamode.",
};
export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasDatabaseUrl()) return (
    <>
      <SiteNav />
      <main className="offers-page">
        <section className="offers-catalog">
          <p className="eyebrow"><span /> Offers setup</p>
          <h1>Offers are temporarily unavailable</h1>
          <p>The database has not been configured. Set DATABASE_URL and redeploy.</p>
        </section>
      </main>
    </>
  );

  const now = new Date();
  let offers: Awaited<ReturnType<typeof prisma.offer.findMany>> = [];
  try {
    offers = await prisma.offer.findMany({
    where: { status: "live", OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
    orderBy: [{ sortOrder: "asc" }, { number: "asc" }],
    });
  } catch (error) {
    console.error("Could not load offers:", error);
    offers = [];
  }
  const visible = offers
    .filter((offer) => !offer.endsAt || offer.endsAt >= now)
    .filter((offer) => offer.slotsLimit == null || offer.slotsLimit - offer.slotsClaimed > 0)
    .map(({ cost, status, createdAt, updatedAt, ...offer }) => ({
      ...offer,
      startsAt: offer.startsAt?.toISOString() ?? null,
      endsAt: offer.endsAt?.toISOString() ?? null,
    }));

  return (
    <>
      <SiteNav />
      <OffersPage offers={visible} />
    </>
  );
}
