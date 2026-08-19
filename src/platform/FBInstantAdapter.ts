import type { PlatformAdapter, SaveData } from "./PlatformAdapter";
import { DEFAULT_SAVE_DATA } from "./PlatformAdapter";

declare const FBInstant: any;

export class FBInstantAdapter implements PlatformAdapter {
  readonly name = "fbinstant";

  async init(): Promise<void> {
    await FBInstant.initializeAsync();
  }

  reportLoadingProgress(percent: number): void {
    FBInstant.setLoadingProgress(percent);
  }

  async notifyReady(): Promise<void> {
    await FBInstant.startGameAsync();
  }

  async loadData(): Promise<SaveData> {
    try {
      const data = await FBInstant.player.getDataAsync(["highScores", "progress"]);
      return {
        highScores: data.highScores ?? { ...DEFAULT_SAVE_DATA.highScores },
        progress: data.progress ?? { ...DEFAULT_SAVE_DATA.progress },
        // The ad-free purchase isn't offered on this platform.
        noAdsPurchased: false,
      };
    } catch {
      return { ...DEFAULT_SAVE_DATA };
    }
  }

  async saveData(data: SaveData): Promise<void> {
    try {
      await FBInstant.player.setDataAsync(data);
    } catch {
      // best-effort; ignore failures
    }
  }
}
