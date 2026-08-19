import { GB } from "../../config/AppConfig";

export const COLS = 20;
export const ROWS = 36;
export const CELL = 19;

export const TIMING = {
  BASE_TICK_MS: 180,
  MIN_TICK_MS: 70,
  TICK_STEP_MS: 3,
};

export const SNAKE_COLORS = {
  HEAD: GB.DARKEST,
  BODY: GB.DARK,
  FOOD: GB.DARKEST,
};
