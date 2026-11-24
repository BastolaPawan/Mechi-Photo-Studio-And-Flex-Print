"use client";

import { useEffect, useState } from "react";

type Offer = {
  id: string; number: number; slug: string; name: string; category: string; icon: string;
  targetCustomer: string; price: number; originalPrice: number | null; cost: number;
  included: string; bonus: string; scarcityText: string; guarantee: string; upsell: string;
  status: string; featured: boolean; badge: string | null; seasonTags: string[];
  slotsLimit: number | null; slotsClaimed: number; startsAt: string | null; endsAt: string | null; sortOrder: number;
};

const empty = (number = 1): Offer => ({
  id: "", number, slug: "", name: "", category: "", icon: "⭐", targetCustomer: "",
  price: 0, originalPrice: null, cost: 0, included: "", bonus: "", scarcityText: "",
  guarantee: "", upsell: "", status: "draft", featured: false, badge: null,
  seasonTags: [], slotsLimit: null, slotsClaimed: 0, startsAt: null, endsAt: null, sortOrder: number,
});

export default function AdminOffers({ initial }: { initial: Offer[] }) {
  const [offers, setOffers] = useState(initial);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [search, setSearch] = useState("");
  const margin = editing && editing.price > 0 ? ((editing.price - editing.cost) / editing.price) * 100 : 0;

  async function save() {
    if (!editing) return;
    const method = editing.id ? "PATCH" : "POST";
    const url = editing.id ? `/api/admin/offers/${editing.id}` : "/api/admin/offers";
    const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
    if (!response.ok) { alert((await response.json()).error || "Save failed"); return; }
    const saved = await response.json();
    setOffers((current) => editing.id ? current.map((offer) => offer.id === saved.id ? saved : offer) : [saved, ...current]);
    setEditing(null);
  }

  async function update(id: string, patch: Partial<Offer>) {
    const response = await fetch(`/api/admin/offers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (!response.ok) return;
    const saved = await response.json();
    setOffers((current) => current.map((offer) => offer.id === id ? saved : offer));
  }

  async function removeOffer(offer: Offer) {
    if (!confirm(`Delete "${offer.name}"?`)) return;
    if (confirm("Archive instead? Choose Cancel to delete permanently.")) {
      await update(offer.id, { status: "archived" });
      return;
    }
    await fetch(`/api/admin/offers/${offer.id}`, { method: "DELETE" });
    setOffers((current) => current.filter((item) => item.id !== offer.id));
  }

  async function markBooked(offer: Offer) {
    await update(offer.id, { slotsClaimed: offer.slotsClaimed + 1 });
  }

  const filtered = offers.filter((offer) => `${offer.number} ${offer.name} ${offer.category}`.toLowerCase().includes(search.toLowerCase()));
  function field(key: keyof Offer, value: unknown) { if (editing) setEditing({ ...editing, [key]: value }); }

  return (
    <main className="admin-page">
      <header className="admin-header"><div><p className="eyebrow"><span /> Admin</p><h1>Offers</h1></div><button type="button" onClick={() => setEditing(empty(Math.max(0, ...offers.map((o) => o.number)) + 1))}>+ Add offer</button></header>
      {editing ? (
        <section className="admin-editor">
          <h2>{editing.id ? "Edit offer" : "Add offer"}</h2>
          <div className="admin-fields">
            {([
              ["number","Number","number"],["slug","Slug","text"],["name","Name","text"],["category","Category","text"],["icon","Icon","text"],
              ["targetCustomer","Target customer","text"],["included","Included","text"],["bonus","Bonus","text"],["scarcityText","Scarcity text","text"],
              ["guarantee","Guarantee","text"],["upsell","Upsell","text"],["badge","Badge","text"],
            ] as const).map(([key,label,type]) => (
              <label key={key}>{label}<input type={type} value={String(editing[key] ?? "")} onChange={(event) => field(key, type === "number" ? Number(event.target.value) : event.target.value)} /></label>
            ))}
            <label>Price<input type="number" value={editing.price} onChange={(event) => field("price", Number(event.target.value))} /></label>
            <label>Original price<input type="number" value={editing.originalPrice ?? ""} onChange={(event) => field("originalPrice", event.target.value ? Number(event.target.value) : null)} /></label>
            <label>Cost <small>(private)</small><input type="number" value={editing.cost} onChange={(event) => field("cost", Number(event.target.value))} /></label>
            <label>Status<select value={editing.status} onChange={(event) => field("status", event.target.value)}><option value="draft">Draft</option><option value="live">Live</option><option value="archived">Archived</option></select></label>
            <label>Season tags<input value={editing.seasonTags.join(", ")} onChange={(event) => field("seasonTags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} /></label>
            <label>Slots limit<input type="number" value={editing.slotsLimit ?? ""} onChange={(event) => field("slotsLimit", event.target.value ? Number(event.target.value) : null)} /></label>
            <label>Start (Nepal time)<input type="datetime-local" value={editing.startsAt ? editing.startsAt.slice(0,16) : ""} onChange={(event) => field("startsAt", event.target.value ? new Date(event.target.value).toISOString() : null)} /></label>
            <label>End (Nepal time)<input type="datetime-local" value={editing.endsAt ? editing.endsAt.slice(0,16) : ""} onChange={(event) => field("endsAt", event.target.value ? new Date(event.target.value).toISOString() : null)} /></label>
            <label>Sort order<input type="number" value={editing.sortOrder} onChange={(event) => field("sortOrder", Number(event.target.value))} /></label>
            <label className="admin-check"><input type="checkbox" checked={editing.featured} onChange={(event) => field("featured", event.target.checked)} /> Featured</label>
          </div>
          <div className={margin < 40 ? "admin-margin admin-margin-warn" : "admin-margin"}>Profit: NPR {(editing.price - editing.cost).toLocaleString("en-IN")} · Margin: {margin.toFixed(1)}%
            {margin < 40 && " — below your target margin"}</div>
          <div className="admin-actions"><button type="button" className="admin-save" onClick={save}>Save offer</button><button type="button" onClick={() => setEditing(null)}>Cancel</button></div>
        </section>
      ) : (
        <>
          <div className="admin-toolbar"><input aria-label="Search offers" placeholder="Search offers" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <div className="admin-list">
            {filtered.map((offer) => {
              const value = offer.price > 0 ? (offer.price - offer.cost) / offer.price * 100 : 0;
              return (
                <article className="admin-row" key={offer.id}>
                  <span className="admin-row-icon" aria-hidden="true">{offer.icon}</span>
                  <div className="admin-row-name"><b>#{offer.number} {offer.name}</b><small>NPR {offer.price.toLocaleString("en-IN")}</small></div>
                  <span className={`admin-margin-badge ${value < 40 ? "red" : value <= 55 ? "amber" : "green"}`}>{value.toFixed(0)}%</span>
                  <span className="admin-status">{offer.status}</span>
                  <div className="admin-row-actions">
                    <button type="button" onClick={() => update(offer.id, { status: offer.status === "live" ? "draft" : "live" })}>{offer.status === "live" ? "Set draft" : "Set live"}</button>
                    <button type="button" onClick={() => update(offer.id, { featured: !offer.featured })}>{offer.featured ? "Unfeature" : "Feature"}</button>
                    <button type="button" onClick={() => setEditing({ ...offer })}>Edit</button>
                    {offer.slotsLimit != null && <button type="button" onClick={() => markBooked(offer)}>Mark as booked</button>}
                    <button type="button" onClick={() => removeOffer(offer)}>Delete</button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
