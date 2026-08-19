import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, GB, FONT_FAMILY } from "../config/AppConfig";
import { createButton } from "../ui/createButton";
import { exitApp } from "../platform/exitApp";
import { AdsManager } from "../systems/AdsManager";

interface PauseSceneData {
  returnSceneKey: string;
  uiSceneKey?: string;
}

export class PauseScene extends Phaser.Scene {
  private pauseData!: PauseSceneData;
  private exiting = false;

  constructor() {
    super("Pause");
  }

  create(data: PauseSceneData): void {
    this.pauseData = data;
    this.exiting = false;
    AdsManager.showBanner();

    const centerY = GAME_HEIGHT / 2;

    this.add.rectangle(GAME_WIDTH / 2, centerY, GAME_WIDTH, GAME_HEIGHT, GB.DARKEST, 0.55);

    this.add
      .rectangle(GAME_WIDTH / 2, centerY, 300, 420, GB.LIGHTEST)
      .setStrokeStyle(4, GB.DARKEST);

    this.add
      .text(GAME_WIDTH / 2, centerY - 130, "PAUSED", { fontFamily: FONT_FAMILY, fontSize: "20px", color: "#16170f" })
      .setOrigin(0.5);

    createButton(this, GAME_WIDTH / 2, centerY - 50, "RESUME", () => {
      AdsManager.hideBanner();
      this.scene.resume(this.pauseData.returnSceneKey);
      this.scene.stop();
    });

    createButton(this, GAME_WIDTH / 2, centerY + 20, "MAIN MENU", () => {
      if (this.exiting) return;
      this.exiting = true;
      AdsManager.hideBanner();
      AdsManager.showInterstitial(() => {
        this.scene.stop(this.pauseData.returnSceneKey);
        if (this.pauseData.uiSceneKey) this.scene.stop(this.pauseData.uiSceneKey);
        this.scene.stop();
        this.scene.start("Hub");
      });
    });

    createButton(this, GAME_WIDTH / 2, centerY + 90, "SETTINGS", () => {
      this.scene.launch("Settings");
    });

    createButton(this, GAME_WIDTH / 2, centerY + 160, "EXIT", () => {
      if (this.exiting) return;
      this.exiting = true;
      AdsManager.hideBanner();
      AdsManager.showInterstitial(() => {
        exitApp(() => {
          this.scene.stop(this.pauseData.returnSceneKey);
          if (this.pauseData.uiSceneKey) this.scene.stop(this.pauseData.uiSceneKey);
          this.scene.stop();
          this.scene.start("Hub");
        });
      });
    });
  }
}
