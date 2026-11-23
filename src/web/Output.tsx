import { useState } from "react";
import * as styles from "./Output.module.css";
import type { CardKind } from "@/cards/paths";
import type { Minted } from "./useToken";

type Snippet = {
  readonly label: string;
  readonly render: (minted: Minted, kind: CardKind) => string;
};

const SNIPPETS: readonly Snippet[] = [
  { label: "url", render: ({ url }) => url },
  { label: "markdown", render: ({ url }, kind) => `![${kind}](${url})` },
  { label: "html", render: ({ url }, kind) => `<img src="${url}" alt="${kind} presence" />` },
];

const COPIED_MS = 1200;

export const Output = ({ minted, kind }: { readonly minted: Minted; readonly kind: CardKind }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied((current) => (current === label ? null : current)), COPIED_MS);
  };

  return (
    <div className={styles.output}>
      {SNIPPETS.map(({ label, render }) => {
        const value = render(minted, kind);
        return (
          <button key={label} type="button" className={styles.snippet} onClick={() => copy(label, value)}>
            <span className={styles.snippetLabel}>{copied === label ? "copied" : label}</span>
            <code className={styles.snippetValue}>{value}</code>
          </button>
        );
      })}
      <p className={styles.meta}>
        {minted.bytes} char token · protobuf + hmac{minted.tracked === false ? " · not live yet, see the hint under user" : ""}
      </p>
    </div>
  );
};
