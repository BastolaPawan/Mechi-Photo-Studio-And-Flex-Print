import { describe, expect, it } from "vitest";
import {
  calculatePixelsPerInch,
  clamp,
  clampPrintPosition,
  inchesFromUnit,
  inchesToCm,
  inchesToFeet,
} from "./print-scaling";

describe("print scaling utilities", () => {
  it("converts inches, cm and feet", () => {
    expect(inchesToCm(12)).toBeCloseTo(30.48);
    expect(inchesToFeet(36)).toBe(3);
    expect(inchesFromUnit(30.48, "cm")).toBeCloseTo(12);
    expect(inchesFromUnit(3, "ft")).toBe(36);
  });

  it("calculates one pixels-per-inch scale", () => {
    expect(calculatePixelsPerInch(840, 84)).toBe(10);
    expect(calculatePixelsPerInch(420, 84)).toBe(5);
  });

  it("clamps values and print positions", () => {
    expect(clamp(120, 0, 100)).toBe(100);
    expect(clamp(-2, 0, 100)).toBe(0);
    expect(clampPrintPosition(-10, 500, 100, 50, 300, 200)).toEqual({ x: 0, y: 150 });
  });
});
