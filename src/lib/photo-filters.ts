export type PhotoFilter = {
  id: string;
  label: string;
  /** Valid both as a CSS `filter` value and as a Canvas 2D `ctx.filter` value. */
  css: string;
};

const NAMES = [
  "Cannes",
  "Macau",
  "Calusa",
  "Melawai",
  "Aberdeen",
  "Sarajevo",
  "Louvre",
  "Geneva",
  "Giza",
  "Kemajoran",
  "Stockholm",
  "Floriano",
  "Maribor",
  "Odessa",
  "Milan",
  "Seoul",
  "Saigon",
  "Wolfsburg",
  "Java",
  "Malaga",
  "Helsinki",
  "Rakvere",
  "Kandy",
  "Boracay",
  "Macau",
  "Lima",
  "Nairobi",
  "Nazareth",
  "Phoenix",
  "Lost",
  "Dakota",
  "Suryakencana",
  "Mogadishu",
  "Kent",
  "Agra",
  "Quebec",
  "Cyrthea",
  "Luxor",
  "Marrakech",
  "Manchester",
  "Manila",
  "Fortaleza",
];

/** Names that are true black & white / grayscale looks. */
const MUTED = new Set([
  "Nairobi",
  "Nazareth",
  "Phoenix",
  "Lost",
  "Dakota",
  "Milan",
  "Seoul",
  "Odessa",
  "Wolfsburg",
  "Kent",
]);

/**
 * Hue angles reverse-engineered from a real reference (sepia base pushed
 * around the color wheel via hue-rotate): Cannes = warm orange, Macau =
 * violet/indigo, Calusa = magenta/pink, Melawai = red/coral.
 */
const HUE_OVERRIDES: Record<string, number> = {
  Cannes: 8,
  Macau: 232,
  Calusa: 292,
  Melawai: 332,
};

function buildFilter(name: string, index: number): string {
  if (MUTED.has(name)) {
    const contrast = 1.05 + ((index * 7) % 32) / 100;
    const brightness = 0.94 + ((index * 5) % 16) / 100;
    return `grayscale(1) contrast(${contrast.toFixed(2)}) brightness(${brightness.toFixed(2)})`;
  }

  const hue = HUE_OVERRIDES[name] ?? (index * 53) % 360;
  const sepia = 0.55 + ((index * 7) % 30) / 100;
  const saturate = 2.6 + ((index * 11) % 30) / 10;
  const contrast = 1.0 + ((index * 5) % 18) / 100;
  const brightness = 0.96 + ((index * 3) % 12) / 100;

  return `sepia(${sepia.toFixed(2)}) saturate(${saturate.toFixed(2)}) hue-rotate(${hue}deg) contrast(${contrast.toFixed(2)}) brightness(${brightness.toFixed(2)})`;
}

/**
 * Combines several CSS `filter` values into one. `none` (or empty) parts are
 * dropped, since `none` is only valid on its own — `blur(4px) none` is
 * invalid CSS and gets silently ignored by the browser (and canvas).
 */
export function combineFilters(...parts: (string | null | undefined)[]): string {
  const valid = parts.filter((p): p is string => Boolean(p) && p !== "none");
  return valid.length > 0 ? valid.join(" ") : "none";
}

export const PHOTO_FILTERS: PhotoFilter[] = [
  { id: "original", label: "Original", css: "none" },
  ...NAMES.map((label, i) => ({
    id: `${label.toLowerCase()}-${i}`,
    label,
    css: buildFilter(label, i),
  })),
];

export const DEFAULT_PHOTO_FILTER = PHOTO_FILTERS[0];
