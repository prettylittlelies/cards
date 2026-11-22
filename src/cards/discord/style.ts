import { FONT_STACKS, type Theme } from "@/render";
import type { DiscordCardConfig } from "./schema";

const KEYFRAMES = {
  fadeIn: "@keyframes in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}.card{animation:in .6s cubic-bezier(.2,.7,.2,1) both}",
  equalizer:
    "@keyframes eq{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}.eq rect{transform-box:fill-box;transform-origin:50% 100%;animation:eq 1.1s ease-in-out infinite}",
  pulse:
    "@keyframes pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.6);opacity:0}}.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 2s ease-out infinite}",
} as const satisfies Partial<Record<keyof DiscordCardConfig["motion"], string>>;

export const stylesheet = (theme: Theme, config: DiscordCardConfig): string => {
  const { css } = theme;
  const motion = (Object.keys(KEYFRAMES) as (keyof typeof KEYFRAMES)[]).filter((name) => config.motion[name]).map((name) => KEYFRAMES[name]);
  return [
    `text{font-family:${FONT_STACKS[config.font]}}`,
    `.t{fill:${css.text}}.m{fill:${css.muted}}.f{fill:${css.faint}}.a{fill:${css.accent}}`,
    `.track{fill:${css.border}}.fill{fill:${css.accent}}`,
    ".caps{letter-spacing:.04em}.tnum{font-variant-numeric:tabular-nums}",
    ...motion,
    "@media (prefers-reduced-motion:reduce){*{animation:none!important}}",
  ].join("");
};
