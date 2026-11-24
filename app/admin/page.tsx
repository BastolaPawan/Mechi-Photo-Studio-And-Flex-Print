import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminOffers from "@/components/AdminOffers";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";
import { SESSION_COOKIE, validSessionValue } from "@/lib/auth";

export default async function AdminPage() {
  const session = cookies().get(SESSION_COOKIE)?.value;
  if (!validSessionValue(session)) redirect("/admin/login");
  if (!hasDatabaseUrl()) {
    return <main className="admin-page"><h1>Admin offers unavailable</h1><p>Set DATABASE_URL before using the admin panel.</p></main>;
  }
  let offers;
  try {
    offers = await prisma.offer.findMany({ orderBy: [{ sortOrder: "asc" }, { number: "asc" }] });
  } catch (error) {
    console.error("Could not load admin offers:", error);
    return <main className="admin-page"><h1>Database unavailable</h1><p>Check DATABASE_URL and the Neon database connection.</p></main>;
  }
  const safe = offers.map((offer) => ({
    ...offer,
    startsAt: offer.startsAt?.toISOString() ?? null,
    endsAt: offer.endsAt?.toISOString() ?? null,
  }));
  return <AdminOffers initial={safe} />;
}
