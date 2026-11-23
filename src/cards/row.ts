export const ROW = {
  height: 42,
  inset: 8,
  gap: 12,
  avatar: 32,
  statusCenter: 27,
  statusRadius: 5,
  statusCutout: 8,
  nameSize: 15,
  nameLine: 20,
  decoratorGap: 4,
  subSize: 12,
  subLine: 16,
  subGap: 4,
  subIcon: 12,
} as const;

export const CONTENT_X = ROW.inset + ROW.avatar + ROW.gap;
export const NAME_TOP = (ROW.height - ROW.nameLine - ROW.subLine) / 2;
export const SUB_TOP = NAME_TOP + ROW.nameLine;
export const NAME_CENTER = NAME_TOP + ROW.nameLine / 2;
export const AVATAR_X = ROW.inset;
export const AVATAR_Y = (ROW.height - ROW.avatar) / 2;

export const contentX = (avatar: boolean): number => (avatar ? CONTENT_X : ROW.inset);
