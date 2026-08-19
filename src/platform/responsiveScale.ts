import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/AppConfig";

/**
 * Scales the game canvas to fill the entire real screen edge-to-edge (no
 * visible gap/frame on any side). Keeping any given edge free of real
 * content is handled separately, in-game, by insetting each scene's own
 * layout (see CONTENT_MARGIN in ui/safeArea.ts) — not by shrinking or
 * repositioning the canvas itself.
 */
export function applyResponsiveScale(game: Phaser.Game): void {
  const layout = (): void => {
    const canvas = game.canvas;
    if (!canvas) return;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const scale = Math.max(screenW / GAME_WIDTH, screenH / GAME_HEIGHT);

    const displayW = GAME_WIDTH * scale;
    const displayH = GAME_HEIGHT * scale;

    const left = (screenW - displayW) / 2;
    const top = (screenH - displayH) / 2;

    canvas.style.position = "fixed";
    canvas.style.width = `${Math.round(displayW)}px`;
    canvas.style.height = `${Math.round(displayH)}px`;
    canvas.style.left = `${Math.round(left)}px`;
    canvas.style.top = `${Math.round(top)}px`;
  };

  layout();
  window.addEventListener("resize", layout);
  window.addEventListener("orientationchange", layout);
}
