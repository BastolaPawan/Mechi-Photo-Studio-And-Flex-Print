export interface PrintSize {
  id: string;
  label: string;
  widthInches: number;
  heightInches: number;
  category: "photo" | "flex";
}

export const printSizes: PrintSize[] = [
  { id: "4x6", label: "4 × 6 in", widthInches: 4, heightInches: 6, category: "photo" },
  { id: "5x7", label: "5 × 7 in", widthInches: 5, heightInches: 7, category: "photo" },
  { id: "6x8", label: "6 × 8 in", widthInches: 6, heightInches: 8, category: "photo" },
  { id: "8x10", label: "8 × 10 in", widthInches: 8, heightInches: 10, category: "photo" },
  { id: "8x12", label: "8 × 12 in", widthInches: 8, heightInches: 12, category: "photo" },
  { id: "10x12", label: "10 × 12 in", widthInches: 10, heightInches: 12, category: "photo" },
  { id: "12x15", label: "12 × 15 in", widthInches: 12, heightInches: 15, category: "photo" },
  { id: "12x18", label: "12 × 18 in", widthInches: 12, heightInches: 18, category: "photo" },
  { id: "16x20", label: "16 × 20 in", widthInches: 16, heightInches: 20, category: "photo" },
  { id: "16x24", label: "16 × 24 in", widthInches: 16, heightInches: 24, category: "photo" },
  { id: "20x30", label: "20 × 30 in", widthInches: 20, heightInches: 30, category: "photo" },
  { id: "24x36", label: "24 × 36 in", widthInches: 24, heightInches: 36, category: "photo" },
  { id: "30x40", label: "30 × 40 in", widthInches: 30, heightInches: 40, category: "photo" },
  { id: "36x48", label: "36 × 48 in", widthInches: 36, heightInches: 48, category: "photo" },
  { id: "3x2ft", label: "3 × 2 ft", widthInches: 36, heightInches: 24, category: "flex" },
  { id: "4x3ft", label: "4 × 3 ft", widthInches: 48, heightInches: 36, category: "flex" },
  { id: "6x4ft", label: "6 × 4 ft", widthInches: 72, heightInches: 48, category: "flex" },
  { id: "8x4ft", label: "8 × 4 ft", widthInches: 96, heightInches: 48, category: "flex" },
  { id: "10x5ft", label: "10 × 5 ft", widthInches: 120, heightInches: 60, category: "flex" },
];
