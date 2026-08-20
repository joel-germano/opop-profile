import { redirect } from "next/navigation";
import { getPendingGoogleSignup } from "@/lib/auth";
import { CompleteGoogleSignupForm } from "@/components/CompleteGoogleSignupForm";

export default async function CompletarCadastroPage() {
  const pending = await getPendingGoogleSignup();
  if (!pending) redirect("/login");

  return (
    <>
      <div className="mt-2 text-center">
        <h1 className="font-heading text-3xl font-normal tracking-wide text-white">
          Quase lá
        </h1>
        <p className="mt-2 text-base text-white/60">
          Confirmamos seu Google ({pending.email}). Só falta completar seu perfil.
        </p>
      </div>

      <CompleteGoogleSignupForm initialName={pending.name} />
    </>
  );
}
