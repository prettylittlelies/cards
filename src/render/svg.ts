const ESCAPES: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g;

export const escape = (value: string): string => value.replace(CONTROL, "").replace(/[&<>"']/g, (c) => ESCAPES[c]!);

export type Markup = { readonly __markup: string };

export type Child = Markup | string | number | false | null | undefined | readonly Child[];

export type Attrs = Readonly<Record<string, string | number | boolean | null | undefined>>;

export const raw = (markup: string): Markup => ({ __markup: markup });

const isMarkup = (child: object): child is Markup => "__markup" in child;

const serialize = (child: Child): string => {
  if (child === false || child === null || child === undefined) return "";
  if (typeof child === "string") return escape(child);
  if (typeof child === "number") return String(child);
  if (Array.isArray(child)) return child.map(serialize).join("");
  return isMarkup(child as object) ? (child as Markup).__markup : "";
};

const attribute = ([name, value]: readonly [string, Attrs[string]]): string => {
  if (value === null || value === undefined || value === false) return "";
  if (value === true) return ` ${name}`;
  return ` ${name}="${escape(typeof value === "number" ? round(value) : value)}"`;
};

export const round = (value: number): string => String(Math.round(value * 100) / 100);

export const h = (tag: string, attrs: Attrs = {}, ...children: Child[]): Markup => {
  const open = `<${tag}${Object.entries(attrs).map(attribute).join("")}`;
  const body = children.map(serialize).join("");
  return raw(body ? `${open}>${body}</${tag}>` : `${open}/>`);
};

export const fragment = (...children: Child[]): Markup => raw(children.map(serialize).join(""));

export const render = (child: Child): string => serialize(child);
