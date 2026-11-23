import { useEffect, useState } from "react";
import type { CardKind } from "@/cards/paths";
import type { About } from "./catalog";

const EMPTY: About = {};

export const useAbout = (kind: CardKind): About => {
  const [about, setAbout] = useState<Readonly<Record<CardKind, About>>>({ discord: EMPTY, telegram: EMPTY });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/x/cards/${kind}/about`, { signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<About>) : EMPTY))
      .then((value) => setAbout((current) => ({ ...current, [kind]: value })))
      .catch(() => undefined);
    return () => controller.abort();
  }, [kind]);

  return about[kind];
};
