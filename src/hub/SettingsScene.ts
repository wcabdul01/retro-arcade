import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, GB, FONT_FAMILY } from "../config/AppConfig";
import { createButton } from "../ui/createButton";
import { Settings } from "../systems/Settings";
import { sfx } from "../systems/SoundManager";
import { vibrate } from "../systems/Haptics";
import { ImpactStyle } from "@capacitor/haptics";
import { Purchases } from "../systems/Purchases";
import type { SaveData } from "../platform";

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

    this.createPurchaseRow(centerY + 85);

    createButton(this, GAME_WIDTH / 2, centerY + 155, "BACK", () => {
      this.scene.stop();
    });
  }

  private createPurchaseRow(y: number): void {
    const width = 260;
    const height = 56;
    const isOwned = (): boolean => (this.registry.get("saveData") as SaveData | undefined)?.noAdsPurchased ?? false;

    const bg = this.add.rectangle(GAME_WIDTH / 2, y, width, height, GB.DARK).setStrokeStyle(4, GB.DARKEST);
    const text = this.add
      .text(GAME_WIDTH / 2, y, "", {
        fontFamily: FONT_FAMILY,
        fontSize: "10px",
        color: "#9ba17c",
        align: "center",
      })
      .setOrigin(0.5);

    const refresh = (): void => {
      if (isOwned()) {
        text.setText("AD-FREE: PURCHASED");
        bg.disableInteractive();
        bg.setFillStyle(GB.DARK);
      } else {
        text.setText("REMOVE ADS - $10\n(TEST MODE)");
        bg.setInteractive({ useHandCursor: true });
      }
    };

    bg.on("pointerover", () => {
      if (!isOwned()) bg.setFillStyle(GB.DARKEST);
    });
    bg.on("pointerout", () => {
      if (!isOwned()) bg.setFillStyle(GB.DARK);
    });
    bg.on("pointerdown", async () => {
      if (isOwned()) return;
      sfx.select();
      await Purchases.buyNoAds(this);
      refresh();
    });

    refresh();
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
