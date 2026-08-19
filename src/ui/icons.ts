import Phaser from "phaser";

// Matches the muted label color used across the app's flat pixel buttons
// (createButton, createPauseButton, etc.) rather than relying on system
// emoji glyphs, which render in full color and clash with the theme.
const ICON_COLOR = 0x9ba17c;

export function drawBulbIcon(scene: Phaser.Scene, x: number, y: number, size = 16): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y });
  const r = size * 0.34;
  g.fillStyle(ICON_COLOR, 1);
  g.fillCircle(0, -size * 0.14, r);
  g.fillRect(-r * 0.5, r * 0.42, r, size * 0.2);
  return g;
}

export function drawUndoIcon(scene: Phaser.Scene, x: number, y: number, size = 16): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y });
  const r = size * 0.36;
  const thickness = Math.max(2, size * 0.16);

  g.lineStyle(thickness, ICON_COLOR, 1);
  g.beginPath();
  g.arc(0, 0, r, Phaser.Math.DegToRad(-40), Phaser.Math.DegToRad(200), false);
  g.strokePath();

  const headAngle = Phaser.Math.DegToRad(200);
  const tipX = Math.cos(headAngle) * r;
  const tipY = Math.sin(headAngle) * r;
  const headLen = size * 0.34;
  g.fillStyle(ICON_COLOR, 1);
  g.fillTriangle(
    tipX - headLen * 0.9,
    tipY - headLen * 0.15,
    tipX + headLen * 0.35,
    tipY - headLen * 0.75,
    tipX + headLen * 0.35,
    tipY + headLen * 0.55
  );
  return g;
}
