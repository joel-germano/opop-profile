// Só ilustrativo — artes de exemplo pra mostrar o estilo de moldura, sem
// perfil real por trás. Usado na home e na galeria dos presidenciáveis.
export const SHOWCASE_ITEMS = [
  { file: "01", title: "Cidade 44", supporters: "11K" },
  { file: "02", title: "O Pará Tá Junto", supporters: "2,4K" },
  { file: "03", title: "Tô Fechado Com Quem Faz", supporters: "8,1K" },
  { file: "04", title: "Tô Com 10", supporters: "980" },
  { file: "05", title: "Apoio Wellington Luiz", supporters: "3,6K" },
  { file: "06", title: "Pra Cima, Amazonas!", supporters: "15K" },
  { file: "07", title: "Tô Com Ela", supporters: "6,2K" },
  { file: "08", title: "Flávio 22", supporters: "42K" },
  { file: "09", title: "Lula 13", supporters: "58K" },
  { file: "10", title: "Tô Com A Renata", supporters: "1,3K" },
  { file: "11", title: "Roosevelt Vilela", supporters: "740" },
  { file: "12", title: "Lucas 11", supporters: "4,8K" },
  { file: "13", title: "Tô Com Rodinei", supporters: "2K" },
  { file: "14", title: "Hermeto 15.190", supporters: "1,1K" },
  { file: "15", title: "Defensor 4477", supporters: "9,3K" },
  { file: "16", title: "Joscilene 36.222", supporters: "620" },
].map((item) => ({ ...item, src: `/modelos-giro/${item.file}.webp` }));
