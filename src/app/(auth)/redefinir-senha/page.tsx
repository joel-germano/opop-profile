import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <Suspense>
      <ResetPasswordForm token={token ?? ""} />
    </Suspense>
  );
}
