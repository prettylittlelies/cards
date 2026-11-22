const NARROW = new Set([..."il.,:;'|!`()[]{}/\\ "]);
const SLIM = new Set([..."fjrtI1-\""]);
const WIDE = new Set([..."mwMW@%&"]);
const WIDE_RANGE = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]|\p{Extended_Pictographic}/u;
const ELLIPSIS = "…";

export type Weight = 400 | 500 | 600 | 700;

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

const weightScale = (weight: Weight): number => 1 + (weight - 400) * 0.0004;

export const measure = (text: string, size: number, weight: Weight = 400): number =>
  graphemes(text).reduce((sum, g) => sum + factor(g), 0) * size * weightScale(weight);

export const truncate = (text: string, width: number, size: number, weight: Weight = 400): string => {
  if (measure(text, size, weight) <= width) return text;
  const budget = width - measure(ELLIPSIS, size, weight);
  const parts = graphemes(text);
  let used = 0;
  let index = 0;
  const scale = size * weightScale(weight);
  while (index < parts.length && used + factor(parts[index]!) * scale <= budget) {
    used += factor(parts[index]!) * scale;
    index += 1;
  }
  return `${parts.slice(0, index).join("").trimEnd()}${ELLIPSIS}`;
};

export const wrap = (text: string, width: number, size: number, maxLines: number, weight: Weight = 400): string[] => {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate, size, weight) <= width || !line) {
        line = candidate;
        continue;
      }
      lines.push(line);
      line = word;
    }
    lines.push(line);
  }
  const visible = lines.filter((line, index) => line || index < lines.length - 1).slice(0, maxLines);
  const clipped = lines.length > maxLines;
  return visible.map((line, index) =>
    truncate(index === visible.length - 1 && clipped ? `${line}${ELLIPSIS}` : line, width, size, weight),
  );
};
