"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { printSizes } from "@/data/print-sizes.config";
import { printPrices } from "@/data/print-prices.config";
import { quickStartTemplates } from "@/data/frame-layout.config";
import {
  clampRect,
  decodeLayout,
  distributeEvenly,
  encodeLayout,
  overlap,
  snapPosition,
  wallUnitBounds,
  valueInInches,
  type FrameStyle,
  type LayoutRect,
  type WallLayout,
} from "@/lib/frame-layout";
import type { Unit } from "@/lib/print-scaling";

type Tab = "wall" | "obstacles" | "frames" | "summary";
type FrameItem = LayoutRect & { orientation: "portrait" | "landscape"; style: FrameStyle; photoName?: string };
type ObstacleItem = LayoutRect & { label: string; approximate: true };

const STORAGE_KEY = "mechi-frame-layout-v1";
const wallColors = [
  ["#fffdf8", "White"], ["#f4edda", "Cream"], ["#dfe3e6", "Light grey"],
  ["#b9c8ad", "Sage green"], ["#b9d8ea", "Sky blue"], ["#eccdd1", "Blush pink"],
  ["#62666b", "Charcoal"], ["#b96f4f", "Terracotta"],
] as const;

const makeId = (prefix: string) => `${prefix}-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;

function emptyLayout(): WallLayout {
  return { width: 144, height: 108, color: "#fffdf8", obstacles: [], frames: [] };
}

export default function FrameLayoutMaker() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ kind: "frame" | "obstacle"; id: string; offsetX: number; offsetY: number } | null>(null);
  const historyPast = useRef<WallLayout[]>([]);
  const historyFuture = useRef<WallLayout[]>([]);
  const photoUrls = useRef<Record<string, string>>({});

  const [layout, setLayout] = useState<WallLayout>(emptyLayout);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [selectedObstacleId, setSelectedObstacleId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("wall");
  const [wallUnit, setWallUnit] = useState<Unit>("ft");
  const [wallWidthInput, setWallWidthInput] = useState("12");
  const [wallHeightInput, setWallHeightInput] = useState("9");
  const [wallError, setWallError] = useState("");
  const [canvasPixels, setCanvasPixels] = useState({ width: 328, height: 246 });
  const [snapGrid, setSnapGrid] = useState(true);
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [dragGap, setDragGap] = useState<number | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [presetId, setPresetId] = useState(printSizes.find((item) => item.id === "12x18")?.id ?? "12x18");
  const [customMode, setCustomMode] = useState(false);
  const [customUnit, setCustomUnit] = useState<Unit>("in");
  const [customWidth, setCustomWidth] = useState("12");
  const [customHeight, setCustomHeight] = useState("18");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [frameStyle, setFrameStyle] = useState<FrameStyle>("none");

  const ppi = canvasPixels.width / layout.width;
  const previewHeight = Math.min(420, Math.max(240, layout.height * ppi));

  useEffect(() => {
    let restored = null;
    const hash = window.location.hash;
    if (hash.startsWith("#layout=")) restored = decodeLayout(decodeURIComponent(hash.slice("#layout=".length)));
    if (!restored) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) restored = decodeLayout(saved);
      } catch {}
    }
    if (restored) {
      setLayout(restored);
      setWallWidthInput((restored.width / (wallUnit === "ft" ? 12 : wallUnit === "cm" ? 2.54 : wallUnit === "m" ? 39.37007874015748 : 1)).toFixed(1));
      setWallHeightInput((restored.height / (wallUnit === "ft" ? 12 : wallUnit === "cm" ? 2.54 : wallUnit === "m" ? 39.37007874015748 : 1)).toFixed(1));
    }
  }, []);

  useEffect(() => {
    fetch("/api/print-config").then((r) => r.json()).then((config: { whatsappNumber?: string | null }) => setWhatsappNumber(config.whatsappNumber ?? null)).catch(() => setWhatsappNumber(null));
  }, []);

  useEffect(() => {
    const update = () => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setCanvasPixels({ width: rect.width, height: rect.height });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, encodeLayout(layout)); } catch {}
  }, [layout]);

  useEffect(() => () => {
    Object.values(photoUrls.current).forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const applyLayout = (next: WallLayout, record = true) => {
    if (record) historyPast.current = [...historyPast.current.slice(-19), layout];
    historyFuture.current = [];
    setLayout(next);
  };

  const undo = () => {
    const previous = historyPast.current.pop();
    if (!previous) return;
    historyFuture.current.push(layout);
    setLayout(previous);
  };

  const redo = () => {
    const next = historyFuture.current.pop();
    if (!next) return;
    historyPast.current.push(layout);
    setLayout(next);
  };

  const updateWallDimension = (which: "width" | "height", value: string) => {
    if (which === "width") setWallWidthInput(value); else setWallHeightInput(value);
    const widthValue = which === "width" ? Number(value) : Number(wallWidthInput);
    const heightValue = which === "height" ? Number(value) : Number(wallHeightInput);
    const bounds = wallUnitBounds(wallUnit);
    if (!Number.isFinite(widthValue) || !Number.isFinite(heightValue) || widthValue < bounds.min || widthValue > bounds.max || heightValue < bounds.min || heightValue > bounds.max) {
      setWallError(`Use wall sizes from ${bounds.min.toFixed(wallUnit === "ft" ? 0 : 1)} to ${bounds.max.toFixed(wallUnit === "ft" ? 0 : 1)} ${wallUnit}.`);
      return;
    }
    setWallError("");
    const width = valueInInches(widthValue, wallUnit);
    const height = valueInInches(heightValue, wallUnit);
    applyLayout({ ...layout, width, height }, false);
  };

  const changeWallUnit = (unit: Unit) => {
    const oldWidth = valueInInches(Number(wallWidthInput), wallUnit);
    const oldHeight = valueInInches(Number(wallHeightInput), wallUnit);
    setWallUnit(unit);
    const divisor = unit === "ft" ? 12 : unit === "cm" ? 2.54 : unit === "m" ? 39.37007874015748 : 1;
    setWallWidthInput((oldWidth / divisor).toFixed(unit === "in" ? 0 : 1));
    setWallHeightInput((oldHeight / divisor).toFixed(unit === "in" ? 0 : 1));
  };

  const addObstacle = (kind: "Door" | "Window" | "Switchboard" | "AC / other") => {
    const presets = kind === "Door" ? { width: 32, height: 80 }
      : kind === "Window" ? { width: 48, height: 36 }
        : kind === "Switchboard" ? { width: 6, height: 4 } : { width: 36, height: 18 };
    const item: ObstacleItem = {
      id: makeId("obstacle"), x: Math.max(0, (layout.width - presets.width) / 2),
      y: kind === "Door" ? layout.height - presets.height : Math.max(0, (layout.height - presets.height) / 2),
      ...presets, label: kind, approximate: true,
    };
    applyLayout({ ...layout, obstacles: [...layout.obstacles, item] });
    setSelectedObstacleId(item.id);
    setTab("obstacles");
  };

  const updateObstacle = (id: string, patch: Partial<ObstacleItem>) => {
    applyLayout({
      ...layout,
      obstacles: layout.obstacles.map((item) => item.id === id ? clampRect({ ...item, ...patch }, layout.width, layout.height) as ObstacleItem : item),
    });
  };

  const addFrame = () => {
    if (layout.frames.length >= 30) return;
    let width: number;
    let height: number;
    if (customMode) {
      width = valueInInches(Number(customWidth), customUnit);
      height = valueInInches(Number(customHeight), customUnit);
    } else {
      const preset = printSizes.find((item) => item.id === presetId) ?? printSizes[0];
      width = preset.widthInches;
      height = preset.heightInches;
    }
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
    if (orientation === "landscape" && width < height) [width, height] = [height, width];
    if (orientation === "portrait" && width > height) [width, height] = [height, width];
    const frame: FrameItem = {
      id: makeId("frame"), width, height, x: Math.max(0, (layout.width - width) / 2),
      y: Math.max(0, (layout.height - height) / 2), orientation, style: frameStyle,
    };
    applyLayout({ ...layout, frames: [...layout.frames, frame] });
    setSelectedFrame(frame.id);
    setTab("frames");
  };

  const updateFrame = (id: string, patch: Partial<FrameItem>) => {
    applyLayout({
      ...layout,
      frames: layout.frames.map((item) => item.id === id ? clampRect({ ...item, ...patch }, layout.width, layout.height) as FrameItem : item),
    });
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>, kind: "frame" | "obstacle", id: string) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const item = kind === "frame" ? layout.frames.find((f) => f.id === id) : layout.obstacles.find((o) => o.id === id);
    if (!item) return;
    dragRef.current = { kind, id, offsetX: event.clientX - rect.left - item.x * ppi, offsetY: event.clientY - rect.top - item.y * ppi };
    historyPast.current = [...historyPast.current.slice(-19), layout];
    historyFuture.current = [];
    if (kind === "frame") setSelectedFrame(id); else setSelectedObstacleId(id);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const list = drag.kind === "frame" ? layout.frames : layout.obstacles;
    const item = list.find((entry) => entry.id === drag.id);
    if (!item) return;
    const proposed = {
      ...item,
      x: (event.clientX - rect.left - drag.offsetX) / ppi,
      y: (event.clientY - rect.top - drag.offsetY) / ppi,
    };
    const neighbors = drag.kind === "frame" ? layout.frames.filter((entry) => entry.id !== drag.id) : layout.obstacles.filter((entry) => entry.id !== drag.id);
    const snapped = snapPosition(proposed, layout.width, layout.height, neighbors, 6, ppi, 1, snapGrid);
    const clamped = clampRect(snapped.rect, layout.width, layout.height);
    setGuides(snapped.guides);
    setDragGap(snapped.gap);
    if (drag.kind === "frame") {
      setLayout((current) => ({ ...current, frames: current.frames.map((entry) => entry.id === drag.id ? clamped as FrameItem : entry) }));
    } else {
      setLayout((current) => ({ ...current, obstacles: current.obstacles.map((entry) => entry.id === drag.id ? clamped as ObstacleItem : entry) }));
    }
  };

  const stopDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
    setGuides({ x: [], y: [] });
    setDragGap(null);
  };

  const nudgeSelected = (dx: number, dy: number) => {
    if (!selectedFrame) return;
    const frame = layout.frames.find((item) => item.id === selectedFrame);
    if (!frame) return;
    updateFrame(frame.id, clampRect({ ...frame, x: frame.x + dx, y: frame.y + dy }, layout.width, layout.height));
  };

  const alignSelected = (axis: "horizontal" | "vertical") => {
    if (!selectedFrame) return;
    const frame = layout.frames.find((item) => item.id === selectedFrame);
    if (!frame) return;
    updateFrame(frame.id, axis === "horizontal"
      ? { x: (layout.width - frame.width) / 2 }
      : { y: (layout.height - frame.height) / 2 });
  };

  const distributeSelected = () => {
    const result = distributeEvenly(layout.frames, "x");
    applyLayout({ ...layout, frames: result as FrameItem[] });
  };

  const rotateSelected = () => {
    if (!selectedFrame) return;
    const frame = layout.frames.find((item) => item.id === selectedFrame);
    if (!frame) return;
    updateFrame(frame.id, { width: frame.height, height: frame.width, orientation: frame.orientation === "portrait" ? "landscape" : "portrait" });
  };

  const duplicateSelected = () => {
    if (!selectedFrame || layout.frames.length >= 30) return;
    const frame = layout.frames.find((item) => item.id === selectedFrame);
    if (!frame) return;
    const copy = { ...frame, id: makeId("frame"), x: frame.x + 6, y: frame.y + 6 };
    applyLayout({ ...layout, frames: [...layout.frames, clampRect(copy, layout.width, layout.height) as FrameItem] });
  };

  const deleteSelected = () => {
    if (!selectedFrame) return;
    applyLayout({ ...layout, frames: layout.frames.filter((item) => item.id !== selectedFrame) });
    setSelectedFrame(null);
  };

  const clearFrames = () => {
    if (!window.confirm("Clear all frames?")) return;
    applyLayout({ ...layout, frames: [] });
    setSelectedFrame(null);
  };

  const resetLayout = () => {
    if (!window.confirm("Reset this layout?")) return;
    applyLayout(emptyLayout());
    setWallWidthInput("12");
    setWallHeightInput("9");
    setWallUnit("ft");
  };

  const applyTemplate = (templateId: string) => {
    const template = quickStartTemplates.find((item) => item.id === templateId);
    if (!template) return;
    const frames: FrameItem[] = template.frames.slice(0, 30).map((frame, index) => ({
      id: makeId("frame"), width: frame.width, height: frame.height,
      x: Math.max(0, (layout.width - frame.width) / 2) + (index - (template.frames.length - 1) / 2) * 8,
      y: Math.max(20, (layout.height - frame.height) / 2),
      orientation: frame.height >= frame.width ? "portrait" : "landscape", style: "none",
    })).map((frame) => clampRect(frame, layout.width, layout.height) as FrameItem);
    applyLayout({ ...layout, frames });
  };

  const shareText = useMemo(() => {
    return `Wall ${layout.width / 12 >= 1 ? `${(layout.width / 12).toFixed(1)} ft` : `${layout.width.toFixed(0)} in`} × ${(layout.height / 12).toFixed(1)} ft. ${layout.frames.length} frames.`;
  }, [layout]);

  const shareLayout = async () => {
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#layout=${encodeLayout(layout)}`;
    const data = { title: "My Frame Layout", text: shareText, url };
    if (navigator.share) {
      await navigator.share(data).catch(() => undefined);
    } else {
      try { await navigator.clipboard.writeText(url); } catch {
        window.prompt("Copy this layout link", url);
      }
    }
  };

  const downloadPreview = () => {
    const canvas = document.createElement("canvas");
    const scale = 800 / layout.width;
    canvas.width = 800;
    canvas.height = Math.round(layout.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = layout.color;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textBaseline = "middle";
    context.textAlign = "center";

    for (const obstacle of layout.obstacles) {
      context.fillStyle = "rgba(120,92,70,.28)";
      context.fillRect(obstacle.x * scale, obstacle.y * scale, obstacle.width * scale, obstacle.height * scale);
      context.strokeStyle = "#7b6a5d";
      context.setLineDash([6, 4]);
      context.strokeRect(obstacle.x * scale, obstacle.y * scale, obstacle.width * scale, obstacle.height * scale);
      context.setLineDash([]);
      context.fillStyle = "#263348";
      context.font = "bold 14px Arial";
      context.fillText(`${obstacle.label} (approx.)`, (obstacle.x + obstacle.width / 2) * scale, (obstacle.y + obstacle.height / 2) * scale);
    }

    const photoLoads: Array<Promise<{ frame: FrameItem; image: HTMLImageElement }>> = [];

    for (const frame of layout.frames) {
      const x = frame.x * scale;
      const y = frame.y * scale;
      const w = frame.width * scale;
      const h = frame.height * scale;

      const gradient = context.createLinearGradient(x, y, x + w, y + h);
      gradient.addColorStop(0, "#f6bd7a");
      gradient.addColorStop(0.58, "#7d9da8");
      gradient.addColorStop(1, "#39485c");
      context.fillStyle = gradient;
      context.fillRect(x, y, w, h);

      context.shadowColor = "rgba(0,0,0,.28)";
      context.shadowBlur = 10;
      context.shadowOffsetY = 5;
      context.shadowColor = "transparent";

      const colors: Record<FrameStyle, string | null> = { none: null, thin: "#171717", white: "#ffffff", wood: "#9a6942", gold: "#c9a227" };
      if (colors[frame.style]) {
        context.strokeStyle = colors[frame.style]!;
        context.lineWidth = frame.style === "thin" ? 5 : 8;
        context.strokeRect(x, y, w, h);
      }

      const url = photoUrls.current[frame.id];
      if (url) {
        photoLoads.push(new Promise((resolve) => {
          const image = new Image();
          image.onload = () => resolve({ frame, image });
          image.onerror = () => resolve({ frame, image });
          image.src = url;
        }));
      }
    }

    void Promise.all(photoLoads).then((loadedPhotos) => {
      for (const { frame, image } of loadedPhotos) {
        if (!image.complete || image.naturalWidth === 0) continue;
        const x = frame.x * scale;
        const y = frame.y * scale;
        const w = frame.width * scale;
        const h = frame.height * scale;
        context.save();
        context.beginPath();
        context.rect(x + 5, y + 5, w - 10, h - 10);
        context.clip();
        const ratio = Math.max(w / image.width, h / image.height);
        const iw = image.width * ratio;
        const ih = image.height * ratio;
        context.drawImage(image, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
        context.restore();
      }
      canvas.toBlob((blob) => blob && downloadBlob(blob), "image/png");
    });
  };

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mechi-frame-layout.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const uploadPhoto = (frameId: string, file?: File) => {
    if (!file) return;
    if (photoUrls.current[frameId]) URL.revokeObjectURL(photoUrls.current[frameId]);
    photoUrls.current[frameId] = URL.createObjectURL(file);
    updateFrame(frameId, { photoName: file.name });
  };

  const frameSummary = useMemo(() => {
    const groups = new Map<string, { count: number; width: number; height: number; orientation: "portrait" | "landscape" }>();
    layout.frames.forEach((frame) => {
      const key = `${frame.width}-${frame.height}-${frame.orientation}`;
      const current = groups.get(key);
      if (current) current.count += 1;
      else groups.set(key, { count: 1, width: frame.width, height: frame.height, orientation: frame.orientation });
    });
    return Array.from(groups.values());
  }, [layout.frames]);

  const estimatedTotal = frameSummary.reduce((total, group) => {
    const preset = printSizes.find((item) => item.widthInches === group.width && item.heightInches === group.height)
      ?? printSizes.find((item) => item.heightInches === group.width && item.widthInches === group.height);
    return total + (preset ? (printPrices[preset.id] ?? 0) * group.count : 0);
  }, 0);

  const utmText = () => {
    const params = new URLSearchParams(window.location.search);
    const entries = Array.from(params.entries()).filter(([key]) => key === "utm" || key.startsWith("utm_"));
    return entries.length ? entries.map(([key, value]) => `${key}=${value}`).join(", ") : "direct";
  };

  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hi Mechi Photo Studio! I planned a wall layout.\nWall: ${layout.width.toFixed(1)} x ${layout.height.toFixed(1)} in\nWall color: ${layout.color}\nFrames: ${layout.frames.length}\n${frameSummary.map((group) => `${group.count} x ${group.width.toFixed(1)}x${group.height.toFixed(1)} in ${group.orientation}`).join(", ") || "No frames"}\nLayout link: ${window.location.origin}${window.location.pathname}${window.location.search}#layout=${encodeLayout(layout)}\nSource: ${utmText()}`,
  )}` : null;

  const selected = layout.frames.find((frame) => frame.id === selectedFrame);
  const selectedObstacle = layout.obstacles.find((item) => item.id === selectedObstacleId);

  return (
    <main className="frame-layout-page">
      <header className="frame-layout-header">
        <Link href="/tools" aria-label="Back to tools">← Tools</Link>
        <h1>Frame Layout Maker</h1>
        <button type="button" onClick={shareLayout}>Share</button>
      </header>

      <div className="frame-layout-shell">
        <section className="frame-layout-preview" aria-label="Wall preview">
          <div
            className="frame-layout-canvas"
            ref={canvasRef}
            style={{ height: `${previewHeight}px`, background: layout.color }}
            onKeyDown={(event) => {
              if (!selectedFrame) return;
              const amount = event.shiftKey ? 6 : 1;
              if (event.key === "ArrowLeft") { event.preventDefault(); nudgeSelected(-amount, 0); }
              if (event.key === "ArrowRight") { event.preventDefault(); nudgeSelected(amount, 0); }
              if (event.key === "ArrowUp") { event.preventDefault(); nudgeSelected(0, -amount); }
              if (event.key === "ArrowDown") { event.preventDefault(); nudgeSelected(0, amount); }
            }}
          >
            <span className="frame-wall-badge">{(layout.width / 12).toFixed(1)} × {(layout.height / 12).toFixed(1)} ft</span>
            {layout.obstacles.map((obstacle) => (
              <div
                key={obstacle.id}
                className={`layout-obstacle ${selectedObstacleId === obstacle.id ? "selected" : ""}`}
                style={{ left: obstacle.x * ppi, top: obstacle.y * ppi, width: obstacle.width * ppi, height: obstacle.height * ppi }}
                onPointerDown={(event) => onPointerDown(event, "obstacle", obstacle.id)}
                onPointerMove={onPointerMove}
                onPointerUp={stopDrag}
                onPointerCancel={stopDrag}
              >
                {obstacle.label}<small>{obstacle.width.toFixed(0)} × {obstacle.height.toFixed(0)} in · tentative</small>
              </div>
            ))}
            {layout.frames.map((frame) => {
              const blockedByObstacle = layout.obstacles.some((obstacle) => overlap(frame, obstacle));
              const blockedByFrame = layout.frames.some((other) => other.id !== frame.id && overlap(frame, other));
              const url = photoUrls.current[frame.id];
              return (
                <div
                  key={frame.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${frame.width} by ${frame.height} inch frame`}
                  className={`layout-frame frame-style-${frame.style} ${selectedFrame === frame.id ? "selected" : ""} ${blockedByObstacle || blockedByFrame ? "overlap-warning" : ""}`}
                  style={{ left: frame.x * ppi, top: frame.y * ppi, width: frame.width * ppi, height: frame.height * ppi }}
                  onPointerDown={(event) => onPointerDown(event, "frame", frame.id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={stopDrag}
                  onPointerCancel={stopDrag}
                  onClick={() => setSelectedFrame(frame.id)}
                >
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" draggable={false} />
                  ) : (
                    <div className="frame-placeholder" aria-hidden="true"><span>PHOTO</span></div>
                  )}
                  <span className="layout-frame-label">{frame.width.toFixed(0)} × {frame.height.toFixed(0)} in</span>
                </div>
              );
            })}
            {guides.x.map((x) => <i className="guide-line guide-x" key={`gx-${x}`} style={{ left: x * ppi }} />)}
            {guides.y.map((y) => <i className="guide-line guide-y" key={`gy-${y}`} style={{ top: y * ppi }} />)}
            {dragGap !== null && <span className="gap-badge">{dragGap.toFixed(1)} in</span>}
          </div>
          {!hintDismissed && <button className="frame-hint" type="button" onClick={() => setHintDismissed(true)}>Drag frames to place them. Tap a frame to edit it. <b>×</b></button>}

          <div className="frame-preview-actions">
            <button type="button" onClick={undo} disabled={!historyPast.current.length}>Undo</button>
            <button type="button" onClick={redo} disabled={!historyFuture.current.length}>Redo</button>
            <label className="snap-toggle"><input type="checkbox" checked={snapGrid} onChange={(event) => setSnapGrid(event.target.checked)} /> Snap grid</label>
            <button type="button" onClick={downloadPreview}>Download PNG</button>
            <button type="button" onClick={clearFrames}>Clear frames</button>
          </div>

          {selected && (
            <div className="selected-frame-toolbar" aria-label="Selected frame toolbar">
              <button type="button" onClick={rotateSelected}>Rotate</button>
              <button type="button" onClick={duplicateSelected}>Duplicate</button>
              <button type="button" onClick={() => selected && updateFrame(selected.id, { style: selected.style === "none" ? "thin" : "none" })}>Style</button>
              <button type="button" onClick={() => alignSelected("horizontal")}>Center X</button>
              <button type="button" onClick={() => alignSelected("vertical")}>Center Y</button>
              <button type="button" onClick={distributeSelected}>Distribute</button>
              <button type="button" onClick={deleteSelected} className="danger">Delete</button>
            </div>
          )}
        </section>

        <aside className="frame-layout-controls" aria-label="Layout controls">
          <div className="frame-tabs" role="tablist">
            {(["wall", "obstacles", "frames", "summary"] as Tab[]).map((item) => (
              <button type="button" role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>

          {tab === "wall" && (
            <div className="frame-control-card">
              <h2>Wall setup</h2>
              <div className="unit-toggle">
                {(["ft", "in", "cm", "m"] as Unit[]).map((unit) => (
                  <button type="button" className={wallUnit === unit ? "active" : ""} onClick={() => changeWallUnit(unit)} key={unit}>{unit === "m" ? "Meters" : unit === "ft" ? "Feet" : unit === "cm" ? "CM" : "Inches"}</button>
                ))}
              </div>
              <div className="frame-size-inputs">
                <label>Wall width<input type="number" inputMode="decimal" value={wallWidthInput} onChange={(event) => updateWallDimension("width", event.target.value)} /></label>
                <label>Wall height<input type="number" inputMode="decimal" value={wallHeightInput} onChange={(event) => updateWallDimension("height", event.target.value)} /></label>
              </div>
              {wallError && <p className="frame-error" role="alert">{wallError}</p>}
              <span className="control-label">Wall color</span>
              <div className="wall-color-swatches">
                {wallColors.map(([color, name]) => (
                  <button type="button" key={color} aria-label={name} className={layout.color === color ? "active" : ""} style={{ background: color }} onClick={() => applyLayout({ ...layout, color })} />
                ))}
                <label className="custom-color" aria-label="Custom wall color"><input type="color" value={layout.color} onChange={(event) => applyLayout({ ...layout, color: event.target.value })} /></label>
              </div>
              <div className="quick-start">
                <span className="control-label">Quick start</span>
                {quickStartTemplates.map((template) => (
                  <button type="button" key={template.id} onClick={() => applyTemplate(template.id)}><strong>{template.title}</strong><small>{template.description}</small></button>
                ))}
              </div>
            </div>
          )}

          {tab === "obstacles" && (
            <div className="frame-control-card">
              <h2>Obstacles</h2>
              <p className="tentative-note">Sizes are tentative / approximate.</p>
              <div className="obstacle-buttons">
                {(["Door", "Window", "Switchboard", "AC / other"] as const).map((kind) => <button type="button" key={kind} onClick={() => addObstacle(kind)}>+ {kind}</button>)}
              </div>
              {selectedObstacleId && (
                <div className="obstacle-editor">
                  <label>Label<input value={selectedObstacle?.label ?? ""} onChange={(event) => updateObstacle(selectedObstacleId, { label: event.target.value })} /></label>
                  <label>Width (in)<input type="number" value={selectedObstacle?.width ?? 0} onChange={(event) => updateObstacle(selectedObstacleId, { width: Math.max(1, Number(event.target.value)) })} /></label>
                  <label>Height (in)<input type="number" value={selectedObstacle?.height ?? 0} onChange={(event) => updateObstacle(selectedObstacleId, { height: Math.max(1, Number(event.target.value)) })} /></label>
                  <button type="button" className="danger" onClick={() => { applyLayout({ ...layout, obstacles: layout.obstacles.filter((item) => item.id !== selectedObstacleId) }); setSelectedObstacleId(null); }}>Delete obstacle</button>
                </div>
              )}
            </div>
          )}

          {tab === "frames" && (
            <div className="frame-control-card">
              <h2>Add frames</h2>
              <div className="size-chips">
                {printSizes.map((size) => (
                  <button type="button" className={!customMode && presetId === size.id ? "active" : ""} onClick={() => { setCustomMode(false); setPresetId(size.id); }} key={size.id}>{size.label}</button>
                ))}
                <button type="button" className={customMode ? "active" : ""} onClick={() => setCustomMode(true)}>Custom</button>
              </div>
              {customMode && (
                <div className="custom-frame-size">
                  <div className="unit-toggle">{(["in", "cm", "ft", "m"] as Unit[]).map((unit) => <button type="button" className={customUnit === unit ? "active" : ""} onClick={() => setCustomUnit(unit)} key={unit}>{unit}</button>)}</div>
                  <label>Width<input type="number" value={customWidth} onChange={(event) => setCustomWidth(event.target.value)} /></label>
                  <label>Height<input type="number" value={customHeight} onChange={(event) => setCustomHeight(event.target.value)} /></label>
                </div>
              )}
              <div className="segmented">
                <button type="button" className={orientation === "portrait" ? "active" : ""} onClick={() => setOrientation("portrait")}>Portrait</button>
                <button type="button" className={orientation === "landscape" ? "active" : ""} onClick={() => setOrientation("landscape")}>Landscape</button>
              </div>
              <div className="frame-style-options">
                {(["none", "thin", "white", "wood", "gold"] as FrameStyle[]).map((style) => (
                  <button type="button" className={frameStyle === style ? "active" : ""} onClick={() => setFrameStyle(style)} key={style}>{style === "none" ? "No frame" : style}</button>
                ))}
              </div>
              <button type="button" className="primary-button" onClick={addFrame} disabled={layout.frames.length >= 30}>Add frame</button>

              {selected && (
                <div className="selected-frame-editor">
                  <h3>Selected frame</h3>
                  <label>Width (in)<input type="number" value={selected.width} onChange={(event) => updateFrame(selected.id, { width: Math.max(1, Number(event.target.value)) })} /></label>
                  <label>Height (in)<input type="number" value={selected.height} onChange={(event) => updateFrame(selected.id, { height: Math.max(1, Number(event.target.value)) })} /></label>
                  <label className="photo-upload">Upload photo<input type="file" accept="image/*" onChange={(event) => uploadPhoto(selected.id, event.target.files?.[0])} /></label>
                </div>
              )}
            </div>
          )}

          {tab === "summary" && (
            <div className="frame-control-card">
              <h2>Frame summary</h2>
              <p className="frame-count"><strong>{layout.frames.length}</strong> frames total</p>
              {frameSummary.map((group) => (
                <div className="summary-row" key={`${group.width}-${group.height}-${group.orientation}`}>
                  <span>{group.count} × {group.width.toFixed(1)}×{group.height.toFixed(1)} in · {group.orientation}</span>
                </div>
              ))}
              <div className="estimated-price">{estimatedTotal > 0 ? `Estimated total: NPR ${estimatedTotal.toLocaleString("en-IN")}` : "Ask for price"}<small>Estimates only</small></div>
              {whatsappUrl ? (
                <a className="whatsapp-cta" href={whatsappUrl} target="_blank" rel="noreferrer">Send this layout on WhatsApp</a>
              ) : <p className="tentative-note">WhatsApp is unavailable until WHATSAPP_NUMBER is configured.</p>}
              <button type="button" className="secondary-button" onClick={shareLayout}>Share layout link</button>
              <button type="button" className="secondary-button" onClick={resetLayout}>New layout / Reset</button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
