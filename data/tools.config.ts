export type ToolStatus = "live" | "coming-soon";

export interface ToolConfig {
  slug: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  status: ToolStatus;
}

export const toolsConfig: ToolConfig[] = [
  {
    slug: "frame-layout",
    title: "Frame Layout Maker",
    description: "Plan a wall of frames and share the layout.",
    icon: "🖼️",
    path: "/tools/frame-layout",
    status: "live",
  },
  {
    slug: "print-visualizer",
    title: "Print Size Visualizer",
    description: "See print and flex sizes against real-world scenes.",
    icon: "📐",
    path: "/tools/print-visualizer",
    status: "live",
  },
  {
    slug: "spin-the-wheel",
    title: "Spin the Wheel",
    description: "Try a fun studio offer wheel.",
    icon: "🎡",
    path: "/tools/spin-the-wheel",
    status: "coming-soon",
  },
  {
    slug: "flex-price-calculator",
    title: "Flex Banner Price Calculator",
    description: "Estimate the cost of a banner or flex.",
    icon: "🧮",
    path: "/tools/flex-price-calculator",
    status: "coming-soon",
  },
  {
    slug: "combo-builder",
    title: "Combo Builder",
    description: "Build a custom photo and print package.",
    icon: "🎁",
    path: "/tools/combo-builder",
    status: "coming-soon",
  },
];
