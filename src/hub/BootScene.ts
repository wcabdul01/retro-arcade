import Phaser from "phaser";
import { COLORS, FONT_FAMILY, GAME_WIDTH, GAME_HEIGHT } from "../config/AppConfig";
import { getPlatformAdapter, DEFAULT_SAVE_DATA } from "../platform";
import { Settings } from "../systems/Settings";
import { AdsManager } from "../systems/AdsManager";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "LOADING...", {
        fontFamily: FONT_FAMILY,
        fontSize: "14px",
        color: "#16170f",
      })
      .setOrigin(0.5);
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
    this.boot();
  }

  private async boot(): Promise<void> {
    const adapter = getPlatformAdapter();
    await adapter.init();
    adapter.reportLoadingProgress(50);
    const saveData = await adapter.loadData().catch(() => ({ ...DEFAULT_SAVE_DATA }));
    this.registry.set("saveData", saveData);
    AdsManager.setAdFree(saveData.noAdsPurchased);
    await Settings.load();
    AdsManager.initialize();
    adapter.reportLoadingProgress(100);
    await adapter.notifyReady();
    this.scene.launch("Overlay");

    // The offline gate (OfflineBlockScene) previously required a connection
    // for free play, with the "Remove Ads" purchase as the only unlock path.
    // That purchase is disabled for v1 (see SettingsScene) — routing here
    // would strand offline players with no way back in, so offline play is
    // allowed for everyone until real billing ships and this can be
    // re-wired to OfflineBlockScene properly.
    this.scene.start("Hub");
  }
}
