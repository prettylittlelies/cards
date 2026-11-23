import { mintPath, type CardKind } from "@/cards/paths";
import { useEffect, useState } from "react";
import type { Identity } from "./catalog";
import type { Config } from "./state";

export type Minted = {
  readonly token: string;
  readonly url: string;
  readonly bytes: number;
  readonly tracked: boolean | null;
};

export type TokenState =
  | { readonly status: "idle" }
  | { readonly status: "pending"; readonly last: Minted | null }
  | { readonly status: "ready"; readonly minted: Minted }
  | { readonly status: "error"; readonly message: string; readonly last: Minted | null };

const DEBOUNCE_MS = 250;
const SNOWFLAKE = /^\d{17,20}$/;

type Problem = { readonly title?: string; readonly detail?: string };

const mint = async (kind: CardKind, config: Config, signal: AbortSignal): Promise<Minted> => {
  const response = await fetch(mintPath(kind), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
    signal,
  });
  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as Problem;
    throw new Error(problem.detail ?? problem.title ?? `mint failed (${response.status})`);
  }
  return (await response.json()) as Minted;
};

const lastOf = (state: TokenState): Minted | null =>
  state.status === "ready" ? state.minted : state.status === "idle" ? null : state.last;

export const useToken = (kind: CardKind, identity: Identity, config: Config): TokenState => {
  const [state, setState] = useState<TokenState>({ status: "idle" });

  useEffect(() => {
    if (!identity.valid(String(config.user ?? ""))) {
      setState({ status: "idle" });
      return;
    }
    const controller = new AbortController();
    setState((previous) => ({ status: "pending", last: lastOf(previous) }));
    const timer = setTimeout(() => {
      mint(kind, config, controller.signal)
        .then((minted) => setState({ status: "ready", minted }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setState((previous) => ({ status: "error", message: error instanceof Error ? error.message : "mint failed", last: lastOf(previous) }));
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [kind, identity, config]);

  return state;
};

export const mintedOf = lastOf;
