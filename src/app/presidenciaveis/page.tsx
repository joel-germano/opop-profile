import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/db";
import { CandidateModel } from "@/lib/models/candidate";

export default async function PresidenciaveisPage() {
  await connectDB();
  const candidates = await CandidateModel.find({}).sort({ name: 1 }).lean();

  return (
    <div className="flex flex-1 min-h-screen overflow-x-hidden bg-[#2A2A2A]">
      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />

      <main
        className="flex w-full flex-col items-center gap-8 overflow-x-hidden py-10 md:w-120 md:flex-none border-x border-white/10 bg-[#2A2A2A]"
        style={{
          paddingTop: "max(2.5rem, env(safe-area-inset-top))",
          paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div className="px-6 text-center">
          <h1 className="font-heading text-3xl font-normal tracking-wide text-white">
            Candidatos à presidência
          </h1>
          <p className="mt-4 text-lg leading-snug text-white/60">
            Escolha seu candidato e monte seu card de apoio.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-4 px-6 sm:grid-cols-3">
          {candidates.map((candidate) => (
            <Link
              key={String(candidate._id)}
              href={`/presidenciaveis/${candidate.slug}`}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white/5 p-4 transition active:scale-95 hover:bg-white/10"
            >
              <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-white/10">
                <Image
                  src={candidate.photoUrl}
                  alt={candidate.name}
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-center text-sm font-bold text-white">
                {candidate.name}
              </span>
            </Link>
          ))}
        </div>

        {candidates.length === 0 && (
          <p className="px-6 text-center text-white/50">
            Nenhum candidato cadastrado ainda.
          </p>
        )}
      </main>

      <div className="hidden md:block flex-1 bg-[#2A2A2A]" />
    </div>
  );
}
