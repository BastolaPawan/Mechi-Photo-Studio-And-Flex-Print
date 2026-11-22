import { inchesFromUnit, type Unit } from "./print-scaling";

export type FrameStyle = "none" | "thin" | "white" | "wood" | "gold";

export interface LayoutRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WallLayout {
  width: number;
  height: number;
  color: string;
  obstacles: Array<LayoutRect & { label: string; approximate: true }>;
  frames: Array<LayoutRect & { orientation: "portrait" | "landscape"; style: FrameStyle; photoName?: string }>;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clampRect(rect: LayoutRect, wallWidth: number, wallHeight: number): LayoutRect {
  return {
    ...rect,
    x: clamp(rect.x, 0, Math.max(0, wallWidth - rect.width)),
    y: clamp(rect.y, 0, Math.max(0, wallHeight - rect.height)),
  };
}

export function overlap(a: LayoutRect, b: LayoutRect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function snapPosition(
  dragged: LayoutRect,
  wallWidth: number,
  wallHeight: number,
  neighbors: LayoutRect[],
  thresholdPx: number,
  pixelsPerInch: number,
  gridStepInches: number,
  snapGrid: boolean,
): { rect: LayoutRect; guides: { x: number[]; y: number[] }; gap: number | null } {
  let x = dragged.x;
  let y = dragged.y;
  const xGuides: number[] = [];
  const yGuides: number[] = [];
  const thresholdInches = thresholdPx / Math.max(pixelsPerInch, 0.001);
  if (snapGrid) {
    x = Math.round(x / gridStepInches) * gridStepInches;
    y = Math.round(y / gridStepInches) * gridStepInches;
  }

  const draggedXs = [x, x + dragged.width / 2, x + dragged.width];
  const targetXs = [
    0, wallWidth / 2, wallWidth,
    ...neighbors.flatMap((n) => [n.x, n.x + n.width / 2, n.x + n.width]),
  ];
  let nextX = x;
  let bestX = thresholdInches;
  for (const source of draggedXs) {
    for (const target of targetXs) {
      const distance = Math.abs(source - target);
      if (distance <= bestX) {
        bestX = distance;
        nextX = x + target - source;
      }
    }
  }
  const draggedYs = [y, y + dragged.height / 2, y + dragged.height];
  const targetYs = [
    0, wallHeight / 2, wallHeight,
    ...neighbors.flatMap((n) => [n.y, n.y + n.height / 2, n.y + n.height]),
  ];
  let nextY = y;
  let bestY = thresholdInches;
  for (const source of draggedYs) {
    for (const target of targetYs) {
      const distance = Math.abs(source - target);
      if (distance <= bestY) {
        bestY = distance;
        nextY = y + target - source;
      }
    }
  }
  if (nextX !== x) xGuides.push(nextX);
  if (nextY !== y) yGuides.push(nextY);
  x = clamp(nextX, 0, Math.max(0, wallWidth - dragged.width));
  y = clamp(nextY, 0, Math.max(0, wallHeight - dragged.height));

  let gap: number | null = null;
  let nearest = Number.POSITIVE_INFINITY;
  const snappedRect = { ...dragged, x, y };
  for (const neighbor of neighbors) {
    const horizontal = snappedRect.x + snappedRect.width <= neighbor.x
      ? neighbor.x - (snappedRect.x + snappedRect.width)
      : neighbor.x + neighbor.width <= snappedRect.x
        ? snappedRect.x - (neighbor.x + neighbor.width)
        : null;
    if (horizontal !== null) {
      if (Math.abs(horizontal) < nearest) { nearest = Math.abs(horizontal); gap = horizontal; }
    }
  }
  return { rect: snappedRect, guides: { x: xGuides, y: yGuides }, gap };
}

export function distributeEvenly(rects: LayoutRect[], axis: "x" | "y"): LayoutRect[] {
  if (rects.length < 3) return rects;
  const sorted = [...rects].sort((a, b) => axis === "x" ? a.x - b.x : a.y - b.y);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const sizeKey = axis === "x" ? "width" : "height";
  const end = axis === "x" ? last.x + last.width : last.y + last.height;
  const start = axis === "x" ? first.x : first.y;
  const occupied = sorted.reduce((sum, rect) => sum + rect[sizeKey], 0);
  const gap = ((end - start) - occupied) / (sorted.length - 1);
  let cursor = start;
  const map = new Map(sorted.map((rect) => [rect.id, rect]));
  const orderedIds = sorted.map((rect) => rect.id);
  const updates = new Map<string, LayoutRect>();
  for (const id of orderedIds) {
    const rect = map.get(id)!;
    updates.set(id, axis === "x" ? { ...rect, x: cursor } : { ...rect, y: cursor });
    cursor += rect[sizeKey] + gap;
  }
  return rects.map((rect) => updates.get(rect.id) ?? rect);
}

export function wallUnitBounds(unit: Unit): { min: number; max: number } {
  if (unit === "ft") return { min: 2, max: 30 };
  if (unit === "in") return { min: 24, max: 360 };
  if (unit === "cm") return { min: 60.96, max: 914.4 };
  if (unit === "m") return { min: 0.61, max: 9.14 };
  return { min: 24, max: 360 };
}

export function valueInInches(value: number, unit: Unit): number {
  return inchesFromUnit(value, unit);
}

export function encodeLayout(layout: WallLayout): string {
  const compact = {
    w: layout.width, h: layout.height, c: layout.color,
    o: layout.obstacles.map(({ id, x, y, width, height, label }) => [id, x, y, width, height, label]),
    f: layout.frames.map(({ id, x, y, width, height, orientation, style }) => [id, x, y, width, height, orientation, style]),
  };
  const json = JSON.stringify(compact);
  if (typeof btoa === "function") {
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeLayout(encoded: string): WallLayout | null {
  try {
    let json: string;
    if (typeof atob === "function") {
      const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
      const binary = atob(padded);
      json = new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
    } else {
      json = Buffer.from(encoded, "base64url").toString("utf8");
    }
    const compact = JSON.parse(json);
    if (!compact || !Number.isFinite(compact.w) || !Number.isFinite(compact.h) || typeof compact.c !== "string") return null;
    if (!Array.isArray(compact.o) || !Array.isArray(compact.f)) return null;
    const obstacles = compact.o.slice(0, 30).map((r: unknown[]) => ({
      id: String(r[0]), x: Number(r[1]), y: Number(r[2]), width: Number(r[3]), height: Number(r[4]), label: String(r[5]), approximate: true as const,
    })).filter((r: LayoutRect & { label: string }) => [r.x, r.y, r.width, r.height].every(Number.isFinite));
    const frames = compact.f.slice(0, 30).map((r: unknown[]) => ({
      id: String(r[0]), x: Number(r[1]), y: Number(r[2]), width: Number(r[3]), height: Number(r[4]),
      orientation: r[5] === "landscape" ? "landscape" as const : "portrait" as const,
      style: ["none", "thin", "white", "wood", "gold"].includes(String(r[6])) ? r[6] as FrameStyle : "none" as FrameStyle,
    })).filter((r: LayoutRect) => [r.x, r.y, r.width, r.height].every(Number.isFinite));
    return { width: clamp(compact.w, 24, 360), height: clamp(compact.h, 24, 360), color: compact.c, obstacles, frames };
  } catch {
    return null;
  }
}
