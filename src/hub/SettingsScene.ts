import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, GB, FONT_FAMILY } from "../config/AppConfig";
import { createButton } from "../ui/createButton";
import { Settings } from "../systems/Settings";
import { sfx } from "../systems/SoundManager";
import { vibrate } from "../systems/Haptics";
import { ImpactStyle } from "@capacitor/haptics";
import { canOpenStorePage, openFeedbackEmail, openStorePage } from "../systems/Store";
import { AD_FREE_CHANGED, Purchases } from "../systems/Purchases";
import { AdsManager } from "../systems/AdsManager";
import { EventBus } from "../systems/EventBus";

const ROW_STEP = 70;
const PANEL_WIDTH = 300;
const TITLE_SPACE = 100;
const STATUS_SPACE = 70;

interface SettingsSceneData {
  message?: string;
}

export class SettingsScene extends Phaser.Scene {
  private status!: Phaser.GameObjects.Text;
  private busy = false;

  constructor() {
    super("Settings");
  }

  create(data: SettingsSceneData): void {
    this.busy = false;
    const canBuy = Purchases.isSupported && !AdsManager.isAdFree;
    const rowCount = 5 + (canBuy ? 1 : 0) + (canOpenStorePage() ? 1 : 0) + (Purchases.isSupported ? 1 : 0);
    const panelHeight = TITLE_SPACE + rowCount * ROW_STEP + STATUS_SPACE;
    const centerY = GAME_HEIGHT / 2;
    const top = centerY - panelHeight / 2;

    // Interactive so taps on the backdrop don't reach the Hub/Pause scene below.
    this.add.rectangle(GAME_WIDTH / 2, centerY, GAME_WIDTH, GAME_HEIGHT, GB.LIGHTEST, 0.98).setInteractive();
    this.add.rectangle(GAME_WIDTH / 2, centerY, PANEL_WIDTH, panelHeight, GB.LIGHT).setStrokeStyle(4, GB.DARKEST);

    this.add
      .text(GAME_WIDTH / 2, top + 50, "SETTINGS", { fontFamily: FONT_FAMILY, fontSize: "18px", color: "#16170f" })
      .setOrigin(0.5);

    let y = top + TITLE_SPACE + ROW_STEP / 2;
    const next = () => {
      const current = y;
      y += ROW_STEP;
      return current;
    };

    this.createToggle(
      next(),
      "SOUND",
      () => Settings.soundEnabled,
      () => Settings.setSoundEnabled(!Settings.soundEnabled)
    );

    this.createToggle(
      next(),
      "VIBRATION",
      () => Settings.vibrationEnabled,
      () => {
        Settings.setVibrationEnabled(!Settings.vibrationEnabled);
        if (Settings.vibrationEnabled) vibrate(ImpactStyle.Light);
      }
    );

    this.createCycleControl(next(), "CONTRAST", () => `${Settings.contrastPercent}%`, () => Settings.cycleContrast());

    // One-time purchase; hidden once owned (and on iOS/web, which have no ads).
    if (canBuy) {
      const button = createButton(this, GAME_WIDTH / 2, next(), this.removeAdsLabel(), () => void this.buy());
      const label = button.getData("label") as Phaser.GameObjects.Text;
      // The store price usually arrives a moment after launch.
      if (!Purchases.priceLabel) {
        this.time.delayedCall(2_000, () => {
          if (label.active) label.setText(this.removeAdsLabel());
        });
      }
    }

    // Web builds have no store listing to open, so RATE only shows on native.
    if (canOpenStorePage()) {
      createButton(this, GAME_WIDTH / 2, next(), "RATE THIS APP", () => {
        void openStorePage();
      });
    }

    createButton(this, GAME_WIDTH / 2, next(), "SEND FEEDBACK", () => {
      void openFeedbackEmail();
    });

    // Gets Remove Ads back after a reinstall or on a new phone (also checked
    // automatically at launch).
    if (Purchases.isSupported) {
      createButton(this, GAME_WIDTH / 2, next(), "RESTORE PURCHASES", () => void this.restore());
    }

    createButton(this, GAME_WIDTH / 2, next(), "BACK", () => {
      this.scene.stop();
    });

    this.status = this.add
      .text(GAME_WIDTH / 2, top + panelHeight - STATUS_SPACE / 2 - 4, data?.message ?? "", {
        fontFamily: FONT_FAMILY,
        fontSize: "8px",
        color: "#16170f",
        align: "center",
        lineSpacing: 6,
        wordWrap: { width: PANEL_WIDTH - 40 },
      })
      .setOrigin(0.5);

    // A purchase, restore or refund redraws the panel (adds/removes REMOVE ADS).
    const onAdFreeChanged = (owned: boolean) => {
      this.scene.restart({ message: owned ? "ADS REMOVED. THANK YOU!" : "" });
    };
    EventBus.on(AD_FREE_CHANGED, onAdFreeChanged);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => EventBus.off(AD_FREE_CHANGED, onAdFreeChanged));
  }

  private removeAdsLabel(): string {
    return Purchases.priceLabel ? `REMOVE ADS ${Purchases.priceLabel}` : "REMOVE ADS";
  }

  private setStatus(message: string): void {
    if (this.status.active) this.status.setText(message.toUpperCase());
  }

  private async buy(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.setStatus("");
    // Owned -> AD_FREE_CHANGED restarts this scene with a thank-you message.
    const { status, message } = await Purchases.buy(this.registry);
    this.busy = false;
    if (status !== "owned") this.setStatus(message);
  }

  private async restore(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.setStatus("Checking...");
    const { owned, checked } = await Purchases.restore(this.registry);
    this.busy = false;
    this.setStatus(owned ? "Ads removed" : checked ? "No purchases found" : "Store unavailable, try later");
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
