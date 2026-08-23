import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { connectDB } from "@/lib/db";
import { CandidateModel } from "@/lib/models/candidate";
import { CandidateTemplateModel } from "@/lib/models/candidate-template";

export default async function AdminPresidenciaveisPage() {
  await connectDB();
  const candidates = await CandidateModel.find({}).sort({ name: 1 }).lean();
  const templateCounts = await CandidateTemplateModel.aggregate([
    { $group: { _id: "$candidateId", count: { $sum: 1 } } },
  ]);
  const countByCandidate = new Map(
    templateCounts.map((t) => [String(t._id), t.count as number])
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Presidenciáveis
          </h1>
          <p className="mt-1 text-sm text-white/60">{candidates.length} candidato(s).</p>
        </div>
        <Link
          href="/admin/presidenciaveis/novo"
          className="flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-black transition active:scale-95 hover:bg-brand-light"
        >
          <Plus size={15} strokeWidth={2} />
          Novo candidato
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {candidates.map((candidate) => (
          <Link
            key={String(candidate._id)}
            href={`/admin/presidenciaveis/${candidate._id}`}
            className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 transition hover:bg-white/10"
          >
            <Image
              src={candidate.photoUrl}
              alt={candidate.name}
              width={44}
              height={44}
              className="shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{candidate.name}</p>
              <p className="truncate text-xs text-white/50">/presidenciaveis/{candidate.slug}</p>
            </div>
            <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
              {countByCandidate.get(String(candidate._id)) ?? 0} moldura(s)
            </span>
          </Link>
        ))}

        {candidates.length === 0 && (
          <p className="text-sm text-white/50">Nenhum candidato cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}
