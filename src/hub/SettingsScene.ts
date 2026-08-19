import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, GB, FONT_FAMILY } from "../config/AppConfig";
import { createButton } from "../ui/createButton";
import { Settings } from "../systems/Settings";
import { sfx } from "../systems/SoundManager";
import { vibrate } from "../systems/Haptics";
import { ImpactStyle } from "@capacitor/haptics";

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super("Settings");
  }

  create(): void {
    const centerY = GAME_HEIGHT / 2;

    this.add.rectangle(GAME_WIDTH / 2, centerY, GAME_WIDTH, GAME_HEIGHT, GB.LIGHTEST, 0.98);
    this.add.rectangle(GAME_WIDTH / 2, centerY, 300, 480, GB.LIGHT).setStrokeStyle(4, GB.DARKEST);

    this.add
      .text(GAME_WIDTH / 2, centerY - 195, "SETTINGS", { fontFamily: FONT_FAMILY, fontSize: "18px", color: "#16170f" })
      .setOrigin(0.5);

    this.createToggle(
      centerY - 125,
      "SOUND",
      () => Settings.soundEnabled,
      () => Settings.setSoundEnabled(!Settings.soundEnabled)
    );

    this.createToggle(
      centerY - 55,
      "VIBRATION",
      () => Settings.vibrationEnabled,
      () => {
        Settings.setVibrationEnabled(!Settings.vibrationEnabled);
        if (Settings.vibrationEnabled) vibrate(ImpactStyle.Light);
      }
    );

    this.createCycleControl(centerY + 15, "CONTRAST", () => `${Settings.contrastPercent}%`, () => Settings.cycleContrast());

    // "Remove Ads" purchase row intentionally omitted for v1 launch — it was
    // wired to a placeholder (Purchases.buyNoAds) that granted the
    // entitlement for free with no real payment. Re-add once real Google
    // Play Billing is implemented (see Purchases.ts).

    createButton(this, GAME_WIDTH / 2, centerY + 85, "BACK", () => {
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
