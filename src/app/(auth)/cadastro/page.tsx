import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { resolveNextPath } from "@/lib/safe-redirect";
import { CadastroForm } from "@/components/CadastroForm";

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    const { next } = await searchParams;
    redirect(resolveNextPath(next) ?? "/painel");
  }

  return (
    <Suspense>
      <CadastroForm googleClientId={process.env.GOOGLE_CLIENT_ID ?? ""} />
    </Suspense>
  );
}
