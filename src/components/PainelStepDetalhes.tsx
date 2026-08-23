import { Link2 } from "lucide-react";
import { TextField } from "@/components/TextField";
import { TextareaField } from "@/components/TextareaField";
import { UsernameField } from "@/components/UsernameField";
import { ProfilePreviewLink } from "@/components/ProfilePreviewLink";
import { PainelStepTabs } from "@/components/PainelStepTabs";

type Props = {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  username: string;
  onUsernameChange: (value: string) => void;
  isLoggedIn: boolean;
  onSelectStep: (step: 1 | 2 | 3) => void;
};

export function PainelStepDetalhes({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  username,
  onUsernameChange,
  isLoggedIn,
  onSelectStep,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <ProfilePreviewLink username={username} />
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary-light">
            <Link2 size={16} strokeWidth={2} />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            Detalhes da campanha
          </h1>
        </div>
        <PainelStepTabs
          isLoggedIn={isLoggedIn}
          activeStep={2}
          onSelectStep={onSelectStep}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-white">
          Título da campanha
        </label>
        <TextField
          type="text"
          name="titulo"
          placeholder="Pode ter números, letras ou caracteres especiais"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-white">
          Descrição <span className="font-normal text-white/40">(opcional)</span>
        </label>
        <TextareaField
          name="descricao"
          placeholder="Conte um pouco sobre sua campanha pra chamar atenção e conseguir apoio."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          maxLength={250}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-white">
          Link da campanha
        </label>
        <UsernameField
          name="username"
          placeholder="seu-nome"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          required
        />
      </div>
    </div>
  );
}
