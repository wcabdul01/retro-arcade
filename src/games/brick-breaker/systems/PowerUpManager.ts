import Phaser from "phaser";
import { GAMEPLAY, BALL } from "../config";
import { Paddle } from "../entities/Paddle";
import { Ball } from "../entities/Ball";
import { PowerUp, PowerUpType } from "../entities/PowerUp";
import { EventBus } from "../../../systems/EventBus";
import { BB_EVENTS } from "./events";
import { ScoreManager } from "./ScoreManager";
import { sfx } from "../../../systems/SoundManager";

const POWERUP_TYPES: PowerUpType[] = ["widen", "shrink", "multiball", "sticky", "slow", "life"];

export interface PowerUpManagerDeps {
  scene: Phaser.Scene;
  paddle: Paddle;
  getBalls: () => Ball[];
  spawnBall: (x: number, y: number) => Ball;
  scoreManager: ScoreManager;
}

export class PowerUpManager {
  readonly powerUps: PowerUp[] = [];
  private activeTimers: Partial<Record<PowerUpType, Phaser.Time.TimerEvent>> = {};
  private originalBallSpeed = new WeakMap<Ball, number>();

  constructor(private deps: PowerUpManagerDeps) {}

  maybeDrop(x: number, y: number): void {
    if (Math.random() > GAMEPLAY.POWERUP_DROP_CHANCE) return;
    const type = Phaser.Utils.Array.GetRandom(POWERUP_TYPES);
    this.powerUps.push(new PowerUp(this.deps.scene, x, y, type));
  }

  collect(powerUp: PowerUp): void {
    const index = this.powerUps.indexOf(powerUp);
    if (index >= 0) this.powerUps.splice(index, 1);
    powerUp.destroy();
    sfx.powerup();
    EventBus.emit(BB_EVENTS.POWERUP_PICKED, powerUp.powerUpType);
    this.apply(powerUp.powerUpType);
  }

  update(screenHeight: number): void {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      if (p.y > screenHeight + 40) {
        this.powerUps.splice(i, 1);
        p.destroy();
      }
    }
  }

  private apply(type: PowerUpType): void {
    const { paddle, getBalls, spawnBall, scoreManager } = this.deps;
    switch (type) {
      case "widen":
        this.clearTimer("shrink");
        paddle.setWidthFactor(1.5);
        this.refreshTimer("widen", () => paddle.resetWidth());
        break;
      case "shrink":
        this.clearTimer("widen");
        paddle.setWidthFactor(0.65);
        this.refreshTimer("shrink", () => paddle.resetWidth());
        break;
      case "multiball": {
        const source = getBalls()[0];
        if (!source) break;
        [-30, 30].forEach((offset) => {
          const clone = spawnBall(source.x, source.y);
          clone.setVelocityFromAngle(-90 + offset);
        });
        break;
      }
      case "sticky":
        paddle.isSticky = true;
        this.refreshTimer("sticky", () => (paddle.isSticky = false));
        break;
      case "slow":
        getBalls().forEach((ball) => {
          if (!this.originalBallSpeed.has(ball)) this.originalBallSpeed.set(ball, ball.speed);
          ball.setSpeed(BALL.SLOW_SPEED);
        });
        this.refreshTimer("slow", () => {
          getBalls().forEach((ball) => {
            const original = this.originalBallSpeed.get(ball);
            if (original) ball.setSpeed(original);
          });
        });
        break;
      case "life":
        scoreManager.addLife();
        break;
    }
  }

  private refreshTimer(type: PowerUpType, onExpire: () => void): void {
    this.clearTimer(type);
    this.activeTimers[type] = this.deps.scene.time.delayedCall(GAMEPLAY.POWERUP_DURATION_MS, () => {
      onExpire();
      delete this.activeTimers[type];
    });
  }

  private clearTimer(type: PowerUpType): void {
    this.activeTimers[type]?.remove();
    delete this.activeTimers[type];
  }

  destroy(): void {
    (Object.keys(this.activeTimers) as PowerUpType[]).forEach((t) => this.clearTimer(t));
    this.powerUps.forEach((p) => p.destroy());
    this.powerUps.length = 0;
  }
}
