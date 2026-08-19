import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS as APP_COLORS } from "../config/AppConfig";
import { AdsManager } from "../systems/AdsManager";

export interface IntroSceneData {
  title: string;
  tagline: string;
  nextScene: string;
}

const HOLD_MS = 2000;
const FADE_MS = 200;

// Brief animated title card shown between the hub and every game's own
// GameScene, replacing the in-game title text those scenes used to show.
// Auto-advances after HOLD_MS — no tap required. "How to play" text lives
// behind the in-game info button instead (see createInfoButton/HowToPlay
// Scene), not here.
export class IntroScene extends Phaser.Scene {
  constructor() {
    super("Intro");
  }

  create(data: IntroSceneData): void {
    this.cameras.main.setBackgroundColor(APP_COLORS.BACKGROUND);
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    const title = this.add
      .text(centerX, centerY - 30, data.title.toUpperCase(), {
        fontFamily: FONT_FAMILY,
        fontSize: "28px",
        color: "#16170f",
        align: "center",
        wordWrap: { width: GAME_WIDTH - 80 },
      })
      .setOrigin(0.5)
      .setScale(0.6)
      .setAlpha(0);

    const tagline = this.add
      .text(centerX, centerY + 40, data.tagline, {
        fontFamily: FONT_FAMILY,
        fontSize: "12px",
        color: "#545a41",
        align: "center",
        wordWrap: { width: GAME_WIDTH - 80 },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 400, ease: "Back.Out" });
    this.tweens.add({ targets: tagline, alpha: 1, duration: 300, delay: 200 });

    const bg = Phaser.Display.Color.IntegerToColor(APP_COLORS.BACKGROUND);
    this.time.delayedCall(HOLD_MS - FADE_MS, () => {
      this.cameras.main.fadeOut(FADE_MS, bg.red, bg.green, bg.blue);
    });
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      AdsManager.hideBanner();
      this.scene.start(data.nextScene);
    });
  }
}
