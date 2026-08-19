export type Template = {
  id: number;
  name: string;
  src: string;
};

export const templates: Template[] = Array.from({ length: 8 }, (_, i) => {
  const id = i + 1;
  return {
    id,
    name: `Modelo ${id}`,
    src: `/templates/template-${id}.png`,
  };
});
