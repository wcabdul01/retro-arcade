import Phaser from "phaser";
import { GB } from "../../../config/AppConfig";
import { TANK } from "../config";

export type Direction = "up" | "down" | "left" | "right";

export class Tank extends Phaser.GameObjects.Container {
  facing: Direction = "up";
  private barrel: Phaser.GameObjects.Rectangle;
  private speed: number;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number, speed: number = TANK.SPEED) {
    super(scene, x, y);
    scene.add.existing(this);
    this.speed = speed;

    const size = TANK.SIZE;
    const hull = scene.add.rectangle(0, 0, size, size * 0.8, color).setStrokeStyle(1, GB.LIGHTEST);
    const turret = scene.add.rectangle(0, 0, size * 0.55, size * 0.55, color).setStrokeStyle(1, GB.LIGHTEST);
    this.barrel = scene.add.rectangle(0, 0, size * 0.18, size * 0.5, color);
    this.add([hull, turret, this.barrel]);

    this.setSize(size, size);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(size, size);
    body.allowGravity = false;
    body.setCollideWorldBounds(true);
    body.pushable = false;

    this.updateFacing(this.facing);
  }

  setVelocityDir(dir: Direction | null): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!dir) {
      body.setVelocity(0, 0);
      return;
    }
    if (dir !== this.facing) {
      this.updateFacing(dir);
    }
    this.facing = dir;
    const v = this.speed;
    switch (dir) {
      case "up":
        body.setVelocity(0, -v);
        break;
      case "down":
        body.setVelocity(0, v);
        break;
      case "left":
        body.setVelocity(-v, 0);
        break;
      case "right":
        body.setVelocity(v, 0);
        break;
    }
  }

  isStopped(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return body.velocity.x === 0 && body.velocity.y === 0;
  }

  freeDirections(): Direction[] {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dirs: Direction[] = [];
    if (!body.blocked.up) dirs.push("up");
    if (!body.blocked.down) dirs.push("down");
    if (!body.blocked.left) dirs.push("left");
    if (!body.blocked.right) dirs.push("right");
    return dirs;
  }

  clampToBounds(minX: number, maxX: number, minY: number, maxY: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const half = TANK.SIZE / 2;
    let x = this.x;
    let y = this.y;
    let vx = body.velocity.x;
    let vy = body.velocity.y;
    let clamped = false;

    if (x - half < minX) {
      x = minX + half;
      vx = Math.max(0, vx);
      clamped = true;
    } else if (x + half > maxX) {
      x = maxX - half;
      vx = Math.min(0, vx);
      clamped = true;
    }

    if (y - half < minY) {
      y = minY + half;
      vy = Math.max(0, vy);
      clamped = true;
    } else if (y + half > maxY) {
      y = maxY - half;
      vy = Math.min(0, vy);
      clamped = true;
    }

    if (clamped) {
      this.setPosition(x, y);
      body.setVelocity(vx, vy);
    }
  }

  private updateFacing(dir: Direction): void {
    const size = TANK.SIZE;
    // Barrel tip (offset + half length) must stay within size/2 so it never
    // renders past the tank's collision box / arena bounds.
    const barrelLength = size * 0.34;
    const barrelThickness = size * 0.18;
    const offset = size * 0.33;
    switch (dir) {
      case "up":
        this.barrel.setSize(barrelThickness, barrelLength);
        this.barrel.setPosition(0, -offset);
        break;
      case "down":
        this.barrel.setSize(barrelThickness, barrelLength);
        this.barrel.setPosition(0, offset);
        break;
      case "left":
        this.barrel.setSize(barrelLength, barrelThickness);
        this.barrel.setPosition(-offset, 0);
        break;
      case "right":
        this.barrel.setSize(barrelLength, barrelThickness);
        this.barrel.setPosition(offset, 0);
        break;
    }
  }
}
