import type { Dispatch } from "react";
import { DiscordCard, MOTION, SHOW } from "@/cards/discord/schema";
import { FONTS, THEMES } from "@/render/theme";
import { Chips, ColorInput, Row, Section, Segmented, Slider, TextInput } from "./controls";
import { humanize, type Action, type Config } from "./state";

type Props = {
  readonly config: Config;
  readonly dispatch: Dispatch<Action>;
};

type NumericKey = { [K in keyof Config]: Config[K] extends number ? K : never }[keyof Config] & keyof typeof DiscordCard;

const SLIDERS: readonly (readonly [NumericKey, string, number?])[] = [
  ["width", "width", 4],
  ["radius", "radius"],
  ["scale", "scale"],
];

const TEXTS = [
  ["name", "name", "display name"],
] as const satisfies readonly (readonly [keyof Config, string, string])[];

export const Editor = ({ config, dispatch }: Props) => {
  const set = (patch: Partial<Config>) => dispatch({ type: "set", patch });

  return (
    <>
      <Section title="user">
        <Row label="discord id">
          {(id) => (
            <TextInput
              id={id}
              mono
              inputMode="numeric"
              placeholder="442626774841556992"
              value={config.user === "0" ? "" : config.user}
              maxLength={20}
              onChange={(value) => set({ user: value.replace(/\D/g, "") || "0" })}
            />
          )}
        </Row>
      </Section>

      <Section title="look">
        <Row label="theme">{(id) => <Segmented id={id} options={THEMES} value={config.theme} onChange={(theme) => set({ theme })} />}</Row>
        <Row label="font">{(id) => <Segmented id={id} options={FONTS} value={config.font} onChange={(font) => set({ font })} />}</Row>
        <Row label="accent">{(id) => <ColorInput id={id} value={config.accent} onChange={(accent) => set({ accent })} />}</Row>
      </Section>

      <Section title="size">
        {SLIDERS.map(([key, label, step]) => {
          const bounds = DiscordCard[key];
          return (
            <Row key={key} label={label}>
              {(id) => <Slider id={id} min={bounds.min} max={bounds.max} step={step} value={config[key]} onChange={(value) => set({ [key]: value })} />}
            </Row>
          );
        })}
      </Section>

      <Section title="show">
        <Chips names={SHOW} value={config.show} label={humanize} onToggle={(name, value) => dispatch({ type: "flag", group: "show", name, value })} />
      </Section>

      <Section title="motion">
        <Chips names={MOTION} value={config.motion} label={humanize} onToggle={(name, value) => dispatch({ type: "flag", group: "motion", name, value })} />
      </Section>

      <Section title="text">
        {TEXTS.map(([key, label, placeholder]) => (
          <Row key={key} label={label}>
            {(id) => (
              <TextInput id={id} value={config[key]} placeholder={placeholder} maxLength={DiscordCard[key].max} onChange={(value) => set({ [key]: value })} />
            )}
          </Row>
        ))}
      </Section>
    </>
  );
};
