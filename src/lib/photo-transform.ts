export type PhotoTransform = {
  scale: number;
  x: number;
  y: number;
  rotation: number;
};

export const DEFAULT_PHOTO_TRANSFORM: PhotoTransform = {
  scale: 1,
  x: 0,
  y: 0,
  rotation: 0,
};

const MIN_SCALE = 0.05;
const MAX_SCALE = 6;

export function clampPhotoTransform(t: PhotoTransform): PhotoTransform {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale));
  return { scale, x: t.x, y: t.y, rotation: t.rotation };
}
