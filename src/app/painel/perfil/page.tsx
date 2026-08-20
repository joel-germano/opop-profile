import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "@/components/ProfileForm";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) return null; // já redirecionado pelo layout/proxy do /painel

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-normal tracking-wide text-white">
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
