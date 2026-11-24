import { describe, expect, it } from "vitest";
import { comboCalculation, isOfferLiveWindow, marginPercent, profit, publicOffer, saving, slugify } from "./offers";

describe("offer utilities", () => {
  it("calculates profit and margin", () => {
    expect(profit(1000, 350)).toBe(650);
    expect(marginPercent(1000, 350)).toBe(65);
  });
  it("calculates saving", () => {
    expect(saving(10000, 7500)).toBe(2500);
    expect(saving(null, 7500)).toBe(0);
  });
  it("checks live date windows", () => {
    const now = new Date("2026-11-24T12:00:00Z");
    expect(isOfferLiveWindow({ status: "live", startsAt: null, endsAt: null }, now)).toBe(true);
    expect(isOfferLiveWindow({ status: "draft", startsAt: null, endsAt: null }, now)).toBe(false);
    expect(isOfferLiveWindow({ status: "live", startsAt: "2026-11-25T00:00:00Z", endsAt: null }, now)).toBe(false);
  });
  it("generates slugs", () => {
    expect(slugify("Mangsir Wedding Season Combo")).toBe("mangsir-wedding-season-combo");
  });
  it("calculates combo totals", () => {
    expect(comboCalculation([{ price: 100, cost: 40 }, { price: 200, cost: 80 }], 10)).toEqual({
      originalPrice: 300, cost: 120, price: 270, profit: 150, margin: 150 / 270 * 100,
    });
  });
  it("removes private cost and other admin fields from public responses", () => {
    const result = publicOffer({ slug: "test", cost: 100, status: "live", createdAt: new Date(), profit: 900 });
    expect(result).not.toHaveProperty("cost");
    expect(result).not.toHaveProperty("status");
  });
});
