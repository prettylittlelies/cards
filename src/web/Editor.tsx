import type { ReactNode } from "react";
import type { Field } from "@/proto/schema";
import type { About, Entry, HintPart } from "./catalog";
import { Chips, ColorInput, Row, Section, Segmented, Slider, TextInput } from "./controls";
import { humanize, type Config, type Patch } from "./state";

type Props = {
  readonly entry: Entry;
  readonly config: Config;
  readonly about: About;
  readonly onChange: (patch: Patch) => void;
};

type Group = "look" | "size" | "flags" | "text";

const GROUP: Readonly<Record<Field["kind"], Group | null>> = {
  enum: "look",
  color: "look",
  uint: "size",
  flags: "flags",
  text: "text",
  bool: "look",
  snowflake: null,
  message: null,
};

const SLIDER_STEP: Readonly<Record<string, number>> = { width: 4 };

const control = (name: string, field: Field, value: unknown, set: (value: unknown) => void, id: string): ReactNode => {
  switch (field.kind) {
    case "enum":
      return <Segmented id={id} options={field.values} value={value as string} onChange={set} />;
    case "color":
      return <ColorInput id={id} value={value as number | null} onChange={set} />;
    case "uint":
      return <Slider id={id} min={field.min} max={field.max} step={SLIDER_STEP[name]} value={value as number} onChange={set} />;
    case "text":
      return <TextInput id={id} value={value as string} maxLength={field.max} placeholder={humanize(name)} onChange={set} />;
    case "bool":
      return <Segmented id={id} options={["off", "on"] as const} value={value ? "on" : "off"} onChange={(next) => set(next === "on")} />;
    default:
      return null;
  }
};

const hintPart = (part: HintPart, index: number): ReactNode =>
  typeof part === "string" ? (
    part
  ) : (
    <a key={index} href={part.href} target="_blank" rel="noreferrer">
      {part.text}
    </a>
  );

export const Editor = ({ entry, config, about, onChange }: Props) => {
  const { schema, identity } = entry;
  const fields = Object.entries(schema).filter(([name]) => name !== "user");
  const grouped = (group: Group) => fields.filter(([, field]) => GROUP[field.kind] === group);
  const user = String(config.user ?? "");

  const rows = (group: Group) =>
    grouped(group).map(([name, field]) => (
      <Row key={name} label={humanize(name)}>
        {(id) => control(name, field, config[name], (value) => onChange({ [name]: value }), id)}
      </Row>
    ));

  return (
    <>
      <Section title="user">
        <Row label={identity.label}>
          {(id) => (
            <TextInput
              id={id}
              mono={identity.mono}
              placeholder={identity.placeholder}
              value={user === identity.empty ? "" : user}
              maxLength={32}
              onChange={(value) => onChange({ user: identity.clean(value) })}
            />
          )}
        </Row>
        <p className="hint">{identity.hint(about).map(hintPart)}</p>
      </Section>

      <Section title="look">{rows("look")}</Section>
      <Section title="size">{rows("size")}</Section>

      {grouped("flags").map(([name, field]) =>
        field.kind === "flags" ? (
          <Section key={name} title={humanize(name)}>
            <Chips
              names={field.values}
              value={config[name] as Readonly<Record<string, boolean>>}
              label={humanize}
              onToggle={(flag, value) => onChange({ [name]: { ...(config[name] as object), [flag]: value } })}
            />
          </Section>
        ) : null,
      )}

      <Section title="text">{rows("text")}</Section>
    </>
  );
};
