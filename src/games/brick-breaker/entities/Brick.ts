import Phaser from "phaser";
import { GB } from "../../../config/AppConfig";
import { BB_COLORS } from "../config";

export type BrickType = "normal" | "reinforced" | "indestructible";

export class Brick extends Phaser.GameObjects.Rectangle {
  brickType: BrickType = "normal";
  hp = 1;
  scoreValue = 10;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y, width, height, GB.LIGHT);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setStrokeStyle(2, GB.DARKEST);
  }

  configure(type: BrickType, rowColor: number): void {
    this.brickType = type;
    switch (type) {
      case "normal":
        this.hp = 1;
        this.scoreValue = 10;
        this.setFillStyle(rowColor);
        break;
      case "reinforced":
        this.hp = 2;
        this.scoreValue = 20;
        this.setFillStyle(rowColor);
        break;
      case "indestructible":
        this.hp = Infinity;
        this.scoreValue = 0;
        this.setFillStyle(BB_COLORS.BRICK_INDESTRUCTIBLE);
        break;
    }
  }

  hit(): boolean {
    if (this.brickType === "indestructible") return false;
    this.hp -= 1;
    if (this.hp === 1 && this.brickType === "reinforced") {
      this.setAlpha(0.6);
    }
    return this.hp <= 0;
  }
}
