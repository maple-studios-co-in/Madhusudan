/**
 * Products featured in the hero.
 *
 * Every product has two renders of its footage (ring → burst → pack reveal):
 *  – landscape 1920×1080 for desktop, the clip composed on its own studio backdrop
 *    continued edge to edge, so the video simply fills the hero;
 *  – portrait 720×1280 for phones, the same idea with the top and bottom fading
 *    into `surround`, the flat colour the hero shows around the video.
 *
 * Footage files are immutable-cached (see next.config.ts): when a clip is
 * re-rendered, give it a new file name (current set: `-v6`).
 */

export type HeroProductId = "sweet-corn" | "soya-chaap" | "mix-veg";

export type FootageVariant = {
  /** H.264 MP4 (plays in every browser) */
  mp4: string;
  poster: string;
  width: number;
  height: number;
};

export type HeroProduct = {
  id: HeroProductId;
  name: string;
  thumb: { src: string; width: number; height: number };
  footage: { landscape: FootageVariant; portrait: FootageVariant };
  /** flat colour around the phone footage (matches the footage's own top/bottom fade) */
  surround: string;
};

const footage = (slug: string): HeroProduct["footage"] => ({
  landscape: {
    mp4: `/video/${slug}-1080.mp4`,
    poster: `/video/${slug}-poster.jpg`,
    width: 1920,
    height: 1080,
  },
  portrait: {
    mp4: `/video/${slug}-portrait.mp4`,
    poster: `/video/${slug}-portrait-poster.jpg`,
    width: 720,
    height: 1280,
  },
});

export const HERO_PRODUCTS: HeroProduct[] = [
  {
    id: "sweet-corn",
    name: "Frozen Sweet Corn",
    thumb: { src: "/hero/product-sweet-corn.png", width: 180, height: 215 },
    footage: footage("sweet-corn-v6"),
    surround: "#862420",
  },
  {
    id: "mix-veg",
    name: "Frozen Mix Vegetables",
    thumb: { src: "/hero/product-mix-veg.png", width: 844, height: 1000 },
    footage: footage("mix-veg-v6"),
    surround: "#517f4a",
  },
  {
    id: "soya-chaap",
    name: "Soya Chaap",
    thumb: { src: "/hero/product-soya-chaap.png", width: 1389, height: 1600 },
    footage: footage("soya-chaap-v6"),
    surround: "#e9c461",
  },
];

/** Product playing on first paint. The picker shows the other products. */
export const INITIAL_PRODUCT_ID: HeroProductId = "sweet-corn";

export function productById(id: HeroProductId): HeroProduct {
  const product = HERO_PRODUCTS.find((p) => p.id === id);
  if (!product) throw new Error(`Unknown hero product: ${id}`);
  return product;
}

/** The products that are not playing, in catalogue order. */
export function otherProducts(activeId: HeroProductId): HeroProduct[] {
  return HERO_PRODUCTS.filter((p) => p.id !== activeId);
}
