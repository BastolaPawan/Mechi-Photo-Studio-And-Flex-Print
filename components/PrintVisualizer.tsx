"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { printSizes, type PrintSize } from "@/data/print-sizes.config";
import {
  calculatePixelsPerInch,
  clamp,
  clampPrintPosition,
  inchesFromUnit,
  inchesToCm,
  type Unit,
} from "@/lib/print-scaling";

type SceneId = "sofa" | "wall" | "door" | "bed" | "person";
type FrameStyle = "none" | "thin" | "white" | "wood" | "gold" | "silver" | "oak";

const scenes: Array<{
  id: SceneId;
  title: string;
  width: number;
  height: number;
  label: string;
}> = [
  { id: "sofa", title: "Sofa", width: 84, height: 34, label: "3-seater sofa" },
  { id: "wall", title: "Wall", width: 120, height: 96, label: "10 × 8 ft wall" },
  { id: "door", title: "Door", width: 32, height: 80, label: "Standard door" },
  { id: "bed", title: "Bed", width: 80, height: 48, label: "Queen bed wall" },
  { id: "person", title: "Person", width: 36, height: 66, label: "5 ft 6 in person" },
];

export default function PrintVisualizer() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null);
  const [sceneId, setSceneId] = useState<SceneId>("sofa");
  const [size, setSize] = useState<PrintSize>(printSizes.find((item) => item.id === "12x18") ?? printSizes[0]);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [customUnit, setCustomUnit] = useState<Unit>("in");
  const [customWidth, setCustomWidth] = useState("12");
  const [customHeight, setCustomHeight] = useState("18");
  const [customMode, setCustomMode] = useState(false);
  const [frame, setFrame] = useState<FrameStyle>("none");
  const [wallUnit, setWallUnit] = useState<Unit>("ft");
  const [wallWidth, setWallWidth] = useState("10");
  const [wallHeight, setWallHeight] = useState("8");
  const [wallColor, setWallColor] = useState("#eef0ea");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [scenePixels, setScenePixels] = useState({ width: 328, height: 210 });
  const [printPosition, setPrintPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  const baseScene = scenes.find((item) => item.id === sceneId) ?? scenes[0];
  const customWallWidth = clamp(inchesFromUnit(Number(wallWidth), wallUnit), 24, 240);
  const customWallHeight = clamp(inchesFromUnit(Number(wallHeight), wallUnit), 24, 240);
  const scene = sceneId === "wall"
    ? {
        ...baseScene,
        width: customWallWidth,
        height: customWallHeight,
        label: `Custom wall ${customWallWidth.toFixed(1)} × ${customWallHeight.toFixed(1)} in`,
      }
    : baseScene;
  const customWidthInches = customMode ? inchesFromUnit(Number(customWidth), customUnit) : size.widthInches;
  const customHeightInches = customMode ? inchesFromUnit(Number(customHeight), customUnit) : size.heightInches;

  const dimensions = useMemo(() => {
    let width = clamp(customWidthInches, 1, 240);
    let height = clamp(customHeightInches, 1, 240);
    if (orientation === "landscape" && width < height) [width, height] = [height, width];
    if (orientation === "portrait" && width > height) [width, height] = [height, width];
    return { width, height };
  }, [customWidthInches, customHeightInches, orientation]);

  const ppi = useMemo(
    () => Math.min(
      calculatePixelsPerInch(scenePixels.width, scene.width),
      calculatePixelsPerInch(scenePixels.height, scene.height),
    ),
    [scenePixels.width, scenePixels.height, scene.width, scene.height],
  );
  const printPixels = { width: dimensions.width * ppi, height: dimensions.height * ppi };

  useEffect(() => {
    fetch("/api/print-config")
      .then((response) => response.json())
      .then((config: { whatsappNumber?: string | null }) => setWhatsappNumber(config.whatsappNumber ?? null))
      .catch(() => setWhatsappNumber(null));
  }, []);

  useEffect(() => {
    const update = () => {
      if (!sceneRef.current) return;
      const rect = sceneRef.current.getBoundingClientRect();
      setScenePixels({ width: rect.width, height: rect.height });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [sceneId]);

  useEffect(() => {
    setPrintPosition((current) => {
      const next = clampPrintPosition(
        current.x,
        current.y,
        printPixels.width,
        printPixels.height,
        scenePixels.width,
        scenePixels.height,
      );
      return next;
    });
  }, [printPixels.width, printPixels.height, scenePixels.width, scenePixels.height]);

  const chooseSize = (nextSize: PrintSize) => {
    setCustomMode(false);
    setSize(nextSize);
    setPrintPosition({
      x: Math.max(0, (scenePixels.width - nextSize.widthInches * ppi) / 2),
      y: Math.max(0, (scenePixels.height - nextSize.heightInches * ppi) / 2),
    });
  };

  const setScene = (id: SceneId) => {
    setSceneId(id);
    setPrintPosition({ x: 0, y: 0 });
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = clampPrintPosition(
      event.clientX - rect.left - dragRef.current.offsetX,
      event.clientY - rect.top - dragRef.current.offsetY,
      printPixels.width,
      printPixels.height,
      rect.width,
      rect.height,
    );
    setPrintPosition(next);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;
    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left - printPosition.x,
      offsetY: event.clientY - rect.top - printPosition.y,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const stopDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      dragRef.current = null;
      setIsDragging(false);
    }
  };

  const handlePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(file));
  };

  const utmText = () => {
    const params = new URLSearchParams(window.location.search);
    const utmEntries = Array.from(params.entries()).filter(([key]) => key === "utm" || key.startsWith("utm_"));
    return utmEntries.length ? utmEntries.map(([key, value]) => `${key}=${value}`).join(", ") : "direct";
  };

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        `Hi Mechi Photo Studio! I want a ${dimensions.width.toFixed(1)} x ${dimensions.height.toFixed(1)} in print/flex. Scene I viewed: ${scene.title}. Source: ${utmText()}`,
      )}`
    : null;

  const share = async () => {
    const shareData = {
      title: "Print Size Visualizer",
      text: `I am viewing ${dimensions.width.toFixed(1)} × ${dimensions.height.toFixed(1)} in on Mechi Photo Studio's visualizer.`,
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(window.location.href);
    }
  };

  const ratio = dimensions.width / scene.width;
  const hint = ratio >= 0.9
    ? "This nearly matches the full width of the reference"
    : ratio >= 0.45
      ? "This is about half the reference width"
      : ratio >= 0.22
        ? "This is about a quarter of the reference width"
        : "This is a small detail compared with the reference";

  return (
    <main className="visualizer-page">
      <header className="visualizer-header">
        <Link href="/tools" aria-label="Back to tools">← Tools</Link>
        <button type="button" onClick={share}>Share</button>
      </header>

      <div className="visualizer-layout">
        <section className="preview-column" aria-label="Size preview">
          <div className="scene-preview" ref={sceneRef}>
            {sceneId === "wall" && (
              <div className="scene-size-badge">
                Wall: {customWallWidth.toFixed(1)} × {customWallHeight.toFixed(1)} in
                <small>{inchesToCm(customWallWidth).toFixed(1)} × {inchesToCm(customWallHeight).toFixed(1)} cm</small>
              </div>
            )}
            <div
              className={`scene-art scene-${sceneId}`}
              aria-label={scene.label}
              style={sceneId === "wall" ? { background: wallColor } : undefined}
            >
              <div className="scene-floor" />
              {sceneId === "sofa" && (
                <div className="sofa"><span /><span /><span /><i /></div>
              )}
              {sceneId === "door" && <div className="door-ref"><span /></div>}
              {sceneId === "bed" && <div className="bed-ref"><span /><i /></div>}
              {sceneId === "person" && <div className="person-ref"><b /><span /><i /></div>}
            </div>
            <div
              className={`print-frame frame-${frame} ${photoUrl ? "with-photo" : ""} ${isDragging ? "is-dragging" : ""}`}
              style={{
                width: `${printPixels.width}px`,
                height: `${printPixels.height}px`,
                transform: `translate(${printPosition.x}px, ${printPosition.y}px)`,
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
              onLostPointerCapture={() => {
                dragRef.current = null;
                setIsDragging(false);
              }}
              role="img"
              tabIndex={0}
              aria-label={`${dimensions.width.toFixed(1)} by ${dimensions.height.toFixed(1)} inch print. Drag to reposition.`}
            >
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Uploaded preview" draggable={false} />
              ) : (
                <svg viewBox="0 0 300 420" aria-hidden="true">
                  <defs><linearGradient id="sample" x2="1" y2="1"><stop stopColor="#f7ad73" /><stop offset="1" stopColor="#6e96a9" /></linearGradient></defs>
                  <rect width="300" height="420" fill="url(#sample)" />
                  <circle cx="220" cy="95" r="42" fill="#ffe0aa" />
                  <path d="M0 300 Q130 210 300 290 V420 H0Z" fill="#27384a" />
                  <path d="M0 345 Q150 250 300 330 V420 H0Z" fill="#f8eee2" opacity=".75" />
                </svg>
              )}
              <span className="print-label">
                {dimensions.width.toFixed(1)} × {dimensions.height.toFixed(1)} in
                <small>{inchesToCm(dimensions.width).toFixed(1)} × {inchesToCm(dimensions.height).toFixed(1)} cm</small>
              </span>
            </div>
          </div>
          <p className="comparison-hint">{hint}</p>
        </section>

        <section className="controls-column" aria-label="Visualizer controls">
          <div className="scene-tabs" role="tablist" aria-label="Scene">
            {scenes.map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={sceneId === item.id}
                className={sceneId === item.id ? "active" : ""}
                onClick={() => setScene(item.id)}
                key={item.id}
              >
                {item.title}
              </button>
            ))}
          </div>

          {sceneId === "wall" && (
            <div className="wall-controls">
              <div className="control-title">
                <span>Wall size</span>
                <span className="wall-total">
                  {customWallWidth.toFixed(1)} × {customWallHeight.toFixed(1)} in
                </span>
              </div>
              <div className="unit-toggle wall-unit" aria-label="Wall unit">
                {(["in", "cm", "ft"] as Unit[]).map((unit) => (
                  <button type="button" className={wallUnit === unit ? "active" : ""} onClick={() => setWallUnit(unit)} key={unit}>
                    {unit === "in" ? "Inches" : unit === "cm" ? "CM" : "Feet"}
                  </button>
                ))}
              </div>
              <label>Wall width
                <input type="number" inputMode="decimal" min="1" max={wallUnit === "cm" ? "610" : "240"} value={wallWidth} onChange={(event) => setWallWidth(event.target.value)} />
              </label>
              <label>Wall height
              </label>
              <div className="wall-color-row">
                <span className="control-label">Wall color</span>
                <div className="wall-colors" role="list" aria-label="Wall color">
                  {[
                    ["#eef0ea", "Cream"],
                    ["#dbe8ed", "Blue"],
                    ["#ded4ca", "Taupe"],
                    ["#e7caca", "Rose"],
                    ["#cfd7c3", "Sage"],
                  ].map(([color, name]) => (
                    <button
                      type="button"
                      role="listitem"
                      aria-label={name}
                      className={wallColor === color ? "active" : ""}
                      style={{ background: color }}
                      onClick={() => setWallColor(color)}
                      key={color}
                    />
                  ))}
                  <label className="custom-wall-color" aria-label="Custom wall color">
                    <input type="color" value={wallColor} onChange={(event) => setWallColor(event.target.value)} />
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="control-block">
            <div className="control-title">
              <span>Print size</span>
            </div>
            <div className="size-chips" role="list">
              {printSizes.map((item) => (
                <button
                  type="button"
                  className={!customMode && size.id === item.id ? "active" : ""}
                  aria-pressed={!customMode && size.id === item.id}
                  onClick={() => chooseSize(item)}
                  key={item.id}
                >
                  {item.label}
                </button>
              ))}
              <button type="button" className={customMode ? "active" : ""} onClick={() => setCustomMode(true)}>Custom</button>
            </div>
          </div>

          {customMode && (
            <div className="custom-size">
              <div className="unit-toggle" aria-label="Unit">
                {(["in", "cm", "ft"] as Unit[]).map((unit) => (
                  <button type="button" className={customUnit === unit ? "active" : ""} onClick={() => setCustomUnit(unit)} key={unit}>
                    {unit === "in" ? "Inches" : unit === "cm" ? "CM" : "Feet"}
                  </button>
                ))}
              </div>
              <label>Width<input type="number" inputMode="decimal" min="1" max={customUnit === "cm" ? "610" : "240"} value={customWidth} onChange={(event) => setCustomWidth(event.target.value)} /></label>
              <label>Height<input type="number" inputMode="decimal" min="1" max={customUnit === "cm" ? "610" : "240"} value={customHeight} onChange={(event) => setCustomHeight(event.target.value)} /></label>
            </div>
          )}

          <div className="two-controls">
            <div>
              <span className="control-label">Orientation</span>
              <div className="segmented">
                <button type="button" className={orientation === "portrait" ? "active" : ""} onClick={() => setOrientation("portrait")}>Portrait</button>
                <button type="button" className={orientation === "landscape" ? "active" : ""} onClick={() => setOrientation("landscape")}>Landscape</button>
              </div>
            </div>
            <div>
              <span className="control-label">Frame</span>
              <div className="frame-options">
                {(["none", "thin", "white", "wood", "gold", "silver", "oak"] as FrameStyle[]).map((item) => (
                  <button type="button" className={frame === item ? "active" : ""} aria-label={`${item} frame`} onClick={() => setFrame(item)} key={item}>
                    <i className={`frame-swatch swatch-${item}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="upload-button">
            Upload your photo
            <input type="file" accept="image/*" onChange={handlePhoto} />
          </label>

          {whatsappUrl && (
            <a className="whatsapp-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
              Order this size on WhatsApp
            </a>
          )}
        </section>
      </div>
    </main>
  );
}
