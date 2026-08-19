import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS as APP_COLORS } from "../config/AppConfig";
import { createButton } from "../ui/createButton";
import { Purchases } from "../systems/Purchases";
import { sfx } from "../systems/SoundManager";

// Shown at boot instead of the Hub when the player is offline and hasn't
// bought the ad-free/offline-play entitlement (see PlatformAdapter.SaveData
// .noAdsPurchased and BootScene). Free play requires a connection so ads can
// load; the purchase removes that requirement entirely.
export class OfflineBlockScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super("OfflineBlock");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(APP_COLORS.BACKGROUND);
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    this.add
      .text(centerX, centerY - 170, "NO CONNECTION", {
        fontFamily: FONT_FAMILY,
        fontSize: "18px",
        color: "#16170f",
        align: "center",
      })
      .setOrigin(0.5);

    this.add
      .text(
        centerX,
        centerY - 100,
        "Free play needs an internet connection.\nConnect and retry, or unlock offline\nad-free play with a one-time purchase.",
        {
          fontFamily: FONT_FAMILY,
          fontSize: "11px",
          color: "#545a41",
          align: "center",
          lineSpacing: 10,
          wordWrap: { width: GAME_WIDTH - 100 },
        }
      )
      .setOrigin(0.5);

    this.statusText = this.add
      .text(centerX, centerY, "", {
        fontFamily: FONT_FAMILY,
        fontSize: "10px",
        color: "#16170f",
        align: "center",
      })
      .setOrigin(0.5);

    createButton(this, centerX, centerY + 60, "RETRY", () => {
      sfx.select();
      if (navigator.onLine) {
        this.scene.start("Hub");
      } else {
        this.statusText.setText("Still offline — try again.");
      }
    });

    createButton(
      this,
      centerX,
      centerY + 150,
      "REMOVE ADS - $10\n(TEST MODE)",
      async () => {
        sfx.select();
        await Purchases.buyNoAds(this);
        this.scene.start("Hub");
      },
      { height: 70 }
    );
  }
}
