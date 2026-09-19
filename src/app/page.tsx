import BetterWay from "@/components/sections/better-way/BetterWay";
import FarmToFreezer from "@/components/sections/farm-to-freezer/FarmToFreezer";
import FarmToHomes from "@/components/sections/farm-to-homes/FarmToHomes";
import FreezeFast from "@/components/sections/freeze-fast/FreezeFast";
import Harvest from "@/components/sections/harvest/Harvest";
import Hero from "@/components/sections/hero/Hero";
import MoveFast from "@/components/sections/move-fast/MoveFast";
import ProductUniverse from "@/components/sections/product-universe/ProductUniverse";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <FarmToFreezer />
      <Harvest />
      <BetterWay />
      <MoveFast />
      <FreezeFast />
      <ProductUniverse />
      <FarmToHomes />
    </main>
  );
}
