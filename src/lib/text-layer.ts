import type { CSSProperties } from "react";
import { DEFAULT_FONT } from "./fonts";

export type TextLayer = {
  id: string;
  text: string;
  fontFamily: string;
  fontLabel: string;
  google: boolean;
  /** Font size expressed as units where 1000 units == stage width. Keeps text scale consistent between the preview and the exported canvas regardless of pixel size. */
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  /** Center position as a fraction of stage width/height, 0 = center. */
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

let counter = 0;

export function createTextLayer(): TextLayer {
  counter += 1;
  return {
    id: `text-${Date.now()}-${counter}`,
    text: "Digite seu texto",
    fontFamily: DEFAULT_FONT.family,
    fontLabel: DEFAULT_FONT.label,
    google: DEFAULT_FONT.google,
    size: 42,
    color: "#ffffff",
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  };
}

export function textFontSizePx(layer: TextLayer, stageWidthPx: number) {
  return (layer.size / 1000) * stageWidthPx * layer.scale;
}

export function textCssFontStyle(layer: TextLayer): CSSProperties {
  return {
    fontFamily: layer.fontFamily,
    fontWeight: layer.bold ? 700 : 400,
    fontStyle: layer.italic ? "italic" : "normal",
    textDecorationLine:
      layer.underline && layer.strikethrough
        ? "underline line-through"
        : layer.underline
          ? "underline"
          : layer.strikethrough
            ? "line-through"
            : "none",
    color: layer.color,
  };
}
