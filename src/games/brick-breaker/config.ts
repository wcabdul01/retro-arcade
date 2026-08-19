import { GB } from "../../config/AppConfig";

export const PADDLE = {
  WIDTH: 84,
  HEIGHT: 18,
  Y_OFFSET: 40,
  MIN_WIDTH: 52,
  MAX_WIDTH: 130,
};

export const BALL = {
  RADIUS: 8,
  BASE_SPEED: 340,
  SLOW_SPEED: 210,
};

export const BRICK = {
  WIDTH: 41,
  HEIGHT: 21,
  PADDING: 5,
  OFFSET_TOP: 20,
};

export const GAMEPLAY = {
  START_LIVES: 3,
  POWERUP_DROP_CHANCE: 0.16,
  POWERUP_FALL_SPEED: 180,
  POWERUP_DURATION_MS: 9000,
};

export const BB_COLORS = {
  PADDLE: GB.DARKEST,
  BALL: GB.DARKEST,
  BRICK_ROWS: [GB.DARK, GB.LIGHT, GB.DARKEST, GB.DARK, GB.LIGHT, GB.DARKEST],
  BRICK_INDESTRUCTIBLE: GB.DARKEST,
  POWERUP: {
    widen: GB.DARK,
    shrink: GB.DARK,
    multiball: GB.DARK,
    sticky: GB.DARK,
    slow: GB.DARK,
    life: GB.DARK,
  },
};
