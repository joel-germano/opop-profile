"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteGalleryPostAction } from "@/app/admin/(dashboard)/presidenciaveis/actions";

type GalleryItem = { id: string; imageUrl: string };

export function AdminGalleryModeration({ posts }: { posts: GalleryItem[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = (id: string) => {
    if (!confirm("Remover esta foto da galeria?")) return;
    startTransition(async () => {
      await deleteGalleryPostAction(id);
      router.refresh();
    });
  };

  if (posts.length === 0) {
    return <p className="text-sm text-white/50">Ninguém postou na galeria ainda.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {posts.map((post) => (
        <div key={post.id} className="relative aspect-square overflow-hidden rounded-2xl bg-white/5">
          <Image src={post.imageUrl} alt="" fill className="object-cover" />
          <button
            type="button"
            onClick={() => handleDelete(post.id)}
            disabled={isPending}
            aria-label="Remover da galeria"
            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition active:scale-90 disabled:opacity-60"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
