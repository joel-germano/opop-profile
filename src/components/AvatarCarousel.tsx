import Image from "next/image";

// Marquee automático e contínuo (mesma técnica do ModelsMarquee: lista
// duplicada + translateX(-50%) em loop) — substitui o carrossel de arrastar,
// já que agora ele anda sozinho. Pausa no hover (desktop) só de cortesia, pra
// quem quiser parar e olhar um rosto específico; no touch ele segue rolando.
export function AvatarCarousel({ avatars }: { avatars: string[] }) {
  return (
    <div className="group overflow-hidden">
      <div className="animate-marquee-left flex w-fit gap-2 group-hover:[animation-play-state:paused]">
        {[...avatars, ...avatars].map((src, i) => (
          <div
            key={i}
            className="relative h-10 w-10 flex-none overflow-hidden rounded-full ring-2 ring-[#1a1a1a]"
          >
            <Image src={src} alt="" fill sizes="40px" className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
