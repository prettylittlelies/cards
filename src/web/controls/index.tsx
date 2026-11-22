import { FALLBACK_ACCENT } from "@/cards/discord/schema";
import { useId, type ReactNode } from "react";
import * as styles from "./controls.module.css";

const cx = (...names: (string | false | undefined)[]): string => names.filter(Boolean).join(" ");

export const Section = ({ title, children }: { readonly title: string; readonly children: ReactNode }) => (
  <section className={styles.section}>
    <h2 className={styles.heading}>{title}</h2>
    {children}
  </section>
);

export const Row = ({ label, children }: { readonly label: string; readonly children: (id: string) => ReactNode }) => {
  const id = useId();
  return (
    <div className={styles.row}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children(id)}
    </div>
  );
};

type SegmentedProps<V extends string> = {
  readonly id?: string;
  readonly options: readonly V[];
  readonly value: V;
  readonly onChange: (value: V) => void;
};

export const Segmented = <V extends string>({ id, options, value, onChange }: SegmentedProps<V>) => (
  <div id={id} role="radiogroup" className={styles.segmented}>
    {options.map((option) => (
      <button key={option} type="button" role="radio" aria-checked={option === value} className={styles.segment} onClick={() => onChange(option)}>
        {option}
      </button>
    ))}
  </div>
);

type SliderProps = {
  readonly id?: string;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly value: number;
  readonly onChange: (value: number) => void;
};

export const Slider = ({ id, min, max, step = 1, value, onChange }: SliderProps) => (
  <div className={styles.slider}>
    <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.currentTarget.valueAsNumber)} />
    <span className={styles.value}>{value}</span>
  </div>
);

type TextProps = {
  readonly id?: string;
  readonly value: string;
  readonly placeholder?: string;
  readonly maxLength?: number;
  readonly mono?: boolean;
  readonly inputMode?: "numeric" | "text";
  readonly onChange: (value: string) => void;
};

export const TextInput = ({ id, value, placeholder, maxLength, mono, inputMode, onChange }: TextProps) => (
  <input
    id={id}
    className={cx(styles.input, mono && styles.mono)}
    value={value}
    placeholder={placeholder}
    maxLength={maxLength}
    inputMode={inputMode}
    spellCheck={false}
    autoComplete="off"
    onChange={(event) => onChange(event.currentTarget.value)}
  />
);

type ChipsProps = {
  readonly names: readonly string[];
  readonly value: Readonly<Record<string, boolean>>;
  readonly label: (name: string) => string;
  readonly onToggle: (name: string, value: boolean) => void;
};

export const Chips = ({ names, value, label, onToggle }: ChipsProps) => (
  <div className={styles.chips}>
    {names.map((name) => (
      <button key={name} type="button" aria-pressed={value[name]} className={styles.chip} onClick={() => onToggle(name, !value[name])}>
        {label(name)}
      </button>
    ))}
  </div>
);

type ColorProps = {
  readonly id?: string;
  readonly value: number | null;
  readonly onChange: (value: number | null) => void;
};

const toHex = (value: number): string => `#${value.toString(16).padStart(6, "0")}`;

export const ColorInput = ({ id, value, onChange }: ColorProps) => (
  <div className={styles.color}>
    <input
      type="color"
      aria-label="accent colour"
      className={styles.swatch}
      value={toHex(value ?? FALLBACK_ACCENT)}
      onChange={(event) => onChange(Number.parseInt(event.currentTarget.value.slice(1), 16))}
    />
    <Segmented
      id={id}
      options={["auto", "custom"] as const}
      value={value === null ? "auto" : "custom"}
      onChange={(mode) => onChange(mode === "auto" ? null : (value ?? FALLBACK_ACCENT))}
    />
  </div>
);
