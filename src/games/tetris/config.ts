import { GB } from "../../config/AppConfig";

export const COLS = 10;
export const ROWS = 18;
export const CELL = 32;

export const EMPTY_CELL_COLOR = GB.LIGHT;

export const TETRIS_COLORS: number[] = [
  0x000000,
  GB.DARKEST,
  GB.DARK,
  GB.DARKEST,
  GB.DARK,
  GB.DARKEST,
  GB.DARK,
  GB.DARKEST,
];

export const TIMING = {
  BASE_DROP_MS: 800,
  MIN_DROP_MS: 120,
  DROP_STEP_MS: 60,
  LINES_PER_LEVEL: 10,
};
