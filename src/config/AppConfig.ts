export const GAME_WIDTH = 480;
// Taller than a typical older-phone canvas (was 800) so the aspect ratio
// (480x1040 = ~19.5:9) is much closer to modern tall phone screens, which
// lets the responsive scaler fill the real screen without cropping the
// playfield/controls. Every game's own layout is anchored to PLAYFIELD_Y /
// PLAYFIELD_HEIGHT (fixed offsets), not GAME_HEIGHT, so this only adds more
// empty background below the existing D-pad/buttons row.
export const GAME_HEIGHT = 1040;

// Every game's content (playfield, HUD text, buttons, D-pad) must stay at
// least this many game-units clear of every canvas edge. The canvas itself
// still fills the physical screen edge-to-edge (see responsiveScale.ts) —
// this is a content-only "keep out" zone, invisible because nothing is ever
// drawn there, not because the canvas is inset or bordered.
export const CONTENT_MARGIN = 20;

// Muted olive/khaki LCD palette, lightest (screen) to darkest (ink).
export const GB = {
  LIGHTEST: 0xabb18c,
  LIGHT: 0x7e8562,
  DARK: 0x545a41,
  DARKEST: 0x16170f,
};

export const COLORS = {
  BACKGROUND: GB.LIGHTEST,
  PANEL: GB.LIGHT,
  TEXT: GB.DARKEST,
  MUTED: GB.DARK,
  ACCENT: GB.DARKEST,
  DANGER: GB.DARKEST,
  SUCCESS: GB.DARK,
};

export const FONT_FAMILY = "'Press Start 2P', monospace";
