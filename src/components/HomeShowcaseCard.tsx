import Image from "next/image";
import { Users } from "lucide-react";

type Props = {
  src: string;
  title: string;
  supporters: string;
};

export function HomeShowcaseCard({ src, title, supporters }: Props) {
  return (
    <div className="flex w-36 flex-none snap-start flex-col gap-2">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
        <Image
          src={src}
          alt={title}
          fill
          sizes="144px"
          className="object-cover"
        />
      </div>
      <div>
        <span className="line-clamp-1 text-sm font-semibold text-white">
          {title}
        </span>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-white/50">
          <Users size={12} strokeWidth={2} />
          <span>{supporters}</span>
        </div>
      </div>
    </div>
  );
}
