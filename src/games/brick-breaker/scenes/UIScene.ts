import Phaser from "phaser";
import { FONT_FAMILY, CONTENT_MARGIN } from "../../../config/AppConfig";
import { EventBus } from "../../../systems/EventBus";
import { BB_EVENTS } from "../systems/events";
import { ScoreManager } from "../systems/ScoreManager";
import { LEVEL_COUNT } from "../data/levels";

interface UISceneData {
  scoreManager: ScoreManager;
}

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  constructor() {
    super("BrickBreaker.UI");
  }

  create(data: UISceneData): void {
    const sm = data.scoreManager;
    const style = { fontFamily: FONT_FAMILY, fontSize: "11px", color: "#16170f" };
    this.scoreText = this.add.text(CONTENT_MARGIN, CONTENT_MARGIN, `Score: ${sm.score}`, style);
    this.livesText = this.add.text(CONTENT_MARGIN, CONTENT_MARGIN + 24, `Lives: ${sm.lives}`, style);
    this.levelText = this.add
      .text(this.scale.width - CONTENT_MARGIN, CONTENT_MARGIN + 40, `Level ${sm.levelIndex + 1}/${LEVEL_COUNT}`, style)
      .setOrigin(1, 0);

    EventBus.on(BB_EVENTS.SCORE_CHANGED, this.onScore, this);
    EventBus.on(BB_EVENTS.LIVES_CHANGED, this.onLives, this);
    EventBus.on(BB_EVENTS.LEVEL_CHANGED, this.onLevel, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  private onScore = (score: number): void => {
    this.scoreText.setText(`Score: ${score}`);
  };

  private onLives = (lives: number): void => {
    this.livesText.setText(`Lives: ${lives}`);
  };

  private onLevel = (levelIndex: number): void => {
    this.levelText.setText(`Level ${levelIndex + 1}/${LEVEL_COUNT}`);
  };

  private cleanup(): void {
    EventBus.off(BB_EVENTS.SCORE_CHANGED, this.onScore, this);
    EventBus.off(BB_EVENTS.LIVES_CHANGED, this.onLives, this);
    EventBus.off(BB_EVENTS.LEVEL_CHANGED, this.onLevel, this);
  }
}
