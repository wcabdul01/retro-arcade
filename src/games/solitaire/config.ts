import { GB } from "../../config/AppConfig";

export const CARD = {
  WIDTH: 60,
  HEIGHT: 84,
  GAP: 6,
  STACK_OFFSET_FACEDOWN: 9,
  STACK_OFFSET_FACEUP: 24,
};

export const SOL_COLORS = {
  FACE_BG: GB.LIGHT,
  BACK_BG: GB.DARK,
  BORDER: GB.DARKEST,
  SLOT_BORDER: GB.DARK,
  HIGHLIGHT: GB.DARKEST,
  DARK_SUIT: "#16170f",
  LIGHT_SUIT: "#545a41",
  BACK_MARK: "#9ba17c",
};

export const GAMEPLAY = {
  SCORE_PER_FOUNDATION_CARD: 10,
};
