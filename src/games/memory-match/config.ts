import { GB } from "../../config/AppConfig";

export interface MemoryDifficulty {
  name: string;
  cols: number;
  rows: number;
  timeLimitS: number;
}

export const DIFFICULTIES: MemoryDifficulty[] = [
  { name: "Easy", cols: 4, rows: 4, timeLimitS: 90 },
  { name: "Medium", cols: 4, rows: 5, timeLimitS: 100 },
  { name: "Hard", cols: 5, rows: 6, timeLimitS: 130 },
  { name: "Expert", cols: 6, rows: 6, timeLimitS: 150 },
  { name: "Master", cols: 6, rows: 7, timeLimitS: 170 },
];

export const GRID_GAP = 6;

export const TIMING = {
  FLIP_BACK_DELAY_MS: 700,
};

export const TILE_BACK_COLOR = GB.DARK;
export const TILE_FACE_COLOR = GB.LIGHT;
export const SYMBOL_COLOR = GB.DARKEST;
