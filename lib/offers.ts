export type OfferCore = {
  number: number;
  slug: string;
  name: string;
  category: string;
  icon: string;
  targetCustomer: string;
  price: number;
  originalPrice: number | null;
  cost: number;
  included: string;
  bonus: string;
  scarcityText: string;
  guarantee: string;
  upsell: string;
  status: string;
  featured: boolean;
  badge: string | null;
  seasonTags: string[];
  slotsLimit: number | null;
  slotsClaimed: number;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  sortOrder: number;
};

export function profit(price: number, cost: number) {
  return price - cost;
}

export function marginPercent(price: number, cost: number) {
  return price <= 0 ? 0 : (profit(price, cost) / price) * 100;
}

export function saving(originalPrice: number | null, price: number) {
  return originalPrice && originalPrice > price ? originalPrice - price : 0;
}

export function isOfferLiveWindow(offer: Pick<OfferCore, "status" | "startsAt" | "endsAt">, now = new Date()) {
  if (offer.status !== "live") return false;
  const start = offer.startsAt ? new Date(offer.startsAt) : null;
  const end = offer.endsAt ? new Date(offer.endsAt) : null;
  return (!start || start <= now) && (!end || end >= now);
}

export function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function comboCalculation(offers: Array<{ price: number; cost: number }>, discountPercent = 0) {
  const originalPrice = offers.reduce((sum, offer) => sum + offer.price, 0);
  const cost = offers.reduce((sum, offer) => sum + offer.cost, 0);
  const price = Math.round(originalPrice * (1 - discountPercent / 100));
  return { originalPrice, cost, price, profit: profit(price, cost), margin: marginPercent(price, cost) };
}

export function publicOffer<T extends Record<string, unknown>>(offer: T) {
  const result = { ...offer } as Record<string, unknown>;
  delete result.cost;
  delete result.status;
  delete result.createdAt;
  delete result.updatedAt;
  return result;
}
