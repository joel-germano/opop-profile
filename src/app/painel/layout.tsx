import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PanelShell } from "@/components/PanelShell";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <PanelShell
      user={{
        name: user.name,
        username: user.username,
        photoUrl: user.photoUrl,
        plan: user.plan as "free" | "premium",
      }}
    >
      {children}
    </PanelShell>
  );
}
