const NARROW = new Set([..."il.,:;'|!`()[]{}/\\ "]);
const SLIM = new Set([..."fjrtI1-\""]);
const WIDE = new Set([..."mwMW@%&"]);
const WIDE_RANGE = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]|\p{Extended_Pictographic}/u;
const ELLIPSIS = "…";

export type Measure = (text: string) => number;

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export const graphemes = (text: string): string[] => [...segmenter.segment(text)].map((s) => s.segment);

const factor = (grapheme: string): number => {
  if (NARROW.has(grapheme)) return 0.3;
  if (SLIM.has(grapheme)) return 0.38;
  if (WIDE.has(grapheme)) return 0.84;
  if (WIDE_RANGE.test(grapheme)) return 1.05;
  if (grapheme >= "A" && grapheme <= "Z") return 0.66;
  if (grapheme >= "0" && grapheme <= "9") return 0.57;
  return 0.54;
};

export const estimate: Measure = (text) => graphemes(text).reduce((sum, g) => sum + factor(g), 0);

export const measure = (text: string, size: number, em: Measure): number => em(text) * size;

export const truncate = (text: string, width: number, size: number, em: Measure): string => {
  if (measure(text, size, em) <= width) return text;
  const budget = width - measure(ELLIPSIS, size, em);
  const parts = graphemes(text);
  let fit = 0;
  while (fit < parts.length && measure(parts.slice(0, fit + 1).join(""), size, em) <= budget) fit += 1;
  return `${parts.slice(0, fit).join("").trimEnd()}${ELLIPSIS}`;
};
