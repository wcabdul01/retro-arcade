import { Preferences } from "@capacitor/preferences";
import type { PlatformAdapter, SaveData } from "./PlatformAdapter";
import { DEFAULT_SAVE_DATA } from "./PlatformAdapter";

const KEY = "retro-arcade-save";

export class WebAdapter implements PlatformAdapter {
  readonly name = "web";

  async init(): Promise<void> {}

  reportLoadingProgress(_percent: number): void {}

  async notifyReady(): Promise<void> {}

  async loadData(): Promise<SaveData> {
    const { value } = await Preferences.get({ key: KEY });
    if (!value) return { ...DEFAULT_SAVE_DATA };
    try {
      const parsed = JSON.parse(value);
      return {
        highScores: { ...parsed.highScores },
        progress: { ...parsed.progress },
        noAdsPurchased: parsed.noAdsPurchased ?? false,
      };
    } catch {
      return { ...DEFAULT_SAVE_DATA };
    }
  }

  async saveData(data: SaveData): Promise<void> {
    await Preferences.set({ key: KEY, value: JSON.stringify(data) });
  }
}
