import { fragment, type Markup } from "./svg";

export type Block = {
  readonly height: number;
  readonly draw: (y: number) => Markup;
};

export const EMPTY_BLOCK: Block = { height: 0, draw: () => fragment() };

export const stack = (blocks: readonly (Block | null)[], gap: number): Block => {
  const present = blocks.filter((block): block is Block => block !== null && block.height > 0);
  const height = present.reduce((sum, block) => sum + block.height, 0) + gap * Math.max(0, present.length - 1);
  return {
    height,
    draw: (y) => {
      let cursor = y;
      return fragment(
        present.map((block) => {
          const markup = block.draw(cursor);
          cursor += block.height + gap;
          return markup;
        }),
      );
    },
  };
};

export const separated = (blocks: readonly (Block | null)[], gap: number, divider: (y: number) => Markup): Block => {
  const present = blocks.filter((block): block is Block => block !== null && block.height > 0);
  return stack(
    present.flatMap((block, index) => (index === 0 ? [block] : [{ height: 1, draw: divider }, block])),
    gap,
  );
};
