import "server-only";
import { randomBytes } from "crypto";
import { UserModel } from "@/lib/models/user";
import { slugifyUsername } from "@/lib/slug";

// Usado quando alguém cria conta sem ter passado pelo passo "Link da
// campanha" em /painel antes (não tem rascunho, então não tem username
// escolhido). Gera um link provisório a partir do nome — a pessoa troca por
// um de verdade depois, em /painel, na hora de publicar (ver
// publishForCurrentUserAction).
export async function generateUniqueUsername(base: string): Promise<string> {
  const slug = slugifyUsername(base) || "usuario";
  let candidate = slug;
  let attempt = 0;

  while (await UserModel.exists({ username: candidate })) {
    attempt += 1;
    const suffix =
      attempt <= 3
        ? String(Math.floor(1000 + Math.random() * 9000))
        : randomBytes(3).toString("hex");
    candidate = `${slug}-${suffix}`;
  }

  return candidate;
}
