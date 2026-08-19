import Phaser from "phaser";
import { GB } from "../../../config/AppConfig";
import { BB_COLORS, GAMEPLAY } from "../config";

export type PowerUpType = "widen" | "shrink" | "multiball" | "sticky" | "slow" | "life";

const COLOR_MAP: Record<PowerUpType, number> = {
  widen: BB_COLORS.POWERUP.widen,
  shrink: BB_COLORS.POWERUP.shrink,
  multiball: BB_COLORS.POWERUP.multiball,
  sticky: BB_COLORS.POWERUP.sticky,
  slow: BB_COLORS.POWERUP.slow,
  life: BB_COLORS.POWERUP.life,
};

export class PowerUp extends Phaser.GameObjects.Arc {
  powerUpType: PowerUpType;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerUpType) {
    super(scene, x, y, 10, 0, 360, false, COLOR_MAP[type]);
    this.powerUpType = type;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setStrokeStyle(2, GB.DARKEST);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    body.setVelocityY(GAMEPLAY.POWERUP_FALL_SPEED);
  }
}
