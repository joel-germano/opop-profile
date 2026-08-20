import { AdminCandidateCreateForm } from "@/components/AdminCandidateCreateForm";

export default function AdminNovoCandidatoPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-normal tracking-wide text-white">
        Novo candidato
      </h1>
      <AdminCandidateCreateForm />
    </div>
  );
}
