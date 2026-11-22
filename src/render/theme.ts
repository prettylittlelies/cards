export const THEMES = ["dark", "light"] as const;
export const FONTS = ["gg", "poppins", "system"] as const;

export type ThemeName = (typeof THEMES)[number];
export type FontName = (typeof FONTS)[number];

export type Palette = {
  readonly fg: number;
  readonly muted: number;
  readonly bg: number;
};

export const PALETTES: Readonly<Record<ThemeName, Palette>> = {
  dark: { fg: 0xededed, muted: 0x8a8a93, bg: 0x0a0a0a },
  light: { fg: 0x000000, muted: 0x6b6b6b, bg: 0xffffff },
};

export const FONT_STACKS: Readonly<Record<FontName, string>> = {
  gg: "'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  poppins: "Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI Variable Text', 'Segoe UI', Inter, sans-serif",
};
