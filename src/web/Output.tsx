import { useState } from "react";
import * as styles from "./Output.module.css";
import type { Minted } from "./useToken";

type Snippet = {
  readonly label: string;
  readonly render: (minted: Minted) => string;
};

const SNIPPETS: readonly Snippet[] = [
  { label: "url", render: ({ url }) => url },
  { label: "markdown", render: ({ url }) => `![discord](${url})` },
  { label: "html", render: ({ url }) => `<img src="${url}" alt="discord presence" />` },
];

const COPIED_MS = 1200;

export const Output = ({ minted }: { readonly minted: Minted }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied((current) => (current === label ? null : current)), COPIED_MS);
  };

  return (
    <div className={styles.output}>
      {SNIPPETS.map(({ label, render }) => {
        const value = render(minted);
        return (
          <button key={label} type="button" className={styles.snippet} onClick={() => copy(label, value)}>
            <span className={styles.snippetLabel}>{copied === label ? "copied" : label}</span>
            <code className={styles.snippetValue}>{value}</code>
          </button>
        );
      })}
      <p className={styles.meta}>
        {minted.bytes} char token · protobuf + hmac{minted.tracked === false ? " · not on lanyard yet, join discord.gg/lanyard" : ""}
      </p>
    </div>
  );
};
