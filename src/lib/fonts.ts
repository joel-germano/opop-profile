export type FontOption = {
  label: string;
  family: string;
  google: boolean;
};

export const FONT_OPTIONS: FontOption[] = [
  { label: "Roboto", family: "Roboto, sans-serif", google: true },
  { label: "Arial", family: "Arial, Helvetica, sans-serif", google: false },
  { label: "Times New Roman", family: '"Times New Roman", Times, serif', google: false },
  { label: "Courier", family: '"Courier New", Courier, monospace', google: false },
  { label: "Oleo Script", family: '"Oleo Script", cursive', google: true },
  { label: "Bebas Neue", family: '"Bebas Neue", sans-serif', google: true },
  { label: "Sacramento", family: "Sacramento, cursive", google: true },
  { label: "Montserrat", family: "Montserrat, sans-serif", google: true },
  { label: "Kalam", family: "Kalam, cursive", google: true },
  { label: "Playfair Display", family: '"Playfair Display", serif', google: true },
  { label: "Fira Mono", family: '"Fira Mono", monospace', google: true },
  { label: "Zilla Slab", family: '"Zilla Slab", serif', google: true },
  { label: "Raleway", family: "Raleway, sans-serif", google: true },
];

export const DEFAULT_FONT = FONT_OPTIONS[0];

export const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?" +
  [
    "family=Roboto:ital,wght@0,400;0,700;1,400;1,700",
    "family=Oleo+Script:wght@400;700",
    "family=Bebas+Neue",
    "family=Sacramento",
    "family=Montserrat:ital,wght@0,400;0,700;1,400;1,700",
    "family=Kalam:ital,wght@0,400;0,700;1,400",
    "family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700",
    "family=Fira+Mono:wght@400;700",
    "family=Zilla+Slab:ital,wght@0,400;0,700;1,400;1,700",
    "family=Raleway:ital,wght@0,400;0,700;1,400;1,700",
  ].join("&") +
  "&display=swap";
