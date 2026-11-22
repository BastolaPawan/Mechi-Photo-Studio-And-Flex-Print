import type { Metadata } from "next";
import FrameLayoutMaker from "@/components/FrameLayoutMaker";

export const metadata: Metadata = {
  title: "Frame Layout Maker | Mechi Photo Studio",
  description: "Plan and share a wall layout for photo frames.",
  openGraph: {
    title: "Frame Layout Maker",
    description: "Design a wall plan with frames and obstacles.",
  },
};

export default function FrameLayoutPage() {
  return <FrameLayoutMaker />;
}
