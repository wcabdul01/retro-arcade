import { GB } from "../../config/AppConfig";
import { CELL } from "../tetris/config";
import { PLAYFIELD_WIDTH } from "../../ui/controlLayout";

// Car footprint matches its 1-3-1-3 dot layout: 3 cells wide, 4 cells tall,
// each cell sized like one Block Drop square. Both the player and oncoming
// traffic step one cell/column at a time across the same column grid, so
// every column the player can reach is one traffic can appear on too.
export const CAR_COLS = 3;
export const CAR_ROWS = 4;
export const GRID_COLS = Math.floor(PLAYFIELD_WIDTH / CELL);

export const RACE = {
  CAR_WIDTH: CAR_COLS * CELL,
  CAR_HEIGHT: CAR_ROWS * CELL,
  OBSTACLE_WIDTH: CAR_COLS * CELL,
  OBSTACLE_HEIGHT: CAR_ROWS * CELL,
  PLAYER_Y_OFFSET: 70,
  BASE_SPEED: 220,
  MAX_SPEED: 480,
  SPEED_RAMP_PER_SEC: 4,
  BASE_SPAWN_MS: 1100,
  MIN_SPAWN_MS: 450,
  SPAWN_RAMP_MS_PER_SEC: 8,
  BOOST_MULTIPLIER: 1.8,
};

export const RACE_COLORS = {
  PLAYER: GB.DARKEST,
  OBSTACLES: [GB.DARK, GB.DARKEST, GB.DARK, GB.DARKEST],
};
