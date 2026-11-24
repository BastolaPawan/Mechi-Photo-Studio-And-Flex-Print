import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import OfferDetail from "@/components/OfferDetail";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  if (!hasDatabaseUrl()) return { title: "Offers unavailable" };
  let offer;
  try {
    offer = await prisma.offer.findUnique({ where: { slug: params.slug } });
  } catch (error) {
    console.error("Could not load offer metadata:", error);
    return { title: "Offer unavailable" };
  }
  if (!offer || offer.status !== "live") return { title: "Offer not found" };
  return {
    title: `${offer.name} | Mechi Photo Studio`,
    description: `${offer.name} for NPR ${offer.price.toLocaleString("en-IN")}. ${offer.included}`,
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  if (!hasDatabaseUrl()) notFound();
  const now = new Date();
  let offer;
  try {
    offer = await prisma.offer.findFirst({
      where: { slug: params.slug, status: "live", OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
    });
  } catch (error) {
    console.error("Could not load offer detail:", error);
    notFound();
  }
  if (!offer || (offer.endsAt && offer.endsAt < now) || (offer.slotsLimit != null && offer.slotsLimit - offer.slotsClaimed <= 0)) notFound();
  const alternatives = await prisma.offer.findMany({
    where: { status: "live", category: offer.category, slug: { not: offer.slug }, OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    take: 3,
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
  });
  const publicOffer = {
    ...offer,
    startsAt: offer.startsAt?.toISOString() ?? null,
    endsAt: offer.endsAt?.toISOString() ?? null,
  };
  delete (publicOffer as unknown as Record<string, unknown>).cost;

  return (
    <>
      <SiteNav />
      <OfferDetail
        offer={publicOffer}
        whatsappNumber={process.env.WHATSAPP_NUMBER?.trim() || null}
        contactEmail={process.env.CONTACT_EMAIL?.trim() || null}
        alternatives={alternatives.map((item) => ({ name: item.name, slug: item.slug, price: item.price }))}
      />
    </>
  );
}
