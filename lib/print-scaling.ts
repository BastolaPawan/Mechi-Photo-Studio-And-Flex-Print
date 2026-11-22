export type Unit = "in" | "cm" | "ft" | "m";

export function inchesFromUnit(value: number, unit: Unit): number {
  if (!Number.isFinite(value)) return 0;
  if (unit === "cm") return value / 2.54;
  if (unit === "ft") return value * 12;
  if (unit === "m") return value * 39.37007874015748;
  return value;
}

export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

export function inchesToFeet(inches: number): number {
  return inches / 12;
}

export function calculatePixelsPerInch(containerWidth: number, sceneWidthInches: number): number {
  if (containerWidth <= 0 || sceneWidthInches <= 0) return 0;
  return containerWidth / sceneWidthInches;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clampPrintPosition(
  x: number,
  y: number,
  printWidth: number,
  printHeight: number,
  sceneWidth: number,
  sceneHeight: number,
) {
  return {
    x: clamp(x, 0, Math.max(0, sceneWidth - printWidth)),
    y: clamp(y, 0, Math.max(0, sceneHeight - printHeight)),
  };
}
