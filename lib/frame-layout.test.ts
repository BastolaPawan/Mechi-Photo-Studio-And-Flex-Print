import { describe, expect, it } from "vitest";
import { clampRect, decodeLayout, distributeEvenly, encodeLayout, overlap, snapPosition, type WallLayout } from "./frame-layout";

describe("frame layout utilities", () => {
  it("clamps rectangles inside walls", () => {
    expect(clampRect({ id: "a", x: -4, y: 30, width: 20, height: 10 }, 100, 50)).toEqual({ id: "a", x: 0, y: 30, width: 20, height: 10 });
  });

  it("detects overlap", () => {
    expect(overlap({ id: "a", x: 0, y: 0, width: 10, height: 10 }, { id: "b", x: 9, y: 9, width: 10, height: 10 })).toBe(true);
    expect(overlap({ id: "a", x: 0, y: 0, width: 10, height: 10 }, { id: "b", x: 11, y: 0, width: 10, height: 10 })).toBe(false);
  });

  it("snaps and reports neighboring gaps", () => {
    const result = snapPosition(
      { id: "b", x: 20.2, y: 10, width: 10, height: 10 }, 100, 50,
      [{ id: "a", x: 10, y: 10, width: 10, height: 10 }],
      6, 10, 1, false,
    );
    expect(result.rect.x).toBeCloseTo(20);
  });

  it("distributes three frames evenly", () => {
    const result = distributeEvenly([
      { id: "a", x: 0, y: 0, width: 10, height: 10 },
      { id: "b", x: 40, y: 0, width: 10, height: 10 },
      { id: "c", x: 90, y: 0, width: 10, height: 10 },
    ], "x");
    expect(result[1].x).toBeCloseTo(45);
  });

  it("encodes and decodes layouts without uploaded photo data", () => {
    const layout: WallLayout = {
      width: 144, height: 108, color: "#ffffff",
      obstacles: [{ id: "door", x: 0, y: 28, width: 32, height: 80, label: "Door", approximate: true }],
      frames: [{ id: "frame", x: 50, y: 20, width: 24, height: 36, orientation: "portrait", style: "wood" }],
    };
    const decoded = decodeLayout(encodeLayout(layout));
    expect(decoded?.width).toBe(144);
    expect(decoded?.frames[0].width).toBe(24);
  });
});
