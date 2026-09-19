import type { StaticImageData } from "next/image";
import babyCorn from "@/assets/products/baby-corn.png";
import frenchFries from "@/assets/products/french-fries.png";
import greenPeas from "@/assets/products/green-peas.png";
import jackfruit from "@/assets/products/jackfruit.png";
import matarPaneer from "@/assets/products/matar-paneer.png";
import mixVeg from "@/assets/products/mix-veg.png";
import soyaChaap from "@/assets/products/soya-chaap.png";
import sweetCorn from "@/assets/products/sweet-corn.png";

/**
 * The product range shown in "Product universe" (Figma 119:627), in design order.
 *
 * Pack art: baby corn and soya chaap are full-size exports; sweet corn is the
 * crisp cut from the hero clip (see freeze-fast); the rest are Figma's 180 × 215
 * thumbnails upscaled 3× — replace with packshots when the client supplies them
 * (keep the transparent 180:215 canvas so `packSize` still fits).
 */
export type CatalogueProduct = {
  id: string;
  name: string;
  /** the first line of the blurb, set in caps */
  hook: string;
  /** the rest of the blurb, one entry per designed line (long lines wrap) */
  lines: string[];
  pack: StaticImageData;
  /** Figma size of the pack image in px, centred in the card's pack frame */
  packSize: { width: number; height: number };
};

export const CATALOGUE: CatalogueProduct[] = [
  {
    id: "sweet-corn",
    name: "Sweet corn",
    hook: "A little golden. A lot delicious.",
    lines: ["Naturally sweet. Ready to brighten up the plate."],
    pack: sweetCorn,
    packSize: { width: 238.605, height: 285 },
  },
  {
    id: "mixed-vegetables",
    name: "Mixed vegetables",
    hook: "When one vegetable isn’t enough.",
    lines: ["A colourful mix for quick, everyday cooking."],
    pack: mixVeg,
    packSize: { width: 244.465, height: 292 },
  },
  {
    id: "green-peas",
    name: "Green peas",
    hook: "The little green powerhouse.",
    lines: ["Sweet. Tender. Ready for whatever you’re cooking next."],
    pack: greenPeas,
    packSize: { width: 248.651, height: 297 },
  },
  {
    id: "french-fries",
    name: "French fries",
    hook: "Potatoes. Cut to make you crave more.",
    lines: ["Crispy outside. Fluffy inside."],
    pack: frenchFries,
    packSize: { width: 241.953, height: 289 },
  },
  {
    id: "baby-corn",
    name: "Baby corn",
    hook: "Small. Crunchy. Ready to go.",
    lines: ["For stir-fries, gravies, starters and everything between."],
    pack: babyCorn,
    packSize: { width: 244.465, height: 292 },
  },
  {
    id: "jackfruit",
    name: "Jackfruit",
    hook: "Tropical goodness. Frozen smart.",
    lines: ["Big flavour. Conveniently ready."],
    pack: jackfruit,
    packSize: { width: 260.136, height: 311 },
  },
  {
    id: "matar-paneer",
    name: "Matar paneer",
    hook: "The comfort classic. Without the wait.",
    lines: ["A familiar favourite.", "Made easier for modern kitchens."],
    pack: matarPaneer,
    packSize: { width: 264.318, height: 316 },
  },
  {
    id: "soya-chaap",
    name: "Soya chaap",
    hook: "The one that doesn’t play safe.",
    lines: ["Rich. Satisfying.", "Ready for your next recipe."],
    pack: soyaChaap,
    packSize: { width: 237.866, height: 274 },
  },
];
