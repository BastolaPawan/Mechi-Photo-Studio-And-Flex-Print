"use client";

import { useEffect, useState } from "react";

type DetailOffer = {
  number: number; slug: string; name: string; category: string; icon: string;
  targetCustomer: string; price: number; originalPrice: number | null;
  included: string; bonus: string; scarcityText: string; guarantee: string;
  upsell: string; badge: string | null; slotsLimit: number | null;
  slotsClaimed: number; endsAt: string | null;
};

export default function OfferDetail({ offer, whatsappNumber, contactEmail, alternatives }: {
  offer: DetailOffer; whatsappNumber: string | null; contactEmail: string | null;
  alternatives: Array<{ name: string; slug: string; price: number }>;
}) {
  const [countdown, setCountdown] = useState("");
  const utm = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("utm")?.slice(0, 80) || "";

  useEffect(() => {
    try {
      const key = `offer-view:${offer.slug}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        navigator.sendBeacon("/api/offers/events", new Blob([JSON.stringify({ offerId: offer.slug, type: "view", utm })], { type: "application/json" }));
      }
    } catch {}

    if (!offer.endsAt) return;
    const tick = () => {
      const diff = new Date(offer.endsAt!).getTime() - Date.now();
      if (diff <= 0) { setCountdown("Offer ended"); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor(diff % 86400000 / 3600000);
      setCountdown(`${days}d ${hours}h left`);
    };
    tick();
    const timer = window.setInterval(tick, 60000);
    return () => window.clearInterval(timer);
  }, [offer.endsAt, offer.slug, utm]);

  const claimUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi Mechi Photo Studio! I want the offer #${offer.number}: ${offer.name} (NPR ${offer.price}). Source: ${utm || "direct"}.`)}`
    : null;

  function recordClaim(type: "claim_whatsapp" | "claim_email") {
    const body = JSON.stringify({ offerId: offer.slug, type, utm });
    try { navigator.sendBeacon("/api/offers/events", new Blob([body], { type: "application/json" })); } catch {}
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: offer.name, text: `${offer.name} - NPR ${offer.price}`, url }).catch(() => {});
    } else {
      await navigator.clipboard?.writeText(url);
      alert("Link copied");
    }
  }

  const remaining = offer.slotsLimit == null ? null : Math.max(0, offer.slotsLimit - offer.slotsClaimed);

  return (
    <main className="offer-detail">
      <section className="offer-detail-card">
        {offer.badge && <span className="offers-badge">{offer.badge}</span>}
        <span className="offer-detail-icon" aria-hidden="true">{offer.icon}</span>
        <h1>{offer.name}</h1>
        {countdown && <p className="offer-countdown">{countdown}</p>}
        <div className="offer-detail-price">
          <strong>NPR {offer.price.toLocaleString("en-IN")}</strong>
          {offer.originalPrice && <del>NPR {offer.originalPrice.toLocaleString("en-IN")}</del>}
        </div>
        {remaining !== null && <p className="offer-scarcity">{remaining === 0 ? "Sold out" : `Only ${remaining} left`}</p>}
        {offer.scarcityText && <p className="offer-scarcity">{offer.scarcityText}</p>}
        <div className="offer-detail-actions">
          {claimUrl && <a className="offer-whatsapp" href={claimUrl} target="_blank" rel="noreferrer" onClick={() => recordClaim("claim_whatsapp")}>Claim this offer on WhatsApp</a>}
          {contactEmail && <a className="offer-email" href={`mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(`Offer #${offer.number}: ${offer.name}`)}`} onClick={() => recordClaim("claim_email")}>Ask by email</a>}
          <button type="button" className="offer-share" onClick={share}>Share offer</button>
        </div>
      </section>
      <section className="offer-detail-info">
        <h2>What&apos;s included</h2><p>{offer.included}</p>
        {offer.bonus && <><h2>You also get</h2><p>{offer.bonus}</p></>}
        {offer.guarantee && <><h2>Our guarantee</h2><p>{offer.guarantee}</p></>}
        <h2>Who it&apos;s for</h2><p>{offer.targetCustomer}</p>
      </section>
      {alternatives.length > 0 && <section className="offer-alternatives"><h2>You may also like</h2>
        {alternatives.map((item) => <a key={item.slug} href={`/offers/${item.slug}`}><strong>{item.name}</strong><span>NPR {item.price.toLocaleString("en-IN")}</span></a>)}
      </section>}
    </main>
  );
}
