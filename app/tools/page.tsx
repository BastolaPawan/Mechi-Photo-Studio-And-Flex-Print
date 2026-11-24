import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { toolsConfig } from "@/data/tools.config";

export const metadata: Metadata = {
  title: "Studio Tools | Mechi Photo Studio",
  description: "Useful print, banner and studio tools from Mechi Photo Studio.",
};

export default function ToolsPage() {
  return (
    <main className="tools-page">
      <SiteNav />
      <section className="tools-wrap">
        <p className="eyebrow"><span /> Studio tools</p>
        <h1>Choose a tool</h1>
        <p className="tools-intro">Quick, mobile-friendly tools to help you plan your next print.</p>
        <div className="tools-grid">
          <Link className="tool-card" href="/offers">
            <span className="tool-icon" aria-hidden="true">🎁</span>
            <span className="tool-card-copy"><strong>Offers</strong><small>View live wedding season and studio offers.</small></span>
            <span className="tool-arrow" aria-hidden="true">→</span>
          </Link>
          {toolsConfig.map((tool) =>
            tool.status === "live" ? (
              <Link className="tool-card" href={tool.path} key={tool.slug}>
                <span className="tool-icon" aria-hidden="true">{tool.icon}</span>
                <span className="tool-card-copy">
                  <strong>{tool.title}</strong>
                  <small>{tool.description}</small>
                </span>
                <span className="tool-arrow" aria-hidden="true">→</span>
              </Link>
            ) : (
              <article className="tool-card tool-card-disabled" key={tool.slug} aria-disabled="true">
                <span className="tool-icon" aria-hidden="true">{tool.icon}</span>
                <span className="tool-card-copy">
                  <strong>{tool.title}</strong>
                  <small>{tool.description}</small>
                </span>
                <span className="coming-soon">Coming soon</span>
              </article>
            ),
          )}
        </div>
      </section>
    </main>
  );
}
