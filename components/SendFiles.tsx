"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { acceptedFiles } from "@/data/send-files.config";

export default function SendFiles() {
  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [utm, setUtm] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/print-config")
      .then((response) => response.json())
      .then((config: { contactEmail?: string | null; whatsappNumber?: string | null }) => {
        setContactEmail(config.contactEmail ?? null);
        setWhatsappNumber(config.whatsappNumber ?? null);
      })
      .catch(() => {
        setContactEmail(null);
        setWhatsappNumber(null);
      });

    const params = new URLSearchParams(window.location.search);
    const utmEntries = Array.from(params.entries()).filter(([key]) => key === "utm" || key.startsWith("utm_"));
    setUtm(utmEntries.length ? utmEntries.map(([key, value]) => `${key}=${value}`).join(", ") : null);
  }, []);

  const subject = "Print Request - [Your Name]";
  const emailBody = useMemo(() => {
    const body = [
      "Hi Mechi Photo Studio,",
      "",
      "Name:",
      "Phone:",
      "Print type (photo / flex / document):",
      "Size:",
      "Quantity:",
      "When needed:",
      "",
      "Please find my files attached.",
    ].join("\n");
    return utm ? `${body}\n\nSource: ${utm}` : body;
  }, [utm]);

  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(emailBody);
  const mailtoUrl = contactEmail
    ? `mailto:${contactEmail}?subject=${encodedSubject}&body=${encodedBody}`
    : null;
  const gmailUrl = contactEmail
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}&su=${encodedSubject}&body=${encodedBody}`
    : null;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi Mechi Photo Studio! I want to send files for printing.${utm ? ` Source: ${utm}` : ""}`)}`
    : null;

  const copyEmail = async () => {
    if (!contactEmail) return;
    try {
      await navigator.clipboard.writeText(contactEmail);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = contactEmail;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="send-files-page">
      <SiteNav />
      <section className="send-files-wrap">
        <Link className="send-files-back" href="/tools">← Back to tools</Link>
        <p className="eyebrow"><span /> Printing request</p>
        <h1>Send Files for Printing</h1>

        <ol className="send-files-steps">
          <li><span>1</span><p>Tap the button</p></li>
          <li><span>2</span><p>Attach your files in your email app</p></li>
          <li><span>3</span><p>Tell us the size, quantity and when you need it</p></li>
        </ol>

        {contactEmail ? (
          <div className="send-files-actions">
            <a className="send-files-primary" href={mailtoUrl ?? undefined}>Open Email App</a>
            <a className="send-files-secondary" href={gmailUrl ?? undefined} target="_blank" rel="noopener">Open in Gmail</a>
            <button type="button" className="send-files-secondary" onClick={copyEmail}>
              {copied ? "Copied!" : "Copy Email Address"}
            </button>
            <p className="send-files-address" aria-live="polite">
              Email address: <strong>{contactEmail}</strong>
            </p>
          </div>
        ) : (
          <p className="send-files-missing">Email requests are currently unavailable. Please contact us on WhatsApp below.</p>
        )}

        <div className="send-files-tip">
          <strong>Large files</strong>
          <p>Files bigger than 25 MB? Share a Google Drive link in your email instead.</p>
        </div>

        {whatsappUrl ? (
          <div className="send-files-whatsapp">
            <p>Prefer WhatsApp? Send files there</p>
            <a href={whatsappUrl} target="_blank" rel="noopener">Open WhatsApp</a>
          </div>
        ) : null}

        <p className="send-files-accepted">
          <strong>Accepted files:</strong> We accept {acceptedFiles}.
        </p>
      </section>
    </main>
  );
}
