"use client";
import { useEffect, useState } from "react";

const rows = [
  ["201", "POST /api/inventory/items", "38"],
  ["200", "GET /api/hrms/employees", "21"],
  ["200", "GET /api/reports/procurement", "46"],
  ["204", "PUT /api/assets/118", "27"],
  ["200", "GET /api/fams/summary", "19"],
  ["200", "GET /health", "3"],
];

export default function RequestStream() {
  const [n, setN] = useState(5);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setN((v) => v + 1), 1800);
    return () => clearInterval(id);
  }, []);

  const visible = Array.from({ length: 6 }, (_, i) => n - 5 + i);

  return (
    <div className="stream" role="img" aria-label="Example stream of ASP.NET Core API requests completing quickly">
      <div className="h"><span>dotnet run: business-api</span><span>time</span></div>
      {visible.map((k) => {
        const [code, path, ms] = rows[k % rows.length];
        return (
          <div className="r" key={k}>
            <span className="ok">{code}</span>
            <span>{path}</span>
            <span className="ms">{ms} ms</span>
          </div>
        );
      })}
    </div>
  );
}
