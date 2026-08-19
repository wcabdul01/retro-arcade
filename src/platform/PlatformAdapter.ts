import type { GameId } from "../hub/gameRegistry";

export interface SaveData {
  highScores: Partial<Record<GameId, number>>;
  progress: Partial<Record<GameId, unknown>>;
  // Placeholder entitlement flag for the $10 "remove ads" purchase — set by
  // a mock buy button for now (see SettingsScene) until real Play Billing
  // is wired in. Also gates offline play: see BootScene.
  noAdsPurchased: boolean;
}

export const DEFAULT_SAVE_DATA: SaveData = { highScores: {}, progress: {}, noAdsPurchased: false };

export interface PlatformAdapter {
  readonly name: string;
  init(): Promise<void>;
  reportLoadingProgress(percent: number): void;
  notifyReady(): Promise<void>;
  loadData(): Promise<SaveData>;
  saveData(data: SaveData): Promise<void>;
}
