import { Link2 } from "lucide-react";

export function HomeLinkPreview() {
  return (
    <section className="px-6 pb-14">
      <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/15 text-secondary-light">
          <Link2 size={20} strokeWidth={2} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-white">
          Link de campanha personalizável
        </h3>
        <p className="mt-1 text-sm leading-snug text-white/60">
          Um endereço fácil de lembrar e de compartilhar.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-full bg-black/30 px-4 py-3 ring-1 ring-white/10">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-danger" />
            <span className="h-2 w-2 rounded-full bg-decor-lime" />
            <span className="h-2 w-2 rounded-full bg-success" />
          </div>
          <span className="truncate text-sm text-white/70">
            profile.opop.bio/suacampanha
          </span>
        </div>
      </div>
    </section>
  );
}
