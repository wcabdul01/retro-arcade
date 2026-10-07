import type { GameId } from "../hub/gameRegistry";

export interface SaveData {
  highScores: Partial<Record<GameId, number>>;
  progress: Partial<Record<GameId, unknown>>;
  // Owns the one-time "Remove Ads" purchase (see systems/Purchases.ts).
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
