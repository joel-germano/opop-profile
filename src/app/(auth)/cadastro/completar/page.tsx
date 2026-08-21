import { redirect } from "next/navigation";
import { getPendingGoogleSignup } from "@/lib/auth";
import { CompleteGoogleSignupForm } from "@/components/CompleteGoogleSignupForm";

export default async function CompletarCadastroPage() {
  const pending = await getPendingGoogleSignup();
  if (!pending) redirect("/login");

  return (
    <>
      <div className="mt-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Quase lá
        </h1>
        <p className="mt-1.5 text-sm text-white/60">
          Confirmamos seu Google ({pending.email}). Só falta escolher seu
          link e completar o perfil que seus apoiadores vão ver.
        </p>
      </div>

      <CompleteGoogleSignupForm initialName={pending.name} />
    </>
  );
}
