import Phaser from "phaser";

const BASE_SHAPE_COUNT = 8;
const STYLE_COUNT = 3;
export const SYMBOL_COUNT = BASE_SHAPE_COUNT * STYLE_COUNT;

function drawBaseShape(g: Phaser.GameObjects.Graphics, shape: number, r: number): void {
  switch (shape) {
    case 0:
      g.fillCircle(0, 0, r * 0.6);
      break;
    case 1:
      g.fillRect(-r * 0.5, -r * 0.5, r, r);
      break;
    case 2:
      g.beginPath();
      g.moveTo(-r * 0.5, -r * 0.5);
      g.lineTo(r * 0.5, r * 0.5);
      g.moveTo(r * 0.5, -r * 0.5);
      g.lineTo(-r * 0.5, r * 0.5);
      g.strokePath();
      break;
    case 3:
      g.fillRect(-r * 0.15, -r * 0.55, r * 0.3, r * 1.1);
      g.fillRect(-r * 0.55, -r * 0.15, r * 1.1, r * 0.3);
      break;
    case 4:
      g.beginPath();
      g.moveTo(0, -r * 0.6);
      g.lineTo(r * 0.55, r * 0.45);
      g.lineTo(-r * 0.55, r * 0.45);
      g.closePath();
      g.fillPath();
      break;
    case 5:
      g.strokeCircle(0, 0, r * 0.5);
      break;
    case 6:
      g.beginPath();
      g.moveTo(0, -r * 0.6);
      g.lineTo(r * 0.5, 0);
      g.lineTo(0, r * 0.6);
      g.lineTo(-r * 0.5, 0);
      g.closePath();
      g.fillPath();
      break;
    case 7: {
      const d = r * 0.22;
      const off = r * 0.3;
      g.fillCircle(-off, -off, d);
      g.fillCircle(off, -off, d);
      g.fillCircle(-off, off, d);
      g.fillCircle(off, off, d);
      break;
    }
  }
}

// Each symbol index maps to one of 8 base shapes plus one of 3 style
// decorations (plain / ringed / corner-dots), giving SYMBOL_COUNT distinct,
// still-monochrome glyphs so higher-difficulty grids (more than 8 pairs)
// never assign the same visible symbol to two different pairs.
export function drawSymbol(g: Phaser.GameObjects.Graphics, index: number, size: number, color: number): void {
  const shape = index % BASE_SHAPE_COUNT;
  const style = Math.floor(index / BASE_SHAPE_COUNT) % STYLE_COUNT;
  const r = size / 2;
  g.clear();
  g.fillStyle(color, 1);
  g.lineStyle(5, color, 1);
  drawBaseShape(g, shape, r);

  if (style === 1) {
    g.lineStyle(2, color, 1);
    g.strokeCircle(0, 0, r * 0.92);
  } else if (style === 2) {
    g.fillStyle(color, 1);
    const d = r * 0.11;
    g.fillCircle(-r * 0.78, -r * 0.78, d);
    g.fillCircle(r * 0.78, -r * 0.78, d);
    g.fillCircle(-r * 0.78, r * 0.78, d);
    g.fillCircle(r * 0.78, r * 0.78, d);
  }
}
