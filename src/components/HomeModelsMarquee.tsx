import Image from "next/image";

const MODEL_IMAGES = Array.from(
  { length: 16 },
  (_, i) => `/modelos-giro/${String(i + 1).padStart(2, "0")}.webp`
);

const COLUMN_COUNT = 4;

// Cada coluna passa pela lista inteira de imagens (só com um deslocamento
// diferente por coluna, pra não ficarem todas sincronizadas) — assim,
// depois da última, repete a primeira, sem nunca faltar imagem.
const COLUMNS = Array.from({ length: COLUMN_COUNT }, (_, colIndex) => {
  const offset = colIndex * Math.round(MODEL_IMAGES.length / COLUMN_COUNT);
  const images = MODEL_IMAGES.map(
    (_, i) => MODEL_IMAGES[(i + offset) % MODEL_IMAGES.length]
  );
  return {
    images,
    direction: colIndex % 2 === 0 ? "animate-marquee-up" : "animate-marquee-down",
  };
});

export function HomeModelsMarquee() {
  return (
    <div className="relative -mx-6 -mt-4 h-80 w-[calc(100%+3rem)] overflow-hidden">
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] gap-3">
        {COLUMNS.map((column, colIndex) => (
          <div
            key={colIndex}
            className={`flex w-32 flex-none flex-col ${column.direction}`}
          >
            {/* Duas cópias idênticas, sem gap entre elas — assim
                translateY(-50%) cai exatamente onde a segunda cópia
                começa, sem salto nem corte no loop. */}
            {[0, 1].map((copy) => (
              <div key={copy} className="flex flex-none flex-col gap-3 pb-3">
                {column.images.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square w-full flex-none overflow-hidden rounded-lg ring-2 ring-white"
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="128px"
                      className="object-cover"
                      aria-hidden
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-decor-coral to-transparent to-40%" />
    </div>
  );
}
