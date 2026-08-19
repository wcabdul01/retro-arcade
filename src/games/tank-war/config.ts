import { GB } from "../../config/AppConfig";

export const ARENA = { COLS: 12, ROWS: 21, CELL: 32 };

export const TANK = { SIZE: 26, SPEED: 90 };

export const BULLET = {
  SIZE: 7,
  SPEED: 220,
  PLAYER_COOLDOWN_MS: 400,
  ENEMY_FIRE_MIN_MS: 1200,
  ENEMY_FIRE_MAX_MS: 2600,
};

export const GAMEPLAY = {
  START_LIVES: 3,
  ENEMY_DIR_CHANGE_MIN_MS: 1200,
  ENEMY_DIR_CHANGE_MAX_MS: 3200,
  ENEMY_SCORE: 100,
};

export const TW_COLORS = {
  PLAYER: GB.DARKEST,
  ENEMY: GB.DARK,
  WALL: GB.LIGHT,
  BULLET_PLAYER: GB.DARKEST,
  BULLET_ENEMY: GB.DARK,
};
