import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "@/components/ProfileForm";
import { BackButton } from "@/components/BackButton";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  // /painel não exige mais login (ver painel/layout.tsx), mas essa tela
  // continua exigindo conta de verdade — se protege sozinha.
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackButton />
        <h1 className="mt-4 text-lg font-bold tracking-tight text-white">
          Meu perfil
        </h1>
        <p className="mt-2 text-base text-white/60">
          Atualize seus dados e sua foto.
        </p>
      </div>

      <ProfileForm
        initialName={user.name}
        initialUsername={user.username}
        initialWhatsapp={user.whatsapp}
        initialPhotoUrl={user.photoUrl}
      />
    </div>
  );
}
