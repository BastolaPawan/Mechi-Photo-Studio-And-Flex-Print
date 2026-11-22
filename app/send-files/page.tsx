import type { Metadata } from "next";
import SendFiles from "@/components/SendFiles";

export const metadata: Metadata = {
  title: "Send Files for Printing | Mechi Photo Studio",
  description: "Email your photos, designs or documents to Mechi Photo Studio for printing.",
  openGraph: {
    title: "Send Files for Printing",
    description: "Email your photos, designs or documents for printing.",
  },
};

export default function SendFilesPage() {
  return <SendFiles />;
}
