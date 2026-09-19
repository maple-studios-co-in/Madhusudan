/**
 * Retail / quick-commerce partners shown in the hero's logo strip
 * (Figma 63:3478–63:3486: five blinkit marks).
 */
export type Partner = {
  id: string;
  name: string;
  logo?: { src: string; width: number; height: number };
  href?: string;
};

const blinkit = { src: "/partners/blinkit.png", width: 322, height: 184 };

export const PARTNERS: Partner[] = [
  { id: "blinkit-1", name: "blinkit", logo: blinkit },
  { id: "blinkit-2", name: "blinkit", logo: blinkit },
  { id: "blinkit-3", name: "blinkit", logo: blinkit },
  { id: "blinkit-4", name: "blinkit", logo: blinkit },
  { id: "blinkit-5", name: "blinkit", logo: blinkit },
];
