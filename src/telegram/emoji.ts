import { Long, Thumbnail, type TelegramClient } from "@mtcute/bun";

export type EmojiArt = {
  readonly outline: string | null;
  readonly image: string | null;
};

export const OUTLINE_SIZE = 512;

export const loadEmojiArt = async (tg: TelegramClient, documentId: string): Promise<EmojiArt> => {
  const [sticker] = await tg.getCustomEmojis([Long.fromString(documentId)]);
  if (!sticker) return { outline: null, image: null };
  const outline = sticker.getThumbnail(Thumbnail.THUMB_OUTLINE);
  const raster = sticker.getThumbnail(Thumbnail.THUMB_320x320_BOX) ?? sticker.getThumbnail(Thumbnail.THUMB_100x100_BOX);
  const bytes = raster ? await tg.downloadAsBuffer(raster) : null;
  return {
    outline: outline?.path ?? null,
    image: bytes ? `data:image/webp;base64,${Buffer.from(bytes).toString("base64")}` : null,
  };
};
