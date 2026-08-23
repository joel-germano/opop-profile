import { model, models, deleteModel, type Schema } from "mongoose";

// O `next dev` mantém o mesmo processo Node vivo entre hot-reloads, e o
// mongoose guarda os models já compilados num registro global. Com o padrão
// `models.X ?? model("X", schema)`, mexer no schema não tinha efeito nenhum
// até reiniciar o servidor na mão — e o pior: em strict mode (o padrão) o
// mongoose DESCARTA EM SILÊNCIO qualquer $set em campo que o schema em
// memória não conhece. Ou seja, o update "dava certo" (updatedAt até mudava)
// mas o campo novo nunca era gravado.
//
// Isso já custou uma sessão inteira de debug com o campo previewPhotoUrl:
// arquivo salvo no disco, URL perdida no banco, e a limpeza depois não tinha
// o que apagar (virava órfão em public/uploads).
//
// Aqui, em dev, o model antigo é descartado pra recompilar com o schema
// atual. Em produção o processo é novo a cada deploy, então segue o
// comportamento de sempre.
export function registerModel(name: string, schema: Schema) {
  if (process.env.NODE_ENV !== "production" && models[name]) {
    deleteModel(name);
  }
  return models[name] ?? model(name, schema);
}
