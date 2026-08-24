import { HomeShowcaseCarousel } from "@/components/HomeShowcaseCarousel";
import { SHOWCASE_ITEMS } from "@/lib/showcase-items";

export function HomeShowcase() {
  return (
    <section className="flex flex-col gap-5 pb-14">
      <div className="px-6 text-center">
        <h2 className="font-display text-2xl font-normal tracking-wide text-white">
          Molduras que combinam com sua campanha
        </h2>
        <p className="mt-3 text-base leading-snug text-white/60">
          Suba a arte que você já tem. A gente cuida do resto.
        </p>
      </div>

      <HomeShowcaseCarousel items={SHOWCASE_ITEMS} />
    </section>
  );
}
