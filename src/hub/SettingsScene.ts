import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, GB, FONT_FAMILY } from "../config/AppConfig";
import { createButton } from "../ui/createButton";
import { Settings } from "../systems/Settings";
import { sfx } from "../systems/SoundManager";
import { vibrate } from "../systems/Haptics";
import { ImpactStyle } from "@capacitor/haptics";
import { canOpenStorePage, openFeedbackEmail, openStorePage } from "../systems/Store";
import { Purchases } from "../systems/Purchases";

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super("Settings");
  }

  create(): void {
    const centerY = GAME_HEIGHT / 2;

    // Interactive so taps on the backdrop don't reach the Hub/Pause scene below.
    this.add.rectangle(GAME_WIDTH / 2, centerY, GAME_WIDTH, GAME_HEIGHT, GB.LIGHTEST, 0.98).setInteractive();
    this.add.rectangle(GAME_WIDTH / 2, centerY, 300, 640, GB.LIGHT).setStrokeStyle(4, GB.DARKEST);

    this.add
      .text(GAME_WIDTH / 2, centerY - 275, "SETTINGS", { fontFamily: FONT_FAMILY, fontSize: "18px", color: "#16170f" })
      .setOrigin(0.5);

    this.createToggle(
      centerY - 205,
      "SOUND",
      () => Settings.soundEnabled,
      () => Settings.setSoundEnabled(!Settings.soundEnabled)
    );

    this.createToggle(
      centerY - 135,
      "VIBRATION",
      () => Settings.vibrationEnabled,
      () => {
        Settings.setVibrationEnabled(!Settings.vibrationEnabled);
        if (Settings.vibrationEnabled) vibrate(ImpactStyle.Light);
      }
    );

    this.createCycleControl(centerY - 65, "CONTRAST", () => `${Settings.contrastPercent}%`, () => Settings.cycleContrast());

    // Web builds have no store listing to open, so RATE only shows on native.
    if (canOpenStorePage()) {
      createButton(this, GAME_WIDTH / 2, centerY + 5, "RATE THIS APP", () => {
        void openStorePage();
      });
    }

    createButton(this, GAME_WIDTH / 2, centerY + 75, "SEND FEEDBACK", () => {
      void openFeedbackEmail();
    });

    // Remove Ads is bought from the lobby; this gets it back after a
    // reinstall or on a new phone (also checked automatically at launch).
    if (Purchases.isSupported) {
      const status = this.add
        .text(GAME_WIDTH / 2, centerY + 290, "", { fontFamily: FONT_FAMILY, fontSize: "8px", color: "#16170f", align: "center" })
        .setOrigin(0.5);
      let restoring = false;
      createButton(this, GAME_WIDTH / 2, centerY + 145, "RESTORE PURCHASES", async () => {
        if (restoring) return;
        restoring = true;
        status.setText("CHECKING...");
        const { owned, checked } = await Purchases.restore(this.registry);
        restoring = false;
        if (!status.active) return;
        status.setText(owned ? "ADS REMOVED" : checked ? "NO PURCHASES FOUND" : "STORE UNAVAILABLE, TRY LATER");
      });
    }

    createButton(this, GAME_WIDTH / 2, centerY + 215, "BACK", () => {
      this.scene.stop();
    });
  }

  private createToggle(y: number, label: string, getValue: () => boolean, onToggle: () => void): void {
    const width = 260;
    const height = 56;
    const bg = this.add
      .rectangle(GAME_WIDTH / 2, y, width, height, GB.DARK)
      .setStrokeStyle(4, GB.DARKEST)
      .setInteractive({ useHandCursor: true });

    const text = this.add
      .text(GAME_WIDTH / 2, y, `${label}: ${getValue() ? "ON" : "OFF"}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "11px",
        color: "#9ba17c",
      })
      .setOrigin(0.5);

    bg.on("pointerover", () => bg.setFillStyle(GB.DARKEST));
    bg.on("pointerout", () => bg.setFillStyle(GB.DARK));
    bg.on("pointerdown", () => {
      onToggle();
      sfx.select();
      text.setText(`${label}: ${getValue() ? "ON" : "OFF"}`);
    });
  }

  private createCycleControl(y: number, label: string, getValue: () => string, onCycle: () => void): void {
    const width = 260;
    const height = 56;
    const bg = this.add
      .rectangle(GAME_WIDTH / 2, y, width, height, GB.DARK)
      .setStrokeStyle(4, GB.DARKEST)
      .setInteractive({ useHandCursor: true });

    const text = this.add
      .text(GAME_WIDTH / 2, y, `${label}: ${getValue()}`, {
        fontFamily: FONT_FAMILY,
        fontSize: "11px",
        color: "#9ba17c",
      })
      .setOrigin(0.5);

    bg.on("pointerover", () => bg.setFillStyle(GB.DARKEST));
    bg.on("pointerout", () => bg.setFillStyle(GB.DARK));
    bg.on("pointerdown", () => {
      onCycle();
      sfx.select();
      text.setText(`${label}: ${getValue()}`);
    });
  }
}
