import { FONT_FAMILY } from "../config/AppConfig";
import { currentStore } from "../systems/Store";

// Same 4-shade LCD palette as the game (AppConfig GB), as CSS colours.
const LIGHTEST = "#abb18c";
const LIGHT = "#7e8562";
const DARK = "#545a41";
const DARKEST = "#16170f";

const SIZE = 1080;

function storeLine(): string {
  switch (currentStore()) {
    case "huawei":
      return "FREE ON APPGALLERY";
    case "appstore":
      return "FREE ON THE APP STORE";
    default:
      return "FREE ON GOOGLE PLAY";
  }
}

/** Square score card in the game's retro style, as base64 PNG (no data: prefix).
 * The store link itself travels in the share text, since apps don't make links
 * inside images tappable. */
export async function renderShareCard(gameTitle: string, score: number): Promise<string> {
  // Canvas text silently falls back to a system font if the webfont isn't loaded yet.
  await document.fonts.load(`48px ${FONT_FAMILY}`).catch(() => undefined);

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");

  ctx.fillStyle = LIGHTEST;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Faint LCD pixel grid, like the in-game background.
  ctx.fillStyle = "rgba(84, 90, 65, 0.08)";
  for (let i = 0; i < SIZE; i += 12) {
    ctx.fillRect(i, 0, 2, SIZE);
    ctx.fillRect(0, i, SIZE, 2);
  }

  ctx.strokeStyle = DARKEST;
  ctx.lineWidth = 16;
  ctx.strokeRect(40, 40, SIZE - 80, SIZE - 80);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const text = (value: string, y: number, px: number, color: string) => {
    ctx.fillStyle = color;
    ctx.font = `${px}px ${FONT_FAMILY}`;
    ctx.fillText(value, SIZE / 2, y, SIZE - 160);
  };

  text("RETRO", 190, 88, DARKEST);
  text("ARCADE", 300, 88, DARKEST);
  text(gameTitle.toUpperCase(), 450, 44, DARK);

  ctx.fillStyle = DARK;
  ctx.fillRect(140, 520, SIZE - 280, 220);
  ctx.strokeStyle = DARKEST;
  ctx.lineWidth = 8;
  ctx.strokeRect(140, 520, SIZE - 280, 220);
  text("SCORE", 580, 36, LIGHT);
  text(String(score), 670, 84, LIGHTEST);

  text("CAN YOU BEAT IT?", 820, 40, DARKEST);
  text(storeLine(), 920, 30, DARK);

  return canvas.toDataURL("image/png").split(",")[1];
}
