import { hex, legible, mix } from "./color";

export const THEMES = ["graphite", "midnight", "paper", "mono", "tinted"] as const;
export const FONTS = ["system", "geometric", "mono", "serif"] as const;

export type ThemeName = (typeof THEMES)[number];
export type FontName = (typeof FONTS)[number];

export type Palette = {
  readonly background: number;
  readonly surface: number;
  readonly border: number;
  readonly text: number;
  readonly muted: number;
  readonly faint: number;
};

export type Theme = {
  readonly palette: Palette;
  readonly accent: number;
  readonly css: Readonly<Record<keyof Palette | "accent", string>>;
};

const PALETTES: Readonly<Record<Exclude<ThemeName, "tinted">, Palette>> = {
  graphite: { background: 0x111113, surface: 0x1a1a1d, border: 0x26262b, text: 0xededef, muted: 0x9b9ba4, faint: 0x5c5c66 },
  midnight: { background: 0x0b0d14, surface: 0x121624, border: 0x1d2236, text: 0xe6e9f2, muted: 0x8a92ab, faint: 0x4e5672 },
  paper: { background: 0xfbfbfa, surface: 0xf1f1ef, border: 0xe4e4e1, text: 0x18181b, muted: 0x63636b, faint: 0xa1a1a8 },
  mono: { background: 0x000000, surface: 0x0c0c0c, border: 0x1f1f1f, text: 0xffffff, muted: 0xa3a3a3, faint: 0x5e5e5e },
};

const tinted = (accent: number): Palette => {
  const base = mix(0x0c0c0e, accent, 0.12);
  return {
    background: base,
    surface: mix(base, accent, 0.08),
    border: mix(base, accent, 0.2),
    text: mix(0xffffff, accent, 0.06),
    muted: mix(0xa0a0a8, accent, 0.25),
    faint: mix(0x5a5a62, accent, 0.3),
  };
};

export const FONT_STACKS: Readonly<Record<FontName, string>> = {
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI Variable Text', 'Segoe UI', 'Inter', 'Helvetica Neue', Arial, sans-serif",
  geometric: "'Avenir Next', 'Avenir', 'Montserrat', 'Century Gothic', 'Segoe UI', sans-serif",
  mono: "'SF Mono', 'JetBrains Mono', 'Cascadia Code', 'Consolas', 'Menlo', monospace",
  serif: "'New York', 'Iowan Old Style', 'Charter', 'Georgia', 'Times New Roman', serif",
};

export const createTheme = (name: ThemeName, accent: number): Theme => {
  const palette = name === "tinted" ? tinted(accent) : PALETTES[name];
  const ink = legible(accent, palette.background);
  return {
    palette,
    accent: ink,
    css: {
      background: hex(palette.background),
      surface: hex(palette.surface),
      border: hex(palette.border),
      text: hex(palette.text),
      muted: hex(palette.muted),
      faint: hex(palette.faint),
      accent: hex(ink),
    },
  };
};
