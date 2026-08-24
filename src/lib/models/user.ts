import { Schema, type InferSchemaType } from "mongoose";
import { registerModel } from "@/lib/models/register-model";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    whatsapp: { type: String, trim: true, default: "" },
    photoUrl: { type: String, required: true },
    // Conteúdo da campanha (preenchido no fluxo de /painel antes de ter
    // conta — ver CampaignDraftModel — e migrado pra cá na hora do cadastro).
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    caption: { type: String, trim: true, default: "" },
    // Foto opcional que o dono sobe pra ilustrar a prévia do passo "Modelo
    // de legenda" — só aparece no /painel dele, nunca na página pública.
    previewPhotoUrl: { type: String, trim: true, default: "" },
    // Capa da campanha: moldura + foto da prévia compostas numa imagem só,
    // regerada a cada "Publicar" (ver saveCoverAction). coverPreviewPhotoUrl
    // é a foto "crua" usada nessa composição — pode ser uma persona (não
    // rastreada em previewPhotoUrl, que só guarda upload próprio) ou a foto
    // enviada. Existe pra imagem OG mostrar a MESMA foto que está dentro da
    // capa, em vez de cair pra photoUrl (a do cadastro, que pode ser outra).
    coverUrl: { type: String, trim: true, default: "" },
    coverPreviewPhotoUrl: { type: String, trim: true, default: "" },
    // Contagem de acessos à página pública /username, exibida como prova
    // social ("N usando essas molduras"). Incrementada a cada carregamento
    // (não requer login) por um valor aleatório — ver randomVisitIncrement
    // em src/app/[id]/page.tsx — pra dar sensação de crescimento orgânico
    // enquanto a audiência real ainda é pequena.
    visitCount: { type: Number, default: 0 },
    // Opcional: contas criadas via Google podem não ter senha — login só
    // pelo Google até o usuário decidir cadastrar uma (não implementado).
    passwordHash: { type: String },
    googleId: { type: String },
    plan: { type: String, enum: ["free", "premium"], default: "free" },
    premiumSince: { type: Date },
    // Recuperação de senha: guarda só o hash do token (nunca o token em si —
    // o link de reset com o token puro só existe no email do usuário). Expira
    // sozinho por data; não precisa de job de limpeza.
    resetPasswordTokenHash: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema> & { _id: string };

export const UserModel = registerModel("User", userSchema);
