import { fragment } from "@/render";
import { telegram } from "@/telegram/service";
import { frame, notice, surfaceOf } from "../frame";
import { defineCard } from "../kind";
import { buildModel } from "./model";
import { USERNAME } from "./schema";
import { avatar, nameLine, scene, summary, type Context } from "./sections";
import { TELEGRAM_TOKEN } from "./token";

const CSS = [
  ".on{fill:var(--on)}",
  "@keyframes tw{0%,100%{opacity:var(--a)}50%{opacity:calc(var(--a)*.35)}}",
  ".tw{animation:tw 4s ease-in-out infinite}",
  "@media (prefers-reduced-motion:reduce){.tw{animation:none}}",
].join("");

const optIn = async (): Promise<string> => {
  const account = await telegram.account();
  return account ? `DM @${account.username} /card to opt in` : "Opt-in is unavailable right now";
};

export const telegramCard = defineCard({
  kind: "telegram",
  token: TELEGRAM_TOKEN,
  validate: (config) => (USERNAME.test(config.user) ? null : "user: expected a telegram username"),
  draw: async (config) => {
    const { value, stale } = await telegram.profile(config.user)();
    if (value.status === "unconfigured") return { svg: await notice(config, "Telegram unavailable", "This server has no Telegram session"), stale };
    if (value.status === "private") return { svg: await notice(config, `@${config.user.replace(/^@/, "")} hasn't opted in`, await optIn()), stale };
    const model = await buildModel(config, value.profile, telegram);
    const ctx: Context = { ...surfaceOf(config), config, model };
    const svg = await frame({
      config,
      label: `${model.name} on Telegram`,
      body: fragment(scene(ctx), avatar(ctx), nameLine(ctx), summary(ctx)),
      css: CSS,
    });
    return { svg, stale };
  },
  unavailable: (config) => notice(config, "Telegram unavailable", "Couldn't reach Telegram, retrying shortly"),
  about: async () => ({ account: await telegram.account() }),
  inspect: async (config) => {
    const { value } = await telegram.profile(config.user)();
    return { tracked: value.status === "ok" };
  },
});
