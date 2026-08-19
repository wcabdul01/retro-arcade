import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, GB, FONT_FAMILY } from "../config/AppConfig";
import { createButton } from "../ui/createButton";

interface HowToPlaySceneData {
  title: string;
  howToPlay: string;
  returnSceneKey: string;
}

// Launched on top of a paused GameScene by createInfoButton. Mirrors the
// PauseScene overlay pattern (dim background + centered card) rather than
// introducing a new visual style.
export class HowToPlayScene extends Phaser.Scene {
  private sceneData!: HowToPlaySceneData;

  constructor() {
    super("HowToPlay");
  }

  create(data: HowToPlaySceneData): void {
    this.sceneData = data;
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, GB.DARKEST, 0.55);
    this.add.rectangle(centerX, centerY, 320, 420, GB.LIGHTEST).setStrokeStyle(4, GB.DARKEST);

    this.add
      .text(centerX, centerY - 160, data.title.toUpperCase(), {
        fontFamily: FONT_FAMILY,
        fontSize: "16px",
        color: "#16170f",
        align: "center",
        wordWrap: { width: 280 },
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY - 10, data.howToPlay, {
        fontFamily: FONT_FAMILY,
        fontSize: "12px",
        color: "#16170f",
        align: "center",
        lineSpacing: 14,
        wordWrap: { width: 260 },
      })
      .setOrigin(0.5);

    createButton(this, centerX, centerY + 160, "CLOSE", () => {
      this.scene.resume(this.sceneData.returnSceneKey);
      this.scene.stop();
    });
  }
}
