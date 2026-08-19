import { GB } from "../../config/AppConfig";

export const GRID_SIZE = 9;
export const CELL = 46;

export interface DifficultyLevel {
  name: string;
  clues: number;
}

export const DIFFICULTIES: DifficultyLevel[] = [
  { name: "Easy", clues: 40 },
  { name: "Medium", clues: 34 },
  { name: "Hard", clues: 28 },
  { name: "Expert", clues: 24 },
  { name: "Master", clues: 22 },
];

export const GAMEPLAY = {
  START_LIVES: 5,
};

export const SUDOKU_COLORS = {
  CELL_BG: GB.LIGHTEST,
  SELECTED: GB.LIGHT,
  GRID_LINE: GB.DARK,
  BOX_LINE: GB.DARKEST,
};
