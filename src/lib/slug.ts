// Normaliza texto livre pra um formato válido de username: minúsculas,
// sem acento, espaço vira "-", só letras/números/_/./-  sobrevivem.
export function slugifyUsername(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (NFD separa a letra do acento)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_.-]/g, "");
}
