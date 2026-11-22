export interface QuickStartTemplate {
  id: string;
  title: string;
  description: string;
  frames: Array<{ width: number; height: number }>;
}

export const quickStartTemplates: QuickStartTemplate[] = [
  {
    id: "gallery",
    title: "Gallery wall",
    description: "Six mixed-size frames",
    frames: [
      { width: 12, height: 18 }, { width: 8, height: 10 }, { width: 16, height: 20 },
      { width: 8, height: 12 }, { width: 12, height: 15 }, { width: 5, height: 7 },
    ],
  },
  {
    id: "triple",
    title: "Triple row",
    description: "Three equal frames",
    frames: [{ width: 16, height: 20 }, { width: 16, height: 20 }, { width: 16, height: 20 }],
  },
  {
    id: "center",
    title: "Big center",
    description: "One large frame with two sides",
    frames: [{ width: 12, height: 18 }, { width: 24, height: 36 }, { width: 12, height: 18 }],
  },
];
