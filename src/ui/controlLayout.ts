// Shared playfield bounding box for continuous-space games (Brick Breaker,
// Star Defender, Racing). Tetris/Block Rise and Snake/Tank War size their own
// grid independently (see their config.ts CELL constants).
export const PLAYFIELD_X = 30;
export const PLAYFIELD_Y = 90;
export const PLAYFIELD_WIDTH = 420;
export const PLAYFIELD_HEIGHT = 684;
export const PLAYFIELD_RIGHT = PLAYFIELD_X + PLAYFIELD_WIDTH;
export const PLAYFIELD_BOTTOM = PLAYFIELD_Y + PLAYFIELD_HEIGHT;

export const DPAD_X = 130;
export const DPAD_Y = PLAYFIELD_BOTTOM + 158;

export const BUTTON_X = 370;
export const BUTTON_Y = DPAD_Y;

// For games needing two buttons (e.g. rotate + drop), place them side by side
// on the same row as single-button games instead of stacking vertically.
export const BUTTON_X_LEFT = 320;
export const BUTTON_X_RIGHT = 420;
