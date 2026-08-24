// Escapa caracteres especiais de regex antes de usar input de busca do
// usuário num filtro do Mongo — sem isso, `.`, `*`, `(` etc. quebram a regex
// ou mudam o que ela casa.
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
