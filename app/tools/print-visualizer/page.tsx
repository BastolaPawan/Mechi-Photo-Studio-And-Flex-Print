import type { Metadata } from "next";
import PrintVisualizer from "@/components/PrintVisualizer";

export const metadata: Metadata = {
  title: "Print Size Visualizer | Mechi Photo Studio",
  description: "Compare photo and flex print sizes against real-world sofa, wall, door, bed and person scenes.",
  openGraph: {
    title: "Print Size Visualizer | Mechi Photo Studio",
    description: "See how your print size will look before you order.",
  },
};

export default function PrintVisualizerPage() {
  return <PrintVisualizer />;
}
