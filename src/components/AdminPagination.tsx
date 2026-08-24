import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Prev/next simples em vez de lista numerada — não importa quantas páginas
// existam, a largura do controle nunca muda, então a lista nunca quebra o
// layout (objetivo original de adicionar paginação nessas telas).
export function AdminPagination({
  page,
  totalPages,
  basePath,
  query = {},
  pageParam = "page",
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string | undefined>;
  pageParam?: string;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
    params.set(pageParam, String(targetPage));
    return `${basePath}?${params.toString()}`;
  };

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-label="Página anterior"
        aria-disabled={!hasPrev}
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20 ${
          hasPrev ? "" : "pointer-events-none opacity-30"
        }`}
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </Link>
      <span className="text-sm text-white/60">
        Página {page} de {totalPages}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-label="Próxima página"
        aria-disabled={!hasNext}
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90 hover:bg-white/20 ${
          hasNext ? "" : "pointer-events-none opacity-30"
        }`}
      >
        <ChevronRight size={16} strokeWidth={2} />
      </Link>
    </div>
  );
}
