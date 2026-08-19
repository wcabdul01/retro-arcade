import Phaser from "phaser";
import { CELL } from "../../tetris/config";

// 1-3-1-3: a single dot, a row of 3, a single dot, a row of 3 — each square
// is exactly one full grid cell, sized and spaced like one Block Drop cell.
// No square is ever a fraction of a cell: that would let it sit unaligned
// with the column grid both cars move on, breaking clean cell-to-cell
// collision.
const ROW_PATTERN = [1, 3, 1, 3];

export class DotCar extends Phaser.GameObjects.Container {
  private rowDy: number[] = [];
  private rowBlocks: Phaser.GameObjects.Rectangle[][] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, color: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setSize(width, height);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(width, height);
    body.allowGravity = false;

    const blockSize = CELL - 2;
    const startY = (-(ROW_PATTERN.length - 1) / 2) * CELL;

    ROW_PATTERN.forEach((count, rowIndex) => {
      const dy = startY + rowIndex * CELL;
      this.rowDy.push(dy);
      const blocks: Phaser.GameObjects.Rectangle[] = [];
      if (count === 1) {
        blocks.push(this.addBlock(scene, 0, dy, color, blockSize));
      } else {
        const startX = (-(count - 1) / 2) * CELL;
        for (let i = 0; i < count; i++) {
          blocks.push(this.addBlock(scene, startX + i * CELL, dy, color, blockSize));
        }
      }
      this.rowBlocks.push(blocks);
    });
  }

  private addBlock(scene: Phaser.Scene, dx: number, dy: number, color: number, blockSize: number): Phaser.GameObjects.Rectangle {
    const block = scene.add.rectangle(dx, dy, blockSize, blockSize, color);
    this.add(block);
    return block;
  }

  // Reveals/hides each row of the car independently against the playfield
  // bounds, so it visibly scrolls into and out of the frame one row at a
  // time instead of the whole car popping in/out — and never renders a
  // partial row past the border.
  updateRowVisibility(top: number, bottom: number): void {
    const half = CELL / 2;
    this.rowDy.forEach((dy, i) => {
      const worldY = this.y + dy;
      const visible = worldY - half >= top - 0.5 && worldY + half <= bottom + 0.5;
      this.rowBlocks[i].forEach((block) => block.setVisible(visible));
    });
  }

  // World-space rects of the car's own visible squares only (skips gaps in
  // the sparse 1-3-1-3 pattern and rows currently clipped off-frame), for
  // precise square-vs-square collision instead of a bounding-box overlap.
  getVisibleBlockRects(): Phaser.Geom.Rectangle[] {
    const rects: Phaser.Geom.Rectangle[] = [];
    this.rowBlocks.forEach((row) => {
      row.forEach((block) => {
        if (!block.visible) return;
        const size = block.width;
        rects.push(new Phaser.Geom.Rectangle(this.x + block.x - size / 2, this.y + block.y - size / 2, size, size));
      });
    });
    return rects;
  }
}
