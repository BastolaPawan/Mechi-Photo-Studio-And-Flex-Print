"use client";

import { useMemo, useState } from "react";

type PublicOffer = {
  number: number; slug: string; name: string; category: string; icon: string;
  price: number; originalPrice: number | null; included: string; scarcityText: string;
  badge: string | null; featured: boolean; seasonTags: string[]; slotsLimit: number | null;
  slotsClaimed: number; endsAt: string | null; sortOrder: number;
};

const npr = (value: number) => `NPR ${value.toLocaleString("en-IN")}`;

export default function OffersPage({ offers }: { offers: PublicOffer[] }) {
  const [category, setCategory] = useState("All");
  const categories = useMemo(() => ["All", ...Array.from(new Set(offers.map((offer) => offer.category)))], [offers]);
  const featured = [...offers].filter((offer) => offer.featured && offer.seasonTags.includes("mangsir"))
    .sort((a, b) => a.sortOrder - b.sortOrder)[0];
  const filtered = category === "All" ? offers : offers.filter((offer) => offer.category === category);

  return (
    <main className="offers-page">
      {featured && (
        <section className="offers-hero">
          <article className="offers-hero-card">
            {featured.badge && <span className="offers-badge">{featured.badge}</span>}
            <span className="offers-hero-icon" aria-hidden="true">{featured.icon}</span>
            <p>Mangsir Wedding Season</p>
            <h1>{featured.name}</h1>
            <div className="offers-price-row">
              <strong>{npr(featured.price)}</strong>
              {featured.originalPrice && <del>{npr(featured.originalPrice)}</del>}
            </div>
            {featured.originalPrice && featured.originalPrice > featured.price &&
              <b className="offers-save">Save NPR {(featured.originalPrice - featured.price).toLocaleString("en-IN")}</b>}
            <a className="offers-claim" href={`/offers/${featured.slug}`}>View &amp; claim offer <span>→</span></a>
          </article>
        </section>
      )}
      <section className="offers-catalog">
        <div className="offers-heading">
          <p className="eyebrow"><span /> This Mangsir</p>
          <h2>{featured ? "Wedding season offers" : "Current offers"}</h2>
        </div>
        <div className="offers-chips" aria-label="Filter offers by category">
          {categories.map((item) => (
            <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
        <div className="offers-grid">
          {filtered.map((offer) => {
            const remaining = offer.slotsLimit == null ? null : Math.max(0, offer.slotsLimit - offer.slotsClaimed);
            return (
              <article className="offer-card" key={offer.slug}>
                <div className="offer-card-top">
                  <span className="offer-icon" aria-hidden="true">{offer.icon}</span>
                  {offer.badge && <span className="offer-mini-badge">{offer.badge}</span>}
                </div>
                <h3>{offer.name}</h3>
                <p className="offer-included">{offer.included}</p>
                {remaining === 0 ? <p className="offer-sold">Sold out</p> :
                  remaining !== null ? <p className="offer-scarcity">Only {remaining} left</p> :
                  offer.scarcityText ? <p className="offer-scarcity">{offer.scarcityText}</p> : null}
                <div className="offer-card-bottom">
                  <strong>{npr(offer.price)}</strong>
                  {remaining === 0 ? <button type="button" disabled>Sold out</button> :
                    <a href={`/offers/${offer.slug}`}>Claim this offer</a>}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
