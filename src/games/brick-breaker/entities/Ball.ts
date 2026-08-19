import Phaser from "phaser";
import { BALL, BB_COLORS } from "../config";
import { Paddle } from "./Paddle";

export class Ball extends Phaser.GameObjects.Arc {
  speed = BALL.BASE_SPEED;
  stuck = false;
  private stuckOffsetX = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, BALL.RADIUS, 0, 360, false, BB_COLORS.BALL);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.allowGravity = false;
    body.setBounce(1, 1);
    body.setCollideWorldBounds(true);
  }

  stickTo(paddle: Paddle): void {
    this.stuck = true;
    this.stuckOffsetX = this.x - paddle.x;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
  }

  followPaddle(paddle: Paddle): void {
    if (!this.stuck) return;
    (this.body as Phaser.Physics.Arcade.Body).reset(
      paddle.x + this.stuckOffsetX,
      paddle.y - paddle.height / 2 - this.height / 2
    );
  }

  launch(): void {
    this.stuck = false;
    const angleDeg = Phaser.Math.Between(-120, -60);
    this.setVelocityFromAngle(angleDeg);
  }

  setVelocityFromAngle(angleDeg: number): void {
    const rad = Phaser.Math.DegToRad(angleDeg);
    this.scene.physics.velocityFromRotation(rad, this.speed, (this.body as Phaser.Physics.Arcade.Body).velocity);
  }

  reflectOffPaddle(paddle: Paddle): void {
    const diff = Phaser.Math.Clamp((this.x - paddle.x) / (paddle.width / 2), -1, 1);
    const maxAngleFromVertical = 70;
    const angleDeg = -90 + diff * maxAngleFromVertical;
    this.setVelocityFromAngle(angleDeg);
  }

  clampToPlayfield(minX: number, maxX: number, minY: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const r = BALL.RADIUS;
    let vx = body.velocity.x;
    let vy = body.velocity.y;
    let x = this.x;
    let y = this.y;
    let clamped = false;

    if (x - r < minX) {
      x = minX + r;
      vx = Math.abs(vx);
      clamped = true;
    } else if (x + r > maxX) {
      x = maxX - r;
      vx = -Math.abs(vx);
      clamped = true;
    }

    if (y - r < minY) {
      y = minY + r;
      vy = Math.abs(vy);
      clamped = true;
    }

    if (clamped) {
      body.reset(x, y);
      body.setVelocity(vx, vy);
    }
  }

  setSpeed(newSpeed: number): void {
    this.speed = newSpeed;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.lengthSq() > 0) {
      const angle = body.velocity.angle();
      this.scene.physics.velocityFromRotation(angle, this.speed, body.velocity);
    }
  }
}
