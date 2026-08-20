import { GB } from "../../config/AppConfig";

// COLS * CELL should fill PLAYFIELD_WIDTH (420) as closely as possible —
// any gap here is dead space between the drawn frame and the actual grid
// where the snake collides with an invisible boundary before it looks like
// it's reached the wall. 22 * 19 = 418 (1px slack per side); the previous
// COLS=20 left a very noticeable 20px gap on each side.
export const COLS = 22;
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
